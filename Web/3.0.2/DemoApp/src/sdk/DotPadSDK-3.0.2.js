const Command = {
    requestFirmwareVersion: "0000",        // REQ_FW_VER
    responseFirmwareVersion: "0001",       // RSP_FW_VER
  
    requestHardwareVersion: "0010",        // REQ_HW_VERSION
    responseHardwareVersion: "0011",       // RSP_HW_VERSION
  
    requestDeviceName: "0100",             // REQ_DEV_NAME
    responseDeviceName: "0101",            // RSP_DEV_NAME

    requestBoardInfo: "0110",              // REQ_BOARD_INFO
    responseBoardInfo: "0111",             // RSP_BOARD_INFO

    requestDisplayLine: "0200",            // REQ_DISP_LINE
    responseDisplayLine: "0201",           // RSP_DISP_LINE
    notificateDisplayComplete: "0202",     // NOTI_DISP_LINE
  
    notificatePanningKey320: "0312",       // NOTI_KEY_PANNING (320 cell)
    notificateFunctionKey: "0332",         // NOTI_KEY_FUNCTION (320 cell)

    requestDisplayPartial: "0220",         // REQ_DISP_PARTIAL
    responseDisplayPartial: "0221",        // RSP_DISP_PARTIAL
    notificateDisplayPartial: "0222",      // NOTI_DISP_PARTIAL

    requestVibrator: "0530"                // REQ_VIBRATOR
};

const DataCodes = Object.freeze({
    Connected:                   "Connected",
    ConnectedFail:               "ConnectedFail",
    Disconnected:                "Disconnected",
    BoardInfo:                   "BoardInfo",
    BleMacAddress:               "BleMacAddress",
    DeviceName:                  "DeviceName",
    DeviceFWVersion:             "DeviceFWVersion",
    DeviceHWVersion:             "DeviceHWVersion",
    ResponseDisplayLineAck:      "ResponseDisplayLineAck",
    ResponseDisplayLineNonAck:   "ResponseDisplayLineNonAck",
    ResponseDisplayLineComplete: "ResponseDisplayLineComplete",
    // CommandError:                "CommandError", // 미구현
    // CommandNone:                 "CommandNone"   // 미구현
});

const KeyCodes = Object.freeze({
    KeyFunction1: "KeyFunction1",
    KeyFunction2: "KeyFunction2",
    KeyFunction3: "KeyFunction3",
    KeyFunction4: "KeyFunction4",
    KeyFunction12: "KeyFunction12",
    KeyFunction13: "KeyFunction13",
    KeyFunction14: "KeyFunction14",
    KeyFunction23: "KeyFunction23",
    KeyFunction24: "KeyFunction24",
    KeyFunction34: "KeyFunction34",
    KeyElse: "KeyElse",
    PanningAll: "PanningAll",
    PanningLeft: "PanningLeft",
    PanningRight: "PanningRight",
    LPF1: "LPF1",
    RPF4: "RPF4"
});

const DotPadKey = Object.freeze({
    KeyFunction1: "KeyFunction1",
    KeyFunction2: "KeyFunction2",
    KeyFunction3: "KeyFunction3",
    KeyFunction4: "KeyFunction4",
    PanningLeft: "PanningLeft",
    PanningRight: "PanningRight"
});

const DeviceInfo = Object.freeze({
    DeviceName: "DeviceName",
    FirmwareVersion: "FirmwareVersion",
    HardwareVersion: "HardwareVersion"
});

const DisplayMode = {
    GraphicMode: 'GraphicMode',
    TextMode: 'TextMode',
};
    
const DeviceCellType = Object.freeze({
    D2: {
        name: "D2",
        models: ["KM2-300A", "KM2-20", "DotPad320A", "DPK12A", "DotPad832A", "DMI32A"]
    },
    D3: {
        name: "D3",
        models: ["KM3-12A", "KM3-08A", "KM3-20A", "KM3-40A", "DPK12B", "DotPad320C", "DotPad320X", "DotPad768A", "DotPad300A"]
    },
    NONE: {
        name: "NONE",
        models: []
    },

    fromDeviceName(deviceName) {
        deviceName = deviceName ?? "";

        // D2 매칭
        if (this.D2.models.some(model => deviceName.toLowerCase().includes(model.toLowerCase()))) {
            return this.D2;
        }

        // D3 매칭
        if (this.D3.models.some(model => deviceName.toLowerCase().includes(model.toLowerCase()))) {
            return this.D3;
        }

        // 매칭 없음
        return this.NONE;
    }
});

class DotReceiver {
    #reader = null;
    #responseHex = "";
    #messageCallBack = null;
    #keyCallBack = null;
    #keyEventMap = null;
    #deviceInfoMap = null;
    #responsePatterns = null;

    // 키 이벤트
    #perkinsKeyState = 0;
    #perkinsKeyRelease = true;
    #functionKeyState = 0;
    #functionKeyRelease = true;
    #prevFunctionKeyMask = 0;
    #prevPanningKeyMask = 0;

    #keyPressInterval = 200;      // ms
    #keyTimeoutId = null;         // setTimeout 핸들
    #callbackTriggered = false;   // 콜백 한 번만 실행하기 위한 플래그
    #callbackReady = true;        // 모든 키가 떼어졌을때만 다시 키 입력을 받기 위한 상태
    #onKeyDownCallBack = null;
    #onKeyUpCallBack = null;

    constructor(messageCallBack, keyCallBack, onKeyDownCallBack = null, onKeyUpCallBack = null) {
        this.#messageCallBack = messageCallBack;
        this.#keyCallBack = keyCallBack;
        this.#onKeyDownCallBack = onKeyDownCallBack;
        this.#onKeyUpCallBack = onKeyUpCallBack;
        this.#keyEventMap = {
            PERKINS_KEY: new RegExp(`aa55000900${Command.notificatePanningKey320}00.*`),
            FUNCTION_KEY: new RegExp(`aa55000900${Command.notificateFunctionKey}00.*`),
        };

        this.#deviceInfoMap = {
            RSP_BOARD_INFO: new RegExp(`aa55001100${Command.responseBoardInfo}00.*`),
            RSP_FW_VER: new RegExp(`aa55000d00${Command.responseFirmwareVersion}00.*`),
            RSP_HW_VERSION: new RegExp(`aa55000600${Command.responseHardwareVersion}00.*`),
            RSP_DEV_NAME: new RegExp(`aa55(....)00${Command.responseDeviceName}00.*`),
        };

        this.#responsePatterns = {
            ACK: {
                [Command.responseDisplayLine]: (match) => this.#messageCallBack(DataCodes.ResponseDisplayLineAck, match),
                [Command.responseDisplayPartial]: (match) => this.#messageCallBack(DataCodes.ResponseDisplayLineAck, match),
            },
            NOTI: {
                [Command.notificateDisplayComplete]: () => this.#messageCallBack(DataCodes.ResponseDisplayLineComplete, ""),
                [Command.notificateDisplayPartial]: () => this.#messageCallBack(DataCodes.ResponseDisplayLineComplete, ""),
            }
        };
    }

    async startUsbReadLoop(device) {
        // 1) reader 생성
        this.#reader = device.readable.getReader();
        
        try {
            while (true) {
                const { value, done } = await this.#reader.read();

                if (done) {
                    // 스트림이 닫혔거나 cancel 된 상태
                    break;
                }

                this.receiveHexPacket = Array.from(new Uint8Array(value.buffer))
                            .map(b => b.toString(16).padStart(2, '0'))
                            .join('');
        
                // 수신 데이터 처리
                this.#handleNotifications(this.receiveHexPacket);
            }
        } catch (error) {
            // 에러 처리
            console.error('read loop error', error);
        } finally {
            // 2) 리더 해제
            this.#reader.releaseLock();
            this.#reader = null;
        }
    }

    async stopReadLoop() {
        // 외부에서 명시적으로 끊고 싶을 때
        if (this.#reader) {
            try {
                await this.#reader.cancel();
                this.#reader = null;
            } catch (e) {
                // 무시 가능
            }
        }
    }

    startBleNotification(event) {
        this.receiveHexPacket = Array.from(new Uint8Array(event.target.value.buffer))
                            .map(b => b.toString(16).padStart(2, '0'))
                            .join('');

        this.#handleNotifications(this.receiveHexPacket);
    }

    #handleNotifications(buffer) {
        if (this.#responseHex.length > 4 && !this.#responseHex.startsWith("aa55")) {
            this.#responseHex = "";
        }

        if (this.#responseHex.length + buffer.length < 18) {
            this.#responseHex = `${this.#responseHex}${buffer}`;
            buffer = "";
        } else {
            buffer = `${this.#responseHex}${buffer}`;
            this.#responseHex = "";
        }

        const packetArray = this.#extractPackets(buffer);

        for (let packet of packetArray) {
            if (this.#isEventPacket(this.#keyEventMap, packet)) {
                this.#processKeyEvent(this.#keyEventMap, packet);
            } else if (this.#isEventPacket(this.#deviceInfoMap, packet)) {
                this.#processDeviceInfo(this.#deviceInfoMap, packet);
            }

            for (const [cmd, handler] of Object.entries(this.#responsePatterns.ACK)) {
                const pattern = new RegExp(`aa550006(..)${cmd}(..)00.*`);
                const match = packet.match(pattern);
                if (match) {
                    handler.call(this, match);
                    return;
                }
            }
        
            for (const [cmd, handler] of Object.entries(this.#responsePatterns.NOTI)) {
                const pattern = new RegExp(`aa550006(..)${cmd}(..)00.*`);
                const match = packet.match(pattern);
                if (match) {
                    handler.call(this);
                    return;
                }
            }
        }
    }

    #isEventPacket(eventMap, packet) {
        return Object.values(eventMap).some(eventPattern => packet.match(eventPattern));
    }

    #extractPackets(packetHexString) {
        let packets = [];
        let currentIndex = 0;

        while (currentIndex < packetHexString.length) {
            if (packetHexString.length - currentIndex < 18) {
                // 패킷의 길이가 12보다 작을 경우 남은 데이터는 패킷이 아님
                this.#responseHex = packetHexString.substring(currentIndex);
                break;
            }

            const startIndex = currentIndex + 4;
            const endIndex = startIndex + 4;
            const lengthHex = packetHexString.substring(startIndex, endIndex);

            const length = parseInt(lengthHex, 16);
            if (isNaN(length)) {
                // 길이를 16진수에서 10진수로 변환할 수 없음
                this.#responseHex = packetHexString.substring(currentIndex);
                break;
            }

            const packetStartIndex = currentIndex + 8;
            const packetEndIndex = packetStartIndex + length * 2;
            const packet = packetHexString.substring(currentIndex, packetEndIndex);

            if (packet.length === length * 2 + 8) {
                packets.push(packet);
                currentIndex = packetEndIndex;
            } else {
                this.#responseHex = packetHexString.substring(currentIndex);
                break;
            }
        }

        return packets;
    }

    #processDeviceInfo(deviceInfoMap, packet) {
        const deviceInfo = Object.keys(deviceInfoMap).find(type => packet.match(deviceInfoMap[type]));

        if (deviceInfo) {
            const lastIndex = 16;
            const deviceResponseData = packet.substring(lastIndex, packet.length - 2);
            const deviceResponseAscii = this.#hexToAscii(deviceResponseData);
            switch (deviceInfo) {
                case 'RSP_BOARD_INFO':
                    this.#messageCallBack(DataCodes.BoardInfo, deviceResponseData);
                    break;
                case 'RSP_FW_VER':
                    this.#messageCallBack(DataCodes.DeviceFWVersion, deviceResponseAscii);
                    break;
                case 'RSP_HW_VERSION':
                    this.#messageCallBack(DataCodes.DeviceHWVersion, deviceResponseData);
                    break;
                case 'RSP_DEV_NAME':
                    this.#messageCallBack(DataCodes.DeviceName, deviceResponseAscii);
                    break;
            }
        }
    }

    #processKeyEvent(keyEventMap, packet) {
        const keyEvent = Object.keys(keyEventMap).find(type => packet.match(keyEventMap[type]));
        if (!keyEvent) {
            return;
        }
        
        // 1) 상태 업데이트
        if (keyEvent === "PERKINS_KEY") {
            const perkinsKeyData = parseInt(packet.substr(19, 1), 16);
            this.#perkinsKeyRelease = perkinsKeyData === 0;
            if (this.#perkinsKeyState < perkinsKeyData) {
                this.#perkinsKeyState = perkinsKeyData;
            }
            this.#notifyPanningKeyStateChanges(perkinsKeyData);
        } else if (keyEvent === "FUNCTION_KEY") {
            const functionKeyData = parseInt(packet.substr(16, 1), 16);
            this.#functionKeyRelease = functionKeyData === 0;
            if (this.#functionKeyState < functionKeyData) {
                this.#functionKeyState = functionKeyData;
            }
            this.#notifyFunctionKeyStateChanges(functionKeyData);
        }
    
        // 모든 키가 떼어진 상태
        if (this.#functionKeyRelease && this.#perkinsKeyRelease) {
            this.#callbackReady = true;
        }

        // 콜백 실행 후 중복 실행 방지
        if (!this.#callbackReady) {
            return;
        }

        // 2) 모든 키가 눌려 있는 상태(하나라도 눌려 있음)에서 타임아웃 설정
        if (!this.#perkinsKeyRelease || !this.#functionKeyRelease) {
            // 아직 타이머가 없으면 새로 설정
            if (this.#keyTimeoutId === null) {
                this.#callbackTriggered = false;

                this.#keyTimeoutId = setTimeout(() => {
                    // 200ms 동안 콜백이 안 나갔다면 여기서 한 번 실행
                    if (!this.#callbackTriggered) {
                        this.#processKeyCallBack();
                        this.#callbackTriggered = true;
                        this.#callbackReady = false;
                    }
                    this.#keyTimeoutId = null;
                }, this.#keyPressInterval);
            }
            return; // 아직 모든 키가 안 떼어졌으니 여기서 종료
        }

        // 3) 여기까지 왔다는 건: perkins + function 둘 다 release 상태
        
        // 타임아웃이 걸려 있다면 취소
        if (this.#keyTimeoutId !== null) {
            clearTimeout(this.#keyTimeoutId);
            this.#keyTimeoutId = null;
        }

        // 타임아웃 콜백에서 이미 실행됐다면 다시 실행하지 않음
        if (!this.#callbackTriggered) {
            this.#processKeyCallBack();
        }

        this.#perkinsKeyState = 0;
        this.#functionKeyState = 0;
        this.#callbackTriggered = false;
        this.#callbackReady = true;
    }

    #processKeyCallBack() {
        let keyCode = KeyCodes.KeyElse;
        let keyMsg = "";
        if (this.#perkinsKeyState === 6) {
            if (this.#functionKeyState === 0) {
                keyCode = KeyCodes.PanningAll;
            }

            keyMsg = "AP + " + this.#functionKeyState;
        } else if (this.#perkinsKeyState === 4) {
            if (this.#functionKeyState === 8) {
                keyCode = KeyCodes.LPF1;
            } else if (this.#functionKeyState === 0) {
                keyCode = KeyCodes.PanningLeft;
            }

            keyMsg = "LP + " + this.#functionKeyState;
        } else if (this.#perkinsKeyState === 2) {
            if (this.#functionKeyState === 1) {
                keyCode = KeyCodes.RPF4;
            } else if (this.#functionKeyState === 0) {
                keyCode = KeyCodes.PanningRight;
            }

            keyMsg = "RP + " + this.#functionKeyState;
        } else if (this.#perkinsKeyState === 0) {
            switch (this.#functionKeyState) {
                case 12: keyCode = KeyCodes.KeyFunction12; break;
                case 10: keyCode = KeyCodes.KeyFunction13; break;
                case 9: keyCode = KeyCodes.KeyFunction14; break;
                case 8: keyCode = KeyCodes.KeyFunction1; break;
                case 6: keyCode = KeyCodes.KeyFunction23; break;
                case 5: keyCode = KeyCodes.KeyFunction24; break;
                case 4: keyCode = KeyCodes.KeyFunction2; break;
                case 3: keyCode = KeyCodes.KeyFunction34; break;
                case 2: keyCode = KeyCodes.KeyFunction3; break;
                case 1: keyCode = KeyCodes.KeyFunction4; break;
            }

            keyMsg = "" + this.#functionKeyState;
        }

        this.#keyCallBack(keyCode, keyMsg);
    }

    #notifyFunctionKeyStateChanges(keyValue) {
        const newMask = keyValue & 0x0F;
        const prev = this.#prevFunctionKeyMask;
        if (prev === newMask) return;
        this.#prevFunctionKeyMask = newMask;

        const singles = [
            [8, DotPadKey.KeyFunction1],
            [4, DotPadKey.KeyFunction2],
            [2, DotPadKey.KeyFunction3],
            [1, DotPadKey.KeyFunction4],
        ];

        for (const [bit, key] of singles) {
            const wasDown = (prev & bit) === bit;
            const isDown = (newMask & bit) === bit;
            if (wasDown === isDown) continue;
            const binary = newMask.toString(2).padStart(4, '0');
            if (isDown) {
                this.#onKeyDownCallBack?.(key, binary);
            } else {
                this.#onKeyUpCallBack?.(key, binary);
            }
        }
    }

    #notifyPanningKeyStateChanges(keyValue) {
        const PANNING_LEFT = 4;
        const PANNING_RIGHT = 2;
        const newMask = keyValue & (PANNING_LEFT | PANNING_RIGHT);
        const prev = this.#prevPanningKeyMask;
        if (prev === newMask) return;
        this.#prevPanningKeyMask = newMask;

        const binary = newMask.toString(2).padStart(3, '0');

        const leftWas = (prev & PANNING_LEFT) !== 0;
        const leftNow = (newMask & PANNING_LEFT) !== 0;
        if (leftWas !== leftNow) {
            if (leftNow) {
                this.#onKeyDownCallBack?.(DotPadKey.PanningLeft, binary);
            } else {
                this.#onKeyUpCallBack?.(DotPadKey.PanningLeft, binary);
            }
        }

        const rightWas = (prev & PANNING_RIGHT) !== 0;
        const rightNow = (newMask & PANNING_RIGHT) !== 0;
        if (rightWas !== rightNow) {
            if (rightNow) {
                this.#onKeyDownCallBack?.(DotPadKey.PanningRight, binary);
            } else {
                this.#onKeyUpCallBack?.(DotPadKey.PanningRight, binary);
            }
        }
    }

    #hexToAscii(hex) {
        let ascii = '';
        for (let i = 0; i < hex.length; i += 2) {
            const hexByte = hex.substr(i, 2);
            const decimalValue = parseInt(hexByte, 16);
            ascii += String.fromCharCode(decimalValue);
        }
        return ascii;
    }
}

const SendMode = {
    BASIC: "BASIC",
    REFRESH: "REFRESH"
};
class DotPadLine {
    #sendMode = SendMode.BASIC;
    get sendMode(){
        return this.#sendMode;
    }

    constructor(lineId, requestTime, numberCellColumns) {
        this.lineId = lineId;
        this.startCellIndex = 0;
        this.sendData = "";
        this.seqNum = "00";
        this.lineData = "00".repeat(numberCellColumns);
        this.requestReady = false;
        this.requestTime = requestTime;
        this.receiveAck = true;
        this.numberCellColumns = numberCellColumns;

        this.refreshLiveData = "";
        this.refreshLiveStartCellIndex = 0;
    }

    getSendData() {
        return this.sendData;
    }

    getLineId() {
        return this.lineId;
    }

    getRequestReady() {
        return this.requestReady;
    }

    getReceiveAck() {
        return this.receiveAck;
    }

    setReceiveAck(receiveAck) {
        this.receiveAck = receiveAck;
    }

    setRequestReady(requestReady){
        this.requestReady = requestReady;
    }

    getRequestTime() {
        return this.requestTime;
    }

    getStartCellIndex() {
        return this.startCellIndex
    }

    getSeqNum() {
        return this.seqNum
    }

    refresh(mode = "ALL_DISPLAY") {
        if (this.requestReady)
            return;

        this.requestReady = true;
        this.receiveAck = true;
        this.#sendMode = SendMode.REFRESH;

        // 라인 갱신
        if (mode == "LIVE_DISPLAY") {
            this.sendData = this.refreshLiveData;
            this.startCellIndex = this.refreshLiveStartCellIndex;
        } else {
            this.sendData = this.lineData;
            this.startCellIndex = 0;
        }
    }

    initRefreshLiveData(startCellIndex, sendData) {
        this.refreshLiveData = sendData;
        this.refreshLiveStartCellIndex = startCellIndex;
    }
    
    setRefreshLiveData(startCellIndex, sendData) {
        const result = this.getMergeCellData(
            this.refreshLiveData,
            this.refreshLiveStartCellIndex,
            sendData,
            startCellIndex
        );
    
        this.refreshLiveData = result.sendData;
        this.refreshLiveStartCellIndex = result.startCellIndex;
    }

    setSendStatus() {
        this.requestReady = false;
        this.receiveAck = false;
    }

    setCommand(seqNum, startCellIndex, sendData) {
        this.#sendMode = SendMode.BASIC;
        this.seqNum = seqNum;

        // 발송이 끝난상태면 새로세팅
        if (!this.requestReady && this.receiveAck) {
            this.startCellIndex = startCellIndex;
            this.sendData = sendData;
        } else {
            // 아닐경우
            const result = this.getMergeCellData(this.sendData, this.startCellIndex, sendData, startCellIndex);

            this.sendData = result.sendData;
            this.startCellIndex = result.startCellIndex;
        }

        this.requestReady = true;
        this.receiveAck = true;

        this.setLineData();
    }

    getMergeCellData(baseSendData, baseStartCellIndex, sendData, startCellIndex) {
        var returnData = "";
        var returnStartCellIndex = 0;

        if (baseSendData == "") {
            return {sendData: sendData, startCellIndex: startCellIndex};
        }
        
        // 새로등록된 시작셀이 앞일 경우
        if (baseStartCellIndex >= startCellIndex) {
            const temp = baseStartCellIndex - startCellIndex;

            // 기존데이터가 신규데이터와 겹칠경우
            if (temp * 2 < sendData.length) {
                // 시작셀 차이 만큼 00 채우기(시작셀을 같게 만들어줌)
                const tempData = "00".repeat(temp) + baseSendData;

                // 데이터 길이 비교후 데이터 세팅(신규데이터의 길이 > 시작셀이 동일한 기존데이터의 길이)
                // 새 데이터가 길경우 덮어쓰기 : 기존 데이터가 길경우 새 데이터 부분만큼만 덮어쓰기
                returnData = sendData.length >= tempData.length ? sendData : sendData + tempData.substring(sendData.length);
            } else {
                // 겹치지 않을경우
                const originData = this.lineData.substring(startCellIndex * 2 + sendData.length, baseStartCellIndex * 2);
                returnData = sendData + originData + baseSendData;
            }

            // 시작셀 세팅
            returnStartCellIndex = startCellIndex;
        } else {
            // 기존등록된 시작셀이 앞일 경우
            returnStartCellIndex = baseStartCellIndex;

            // 시작셀 차이 만큼 기존 데이터로 채우기
            const temp = startCellIndex - baseStartCellIndex;

            // 기존데이터가 신규데이터와 겹칠경우
            if (temp * 2 < baseSendData.length) {
                // 겹치지 않는 앞부분 + 신규데이터
                const tempData = baseSendData.substring(0, temp * 2) + sendData;

                // 데이터 길이 비교후 데이터 세팅
                // 새 데이터가 길경우 덮어쓰기 : 기존 데이터가 길경우 새 데이터 뒤에 기존데이터를 붙이기
                returnData = tempData.length >= baseSendData.length ? tempData : tempData + baseSendData.substring(tempData.length);
            } else {
                // 기존데이터가 신규데이터와 겹치지 않을경우 데이터 사이에 원래 출력된 데이터로 채우기
                const originData = this.lineData.substring(baseStartCellIndex * 2, startCellIndex * 2);
                returnData = originData + sendData;
            }
        }

        return { sendData: returnData, startCellIndex: returnStartCellIndex };
    }

    setLineData() {
        let tempFront = this.lineData.substring(0, this.startCellIndex * 2) + this.sendData;
        this.lineData = tempFront + this.lineData.substring(tempFront.length);

        const remainingLength = this.numberCellColumns * 2 - this.lineData.length;
        if (remainingLength > 0) {
            this.lineData += "00".repeat(remainingLength);
        }
    }

    getLineData() {
        return this.lineData
    }

    clearLineData() {
        this.lineData = "00".repeat(this.numberCellColumns);
        this.sendData = this.lineData;
        this.requestReady = true;
        this.receiveAck = true;
        this.startCellIndex = 0;
    }
}

const BufferMode = Object.freeze({
    ALL_LINE: 'ALL_LINE',
    SINGLE_LINE: 'SINGLE_LINE',
    ALL_PARTIAL: 'ALL_PARTIAL',
    SINGLE_PARTIAL: 'SINGLE_PARTIAL',

    models: ["DotPad320C", "DotPad320X", "DotPad300A"],

    fromDeviceName(deviceName) {
        const lowerName = deviceName.toLowerCase();

        // models 배열 중 하나라도 deviceName에 포함되어 있으면 ALL_PARTIAL
        const match = this.models.some(name => lowerName.includes(name.toLowerCase()));

        return match ? this.ALL_PARTIAL : this.SINGLE_LINE;
    }
});

const DotPadSendMakeModel = {
    getSendData(bufferMode, lineList, line) {
        var sendData = "";
        switch (bufferMode) {
            case BufferMode.ALL_LINE : 
                sendData = this.makeTotalLineData(lineList);
                break
            case BufferMode.SINGLE_LINE :
                sendData = this.makeSingleLineData(line);
                break
            case BufferMode.ALL_PARTIAL : 
                sendData = this.makeTotalPartialData(lineList);
                break
            case BufferMode.SINGLE_PARTIAL : 
                sendData = this.makeSinglePartialData(line);
                break
        }

        return sendData
    },
    makeSingleLineData(line) {
        let hexString = line.getSendData();
        let data = this.decimalToHex(line.getStartCellIndex()) + hexString;                                                                                                                                                                                                                                                                                                                                                                                                          
        return this.makePacket(data, line.getLineId(), line.getSeqNum(), Command.requestDisplayLine)
    },
    makeTotalLineData(lineList) {
        var hexString = "";
        for (let i = 1; i < lineList.length; i++) {
            hexString += lineList[i].getLineData();
        }
        let data = this.decimalToHex(0) + hexString;
        return this.makePacket(data, 1, lineList[1].getSeqNum(), Command.requestDisplayLine)
    },
    makeSinglePartialData(line) {
        let hexString = line.getSendData();
        let startX = line.getStartCellIndex();
        let endX = startX + (hexString.length / 2);
        let data = this.decimalToHex(startX) + this.decimalToHex(endX);
        if (line.getSeqNum() == "80") {
            data += this.brailleToGraphic(hexString);
        } else {
            data += hexString;
        }

        return this.makePacket(data, line.getLineId(), "00", Command.requestDisplayPartial)
    },
    makeTotalPartialData(lineList) {
        let startLine = -1;
        let endLine = -1;
        let startX = 999;
        let endX = -1;

        for (let i = 1; i < lineList.length; i++) {
            const line = lineList[i];
            if (line.getRequestReady()) {
                const start = line.getStartCellIndex();
                const end = start + (line.getSendData().length / 2);
    
                if (startLine < 0) startLine = i;
                if (startX > start) startX = start;
                if (endX < end) endX = end;
    
                endLine = i;
            }
        }

        let hexString = "";

        if (startLine > -1) {
            for (let i = startLine; i <= endLine; i++) {
                const currentData = lineList[i];
                const str1 = currentData.getLineData();
                const data = str1.slice(startX * 2, endX * 2);
                hexString += data;
            }

            let data = this.decimalToHex(startX) + this.decimalToHex(endX);
            if (lineList[startLine].getSeqNum() == "80") {
                data += this.brailleToGraphic(hexString);
            } else {
                data += hexString;
            }

            return this.makePacket(data, startLine, "00", Command.requestDisplayPartial);
        }

        return null;
    },
    // 진동 요청 패킷: DATA = (Run, Stop) 쌍의 가변 리스트(최소 2 ~ 최대 18 byte, 각 값 2byte Big-Endian, 단위 10ms, 범위 0x0000~0x7FFF)
    // Run = 진동 ON 시간, Stop = 멈춤 시간, 최대 5펄스. 마지막 진동의 Stop 은 생략 가능 → N펄스면 워드 수 = 2*N - 1
    makeVibratorPacket(onMs, offMs, repeatCount) {
        const pulseCount = Math.min(5, Math.max(1, repeatCount));
        const runWord = this.decimalToHex(Math.min(0x7FFF, Math.max(0, Math.trunc(onMs / 10))), 4);
        const stopWord = this.decimalToHex(Math.min(0x7FFF, Math.max(0, Math.trunc(offMs / 10))), 4);

        let data = "";
        for (let i = 0; i < pulseCount; i++) {
            data += runWord;
            if (i < pulseCount - 1) data += stopWord; // 마지막 Run 뒤 Stop 은 생략
        }

        return this.makePacket(data, "00", "00", Command.requestVibrator);
    },
    makePacket(data, lineId, seqNum, command) {
        const length = data.length / 2;

        let packet = "AA55" // SYNC BYTE
            + this.decimalToHex(5 + length, 4) // (Header(10) ) + DataCount - (SYNC BYTE(2) + LEN(2))
            + this.decimalToHex(lineId, 2)
            + command
            + seqNum // Mode (GrapicMode: 0x00, TextMode: 0x80)
            + data;
        packet += this.checksum(this.hexToBytes(packet.substring(8)));
        return this.hexStringToArrayBuffer(packet);
    },
    /**
     * Convert a hex string to an ArrayBuffer.
     *
     * @param {string} hexString - hex representation of bytes
     * @return {ArrayBuffer} - The bytes in an ArrayBuffer.
     */
    hexStringToArrayBuffer(hexString) {
        // remove the leading 0x
        hexString = hexString.replace(/^0x/, '');

        // ensure even number of characters                                                                                                                                                                                                                                                                                                                   
        if (hexString.length % 2 !== 0) {
            console.warn('WARNING: expecting an even number of characters in the hexString');
        }

        // check for some non-hex characters
        let bad = hexString.match(/[G-Z\s]/i);
        if (bad) {
            console.warn('WARNING: found non-hex characters', bad);
        }

        // split the string into pairs of octets
        let pairs = hexString.match(/[\dA-F]{2}/gi);

        // convert the octets to integers
        if (pairs != null)  {
            let integers = pairs.map(function (s) {
                return parseInt(s, 16);
            });

            let array = new Uint8Array(integers);

            return array.buffer;
        } else {
            return null;
        }
    },
    checksum(test_data) {
        let check = 0xA5;

        for (let i = 0; i < test_data.length; i++) {
            check = check ^ test_data[i];
        }

        return ('0' + (check & 0xFF).toString(16)).slice(-2);
    },
    decimalToHex(d, padding = 2) {
        return Number(d).toString(16).padStart(padding, "0");
    },
    hexToBytes(hex) {
        const bytes = [];
        for (let c = 0; c < hex.length; c += 2)
            bytes.push(parseInt(hex.substr(c, 2), 16));
        return bytes;
    },
    brailleToGraphic(brailleText) {
        // 1. 2진수로 변경 후 8비트씩 분할
        const binary = this.hexToBinary(brailleText);
        const splitStrings = [];
        for (let i = 0; i < binary.length; i += 8) {
            splitStrings.push(binary.substring(i, i + 8));
        }
    
        // 2. 각 8비트에서 비트 재배치 (8번핀, 7번핀 위치 바꾸기)
        const swappedStrings = splitStrings.map(subStr => {
            // 길이가 8보다 짧으면 뒤를 0으로 패딩
            const bits = subStr.padEnd(8, '0');
    
            const pin8Bits = bits.substring(0, 1);   // bit0
            const pin7Bits = bits.substring(1, 2);   // bit1
            const firstThreeBits = bits.substring(2, 5); // bit2~4
            const lastThreeBits = bits.substring(5);     // bit5~7
    
            return pin8Bits + firstThreeBits + pin7Bits + lastThreeBits;
        });
    
        // 3. 이어 붙인 후 다시 16진수로 변경
        return this.binaryToHex(swappedStrings.join(''));
    },
    hexToBinary(hex) {
        let binary = "";
        for (let i = 0; i < hex.length; i++) {
            const decimal = parseInt(hex[i], 16);              // 16진수 → 10진수
            const fourBits = decimal.toString(2).padStart(4, "0"); // 4비트 바이너리
            binary += fourBits;
        }
        return binary;
    },
    binaryToHex(binary) {
        let hex = "";
        for (let i = 0; i < binary.length; i += 4) {
            const fourBits = binary.substring(i, i + 4);
            const decimal = parseInt(fourBits, 2);      // 2진수 → 10진수
            hex += decimal.toString(16).toUpperCase();  // 10진수 → 16진수
        }
        return hex;
    }
};

const RefreshType = {
    TYPE_A: 'TYPE_A',
    TYPE_B: 'TYPE_B',
    TYPE_C: 'TYPE_C',
};

const RefreshMode = {
    NONE: 'NONE',
    ALL_DISPLAY: 'ALL_DISPLAY',
    GRAPHIC_DISPLAY: 'GRAPHIC_DISPLAY',
    TEXT_DISPLAY: 'TEXT_DISPLAY',
    LIVE_DISPLAY: 'LIVE_DISPLAY',
};

class DotPadSendModule {
    constructor(dotPad) {
        this.dotPadLineList = [];
        this.dotCommandSendReady = true;
        this.sendTime = new Date();
        this.sendCnt = 0;
        this.dotPadLine = null;
        this.restart = false;
        this.currentIndex = 0;
        this.isFunctionRunning = false;
        this.dotPad = dotPad;
        this.baseDisplayComplete = true; // 오토리프레시를 제외한 최초출력이 완료되었는지 체크

        this.refreshType = RefreshType.TYPE_C;
        this.refreshCount = 0;
        this.refreshItem = null;
        this.refreshLine = [];
        this.refreshMode = RefreshMode.NONE;

        this.bufferMode = BufferMode.SINGLE_LINE;
        this.isAutoRefresh = false;
    }

    // 라인목록 초기화
    clearDotPadLine(){
        this.dotPadLineList = [];
    }

    // 모든 라인 데이터 초기화
    resetAllLineData() {
        for (const line of this.dotPadLineList) {
            line.clearLineData();
        }
    }

    // 닷패드 라인 추가
    addDotPadLine(brailleCellRefreshTime, numberCellColumns) {
        const line = new DotPadLine(this.dotPadLineList.length, brailleCellRefreshTime, numberCellColumns);
        if (this.dotPad.cellType == DeviceCellType.D3) {
            line.setCommand("00", 0, "00".repeat(numberCellColumns));
        }
        this.dotPadLineList.push(line);
    }

    // 해당 라인에 커맨드 세팅
    #setDotPadLineCommandData(line, seqNum, startCellIndex, sendData, init = true) {
        if (init) {
            this.refreshCount = 0;
            this.currentIndex = 0;
        } else {
            this.currentIndex = 0;
        }
        
        if (this.refreshMode === RefreshMode.LIVE_DISPLAY && !this.refreshLine.includes(line)){
            this.refreshLine.push(line);
            this.dotPadLineList[line].initRefreshLiveData(startCellIndex, sendData);
        } else {
            this.dotPadLineList[line].setRefreshLiveData(startCellIndex, sendData);
        }
        this.dotPadLineList[line].setCommand(seqNum, startCellIndex, sendData);
    }

    // 데이터 비교후 다른 부분만 출력
    setDotPadLineCommand(line, seqNum, startCellIndex, sendData, init = true) {
        const lineData = this.dotPadLineList[line].getLineData();
        const tempData = lineData.substring(0, startCellIndex * 2) + sendData;
        const result = this.compareString(tempData, lineData);
        if (result !== null) {
            const [start, end] = result;
            const diffData = tempData.slice(start, end + 1);
            this.#setDotPadLineCommandData(line, seqNum, parseInt(start / 2), diffData, init);
            return true
        }

        return false
    }

    // 발송준비 세팅
    setDotCommandSendReady(ready) {
        this.dotCommandSendReady = ready;
    }

    async refresh() {
        for (let i = 0; i < this.dotPadLineList.length; i++) {
            this.dotPadLineList[i].refresh();
        }

        await this.sendCommand();
    }
    
    checkBaseDisplay() {
        return (this.isFunctionRunning && this.currentIndex >= this.dotPadLineList.length - 1) || this.refreshCount > 0 || !this.isFunctionRunning
    }
    
    getIsFunctionRunning() {
        return this.isFunctionRunning
    }

    setDisplayComplete() {
        if (this.checkBaseDisplay()) {
            this.baseDisplayComplete = true;
        }
    }

    // 최초출력 완료 체크
    getDisplayComplete() {
        this.setDisplayComplete();
        return this.baseDisplayComplete
    }

    setBufferMode(bufferMode) {
        this.bufferMode = bufferMode;
    }

    getBufferMode() {
        return this.bufferMode
    }

    // setTimeout은 백그라운드 탭에서 최소 1000ms로 스로틀됨 → MessageChannel로 대체
    #scheduleNext(fn) {
        const ch = new MessageChannel();
        ch.port1.onmessage = fn;
        ch.port2.postMessage(null);
    }

    async sendCommand(refresh = false) {
        if (!this.isFunctionRunning) {
            this.isFunctionRunning = true;
            this.currentIndex = 0;

            if (!refresh) {
                this.refreshCount = 0;
            }

            const cellType = this.dotPad.cellType;

            const processNextLine = async () => {
                if (this.currentIndex < this.dotPadLineList.length) {
                    // 재시작일경우 값 초기화
                    if (this.restart) {
                        // 재시작 시 등록된 refreshItem 타이머 취소
                        if (this.refreshItem != null) {
                            clearTimeout(this.refreshItem);
                            this.refreshItem = null;
                        }

                        for (const tempDotPadLine of this.dotPadLineList) {
                            if (tempDotPadLine.sendMode == SendMode.REFRESH) {
                                tempDotPadLine.setRequestReady(false);
                                tempDotPadLine.setReceiveAck(true);
                            }
                        }
                        
                        this.currentIndex = 0;
                        this.restart = false;
                        this.dotCommandSendReady = true;
                        this.refreshCount = 0;
                    }
                    else {
                        // 전체출력일때 시작라인 세팅
                        if (this.currentIndex > 0 && (this.bufferMode === BufferMode.ALL_LINE || this.bufferMode === BufferMode.ALL_PARTIAL)) {
                            let list = this.dotPadLineList.filter(line => line.getRequestReady());
                            this.currentIndex = list.length > 0 ? list[0].getLineId() : this.currentIndex;
                        } 

                        this.dotPadLine = this.dotPadLineList[this.currentIndex];

                        // 발송해야하는지 확인
                        if (this.dotPadLine.getRequestReady() && this.dotCommandSendReady) {
                            // 발송 처리
                            if (this.currentIndex === 0 || this.bufferMode === BufferMode.SINGLE_LINE || this.bufferMode === BufferMode.SINGLE_PARTIAL) {
                                this.dotPadLine.setSendStatus();
                            } else {
                                this.dotPadLine.setReceiveAck(false);
                            }

                            if (this.currentIndex >= 1 && this.refreshCount === 0) {
                                let sendData = DotPadSendMakeModel.getSendData(this.bufferMode, this.dotPadLineList, this.dotPadLine);
                                
                                if (this.bufferMode === BufferMode.ALL_LINE || this.bufferMode === BufferMode.ALL_PARTIAL) {
                                    for (let i = this.currentIndex; i < this.dotPadLineList.length; i++) {
                                        this.dotPadLineList[i].setRequestReady(false);
                                    }
                                }
                                
                                await this.dotPad.sendCommand(sendData);
                            } else {
                                let sendData = DotPadSendMakeModel.makeSingleLineData(this.dotPadLine);
                                await this.dotPad.sendCommand(sendData);
                            }
                            
                            this.dotCommandSendReady = false;
                            
                            // 최초출력 완료 체크용
                            if (this.refreshCount === 0){
                                this.baseDisplayComplete = false;
                            }
                            
                            // 시간체크 시작
                            this.sendTime = new Date();
                            this.sendCnt = 0;
                        }
                        // ACK 수신 대기중
                        else if (!this.dotPadLine.getReceiveAck()) {
                            // 시간체크
                            const nowTime = new Date() - this.sendTime;
                            let time = (() => {
                                const requestTime = this.dotPadLine?.getRequestTime?.() ?? 500;
                                if (
                                    this.currentIndex >= 1
                                    && this.refreshCount === 0
                                    && (
                                        this.bufferMode === BufferMode.ALL_LINE
                                        || this.bufferMode === BufferMode.ALL_PARTIAL
                                    )
                                ) {
                                    if (cellType === "D3") 
                                        return (requestTime * this.dotPadLineList.length);
                                    else 
                                        return 600;
                                } else {
                                    return requestTime;
                                }
                            })();

                            if (nowTime > time) {
                                // 재요청
                                if (this.sendCnt < 3) {
                                    // 재발송
                                    if (this.currentIndex >= 1 && this.refreshCount === 0) {
                                        if (this.bufferMode === BufferMode.ALL_LINE || this.bufferMode === BufferMode.ALL_PARTIAL) {
                                            // 이미 발송한걸로 취급되서 재발송시에 requestReady를 세팅
                                            for (let i = this.currentIndex; i < this.dotPadLineList.length; i++) {
                                                this.dotPadLineList[i].setRequestReady(true);
                                            }
                                        }

                                        let sendData = DotPadSendMakeModel.getSendData(this.bufferMode, this.dotPadLineList, this.dotPadLine);
                                        await this.dotPad.sendCommand(sendData);

                                        if (this.bufferMode === BufferMode.ALL_LINE || this.bufferMode === BufferMode.ALL_PARTIAL) {
                                            // 발송 후 다시 false 처리
                                            for (let i = this.currentIndex; i < this.dotPadLineList.length; i++) {
                                                this.dotPadLineList[i].setRequestReady(false);
                                            }
                                        }
                                    } else {
                                        let sendData = DotPadSendMakeModel.makeSingleLineData(this.dotPadLine);
                                        await this.dotPad.sendCommand(sendData);
                                    }
                                    this.sendTime = new Date();
                                    this.sendCnt += 1;
                                } else {
                                    // 수신받은 것으로 처리
                                    this.dotPadLine.setReceiveAck(true);
                                    this.dotCommandSendReady = true;
                                    this.baseDisplayComplete = true;
                                }
                            }
                        } else if (this.dotCommandSendReady) {
                            if (this.currentIndex >= 1 && this.refreshCount === 0) {
                                if (this.bufferMode === BufferMode.ALL_LINE || this.bufferMode === BufferMode.ALL_PARTIAL) {
                                    this.currentIndex = this.dotPadLineList.length;
                                    this.dotPadLine = null;
                                } else {
                                    this.currentIndex += 1;
                                }
                            } else {
                                this.currentIndex += 1;
                            }
                        } else {
                            this.dotCommandSendReady = true;
                        }
                    }

                    // DotPad320 D2셀의 경우 Refresh 처리
                    if (cellType === "D2")
                        this.refreshCommand();
                    
                    this.#scheduleNext(processNextLine); // 백그라운드 탭 스로틀 우회
                }
                else {
                    this.isFunctionRunning = false;
                    this.baseDisplayComplete = true;
                }
            };
            
            try {
                await processNextLine();
            }
            catch (e) {
                console.log("sendCommand Error: ", e);
            }
        }
        else {
            this.restart = true;
        }
    }

    // Ack 세팅
    setDotPadLineReceiveAck(line, receiveAck) {
        if (line > 0 && (this.bufferMode === BufferMode.ALL_LINE || this.bufferMode === BufferMode.ALL_PARTIAL)) {
            for (let i = 1; i < this.dotPadLineList.length; i++) {
                this.dotPadLineList[i].setReceiveAck(receiveAck);
            }
        } else {
            const dotPadLine = this.dotPadLineList[line];
            if(dotPadLine){
                dotPadLine.setReceiveAck(receiveAck);
            }
        }
    }

    // 재출력 타입 세팅
    setRefreshType(type){
        this.refreshType = type;
    }

    // 재출력
    refreshCommand() {
        if(this.dotPadLineList.length === this.currentIndex) {
            switch (this.refreshType) {
                case RefreshType.TYPE_A : this.refreshCommandFuncA(); break;
                case RefreshType.TYPE_B : this.refreshCommandFuncB(); break;
                case RefreshType.TYPE_C : this.refreshCommandFuncC(); break;
            }
        }
    }

    // 재출력 A타입
    refreshCommandFuncA() {
        // 전체출력후 재출력
        if (this.refreshCount < 3) {
            this.currentIndex = 0;
            
            for (const tempLine of this.dotPadLineList) {
                tempLine.refresh();
            }
            
            this.refreshCount += 1;
        }
    }

    // 재출력 B타입
    refreshCommandFuncB() {
        // 전체출력후 재출력
        if (this.refreshCount < 3) {
            this.currentIndex = 0;
            for (let i = 0; i <= 3; i++) {
                this.dotPadLineList[i].refresh();
            }
        } else if (this.refreshCount < 6) {
            this.currentIndex = 1;
            
            for (let i = 4; i <= 10; i++) {
                this.dotPadLineList[i].refresh();
            }
        } else {
            this.refreshMode = RefreshMode.NONE;
        }
        
        this.refreshCount += 1;
    }

    // 재출력 C타입
    refreshCommandFuncC() {
        // 재출력 작업이 등록되어 있는경우
        if (this.refreshItem != null) {
            return
        }

        switch (this.refreshMode) {
            case RefreshMode.ALL_DISPLAY : this.refreshCommandFuncB(); break;
            case RefreshMode.GRAPHIC_DISPLAY : this.graphicRefresh(); break;
            case RefreshMode.TEXT_DISPLAY : this.textRefresh(); break;
            case RefreshMode.LIVE_DISPLAY : this.liveRefresh(); break;
        }
    }

    graphicRefresh() {
        this.refreshItem = () => {
            if (this.refreshCount < 3) {
                this.currentIndex = 1;

                for (let i = 1; i <= 3; i++) {
                    this.dotPadLineList[i].refresh();
                }
            } else if (this.refreshCount < 6) {
                    this.currentIndex = 4;
                    for (let i = 4; i < this.dotPadLineList.length; i++) {
                        this.dotPadLineList[i].refresh();
                    }
                    
            } else {
                this.refreshMode = RefreshMode.NONE;
            }

            this.refreshItem = null;
            this.refreshCount += 1;
            this.sendCommand(true);
        };
        setTimeout(this.refreshItem, 500);
    }

    textRefresh(){
        if (this.refreshCount < 3) {
            this.refreshItem = () => {
                this.currentIndex = 0;
                this.dotPadLineList[0].refresh();
                
                this.refreshItem = null;
                this.refreshCount += 1;
                this.sendCommand(true);
            };
            
            setTimeout(this.refreshItem, 1500);
        } else {
            this.refreshMode = RefreshMode.NONE;
        }
    }

    liveRefresh(){
        if (this.refreshCount < 3) {
            this.refreshItem = () => {
                this.currentIndex = 0;
                
                for (const i of this.refreshLine) {
                    this.dotPadLineList[i].refresh(RefreshMode.LIVE_DISPLAY);
                }
                
                this.refreshItem = null;
                this.refreshCount += 1;
                this.sendCommand(true);
            };
            
            setTimeout(this.refreshItem, 1500);
        } else {
            this.refreshLine = [];
            this.refreshMode = RefreshMode.NONE;
        }
    }

    setRefreshMode(mode) {
        clearTimeout(this.refreshItem);
        this.refreshItem = null;
        
        if (this.refreshMode !== RefreshMode.LIVE_DISPLAY && mode === RefreshMode.LIVE_DISPLAY) {
            this.refreshLine = [];
        }
        
        if (this.refreshMode === RefreshMode.NONE) {
            this.refreshMode = mode;
            this.refreshLine = [];
        }
        else if (this.refreshMode !== RefreshMode.ALL_DISPLAY && this.refreshMode !== mode) {
            if (this.refreshMode === RefreshMode.GRAPHIC_DISPLAY) {
                if (mode === RefreshMode.TEXT_DISPLAY) {
                    this.refreshMode = RefreshMode.ALL_DISPLAY;
                }
            }
            else if (this.refreshMode === RefreshMode.TEXT_DISPLAY) {
                if (mode !== RefreshMode.TEXT_DISPLAY) {
                    this.refreshMode = RefreshMode.ALL_DISPLAY;
                }
            }
            else if (this.refreshMode === RefreshMode.LIVE_DISPLAY) {
                if (mode === RefreshMode.TEXT_DISPLAY) {
                    this.refreshMode = RefreshMode.ALL_DISPLAY;
                }
                else if (mode === RefreshMode.GRAPHIC_DISPLAY) {
                    this.refreshMode = RefreshMode.GRAPHIC_DISPLAY;
                }
            }
        }
    }

    compareString(str1, str2) {
        let start = -1;
        let end = -1;
    
        let len = str1.length;
        if (str1.length > str2.length)
            len = str2.length;

        for (let i = 0; i < len - 1; i += 2) {
            const char1 = str1.substring(i, i + 2);
            const char2 = str2.substring(i, i + 2);
    
            if (char1 !== char2) {
                if (start === -1) {
                    start = i;
                }
                end = i + 1;
            }
        }
        
        if (start !== -1) {
            return [start, end];
        } else {
            return null;
        }
    }
}

const ConnectType = {
    NONE: "",
    BLE: "BLE",
    USB: "USB"
};

class DotDevice {
    #messageCallBack = null; // DotPadSDK로 Message 콜백
    #keyCallBack = null; // DotPadSDK로 key 콜백
    #onKeyDownCallBack = null; // DotPadSDK로 keyDown 콜백
    #onKeyUpCallBack = null; // DotPadSDK로 keyUp 콜백
    #receiver = null; // 기기 응답 리시버
    #sendModule = null; // 발송 모듈
    #connectType = ConnectType.NONE; // 연결 방식
    #device = null;
    get connectDevice() {
        return this.#device;
    }
    #writer = null;
    #isConnect = false; // 연결 여부
    get isConnect() {
        return this.#isConnect;
    }
    #mtuSize = 20;

    // 기기 정보
    #deviceName = "";
    #dotCellType = "";
    get cellType() {
        return this.#dotCellType;
    }
    #graphicSupport = false; // 그래픽 지원
    #textSupport = false; // 텍스트 지원
    #numberCellRows = 10; // 그래픽 라인 수
    get numberCellRows() {
        return this.#numberCellRows;
    }
    #numberCellColumns = 30; // 그래픽 라인당 셀 수
    get numberCellColumns() {
        return this.#numberCellColumns;
    }
    #numberBrailleCellRows = 1; // 텍스트 영역 라인 수
    #numberBrailleCellColumns = 20; // 텍스트 라인당 셀 수
    get numberBrailleCellColumns() {
        return this.#numberBrailleCellColumns;
    }
    #graphicCellRefreshTime = 600;
    #brailleCellRefreshTime = 600;

    // 재연결
    #reconnecting = false;
    #maxReconnectAttempts = 10;
    #reconnectDelayMs = 3000;

    // 연결 완료(DataCodes.Connected) 대기
    #connectReadyResolve = null;
    #connectReadyTimeoutId = null;
    #connectSetupAbandoned = false; // 타임아웃 이후 뒤늦게 도착한 Connected 무시용

    constructor(messageCallBack, keyCallBack, onKeyDownCallBack = null, onKeyUpCallBack = null) {
        this.#messageCallBack = messageCallBack;
        this.#keyCallBack = keyCallBack;
        this.#onKeyDownCallBack = onKeyDownCallBack;
        this.#onKeyUpCallBack = onKeyUpCallBack;
        this.DOTPAD_SERVICE = "49535343-fe7d-4ae5-8fa9-9fafd205e455";
        this.DOTPAD_NOTIFY_CHARACTERISTIC = "49535343-1e4d-4bd9-ba61-23c647249616";
        this.DOTPAD_WRITE_CHARACTERISTIC = "49535343-8841-43f4-a8d4-ecbe34729bb3";
        this.#receiver = new DotReceiver(
            this.#receivedMessageCallBack.bind(this),
            this.#receivedKeyCallBack.bind(this),
            this.#receivedKeyDownCallBack.bind(this),
            this.#receivedKeyUpCallBack.bind(this)
        );
        this.#sendModule = new DotPadSendModule(this);
    }

    async connectBleDevice(device) {
        try {
            const server = await device.gatt.connect();
            this.#device = device;
            await this.#setBleDevice();
            this.#connectType = ConnectType.BLE;

            await this.#setMTU();
            const ready = this.#waitUntilConnected();
            await this.requestDeviceInfo(DeviceInfo.DeviceName);
            await ready;

            return true;
        } catch (error) {
            console.error(`BLE Device Connect failed: ${error.message}`);
        }

        return false;
    }

    // requestDeviceInfo(DeviceName) 전송 이후 실제 DataCodes.Connected(핸드셰이크 완료)까지 대기
    #waitUntilConnected(timeoutMs = 5000) {
        this.#connectSetupAbandoned = false;
        return new Promise((resolve, reject) => {
            this.#connectReadyResolve = resolve;
            this.#connectReadyTimeoutId = setTimeout(() => {
                this.#connectReadyResolve = null;
                this.#connectSetupAbandoned = true;
                reject(new Error('Connection handshake timed out'));
            }, timeoutMs);
        });
    }

    async #setBleDevice() {
        const service = await this.#device.gatt.getPrimaryService(this.DOTPAD_SERVICE);

        const notifyCharacteristic = await this.#getCharacteristicWithFallback(service, this.DOTPAD_NOTIFY_CHARACTERISTIC, "notify");
        notifyCharacteristic.startNotifications()
            .then(() => {
                return notifyCharacteristic.addEventListener('characteristicvaluechanged', async (event) => {
                        this.#receiver.startBleNotification(event);
                });
            });

        this.#device.addEventListener("gattserverdisconnected", (event) => {
            this.#receivedMessageCallBack(DataCodes.Disconnected, "");
        }, { once: true });

        this.#writer = await this.#getCharacteristicWithFallback(service, this.DOTPAD_WRITE_CHARACTERISTIC, "write");
    }

    async #getCharacteristicWithFallback(service, uuid, requiredProperty) {
        const propertyCheck = (char) => {
            if (requiredProperty === "write") {
                return char.properties.write || char.properties.writeWithoutResponse;
            }
            return char.properties[requiredProperty];
        };

        try {
            const characteristic = await service.getCharacteristic(uuid);
            if (propertyCheck(characteristic)) {
                return characteristic;
            }
            console.warn(`Characteristic ${uuid} does not have '${requiredProperty}' property. Searching from list.`);
        } catch {
            console.warn(`Characteristic ${uuid} not found. Searching from list.`);
        }

        const characteristics = await service.getCharacteristics();
        const found = characteristics.find(propertyCheck);
        if (!found) {
            throw new Error(`No characteristic with '${requiredProperty}' property found in service.`);
        }
        return found;
    }

    async connectUsbDevice(device) {
        try {
            await device.open({baudRate: 115200, dataBits: 8});
            //const {usbProductId, usbVendorId} = await device.getInfo()
            //const handleReadData = this.getHandleReadData()

            // Listen for the event.
            this.#receiver.startUsbReadLoop(device);

            this.#device = device;
            this.#writer = device.writable.getWriter();
            this.#connectType = ConnectType.USB;
            const ready = this.#waitUntilConnected();
            await this.requestDeviceInfo(DeviceInfo.DeviceName);
            await ready;

            return true;
        } catch (error) {
            console.error(`USB Device Connect failed: ${error.message}`);
        }

        return false;
    }

    async disconnect() {
        if (!this.#isConnect) {
            return Promise.reject('Device is not connected.');
        }
        
        this.#isConnect = false;
        if (this.#connectType === ConnectType.BLE) {
            this.#device.gatt.disconnect();
        } else if (this.#connectType === ConnectType.USB) {
            await this.#receiver.stopReadLoop();
            await this.#writer.close();
            this.#device.close();
        }

        this.#device = null;
        this.#writer = null;

        this.#messageCallBack(this, DataCodes.Disconnected, "");
    }

    // 패킷 전송
    async sendCommand(packet) {
        if (!this.#isConnect)
            return
        
        try {
            if (this.#connectType === ConnectType.BLE) {
                let offset = 0;
                while (offset < packet.byteLength) {
                    // MTU 크기에 맞게 데이터를 분할
                    let chunkSize = Math.min(this.#mtuSize, packet.byteLength - offset);
                    let chunk = packet.slice(offset, offset + chunkSize);
                    try {
                        await this.#writer.writeValue(chunk);
                    } catch (error) {
                        return;
                    }
            
                    offset += chunkSize;
                }

                return true;
            } else if (this.#connectType === ConnectType.USB) {
                await this.#writer.write(packet);
                return true;
            }
        } catch (e) {
            if (e.name === "NetworkError" && e.code === 19 && this.connected) {
                this.#isConnect = false;
                await this.disconnect();
            }
            else {
                if (this.#device) {
                    if (this.#connectType == ConnectType.BLE)
                        await this.connectBleDevice(this.#device);
                    else if (this.#connectType == ConnectType.USB)
                        await this.connectUsbDevice(this.#device);
                }
                else {
                    console.log(e.code, e.name, e.message);
                    console.error(e);
                }
            }
        }
    }

    displayGraphicData(hexData, startLineIndex = 1, startCellIndex = 0, displayMode = DisplayMode.GraphicMode) {
        if (!this.#graphicSupport) {
            return;
        }
    
        // seqNum 결정
        const seqNum = (displayMode === DisplayMode.GraphicMode) ? "00" : "80";
        const step = this.#numberCellColumns;
        const totalStart = startCellIndex;
        const totalEnd = startCellIndex + (hexData.length / 2); // 2 문자 = 1 byte
    
        for (let i = startLineIndex; i <= this.#numberCellRows; i++) {
            const startIndex = i - 1;
    
            if (startIndex < 0) {
                continue;
            }
    
            const chunkStart = startIndex * step;
            const chunkEnd = chunkStart + step;
    
            // 겹치는 범위 계산
            const overlapStart = Math.max(chunkStart, totalStart);
            const overlapEnd = Math.min(chunkEnd, totalEnd);
    
            if (overlapStart >= overlapEnd || chunkEnd < totalStart) {
                continue;
            }
    
            const startOffset = (overlapStart - totalStart) * 2; // hex 문자열 인덱스
            const count = (overlapEnd - overlapStart) * 2;       // 잘라낼 길이
    
            const output = hexData.substring(startOffset, startOffset + count);
            const offset = (startLineIndex === i) ? startCellIndex : 0;

            this.#sendModule.setDotPadLineCommand(
                i,
                seqNum,
                offset,
                output
            );
        }

        this.#sendModule.setRefreshMode(RefreshMode.GRAPHIC_DISPLAY);
        this.#sendModule.sendCommand(true);
    }

    displayTextData(hexData, startCellIndex = 0, displayMode = DisplayMode.TextMode) {
        if (!this.#textSupport) {
            return;
        }
    
        // seqNum 결정
        const seqNum = (displayMode === DisplayMode.GraphicMode) ? "00" : "80";
        this.#sendModule.setDotPadLineCommand(
            0,
            seqNum,
            startCellIndex,
            hexData
        );

        this.#sendModule.setRefreshMode(RefreshMode.TEXT_DISPLAY);
        this.#sendModule.sendCommand(true);
    }

    displayLineData(lineId, startCellIndex = 0, hexData, displayMode) {
        if (!this.#textSupport && lineId == 0) {
            return;
        }

        if (!this.#graphicSupport && lineId > 0) {
            return;
        }
    
        // seqNum 결정
        const seqNum = (displayMode === DisplayMode.GraphicMode) ? "00" : "80";
        this.#sendModule.setDotPadLineCommand(
            lineId,
            seqNum,
            startCellIndex,
            hexData
        );

        this.#sendModule.setRefreshMode(RefreshMode.LIVE_DISPLAY);
        this.#sendModule.sendCommand(true);
    }

    async #setMTU() {
        let maxBytes = 20; // 기본 20바이트부터 시작
        let success = true;
        let temp = 10; // 증가 값
        while (success) {
            let testData = new Uint8Array(maxBytes).fill(0xAB); // 더미 데이터
            try {
                await this.#writer.writeValue(testData);
                maxBytes += temp; // 10바이트씩 증가하며 테스트
                if (maxBytes > 150) break;
            } catch (error) {
                if (temp == 10) {
                    maxBytes -= 9;
                    temp = 1;
                } else {
                    success = false;
                }
            }
        }
    
        this.#mtuSize = maxBytes - 1 >= 148 ? 148 : maxBytes - 1;
    }

    async requestDeviceInfo(deviceInfo) {
        let packet;
        switch (deviceInfo) {
            case DeviceInfo.DeviceName:
                packet = DotPadSendMakeModel.makePacket("", "00", "00", Command.requestDeviceName);
                break;

            case DeviceInfo.FirmwareVersion:
                packet = DotPadSendMakeModel.makePacket("", "00", "00", Command.requestFirmwareVersion);
                break;

            case DeviceInfo.HardwareVersion:
                packet = DotPadSendMakeModel.makePacket("", "00", "00", Command.requestHardwareVersion);
                break;
            default:
                console.warn("Unknown deviceInfo:", deviceInfo);
                return;
        }

        if (this.#connectType === ConnectType.BLE) {
            await this.#writer.writeValue(packet);
        } else if (this.#connectType === ConnectType.USB) {
            await this.#writer.write(packet);
        }
    }

    // 진동 요청
    async requestVibrator(onMs, offMs, repeatCount) {
        const packet = DotPadSendMakeModel.makeVibratorPacket(onMs, offMs, repeatCount);
        await this.sendCommand(packet);
    }

    async #requestBoardInfo() {
        const packet = DotPadSendMakeModel.makePacket("", "00", "00", Command.requestBoardInfo);
        if (this.#connectType === ConnectType.BLE) {
            await this.#writer.writeValue(packet);
        } else if (this.#connectType === ConnectType.USB) {
            await this.#writer.write(packet);
        }
    }

    async #setDeviceNameWithCallBoardInfo(msg) {
        this.#deviceName = msg;
    
        // DeviceName 콜백 전달
        this.#messageCallBack(this, DataCodes.DeviceName, msg);
    
        // 모델별 고정 레이아웃 처리
        if (this.#deviceName.includes("KM2-300A")) {
            this.#initDotPadLineList(0, 0, 20, 15);
        } else if (this.#deviceName.includes("KM2-20")) {
            this.#initDotPadLineList(1, 20, 0, 0);
        } else if (this.#deviceName.includes("KM3-20A")) {
            this.#initDotPadLineList(1, 20, 0, 0);
        } else {
            // BoardInfo 요청 필요
            await this.#requestBoardInfo();
            return;
        }
        
        // 연결 완료 콜백
        this.#setDeviceCellType();
        this.#initDotPadLineList();

        this.#receivedMessageCallBack(DataCodes.Connected, "");
    }

    #setBoardInfo(msg) {
        // 1바이트 = 2 hex 문자 기준
        const data1st = msg.substring(0, 2);
        let data1stLeft = parseInt(data1st.substring(0, 1), 16);

        // 그래픽 지원 플래그
        if (data1stLeft >= 8) {
            data1stLeft -= 8;
            this.#graphicSupport = true;
        } else {
            this.#graphicSupport = false;
        }

        // 텍스트 지원 플래그
        if (data1stLeft >= 4) {
            data1stLeft -= 4;
            this.#textSupport = true;
        } else {
            this.#textSupport = false;
        }

        parseInt(msg.substring(2, 4), 16);
        parseInt(msg.substring(4, 6), 16);
        parseInt(msg.substring(6, 8), 16);

        // ----- Braille display layout configuration(5th ~ 8th) ------ //
        // 5th: Number of Braille Cell Rows (1/2)
        const data5th = parseInt(msg.substring(8, 10), 16);
        this.#numberBrailleCellRows = data5th;

        // 6th: Number of Braille Cell Columns (12/14/15/16/20/24/26/28/30/32/36/40)
        const data6th = parseInt(msg.substring(10, 12), 16);
        this.#numberBrailleCellColumns = data6th;

        parseInt(msg.substring(12, 14), 16);

        // 8th: Braille Text cell total refresh time
        const data8th = parseInt(msg.substring(14, 16), 16);

        // ------ Graphic display layout configuration (9th ~ 12th) ------ //
        // 9th: Number of Graphic Cell Rows
        const data9th = parseInt(msg.substring(16, 18), 16);
        this.#numberCellRows = data9th;

        // 10th: Number of Graphic Cell Columns
        const data10th = parseInt(msg.substring(18, 20), 16);
        this.#numberCellColumns = data10th;

        parseInt(msg.substring(20, 22), 16);

        // 12th: Graphic cell total refresh time
        const data12th = parseInt(msg.substring(22, 24), 16);

        // 그래픽 라인당 refresh time 계산
        if (data12th !== 0 && data9th !== 0) {
            let t = Math.floor((data12th * 100) / data9th) * 3;
            if (t < 300) t = 300;
            this.#graphicCellRefreshTime = t;
        }

        // 텍스트 라인당 refresh time 계산
        if (data8th !== 0 && data5th !== 0) {
            let t = Math.floor((data8th * 100) / data5th) * 3;
            if (t < 300) t = 300;
            this.#brailleCellRefreshTime = t;
        }

        this.#setDeviceCellType();
        this.#initDotPadLineList();

        this.#receivedMessageCallBack(DataCodes.Connected, "");
    }

    #setDeviceCellType() {
        this.#dotCellType = DeviceCellType.fromDeviceName(this.#deviceName).name;
        this.#sendModule.setBufferMode(BufferMode.fromDeviceName(this.#deviceName));
    }

    #initDotPadLineList(numberBrailleCellRows = this.#numberBrailleCellRows, numberBrailleCellColumns = this.#numberBrailleCellColumns, numberCellRows = this.#numberCellRows, numberCellColumns = this.#numberCellColumns) {
        this.#sendModule.clearDotPadLine();

        this.#textSupport = numberBrailleCellRows > 0;
        this.#graphicSupport = numberCellRows > 0;

        if (this.#textSupport) {
            // 텍스트라인 추가
            for (let i = 0; i < numberBrailleCellRows; i++) {
                this.#sendModule.addDotPadLine(
                    this.#brailleCellRefreshTime,
                    numberBrailleCellColumns
                );
            }
        } else {
            // 텍스트 지원하지 않아도 버퍼세팅
            this.#sendModule.addDotPadLine(0, 0);
        }

        if (this.#graphicSupport) {
            // 그래픽 라인 추가
            for (let i = 0; i < numberCellRows; i++) {
                this.#sendModule.addDotPadLine(
                    this.#graphicCellRefreshTime,
                    numberCellColumns
                );
            }
        }

        if (this.#dotCellType === "D3") {
            this.#sendModule.resetAllLineData();
        }
    }

    // 메시지 콜백
    #receivedMessageCallBack(dataCode, msg) {
        switch (dataCode) {
            case DataCodes.Connected:
                if (this.#connectSetupAbandoned) {
                    // 타임아웃으로 이미 연결 실패 처리된 뒤 뒤늦게 도착한 응답 - 무시
                    break;
                }
                this.#isConnect = true;
                if (this.#connectReadyResolve) {
                    clearTimeout(this.#connectReadyTimeoutId);
                    this.#connectReadyResolve();
                    this.#connectReadyResolve = null;
                }
                this.#messageCallBack(this, DataCodes.Connected, "");
                break;
            case DataCodes.Disconnected:
                this.#reconnect();
                break;
            case DataCodes.DeviceName:
                this.#setDeviceNameWithCallBoardInfo(msg);
                break;
            case DataCodes.BoardInfo:
                this.#setBoardInfo(msg);
                break;
            case DataCodes.ResponseDisplayLineAck:
                this.#sendModule.setDotPadLineReceiveAck(parseInt(msg[1], 16), true);
                break;
            case DataCodes.ResponseDisplayLineComplete:
                this.#sendModule.setDotCommandSendReady(true);
                break;
            default:
                this.#messageCallBack(this, dataCode, msg);
                break;
        }
    }

    // 키 콜백
    #receivedKeyCallBack(keyCode, msg) {
        this.#keyCallBack(this, keyCode, msg);
    }

    #receivedKeyDownCallBack(key, dotKeyBinary) {
        if (this.#onKeyDownCallBack) {
            this.#onKeyDownCallBack(this, key, dotKeyBinary);
        }
    }

    #receivedKeyUpCallBack(key, dotKeyBinary) {
        if (this.#onKeyUpCallBack) {
            this.#onKeyUpCallBack(this, key, dotKeyBinary);
        }
    }

    async #reconnect() {
        if (!this.#isConnect) return;
        if (this.#connectType !== ConnectType.BLE) return;
        if (!this.#device) {
            this.disconnect();
            return;
        }
        if (this.#reconnecting) return; // 이미 재연결 중이면 중복 실행 방지
    
        this.#reconnecting = true;
    
        try {
            for (let attempt = 1; attempt <= this.#maxReconnectAttempts; attempt++) {
                console.log(`Reconnect try #${attempt}`);
    
                try {
                    await this.#connectWithTimeout(this.#reconnectDelayMs);
                    await this.#setBleDevice();   // service/characteristic/리스너 재세팅
                    console.log("Reconnect success");
                    return;
                } catch (e) {
                    console.error("Reconnect failed:", e);
    
                    // 마지막 시도면 종료
                    if (attempt === this.#maxReconnectAttempts) {
                        console.log("Reconnect attempts exceeded. Force disconnect.");
                        this.disconnect();
                        return;
                    }
    
                    // 백오프 (필요하면 지수 증가 같은 것도 가능)
                    //await new Promise(res => setTimeout(res, this.#baseReconnectDelayMs));
                }
            }
        } finally {
            this.#reconnecting = false;
        }
    }

    async #connectWithTimeout(timeoutMs) {
        if (!this.#device) {
            throw new Error("Device is null");
        }
    
        const connectPromise = this.#device.gatt.connect();
        let timerId = null;
    
        try {
            const timeoutPromise = new Promise((_, reject) => {
                timerId = setTimeout(() => {
                    reject(new Error("BLE connect timeout"));
                }, timeoutMs);
            });
    
            // 둘 중 먼저 끝나는 걸 기다림
            const result = await Promise.race([connectPromise, timeoutPromise]);
            return result;
        } finally {
            if (timerId !== null) {
                clearTimeout(timerId);
            }
        }
    }
}

class DotPadScanner { 
    constructor() {
        this.DOTPAD_PREFIX = "DotPad";
        this.DOTPAD_SERVICE = "49535343-fe7d-4ae5-8fa9-9fafd205e455";
    }
    
    async startBleScan() {
        const bluetoothOption = {
            filters: [{ namePrefix: this.DOTPAD_PREFIX }],
            optionalServices: [this.DOTPAD_SERVICE]
          };
          
        try {
            const device = await navigator.bluetooth.requestDevice(bluetoothOption);

            return device;
        } catch (error) {
            if (error.name === "NotFoundError") {
                // 취소하거나 아무것도 선택 안 한 케이스
                return;
            }
            console.error(error);
        }

        return;
    }

    async startUsbScan() {
        const filters = [
            {
                usbVendorId: 1027,
                usbProductId: 24592
            },
            {
                usbVendorId: 1027,
                usbProductId: 24597
            }
        ];

        try {
            const device = await navigator.serial.requestPort({filters: filters});

            return device;
        } catch (error) {
            if (error.name === "NotFoundError") {
                // 취소하거나 아무것도 선택 안 한 케이스
                return;
            }
            console.error(error);
        }

        return;
    }
}

// 점역 등급(축약/비축약)
const GradeOption = Object.freeze({
    Grade1: 0x01,
    Grade2: 0x02,
    Grade3: 0x03
});

// 핀 옵션 — liblouis 테이블 선택(getTable)에 쓰인다.
const PinOption = Object.freeze({
    Dot6: 1,
    Dot8: 0
});

// 번역 엔진 종류 — Louis(liblouis, 이번 주 반영) / Dot(닷 자체 점역 엔진, 다음 주 반영 예정)
const TranslateEngine = Object.freeze({
    Dot: "DOT",
    Louis: "LOUIS"
});

// 한 줄당 점자 수 옵션
const NumberOfBraillePerLine = Object.freeze({
    BraillePerLine8: 0x08,
    BraillePerLine12: 0x0C,
    BraillePerLine20: 0x14,
    BraillePerLine32: 0x20
});

class UserOption {
    languageCode; // BrailleLanguage
    gradeOption = GradeOption.Grade2;
    pinOption = PinOption.Dot6;
    numberOfBraillePerLine = NumberOfBraillePerLine.BraillePerLine20;

    constructor(languageCode) {
        this.languageCode = languageCode;
    }
}

// translateEngine / pinOption / languageCode 는 엔진 라우팅·테이블 선택에 쓰이는 SDK 내부 구현 디테일이라
// 공개 객체(BrailleLanguage.X)에는 넣지 않고 이 파일 안에서만 조회 가능한 내부 맵(#ENGINE_INFO)에 둔다.
// 값 자체는 Android(sdk_v3.braile.BrailleLanguage), iOS(BrailleLanguage.swift)와 동일하게 유지한다.
// 엔진이 다르면 같은 텍스트가 플랫폼별로 다르게 점역된다 — Louis 는 liblouis(LiblouisManager)의
// 테이블을, Dot 은 닷 자체 점역 엔진(다음 주 반영 예정)을 사용한다.
const ENGINE_INFO = new Map();

function define(name, displayName, grades, translateEngine, pinOption, languageCode) {
    const language = Object.freeze({ name, displayName, grades });
    ENGINE_INFO.set(language, Object.freeze({ translateEngine, pinOption, languageCode }));
    return language;
}

const BrailleLanguage = Object.freeze({
    English:           define("English",           "English",       ["Grade1", "Grade2"], TranslateEngine.Louis, PinOption.Dot6, 0x05),
    Korean:            define("Korean",             "한국어",         ["Grade1", "Grade2"], TranslateEngine.Dot,   PinOption.Dot6, 0x0A),
    Japanese:          define("Japanese",           "日本語",         [],                   TranslateEngine.Dot,   PinOption.Dot8, 0x09),
    ChineseSimplified: define("ChineseSimplified",  "简体中文",       ["Xianxing (Shengdiao)", "Xianxing (No Shengdiao)", "Shuang Pin"], TranslateEngine.Dot, PinOption.Dot6, 0x03),
    Catalan:           define("Catalan",            "català",         [],                   TranslateEngine.Louis, PinOption.Dot6, 0x19),
    Polish:            define("Polish",             "polski",         [],                   TranslateEngine.Louis, PinOption.Dot6, 0x11),
    Norwegian:         define("Norwegian",          "norsk",          [],                   TranslateEngine.Louis, PinOption.Dot6, 0x12),
    ChineseTaiwan:     define("ChineseTaiwan",      "中華民國",       [],                   TranslateEngine.Louis, PinOption.Dot6, 0x1D),
    French:            define("French",             "français",       ["Grade1", "Grade2"], TranslateEngine.Louis, PinOption.Dot6, 0x06),
    German:            define("German",             "deutsch",        ["Grade1", "Grade2"], TranslateEngine.Louis, PinOption.Dot6, 0x07),
    Spanish:           define("Spanish",            "español",        [],                   TranslateEngine.Louis, PinOption.Dot6, 0x0C),
    Russian:           define("Russian",            "Русский",        [],                   TranslateEngine.Dot,   PinOption.Dot6, 0x0B),
    Italian:           define("Italian",            "Italiano",       [],                   TranslateEngine.Louis, PinOption.Dot6, 0x08),
    Czech:             define("Czech",              "čeština",        [],                   TranslateEngine.Louis, PinOption.Dot6, 0x10),
    Vietnamese:        define("Vietnamese",         "Tiếng Việt",     ["Grade1", "Grade2"], TranslateEngine.Louis, PinOption.Dot6, 0x0D),
    Arabic:            define("Arabic",             "العربية",        ["Grade1", "Grade2"], TranslateEngine.Dot,   PinOption.Dot6, 0x01),
    Portuguese:        define("Portuguese",         "Português",      ["Grade1", "Grade2"], TranslateEngine.Louis, PinOption.Dot6, 0x0F),
    Kazakh:            define("Kazakh",             "қазақ",          [],                   TranslateEngine.Louis, PinOption.Dot6, 0x13),
    Danish:            define("Danish",             "dansk",          ["Grade1", "Grade2"], TranslateEngine.Louis, PinOption.Dot6, 0x14),
    Greek:             define("Greek",              "Ελληνικά",       [],                   TranslateEngine.Louis, PinOption.Dot6, 0x15),
    Swedish:           define("Swedish",            "svenska",        ["Grade1", "Grade2"], TranslateEngine.Louis, PinOption.Dot6, 0x16),
    Finnish:           define("Finnish",            "Suomalainen",    [],                   TranslateEngine.Louis, PinOption.Dot6, 0x17),
    Thai:              define("Thai",               "แบบไทย",         [],                   TranslateEngine.Louis, PinOption.Dot6, 0x18),
    Khmer:             define("Khmer",              "ខ្មែរ",           [],                   TranslateEngine.Louis, PinOption.Dot6, 0x1A),
    Mongolian:         define("Mongolian",          "монгол",         ["Grade1", "Grade2"], TranslateEngine.Louis, PinOption.Dot6, 0x23),
    Uzbek:             define("Uzbek",              "Oʻzbekcha",      [],                   TranslateEngine.Louis, PinOption.Dot6, 0x22),
    Dutch:             define("Dutch",              "Nederlands",     ["Grade1", "Grade2"], TranslateEngine.Louis, PinOption.Dot6, 0x04),
    Romanian:          define("Romanian",           "Română",         [],                   TranslateEngine.Louis, PinOption.Dot6, 0x25),
    Hungarian:         define("Hungarian",          "Magyar",         ["Grade1", "Grade2"], TranslateEngine.Louis, PinOption.Dot6, 0x26),
    Welsh:             define("Welsh",              "Cymraeg",        ["Grade1", "Grade2"], TranslateEngine.Louis, PinOption.Dot6, 0x27),
    Serbian:           define("Serbian",            "Србија",         [],                   TranslateEngine.Louis, PinOption.Dot6, 0x28),
    Croatian:          define("Croatian",           "Hrvatski",       [],                   TranslateEngine.Louis, PinOption.Dot6, 0x2A),
    Marathi:           define("Marathi",            "मराठी",          [],                   TranslateEngine.Louis, PinOption.Dot6, 0x2B),
    // 구 미국 점자(EBAE, UEB 이전 규격)
    EnglishOld:        define("EnglishOld",         "English (EBAE)", ["Grade1", "Grade2"], TranslateEngine.Louis, PinOption.Dot6, 0x29)
});

// SDK 내부(LiblouisManager 테이블 선택, DotBrailleManager 엔진 라우팅)에서만 사용 — DotPadSDK.js에서 재노출하지 않는다.
function getEngineInfo(language) {
    return ENGINE_INFO.get(language);
}

// liblouis(wasm) 정적 파일(liblouis.js/.wasm/.data) 위치. 기본값은 이 파일과 같은 폴더(./lib) 이며,
// 배포 시 세 파일을 반드시 함께 옮겨야 한다(.data 안에 tables 전체가 미리 패키징되어 있음).
// new URL(literal, import.meta.url) 형태를 webpack 5가 정적 에셋 참조로 해석해 './lib/' 폴더를
// 번들러 소스 트리에서 직접 찾으려 시도한다. setAssetBaseUrl()로 항상 재정의해 쓰는 경로라
// webpackIgnore로 그 정적 분석을 막아둔다(빌드 시 './lib/'가 실제로 존재하지 않아도 에러가 안 나게).
let assetBaseUrl = new URL(/* webpackIgnore: true */ "./lib/", import.meta.url);
let modulePromise = null;

/**
 * liblouis 정적 파일을 다른 경로에 배포했을 때 사용. loadModule()이 처음 호출되기 전에만 유효하다.
 * @param {string | URL} url - liblouis.js/.wasm/.data 세 파일이 위치한 디렉토리(끝에 "/" 필요)
 */
function setAssetBaseUrl(url) {
    assetBaseUrl = new URL(/* webpackIgnore: true */ url, import.meta.url);
}

// liblouis(wasm) 엔진 로드 — 최초 1회만 초기화하고 이후 호출은 같은 Promise를 재사용한다.
function loadModule() {
    if (!modulePromise) {
        modulePromise = import(/* @vite-ignore */ /* webpackIgnore: true */ new URL("liblouis.js", assetBaseUrl).href)
            .then((module) => module.default({
                locateFile: (path) => new URL(path, assetBaseUrl).href
            }))
            .then((Module) => {
                Module.liblouis.setDataPath("/tables");
                return Module;
            });
    }
    return modulePromise;
}

/** 등급/핀옵션으로 4개 후보 테이블 중 하나를 고른다. Grade1만 "-1", 나머지(Grade2/Grade3)는 "-2"로 취급한다. */
function pick(gradeOption, pinOption, g1Dot6, g1Dot8, g2Dot6, g2Dot8) {
    if (gradeOption === GradeOption.Grade1) {
        return pinOption === PinOption.Dot8 ? g1Dot8 : g1Dot6;
    }
    return pinOption === PinOption.Dot8 ? g2Dot8 : g2Dot6;
}

/**
 * 언어/등급/핀옵션 조합에 해당하는 liblouis 테이블 파일명.
 * Android(LiblouisManager.kt), iOS(Louis.m)의 매핑과 동일하게 맞춘다.
 */
function getTable(languageCode, gradeOption, pinOption) {
    switch (languageCode) {
        case BrailleLanguage.English: return pick(gradeOption, pinOption, "en-ueb-g1.ctb", "en-ueb-g1.ctb", "en-ueb-g2.ctb", "en-ueb-g2.ctb");
        case BrailleLanguage.Korean: return pick(gradeOption, pinOption, "ko-g1.ctb", "ko-g1.ctb", "ko-g2.ctb", "ko-g2.ctb");
        case BrailleLanguage.Japanese: return pick(gradeOption, pinOption, "ja-rokutenkanji.utb", "ja-kantenji-ucs2.utb", "ja-rokutenkanji.utb", "ja-kantenji-ucs2.utb");
        // Dot 엔진 전용 — liblouis 미사용, 기존 값 유지
        case BrailleLanguage.ChineseSimplified: return "zhcn-cbs.ctb";
        case BrailleLanguage.Catalan: return "ca.tbl";
        case BrailleLanguage.Polish: return pick(gradeOption, pinOption, "pl.tbl", "pl-pl-comp8.ctb", "pl.tbl", "pl-pl-comp8.ctb");
        case BrailleLanguage.Norwegian: return pick(gradeOption, pinOption, "no-no-g0.utb", "no-no-comp8.ctb", "no-no-g1.ctb", "no-no-comp8.ctb");
        case BrailleLanguage.ChineseTaiwan: return "zh-tw.ctb";
        case BrailleLanguage.French: return pick(gradeOption, pinOption, "fr-bfu-comp6.utb", "fr-bfu-comp8.utb", "fr-bfu-g2.ctb", "fr-bfu-comp8.utb");
        case BrailleLanguage.German: return pick(gradeOption, pinOption, "de-g0.utb", "de-de-comp8.ctb", "de-g2.ctb", "de-de-comp8.ctb");
        case BrailleLanguage.Spanish: return pick(gradeOption, pinOption, "es.tbl", "Es-Es-G0.utb", "es-g2.ctb", "Es-Es-G0.utb");
        case BrailleLanguage.Russian: return pick(gradeOption, pinOption, "ru-litbrl.ctb", "ru-comp8.utb", "ru-ru-g1.ctb", "ru-comp8.utb");
        case BrailleLanguage.Italian: return pick(gradeOption, pinOption, "it-it-comp6.utb", "it-it-comp8.utb", "it-it-comp6.utb", "it-it-comp8.utb");
        case BrailleLanguage.Czech: return pick(gradeOption, pinOption, "cs.tbl", "cs-comp8.utb", "cs.tbl", "cs-comp8.utb");
        case BrailleLanguage.Vietnamese: return pick(gradeOption, pinOption, "vi-vn-g0.utb", "vi-cb8.utb", "vi-vn-g2.ctb", "vi-cb8.utb");
        case BrailleLanguage.Arabic: return pick(gradeOption, pinOption, "ar.tbl", "ar-ar-comp8.utb", "ar-ar-g2.ctb", "ar-ar-comp8.utb");
        case BrailleLanguage.Portuguese: return pick(gradeOption, pinOption, "pt-pt-g1.utb", "pt-pt-comp8.ctb", "pt.tbl", "pt-pt-comp8.ctb");
        case BrailleLanguage.Kazakh: return "kk.utb";
        case BrailleLanguage.Danish: return pick(gradeOption, pinOption, "da-dk-g16.ctb", "da-dk-g26.ctb", "da-dk-g18.ctb", "da-dk-g28.ctb");
        case BrailleLanguage.Greek: return "el.ctb";
        case BrailleLanguage.Swedish: return pick(gradeOption, pinOption, "sv-g0.utb", "sv-g0.utb", "sv-g2.ctb", "sv-g2.ctb");
        case BrailleLanguage.Finnish: return pick(gradeOption, pinOption, "fi.utb", "fi-fi-8dot.ctb", "fi.utb", "fi-fi-8dot.ctb");
        case BrailleLanguage.Thai: return pick(gradeOption, pinOption, "th-g0.utb", "th-comp8-backward.utb", "th-g0.utb", "th-comp8-backward.utb");
        case BrailleLanguage.Khmer: return "km-g1.utb";
        case BrailleLanguage.Mongolian: return pick(gradeOption, pinOption, "mn-MN-g1.utb", "mn-MN-g1.utb", "mn-MN-g2.ctb", "mn-MN-g2.ctb");
        case BrailleLanguage.Uzbek: return "uz-g1.utb";
        case BrailleLanguage.Dutch: return pick(gradeOption, pinOption, "nl-NL-g0.utb", "nl-comp8.utb", "nl-NL-g0.utb", "nl-comp8.utb");
        case BrailleLanguage.Romanian: return "ro-g0.utb";
        case BrailleLanguage.Hungarian: return pick(gradeOption, pinOption, "hu.tbl", "hu-hu-comp8.ctb", "hu-hu-g2.ctb", "hu-hu-comp8.ctb");
        case BrailleLanguage.Welsh: return pick(gradeOption, pinOption, "cy-cy-g1.utb", "cy-cy-g1.utb", "cy.tbl", "cy.tbl");
        case BrailleLanguage.Serbian: return pick(gradeOption, pinOption, "sr-g1.ctb", "sr-g1.ctb", "sr-Cyrl.ctb", "sr-Cyrl.ctb");
        case BrailleLanguage.Croatian: return pick(gradeOption, pinOption, "hr-g1.tbl", "hr-comp8.tbl", "hr-g1.tbl", "hr-comp8.tbl");
        case BrailleLanguage.Marathi: return "mr-in-g1.utb";
        case BrailleLanguage.EnglishOld: return pick(gradeOption, pinOption, "en-us-g1.ctb", "en_US-comp8-ext.tbl", "en-us-g2.ctb", "en_US-comp8-ext.tbl");
        default: return pick(gradeOption, pinOption, "en-ueb-g1.ctb", "en-ueb-g1.ctb", "en-ueb-g2.ctb", "en-ueb-g2.ctb");
    }
}

/** 점자 셀 hex(2자리/셀) → liblouis 입력용 유니코드 점자(U+2800 + 핀 비트) */
function hexToBrailleUnicode(hex) {
    let result = "";
    for (let i = 0; i + 2 <= hex.length; i += 2) {
        result += String.fromCodePoint(0x2800 + parseInt(hex.substring(i, i + 2), 16));
    }
    return result;
}

/** liblouis가 반환한 유니코드 점자 → 점자 셀 hex(2자리/셀) */
function brailleUnicodeToHex(text) {
    let result = "";
    for (const ch of text) {
        result += (ch.codePointAt(0) - 0x2800).toString(16).padStart(2, "0");
    }
    return result;
}

/** 셀 hex는 2자리씩(바이트) 짝수 길이의 16진수여야 한다. liblouis 번역/테이블 컴파일 실패 판별용. */
function isValidBrailleHex(hex) {
    return typeof hex === "string" && hex.length > 0 && hex.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(hex);
}

// 공백(00, 빈 셀) 기준으로 단어 단위 줄바꿈 후 cellCount 배수로 정렬한다.
// iOS(Louis.m wordwrapTranslateOutput), Android(LiblouisManager.kt)와 동일한 알고리즘.
// 단어(00으로 끝나는 청크) 하나가 cellCount보다 길면 강제로 여러 줄에 걸쳐 자른다.
function wordwrapTranslateOutput(hex, cellCount) {
    if (!Number.isInteger(cellCount) || cellCount <= 0) {
        return hex;
    }

    const cells = [];
    for (let i = 0; i + 2 <= hex.length; i += 2) {
        cells.push(hex.substring(i, i + 2));
    }
    if (cells.length === 0) {
        return hex;
    }

    const chunks = [];
    let current = [];
    for (let i = 0; i < cells.length; i++) {
        current.push(cells[i]);
        if (cells[i] === "00" || i === cells.length - 1) {
            chunks.push(current);
            current = [];
        }
    }

    let result = "";
    let used = 0; // 현재 줄에 이미 쓴 셀 수

    for (const chunk of chunks) {
        const chunkSize = chunk.length;
        let spaceLeft = cellCount - used;

        if ((chunkSize <= cellCount && chunkSize > spaceLeft) || (chunkSize > cellCount && spaceLeft !== cellCount)) {
            result += "00".repeat(spaceLeft);
            used = 0;
        }

        let startPos = 0;
        while (startPos < chunkSize) {
            if (used === cellCount) {
                used = 0;
            }

            spaceLeft = cellCount - used;
            const remaining = chunkSize - startPos;
            const toWrite = remaining > spaceLeft ? spaceLeft : remaining;

            result += chunk.slice(startPos, startPos + toWrite).join("");

            startPos += toWrite;
            used += toWrite;
        }
    }

    if (used > 0 && used < cellCount) {
        result += "00".repeat(cellCount - used);
    }

    return result;
}

// 정역: 텍스트 → 점자 셀 hex
// @param {boolean} [applyWordWrap] - true면 userOption.numberOfBraillePerLine 기준으로 워드랩 적용.
//   buildMultiLineData()가 그래픽 폭 기준으로 재배치할 원본 셀 스트림이 필요할 때는 false로 호출한다.
async function translateText$1(inputText, userOption, applyWordWrap = true) {
    const Module = await loadModule();
    const table = getTable(userOption.languageCode, userOption.gradeOption, userOption.pinOption);

    let brailleUnicode = null;
    try {
        brailleUnicode = Module.liblouis.translate({ table, text: inputText, direction: "forward" });
    } catch (e) {
        brailleUnicode = null;
    }

    const hex = brailleUnicode ? brailleUnicodeToHex(brailleUnicode) : null;

    // liblouis가 테이블 컴파일/번역에 실패하면 결과가 비어있거나 홀수 길이일 수 있다.
    if (!isValidBrailleHex(hex)) {
        return "";
    }

    return applyWordWrap ? wordwrapTranslateOutput(hex, userOption.numberOfBraillePerLine) : hex;
}

// 역점역: 점자 셀 hex → 텍스트
async function backTranslateText$1(inputHex, userOption) {
    const Module = await loadModule();
    const table = getTable(userOption.languageCode, userOption.gradeOption, userOption.pinOption);
    const brailleUnicode = hexToBrailleUnicode(inputHex);

    try {
        return Module.liblouis.translate({ table, text: brailleUnicode, direction: "backward" }) ?? "";
    } catch (e) {
        return "";
    }
}

var LiblouisManager = /*#__PURE__*/Object.freeze({
  __proto__: null,
  backTranslateText: backTranslateText$1,
  brailleUnicodeToHex: brailleUnicodeToHex,
  hexToBrailleUnicode: hexToBrailleUnicode,
  setAssetBaseUrl: setAssetBaseUrl,
  translateText: translateText$1
});

// 닷 자체 점역 엔진(Android/iOS의 TTBEngine 대응) — 다음 주 웹용 빌드본 반영 예정.
// BrailleLanguage.translateEngine === TranslateEngine.Dot 인 언어(한국어, 일본어, 중국어, 러시아어, 아랍어)의
// 정역/역점역을 담당한다. 엔진이 추가되면 이 파일의 두 함수만 구현하면 DotBrailleManager는 그대로 동작한다.

async function translateText(inputText, userOption) {
    throw new Error(`닷점역(Dot) 엔진은 아직 web SDK에 추가되지 않았습니다. (language=${userOption.languageCode.name})`);
}

async function backTranslateText(inputHex, userOption) {
    throw new Error(`닷점역(Dot) 엔진은 아직 web SDK에 추가되지 않았습니다. (language=${userOption.languageCode.name})`);
}

// 점역된 텍스트를 그래픽 영역(예: 300셀)에 자간/행간을 띄워 배치하는 멀티라인 레이아웃 순수 함수 모음.
// 디바이스 I/O 없음 — 결과 hex는 DotDevice.displayGraphicData()에 그대로 전달한다.
// dot-aaas-site(paragraphDotpadCursor.ts / dotpadConnection.ts)의 레이아웃·비트 패킹 규칙을 그대로 따른다.

const PIN_ROWS_PER_CELL = 4; // 점자 셀 1개 = 세로 4핀(1·2·3 + 4·5·6 중 하나의 열 기준 3핀 + 커서/8점용 1핀)
const PIN_COLS_PER_CELL = 2; // 점자 셀 1개 = 가로 2핀

// 그래픽 모드 hex의 바이트 비트 배치(DotPad 그래픽 프로토콜 고유 규칙, column-major).
// 점자 dot-bit(1~8번 점) 규칙과는 다르므로 혼동하지 말 것 — 이 값은 하드웨어 스펙 그대로다.
const PIN_BIT_TABLE = {
    "0,0": 0x01, "1,0": 0x10,
    "0,1": 0x02, "1,1": 0x20,
    "0,2": 0x04, "1,2": 0x40,
    "0,3": 0x08, "1,3": 0x80
};

// 점자 셀 hex(2자리/셀) → 셀 바이트 배열(0~255, dot-bit)
function hexToCellBytes(hex) {
    const cells = [];
    for (let i = 0; i + 2 <= hex.length; i += 2) {
        cells.push(parseInt(hex.substring(i, i + 2), 16));
    }
    return cells;
}

// 공백(0x00, 빈 셀) 기준으로 단어 단위 줄바꿈. 한 줄에 최대 textCols 셀까지, 단어 사이는 빈 셀 1개.
// 단어 하나가 textCols보다 길면 강제로 여러 줄에 걸쳐 자른다.
function wrapCellsToLines(cells, textCols) {
    if (textCols <= 0 || cells.length === 0) {
        return [[]];
    }

    const words = [];
    let word = [];
    for (const cell of cells) {
        if (cell === 0x00) {
            if (word.length > 0) {
                words.push(word);
                word = [];
            }
        } else {
            word.push(cell);
        }
    }
    if (word.length > 0) {
        words.push(word);
    }
    if (words.length === 0) {
        return [[]];
    }

    const lines = [];
    let current = [];
    for (const w of words) {
        if (w.length > textCols) {
            if (current.length > 0) {
                lines.push(current);
                current = [];
            }
            for (let i = 0; i < w.length; i += textCols) {
                lines.push(w.slice(i, i + textCols));
            }
            continue;
        }

        const needed = current.length === 0 ? w.length : current.length + 1 + w.length;
        if (needed > textCols) {
            lines.push(current);
            current = [...w];
        } else {
            if (current.length > 0) {
                current.push(0x00);
            }
            current.push(...w);
        }
    }
    if (current.length > 0) {
        lines.push(current);
    }

    return lines;
}

// 강제 개행(문단)으로 이미 나뉜 셀 배열들을 각각 word-wrap 한 뒤 순서대로 이어붙인다.
function wrapParagraphsToLines(cellLinesPerParagraph, textCols) {
    const lines = [];
    for (const cells of cellLinesPerParagraph) {
        lines.push(...wrapCellsToLines(cells, textCols));
    }
    return lines;
}

// 핀 비트맵(row-major, pinW*pinH) → 그래픽 모드 hex(셀당 1바이트, column-major 압축)
function packPinsToGraphicHex(pinGrid, pinW, pinH) {
    const cellsW = pinW / PIN_COLS_PER_CELL;
    const cellsH = pinH / PIN_ROWS_PER_CELL;
    let result = "";

    for (let cellRow = 0; cellRow < cellsH; cellRow++) {
        for (let cellCol = 0; cellCol < cellsW; cellCol++) {
            let byte = 0;
            for (let dr = 0; dr < PIN_ROWS_PER_CELL; dr++) {
                for (let dc = 0; dc < PIN_COLS_PER_CELL; dc++) {
                    const pinRow = cellRow * PIN_ROWS_PER_CELL + dr;
                    const pinCol = cellCol * PIN_COLS_PER_CELL + dc;
                    if (pinGrid[pinRow * pinW + pinCol]) {
                        byte |= PIN_BIT_TABLE[`${dc},${dr}`];
                    }
                }
            }
            result += byte.toString(16).padStart(2, "0");
        }
    }

    return result;
}

/**
 * 문단(강제 개행) 단위로 나뉜 점자 셀 배열들을 그래픽 격자에 배치하여 페이지 hex 배열을 만든다.
 * @param {number[][]} cellLinesPerParagraph - 문단별 점자 셀 바이트 배열(문단 순서대로)
 * @param {number} graphicCols - 그래픽 셀 열 수 (예: 30)
 * @param {number} graphicRows - 그래픽 셀 행 수 (예: 10)
 * @param {number} [lineSpacing] - 행간: 1|2|3
 * @param {number} [letterSpacing] - 자간: 0|1
 * @returns {{ pages: string[], pageCount: number, totalLines: number }}
 */
function buildMultilinePages(cellLinesPerParagraph, graphicCols, graphicRows, lineSpacing = 2, letterSpacing = 1) {
    const cellPinW = letterSpacing === 0 ? 2 : 3;
    const pinW = graphicCols * PIN_COLS_PER_CELL;
    const textCols = Math.floor(pinW / cellPinW);

    const pinH = graphicRows * PIN_ROWS_PER_CELL;
    const gapPins = lineSpacing > 1 ? lineSpacing - 1 : 0;
    const cellRows = gapPins === 0 ? graphicRows : Math.floor((pinH + gapPins) / (PIN_ROWS_PER_CELL + gapPins));

    const wrapped = wrapParagraphsToLines(cellLinesPerParagraph, textCols);
    const totalLines = wrapped.length;
    const totalPages = Math.max(1, Math.ceil(totalLines / cellRows));

    const pages = [];
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const startLine = pageIndex * cellRows;
        const pinGrid = new Uint8Array(pinW * pinH);

        for (let row = 0; row < cellRows; row++) {
            const absLine = startLine + row;
            if (absLine >= wrapped.length) {
                break;
            }

            const lineCells = wrapped[absLine];
            const baseRow = row * (PIN_ROWS_PER_CELL + gapPins);
            if (baseRow + PIN_ROWS_PER_CELL > pinH) {
                break;
            }

            for (let col = 0; col < textCols; col++) {
                const cellByte = col < lineCells.length ? lineCells[col] : 0;
                if (!cellByte) {
                    continue;
                }

                const baseCol = col * cellPinW;
                if (baseCol + PIN_COLS_PER_CELL > pinW) {
                    break;
                }

                // 점자 dot-bit(표준 점자 1~8번 점) → 셀 내부(2열×4행) 좌표
                if (cellByte & 0x01) pinGrid[(baseRow + 0) * pinW + baseCol + 0] = 1; // dot 1
                if (cellByte & 0x02) pinGrid[(baseRow + 1) * pinW + baseCol + 0] = 1; // dot 2
                if (cellByte & 0x04) pinGrid[(baseRow + 2) * pinW + baseCol + 0] = 1; // dot 3
                if (cellByte & 0x08) pinGrid[(baseRow + 0) * pinW + baseCol + 1] = 1; // dot 4
                if (cellByte & 0x10) pinGrid[(baseRow + 1) * pinW + baseCol + 1] = 1; // dot 5
                if (cellByte & 0x20) pinGrid[(baseRow + 2) * pinW + baseCol + 1] = 1; // dot 6
                if (cellByte & 0x40) pinGrid[(baseRow + 3) * pinW + baseCol + 0] = 1; // dot 7
                if (cellByte & 0x80) pinGrid[(baseRow + 3) * pinW + baseCol + 1] = 1; // dot 8
            }
        }

        pages.push(packPinsToGraphicHex(pinGrid, pinW, pinH));
    }

    return { pages, pageCount: pages.length, totalLines };
}

// 언어별 translateEngine(BrailleLanguage.translateEngine)에 따라 liblouis(LiblouisManager) 또는
// 닷 자체 엔진(DotBrailleModule)으로 라우팅한다. Android(sdk_v3.braile.DotBrailleManager)와 동일한 구조.
class DotBrailleManager {
    userOption = new UserOption(BrailleLanguage.English);

    constructor() {
        this.setBrailleLanguage(BrailleLanguage.English);
    }

    /**
     * @param {BrailleLanguage[keyof BrailleLanguage]} language
     * @param {number} [gradeOption]
     */
    setBrailleLanguage(language, gradeOption = null) {
        this.userOption.languageCode = language;
        this.userOption.pinOption = getEngineInfo(language).pinOption;

        if (gradeOption != null) {
            this.userOption.gradeOption = gradeOption;
        }
    }

    setBrailleGrade(gradeOption) {
        this.userOption.gradeOption = gradeOption;
    }

    /**
     * 워드랩 기준 한 줄당 점자 셀 수 설정(liblouis 정역 결과에 적용됨).
     * @param {number} count
     */
    setNumberOfBraillePerLine(count) {
        if (Number.isInteger(count) && count > 0) {
            this.userOption.numberOfBraillePerLine = count;
        }
    }

    getNumberOfBraillePerLine() {
        return this.userOption.numberOfBraillePerLine;
    }

    // 텍스트 → 점자 셀 hex (userOption.numberOfBraillePerLine 기준 워드랩 적용)
    // applyWordWrap=false: buildMultiLineData()가 그래픽 폭 기준으로 재배치할 원본 셀 스트림용.
    async translateText(inputText, applyWordWrap = false) {
        if (getEngineInfo(this.userOption.languageCode).translateEngine === TranslateEngine.Louis) {
            return translateText$1(inputText, this.userOption, applyWordWrap);
        }

        try {
            return await translateText(inputText, this.userOption);
        } catch (e) {
            // 닷점역(Dot) 엔진이 아직 반영되지 않아 임시로 liblouis로 폴백한다.
            // DotBrailleModule이 실제로 구현되면 더 이상 에러를 던지지 않으므로 이 catch는 자연히 타지 않게 된다.
            return translateText$1(inputText, this.userOption, applyWordWrap);
        }
    }

    // 역점역: 점자 셀 hex → 텍스트
    async backTranslateText(inputHex) {
        if (getEngineInfo(this.userOption.languageCode).translateEngine === TranslateEngine.Louis) {
            return backTranslateText$1(inputHex, this.userOption);
        }

        try {
            return await backTranslateText(inputHex, this.userOption);
        } catch (e) {
            // translateText와 동일한 사유의 임시 liblouis 폴백.
            return backTranslateText$1(inputHex, this.userOption);
        }
    }

    /**
     * 여러 줄(문단) 텍스트를 점역하여 그래픽 영역(예: 300셀)에 자간/행간을 띄워 배치하는 멀티라인 페이지 hex 배열로 변환.
     * 입력의 "\n"은 강제 개행(문단 구분)으로 유지되고, 그 외 텍스트는 그래픽 폭에 맞춰 자동 줄바꿈된다.
     * @param {string} inputText
     * @param {number} graphicCols
     * @param {number} graphicRows
     * @param {number} [lineSpacing] - 행간: 1|2|3
     * @param {number} [letterSpacing] - 자간: 0|1
     * @returns {Promise<{ pages: string[], pageCount: number, totalLines: number }>}
     */
    async buildMultiLineData(inputText, graphicCols, graphicRows, lineSpacing = 2, letterSpacing = 1) {
        const paragraphs = inputText.split("\n");
        const cellLinesPerParagraph = [];

        for (const paragraph of paragraphs) {
            const hex = paragraph.length > 0 ? await this.translateText(paragraph, false) : "";
            cellLinesPerParagraph.push(hexToCellBytes(hex));
        }

        return buildMultilinePages(cellLinesPerParagraph, graphicCols, graphicRows, lineSpacing, letterSpacing);
    }
}

class DotPadSDK {
    #connectedDevices = [];
    #brailleManager = new DotBrailleManager();
    messageCallBack = null;
    keyCallBack = null;
    onKeyDownCallBack = null;
    onKeyUpCallBack = null;

    // 연결된 기기 목록
    getConnectedDevices() {
        return [...this.#connectedDevices];
    }

    // Bluetooth 연결
    async connectBleDevice(device) {
        for (const dev of this.#connectedDevices) {
            if (dev.connectDevice == device) {
                return null;
            }
        }

        const newDevice = new DotDevice(this.#receivedMessageCallBackWithDevice.bind(this), this.#receivedKeyCallBack.bind(this), this.#receivedOnKeyDownCallBack.bind(this), this.#receivedOnKeyUpCallBack.bind(this));
        if (await newDevice.connectBleDevice(device)) {
            this.#connectedDevices.push(newDevice);
            return newDevice;
        }
        
        return null;
    }

    // USB 연결
    async connectUsbDevice(device) {
        for (const dev of this.#connectedDevices) {
            if (dev.connectDevice == device) {
                return null;
            }
        }

        const newDevice = new DotDevice(this.#receivedMessageCallBackWithDevice.bind(this), this.#receivedKeyCallBack.bind(this), this.#receivedOnKeyDownCallBack.bind(this), this.#receivedOnKeyUpCallBack.bind(this));
        if (await newDevice.connectUsbDevice(device)) {
            this.#connectedDevices.push(newDevice);
            return newDevice;
        }
        
        return null;
    }

    /**
     * device 연결 해제
     * @param {DotDevice | null | undefined} [device]
     */
    disconnect(device = null) {
        if (device == null) {
            for (const dev of this.#connectedDevices) {
                dev.disconnect();
            }
            this.#connectedDevices = [];
        } else {
            device.disconnect();
            this.#connectedDevices = this.#connectedDevices.filter(d => d !== device);
        }
    }

    /**
     * 기기 정보 요청
     * @typedef {DeviceInfo} DeviceInfo
     * @param {DotDevice} [device]
     * @param {DeviceInfo} deviceInfo
     */
    requestDeviceInfo(device, deviceInfo) {
        device.requestDeviceInfo(deviceInfo);
    }

    /**
     * @param {string} hexData
     * @param {DotDevice | null | undefined} [device]
     * @param {DisplayMode} displayMode
     */
    displayGraphicData(hexData, device = null, displayMode = DisplayMode.GraphicMode) {
        if (device == null) {
            for (const dev of this.#connectedDevices) {
                dev.displayGraphicData(hexData, 1, 0, displayMode);
            }
        } else {
            device.displayGraphicData(hexData, 1, 0, displayMode);
        }
    }

    /**
     * 텍스트(점자 라인) 출력.
     * needsTranslation을 생략하면 기존과 동일하게 inputData를 점자 셀 hex로 보고 그대로 출력한다(하위 호환).
     * needsTranslation=true면 inputData를 일반 텍스트로 보고 setBrailleLanguage로 설정한 언어/등급 기준 정역한 뒤 출력한다(Android displayTextData와 동일한 옵션).
     * @param {string} inputData - needsTranslation=false(기본)면 점자 셀 hex, true면 점역할 일반 텍스트
     * @param {DotDevice | null | undefined} [device]
     * @param {DisplayMode} displayMode
     * @param {boolean} [needsTranslation] - true면 inputData를 정역(translateText)한 결과를 출력
     * @param {(device: DotDevice, hex: string) => void} [callback] - needsTranslation=true일 때 점역된 hex를 전달받는 콜백
     */
    async displayTextData(inputData, device = null, displayMode = DisplayMode.TextMode, needsTranslation = false, callback = null) {
        if (!needsTranslation) {
            if (device == null) {
                for (const dev of this.#connectedDevices) {
                    dev.displayTextData(inputData, 0, displayMode);
                }
            } else {
                device.displayTextData(inputData, 0, displayMode);
            }
            return;
        }

        const devices = device == null ? this.#connectedDevices : [device];
        for (const dev of devices) {
            // 기기의 실제 텍스트 라인 셀 수 기준으로 워드랩되도록 반영(Android displayTextData와 동일).
            this.#brailleManager.setNumberOfBraillePerLine(dev.numberBrailleCellColumns);
            const hex = await this.#brailleManager.translateText(inputData, true);
            dev.displayTextData(hex, 0, displayMode);
            if (callback) {
                callback(dev, hex);
            }
        }
    }

    /**
     * @param {number} lineId
     * @param {number} startCellIndex
     * @param {string} hexData
     * @param {DisplayMode} displayMode
     * @param {DotDevice | null | undefined} [device]
     */
    displayLineData(lineId, startCellIndex, hexData, displayMode, device = null) {
        if (device == null) {
            for (const dev of this.#connectedDevices) {
                dev.displayLineData(lineId, startCellIndex, hexData, displayMode);
            }
        } else {
            device.displayLineData(lineId, startCellIndex, hexData, displayMode);
        }
    }

    /**
     * @param {DotDevice | null | undefined} [device]
     */
    displayAllUp(device = null) {
        if (device == null) {
            for (const dev of this.#connectedDevices) {
                dev.displayTextData("FF".repeat(dev.numberBrailleCellColumns));
                dev.displayGraphicData("FF".repeat(dev.numberCellColumns * dev.numberCellRows));
            }
        } else {
            device.displayTextData("FF".repeat(device.numberBrailleCellColumns));
            device.displayGraphicData("FF".repeat(device.numberCellColumns * device.numberCellRows));
        }
    }

    /**
     * @param {DotDevice | null | undefined} [device]
     */
    displayAllDown(device = null) {
        if (device == null) {
            for (const dev of this.#connectedDevices) {
                dev.displayTextData("00".repeat(dev.numberBrailleCellColumns));
                dev.displayGraphicData("00".repeat(dev.numberCellColumns * dev.numberCellRows));
            }
        } else {
            device.displayTextData("00".repeat(device.numberBrailleCellColumns));
            device.displayGraphicData("00".repeat(device.numberCellColumns * device.numberCellRows));
        }
    }

    /**
     * 진동 요청
     * @param {DotDevice | null | undefined} [device]
     * @param {number} onMs - 진동 ON(Run) 지속시간(ms)
     * @param {number} offMs - 멈춤(Stop) 시간(ms)
     * @param {number} repeatCount - 진동 펄스 수(1~5)
     */
    requestVibrator(device = null, onMs = 70, offMs = 50, repeatCount = 2) {
        if (device == null) {
            for (const dev of this.#connectedDevices) {
                dev.requestVibrator(onMs, offMs, repeatCount);
            }
        } else {
            device.requestVibrator(onMs, offMs, repeatCount);
        }
    }

    /**
     * 점역 언어/등급 설정
     * @param {BrailleLanguage[keyof BrailleLanguage]} language
     * @param {number} [gradeOption]
     */
    setBrailleLanguage(language, gradeOption = null) {
        this.#brailleManager.setBrailleLanguage(language, gradeOption);
    }

    /**
     * 점역 등급 설정
     * @param {number} gradeOption
     */
    setBrailleGrade(gradeOption) {
        this.#brailleManager.setBrailleGrade(gradeOption);
    }

    /**
     * 워드랩 기준 한 줄당 점자 셀 수 설정 (translateText()의 liblouis 정역 결과에 적용됨)
     * @param {number} count
     */
    setNumberOfBraillePerLine(count) {
        this.#brailleManager.setNumberOfBraillePerLine(count);
    }

    /**
     * @returns {number} 워드랩 기준 한 줄당 점자 셀 수
     */
    getNumberOfBraillePerLine() {
        return this.#brailleManager.getNumberOfBraillePerLine();
    }

    /**
     * 정역: 텍스트 → 점자 셀 hex (setBrailleLanguage로 설정한 언어/등급 기준)
     * @param {string} inputText
     * @param {boolean} [applyWordWrap] - true(기본)면 setNumberOfBraillePerLine() 기준으로 워드랩 적용
     * @returns {Promise<string>} 점자 셀 hex
     */
    async translateText(inputText, applyWordWrap = true) {
        return this.#brailleManager.translateText(inputText, applyWordWrap);
    }

    /**
     * 역점역: 점자 셀 hex → 텍스트 (setBrailleLanguage로 설정한 언어/등급 기준)
     * @param {string} inputHex
     * @returns {Promise<string>}
     */
    async backTranslateText(inputHex) {
        return this.#brailleManager.backTranslateText(inputHex);
    }

    /**
     * 여러 줄(문단) 텍스트를 점역하여 그래픽 영역에 자간/행간을 띄워 배치하는 멀티라인 페이지 hex 배열로 변환.
     * "\n"은 강제 개행(문단 구분)으로 유지되고, 그 외에는 그래픽 폭에 맞춰 자동 줄바꿈된다.
     * 반환된 pages는 재번역 없이 그대로 displayGraphicData()에 넘겨 페이지를 넘기면 된다.
     * @param {string} inputText
     * @param {DotDevice | null | undefined} [device] - 그래픽 격자 크기를 여기서 읽음. 없으면 30x10(DotPad320) 기본값
     * @param {number} [lineSpacing] - 행간: 1|2|3
     * @param {number} [letterSpacing] - 자간: 0|1
     * @returns {Promise<{ pages: string[], pageCount: number, totalLines: number }>}
     */
    async buildMultiLineData(inputText, device = null, lineSpacing = 2, letterSpacing = 1) {
        const graphicCols = device ? device.numberCellColumns : 30;
        const graphicRows = device ? device.numberCellRows : 10;
        return this.#brailleManager.buildMultiLineData(inputText, graphicCols, graphicRows, lineSpacing, letterSpacing);
    }

     /**
     * 콜백 세팅
     * @param {(device: DotDevice, dataCode: string, msg: string) => void} messageCallBack - 메시지 콜백
     * @param {(device: DotDevice, keyCode: string, msg: string) => void} keyCallBack - 키 콜백
     * @param {(device: DotDevice, key: string, dotKeyBinary: string) => void} [onKeyDownCallBack] - 키 다운 콜백
     * @param {(device: DotDevice, key: string, dotKeyBinary: string) => void} [onKeyUpCallBack] - 키 업 콜백
     */
    setCallBack(messageCallBack, keyCallBack, onKeyDownCallBack = null, onKeyUpCallBack = null) {
        this.messageCallBack = messageCallBack;
        this.keyCallBack = keyCallBack;
        this.onKeyDownCallBack = onKeyDownCallBack;
        this.onKeyUpCallBack = onKeyUpCallBack;
    }

    // 메시지 콜백
    #receivedMessageCallBackWithDevice(device, dataCode, msg) {
        if (dataCode == DataCodes.Disconnected) {
            this.#connectedDevices = this.#connectedDevices.filter(d => d !== device);
        }

        if (this.messageCallBack) {
            this.messageCallBack(device, dataCode, msg);
        }
    }

    // 키 콜백
    #receivedKeyCallBack(device, keyCode, msg) {
        if (this.keyCallBack) {
            this.keyCallBack(device, keyCode, msg);
        }
    }

    #receivedOnKeyDownCallBack(device, key, dotKeyBinary) {
        if (this.onKeyDownCallBack) {
            this.onKeyDownCallBack(device, key, dotKeyBinary);
        }
    }

    #receivedOnKeyUpCallBack(device, key, dotKeyBinary) {
        if (this.onKeyUpCallBack) {
            this.onKeyUpCallBack(device, key, dotKeyBinary);
        }
    }
}

export { BrailleLanguage, DataCodes, DeviceInfo, DisplayMode, DotDevice, DotPadKey, DotPadSDK, DotPadScanner, GradeOption, KeyCodes, LiblouisManager, NumberOfBraillePerLine, PinOption, TranslateEngine };
