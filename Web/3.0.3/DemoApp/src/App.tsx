import React, { useEffect, useRef, useState } from 'react';
import { DotPadScanner, DotPadSDK, DotDevice, DataCodes, DisplayMode, DotPadKey, BrailleLanguage, GradeOption, NumberOfBraillePerLine, LiblouisManager } from "./sdk/DotPadSDK-3.0.3";
import "./App.css";

export default function DotPad() {
  // Constants for full graphic and text output
  const CELL300_GRAPHIC_FULL = "0002200002200002200002200042f22f24000220000220000220000220000009900009900009900009900009f88f9000099000099000099000099000000440000440000440404e400004f00f40000440000440000440000440000002200002200002200002200002f00f2000022000022020272000022000888998888998888998888998888df88f988889988889988889988889a88c111991111991111991111991111bf11f91111991111991111991111951130004400004400004400004400004f00f40000440000440000440000440000002200002200002200002200002f00f20000a20000220000220000220000009900009900009900009d80809f00f90101b90000990000990000990000004400004400004400004500004f00f4000044000044000044000044000";
  const CELL300_TEXT_FULL = "E000041D380419080000000000000000000000000000000000000000000080A00000204484204400A0006080040420004400000000000000000000000000010808000108000808010008000900000100000000000000000000002008031130010530031538010000040110021130010E00021C000000000060800400200000A004C420408480000000000000000000000000000000000008000000000000000100000000000000000000000000000000000000001538012220040E18061708011100000E0801170802220000000000000000C48000A4A04400204484A00084A00084A0046400006400000000000000000100000000010000000008010008000108000800000900000000000000003230031710010328041E18050018003D00002000041D3804000000000000"//"000000000008800888800080000808000000000008800008000808800008000010000010000111100001100011000010000001100100100001100010000040000024000040000006200406200400000400200642400600000000000000800808800800000000000000000000000000000000000000000000000000100000000100000000000000000000000000000000000000000000000040000066200464000040600042600042000040200642200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  const CELL300_GRAPHIC_PARTIAL = "C0FCCF0C";
  const CELL300_TEXT_PARTIAL = "312536";
  const CELL20_TEXT_SHORT = "19151E";
  const CELL20_TEXT_FULL = "19151E001E15190019151E001E15190019151E001E15190019151E001E151900";

  // Device interface (USB: target = SerialPort, BLE: target = BluetoothDevice)
  type ConnectionType = 'usb' | 'ble';
  interface Device {
    id: string; // 스캔마다 부여되는 고유 id (name은 기기 모델명이라 여러 대가 같은 값을 가질 수 있음)
    target: unknown; // SerialPort (USB) or BluetoothDevice (BLE)
    name: string;
    connectionType: ConnectionType;
    connected: boolean;
    connectDevice: DotDevice | null;
  }

  const dotpadsdk = useRef<DotPadSDK>();
  const dotpadscanner = useRef<DotPadScanner>();
  const [devices, setDevices] = useState<Device[]>([]);
  /** BLE는 동시에 하나의 GATT 연산만 허용 → 연결 중인 디바이스 키 (연결 완료 시 초기화) */
  const [connectingKey, setConnectingKey] = useState<string | null>(null);
  const deviceKey = (d: Device) => d.id;

  // Braille translation demo state
  type BrailleLanguageEntry = (typeof BrailleLanguage)[keyof typeof BrailleLanguage];
  const languageList = Object.values(BrailleLanguage) as BrailleLanguageEntry[];
  const gradeOptionByIndex = (index: number) => [GradeOption.Grade1, GradeOption.Grade2, GradeOption.Grade3][index] ?? GradeOption.Grade1;
  const [selectedLanguage, setSelectedLanguage] = useState<BrailleLanguageEntry>(BrailleLanguage.English);
  const [selectedGradeIndex, setSelectedGradeIndex] = useState<number | null>(1); // English default: Grade2
  const [selectedWordWrap, setSelectedWordWrap] = useState<number>(NumberOfBraillePerLine.BraillePerLine20);
  const [translateInput, setTranslateInput] = useState('Hello, DotPad!');
  const [applyWordWrap, setApplyWordWrap] = useState(true);
  const [translateOutputHex, setTranslateOutputHex] = useState('');
  const [backTranslateInput, setBackTranslateInput] = useState('');
  const [backTranslateOutput, setBackTranslateOutput] = useState('');
  const [multilineText, setMultilineText] = useState('Hello\nDotPad SDK multi-line graphic test.');
  const [lineSpacing, setLineSpacing] = useState(2); // 행간: 1|2|3
  const [letterSpacing, setLetterSpacing] = useState(1); // 자간: 0|1
  const [multilinePagesByDevice, setMultilinePagesByDevice] = useState<Record<string, { pages: string[]; index: number }>>({});
  const [eventLog, setEventLog] = useState<string[]>([]);
  // 텍스트 라인(20 cells) 패닝 상태 — 기기는 스스로 스크롤하지 않고 startCellIndex를 받은 그대로 그 위치에 쓰기만 하므로,
  // 전체 hex는 앱이 들고 있다가 물리 Panning 키/소프트웨어 버튼에 맞춰 windowing해서 다시 보내야 한다.
  const [translatedTextByDevice, setTranslatedTextByDevice] = useState<Record<string, { hex: string; startCellIndex: number }>>({});

  const pushLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setEventLog(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    // liblouis(wasm) 정적 파일은 public/liblouis에 배치 — webpack 번들에 포함하지 않고 그대로 서빙한다.
    LiblouisManager.setAssetBaseUrl(`${window.location.origin}/liblouis/`);
    dotpadsdk.current = new DotPadSDK();
    dotpadsdk.current.setBrailleLanguage(BrailleLanguage.English, GradeOption.Grade2);
    dotpadscanner.current = new DotPadScanner();
  }, []);

  // dotpadKeyCallback이 물리 Panning 키에서 devices/translatedTextByDevice를 최신 상태로 읽도록,
  // 그 값들이 바뀔 때마다 콜백을 다시 등록해 클로저를 최신으로 유지한다.
  useEffect(() => {
    dotpadsdk.current?.setCallBack(dotpadMessageCallBack, dotpadKeyCallback, dotpadKeyDownCallback, dotpadKeyUpCallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, translatedTextByDevice]);

  // Function to update device connection information
  const updateDeviceConnection = async (device: Device, connected: boolean) => {
    if (connected) {
      const key = deviceKey(device);
      if (connectingKey) return; // 이미 다른 디바이스 연결 중
      setConnectingKey(key);
      try {
        const connectDevice = device.connectionType === 'ble'
          ? await dotpadsdk.current?.connectBleDevice(device.target as Parameters<DotPadSDK['connectBleDevice']>[0])
          : await dotpadsdk.current?.connectUsbDevice(device.target as Parameters<DotPadSDK['connectUsbDevice']>[0]);
        if (connectDevice) {
          setDevices(devices => devices.map(d => d.id === device.id ? { ...d, connected, connectDevice } : d));
        }
      } finally {
        setConnectingKey(null);
      }
    } else {
      dotpadsdk.current?.disconnect(device.connectDevice ?? null);
      setDevices(devices => devices.map(d => d.id === device.id ? { ...d, connected, connectDevice: null } : d));
    }
  };

  // Function to select a DotPad device (USB)
  const handleSelectUsbDevice = async () => {
    const device = await dotpadscanner.current?.startUsbScan();
    if (device) {
      setDevices(currentDevices => {
        if (currentDevices.some(d => d.target === device)) return currentDevices; // 이미 목록에 있는 기기
        const deviceInfo: Device = {
          id: crypto.randomUUID(),
          target: device,
          name: (device as { name?: string }).name ?? 'USB DotPad',
          connectionType: 'usb',
          connected: false,
          connectDevice: null
        };
        return [...currentDevices, deviceInfo];
      });
    }
  };

  // Function to select a DotPad device (BLE)
  const handleSelectBleDevice = async () => {
    const device = await dotpadscanner.current?.startBleScan();
    if (device) {
      setDevices(currentDevices => {
        if (currentDevices.some(d => d.target === device)) return currentDevices; // 이미 목록에 있는 기기
        const deviceInfo: Device = {
          id: crypto.randomUUID(),
          target: device,
          name: device.name ?? 'BLE DotPad',
          connectionType: 'ble',
          connected: false,
          connectDevice: null
        };
        return [...currentDevices, deviceInfo];
      });
    }
  };

  // Function to print full graphic area (300 cells) - all devices
  const handleCell300FullPrint = async (hexData: string, displayMode: string) => {
      dotpadsdk.current?.displayGraphicData(hexData, null, displayMode);
  };

  // Function to print a portion of the graphic area (300 cells) - all devices
  const handleCell300PartialPrint = async (lineId: number, cellIndex: number, hexData: string, displayMode: string = DisplayMode.GraphicMode) => {
      dotpadsdk.current?.displayLineData(lineId, cellIndex, hexData, displayMode);
  };

  // Function to reset the graphic area (300 cells) - all devices
  const handleCell300Reset = async () => {
      dotpadsdk.current?.displayGraphicData("00".repeat(300));
  };

  // Function to print the text area (20 cells) - all devices
  const handleCell20Print = async (hexData: string) => {
      dotpadsdk.current?.displayTextData(hexData);
  };

  // Function to reset the text area (20 cells) - all devices
  const handleCell20Reset = async () => {
      dotpadsdk.current?.displayTextData("00".repeat(20));
  };

  // Individual device functions
  const handleDeviceCell300FullPrint = async (device: Device, hexData: string, displayMode: string) => {
    if (device.connectDevice) {
      dotpadsdk.current?.displayGraphicData(hexData, device.connectDevice, displayMode);
    }
  };

  const handleDeviceCell300PartialPrint = async (device: Device, lineId: number, cellIndex: number, hexData: string) => {
    if (device.connectDevice) {
      dotpadsdk.current?.displayLineData(lineId, cellIndex, hexData, DisplayMode.GraphicMode, device.connectDevice);
    }
  };

  const handleDeviceCell300Reset = async (device: Device) => {
    if (device.connectDevice) {
      dotpadsdk.current?.displayGraphicData("00".repeat(300), device.connectDevice);
    }
  };

  const handleDeviceCell20Print = async (device: Device, hexData: string) => {
    if (device.connectDevice) {
      dotpadsdk.current?.displayTextData(hexData, device.connectDevice);
    }
  };

  const handleDeviceCell20Reset = async (device: Device) => {
    if (device.connectDevice) {
      dotpadsdk.current?.displayTextData("00".repeat(20), device.connectDevice);
    }
  };

  // Braille translation demo functions
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const language = languageList.find(l => l.name === e.target.value) ?? BrailleLanguage.English;
    const gradeIndex = language.grades.length > 0 ? 0 : null;
    setSelectedLanguage(language);
    setSelectedGradeIndex(gradeIndex);
    dotpadsdk.current?.setBrailleLanguage(language, gradeIndex == null ? null : gradeOptionByIndex(gradeIndex));
  };

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const gradeIndex = Number(e.target.value);
    setSelectedGradeIndex(gradeIndex);
    dotpadsdk.current?.setBrailleGrade(gradeOptionByIndex(gradeIndex));
  };

  const handleWordWrapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = Number(e.target.value);
    setSelectedWordWrap(count);
    dotpadsdk.current?.setNumberOfBraillePerLine(count);
  };

  // 텍스트 → 점자 셀 hex 정역 (기기 없이도 확인 가능)
  const handleTranslate = async () => {
    const hex = await dotpadsdk.current?.translateText(translateInput, applyWordWrap);
    setTranslateOutputHex(hex ?? '');
  };

  // 점자 셀 hex → 텍스트 역점역
  const handleBackTranslate = async () => {
    const text = await dotpadsdk.current?.backTranslateText(backTranslateInput);
    setBackTranslateOutput(text ?? '');
  };

  // 방금 정역한 hex를 역점역 입력으로 그대로 사용(라운드트립 확인용)
  const handleUseTranslatedHexForBackTranslate = () => {
    setBackTranslateInput(translateOutputHex);
  };

  // 텍스트를 점역해 특정 기기의 텍스트 라인(20 cells)으로 바로 출력. 전체 hex를 기억해뒀다가 패닝에 사용.
  const handleDeviceSendTranslatedText = async (device: Device) => {
    if (!device.connectDevice) return;
    await dotpadsdk.current?.displayTextData(translateInput, device.connectDevice, DisplayMode.TextMode, true, (dev, hex) => {
      setTranslatedTextByDevice(prev => ({ ...prev, [device.id]: { hex, startCellIndex: 0 } }));
      pushLog(`Translated text sent to ${device.name} (${dev.numberBrailleCellColumns} cells): ${hex}`);
    });
  };

  // 텍스트 라인 패닝: 기기는 startCellIndex에 받은 데이터를 그 위치에 쓰기만 할 뿐 스스로 스크롤하지 않으므로,
  // 앱이 들고 있는 전체 hex에서 한 줄(numberBrailleCellColumns) 만큼 창을 옮겨서 다시 보내야 한다.
  const handleDeviceTextPan = (device: Device, direction: 1 | -1) => {
    const state = translatedTextByDevice[device.id];
    if (!state || !device.connectDevice) return;
    const cellCount = device.connectDevice.numberBrailleCellColumns;
    const totalCells = state.hex.length / 2;
    const maxStartCellIndex = Math.max(0, totalCells - cellCount);
    const nextStartCellIndex = Math.min(Math.max(state.startCellIndex + direction * cellCount, 0), maxStartCellIndex);
    if (nextStartCellIndex === state.startCellIndex) return;

    // startCellIndex는 "그 20셀 안에서 몇 번째 칸부터 갱신할지"이지 페이지 오프셋이 아니므로,
    // 항상 0부터 그 페이지 창(window)을 새로 써야 한다(패닝 = 다른 페이지를 같은 자리에 다시 쓰는 것).
    const window = state.hex.substring(nextStartCellIndex * 2, (nextStartCellIndex + cellCount) * 2);
    device.connectDevice.displayTextData(window, 0, DisplayMode.TextMode);
    setTranslatedTextByDevice(prev => ({ ...prev, [device.id]: { ...state, startCellIndex: nextStartCellIndex } }));
  };

  // 여러 줄 텍스트를 점역해 그래픽 영역 페이지들로 빌드하고 첫 페이지를 출력
  const handleDeviceBuildMultiline = async (device: Device) => {
    if (!device.connectDevice) return;
    const result = await dotpadsdk.current?.buildMultiLineData(multilineText, device.connectDevice, lineSpacing, letterSpacing);
    if (!result) return;
    setMultilinePagesByDevice(prev => ({ ...prev, [device.id]: { pages: result.pages, index: 0 } }));
    if (result.pages.length > 0) {
      dotpadsdk.current?.displayGraphicData(result.pages[0], device.connectDevice, DisplayMode.GraphicMode);
    }
    pushLog(`Multi-line data built for ${device.name}: ${result.pageCount} page(s), ${result.totalLines} line(s)`);
  };

  // 빌드된 멀티라인 페이지들을 앞/뒤로 넘기며 출력
  const handleDeviceMultilinePage = (device: Device, delta: number) => {
    setMultilinePagesByDevice(prev => {
      const state = prev[device.id];
      if (!state) return prev;
      const nextIndex = Math.min(Math.max(state.index + delta, 0), state.pages.length - 1);
      if (device.connectDevice && nextIndex !== state.index) {
        dotpadsdk.current?.displayGraphicData(state.pages[nextIndex], device.connectDevice, DisplayMode.GraphicMode);
      }
      return { ...prev, [device.id]: { ...state, index: nextIndex } };
    });
  };

  // 진동 테스트
  const handleDeviceVibrate = (device: Device) => {
    if (!device.connectDevice) return;
    dotpadsdk.current?.requestVibrator(device.connectDevice, 100, 70, 3);
    pushLog(`Vibrator requested on ${device.name}`);
  };

  // DotPad function key callback
  const dotpadKeyCallback = (device: DotDevice, keyCode: string, keyMsg: string) => {
    console.log("=> dotpad key code : " + keyCode + " msg : " + keyMsg);
    pushLog(`key code: ${keyCode} msg: ${keyMsg}`);

    if(keyCode == "KeyFunction1") {
      dotpadsdk.current?.requestVibrator(device, 100, 70, 5);
    }

    // 물리 Panning 버튼은 키 이벤트만 올라오고 기기가 스스로 스크롤해주지 않으므로, 여기서 직접 패닝해준다.
    if (keyCode === "PanningLeft" || keyCode === "PanningRight") {
      const found = devices.find(d => d.connectDevice === device);
      if (found) {
        handleDeviceTextPan(found, keyCode === "PanningRight" ? 1 : -1);
      }
    }
  }

  // DotPad key down callback
  const dotpadKeyDownCallback = (device: DotDevice, key: typeof DotPadKey[keyof typeof DotPadKey], dotKeyBinary: string) => {
    console.log("=> dotpad key down : " + key + " binary : " + dotKeyBinary);
    pushLog(`key down: ${key} binary: ${dotKeyBinary}`);
  }

  // DotPad key up callback
  const dotpadKeyUpCallback = (device: DotDevice, key: typeof DotPadKey[keyof typeof DotPadKey], dotKeyBinary: string) => {
    console.log("=> dotpad key up : " + key + " binary : " + dotKeyBinary);
    pushLog(`key up: ${key} binary: ${dotKeyBinary}`);
  }

  const dotpadMessageCallBack = (device: DotDevice, dataCode: string, msg: string) => {
    switch (dataCode) {
      case DataCodes.Disconnected : {
        setDevices(devices => devices.map(d => d.connectDevice === device ? { ...d, connected: false, connectDevice: null } : d));
      } break;
    }

    console.log("" + dataCode + " : " + msg)
    pushLog(`${dataCode}: ${msg}`);
  }

  return (
      <div className="tableContainer">
        <div className="buttonContainer">
          <button className="selectButton" onClick={handleSelectUsbDevice}>
            Select USB DotPad
          </button>
          <button className="selectButton" onClick={handleSelectBleDevice}>
            Select BLE DotPad
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th className="header">DotPad Name</th>
              <th className="header">Type</th>
              <th className="header">Connect/Disconnect</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <React.Fragment key={device.id}>
                <tr className="row">
                  <td className="cell">{device.name}</td>
                  <td className="cell">{device.connectionType.toUpperCase()}</td>
                  <td className="cell">
                    {!device.connected && (
                      <button
                        className="button"
                        disabled={connectingKey !== null}
                        onClick={() => updateDeviceConnection(device, true)}
                      >
                        {connectingKey === deviceKey(device) ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                    {device.connected && (
                      <button className="button" onClick={() => updateDeviceConnection(device, false)}>
                        Disconnect
                      </button>
                    )}
                  </td>
                </tr>
                {device.connected && (
                  <tr className="row">
                    <td colSpan={3} className="cell">
                      <div className="deviceControls">
                        <div className="deviceControlSection">
                          <div className="deviceLabelContainer">
                            <label className="deviceLabel">Graphic Area (300 cells)</label>
                          </div>
                          <div className="deviceButtonContainer">
                            <button className="deviceButton" onClick={() => {
                              handleDeviceCell300FullPrint(device, CELL300_GRAPHIC_FULL, DisplayMode.GraphicMode);
                            }}>
                              Print Full Image
                            </button>
                            <button className="deviceButton" onClick={() => {
                              handleDeviceCell300FullPrint(device, CELL300_TEXT_FULL, DisplayMode.TextMode);
                            }}>
                              Print Full Braille
                            </button>
                            <button className="deviceButton" onClick={() => {
                              handleDeviceCell300Reset(device);
                            }}>
                              Reset
                            </button>
                          </div>
                        </div>
                        <div className="deviceControlSection">
                          <div className="deviceLabelContainer">
                            <label className="deviceLabel">Text Area (20 cells)</label>
                          </div>
                          <div className="deviceButtonContainer">
                            <button className="deviceButton" onClick={() => {
                              handleDeviceCell20Print(device, CELL20_TEXT_FULL);
                            }}>
                              Print Braille (Panning)
                            </button>
                            <button className="deviceButton" onClick={() => {
                              handleDeviceCell20Reset(device);
                            }}>
                              Reset
                            </button>
                          </div>
                        </div>
                        <div className="deviceControlSection">
                          <div className="deviceLabelContainer">
                            <label className="deviceLabel">Translated Text (setBrailleLanguage 기준)</label>
                          </div>
                          <div className="deviceButtonContainer">
                            <button className="deviceButton" onClick={() => {
                              handleDeviceSendTranslatedText(device);
                            }}>
                              Send "{translateInput}"
                            </button>
                            <button className="deviceButton" onClick={() => {
                              handleDeviceTextPan(device, -1);
                            }} disabled={!translatedTextByDevice[device.id] || translatedTextByDevice[device.id].startCellIndex === 0}>
                              ◀ Prev
                            </button>
                            <button className="deviceButton" onClick={() => {
                              handleDeviceTextPan(device, 1);
                            }} disabled={!translatedTextByDevice[device.id] || translatedTextByDevice[device.id].startCellIndex + (device.connectDevice?.numberBrailleCellColumns ?? 0) >= translatedTextByDevice[device.id].hex.length / 2}>
                              Next ▶
                            </button>
                            {translatedTextByDevice[device.id] && (
                              <span>
                                Cell {translatedTextByDevice[device.id].startCellIndex + 1}
                                –{Math.min(translatedTextByDevice[device.id].startCellIndex + (device.connectDevice?.numberBrailleCellColumns ?? 0), translatedTextByDevice[device.id].hex.length / 2)}
                                {' '}/ {translatedTextByDevice[device.id].hex.length / 2}
                              </span>
                            )}
                            <button className="deviceButton" onClick={() => {
                              handleDeviceVibrate(device);
                            }}>
                              Vibrate
                            </button>
                          </div>
                        </div>
                        <div className="deviceControlSection">
                          <div className="deviceLabelContainer">
                            <label className="deviceLabel">Multi-line Graphic (buildMultiLineData)</label>
                          </div>
                          <div className="deviceButtonContainer">
                            <button className="deviceButton" onClick={() => {
                              handleDeviceBuildMultiline(device);
                            }}>
                              Build &amp; Display
                            </button>
                            <button className="deviceButton" onClick={() => {
                              handleDeviceMultilinePage(device, -1);
                            }} disabled={!multilinePagesByDevice[device.id] || multilinePagesByDevice[device.id].index === 0}>
                              ◀ Prev
                            </button>
                            <button className="deviceButton" onClick={() => {
                              handleDeviceMultilinePage(device, 1);
                            }} disabled={!multilinePagesByDevice[device.id] || multilinePagesByDevice[device.id].index >= multilinePagesByDevice[device.id].pages.length - 1}>
                              Next ▶
                            </button>
                            {multilinePagesByDevice[device.id] && (
                              <span>Page {multilinePagesByDevice[device.id].index + 1} / {multilinePagesByDevice[device.id].pages.length}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="container">
          <div className="labelContainer">
            <label>Graphic Area (300 cells)</label>
          </div>
          <div className="buttonContainer">
            <button className="selectButton" onClick={() => {
              handleCell300FullPrint(CELL300_GRAPHIC_FULL, DisplayMode.GraphicMode);
            }}>
              Print Full Image
            </button>
            <button className="printButton" onClick={() => {
              handleCell300PartialPrint(3, 5, CELL300_GRAPHIC_PARTIAL, DisplayMode.GraphicMode);
            }}>
              Print Partial Image
            </button>
            <button className="selectButton" onClick={() => {
              handleCell300FullPrint(CELL300_TEXT_FULL, DisplayMode.TextMode);
            }}>
              Print Full Braille
            </button>
            <button className="printButton" onClick={() => {
              handleCell300PartialPrint(3, 10, CELL300_TEXT_PARTIAL, DisplayMode.TextMode);
            }}>
              Print Partial Braille
            </button>
            <button className="selectButton" onClick={() => {
              handleCell300Reset();
            }}>
              Reset
            </button>
          </div>
        </div>
        <div className="container">
          <div className="labelContainer">
            <label>Text Area (20 cells)</label>
          </div>
          <div className="buttonContainer">
            <button className="selectButton" onClick={() => {
              handleCell20Print(CELL20_TEXT_SHORT);
            }}>
              Print Braille
            </button>
            <button className="printButton" onClick={() => {
              handleCell20Print(CELL20_TEXT_FULL);
            }}>
              Print Braille (Panning Button)
            </button>
            <button className="selectButton" onClick={() => {
              handleCell20Reset();
            }}>
              Reset
            </button>
          </div>
        </div>
        <div className="container" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
          <div className="labelContainer">
            <label>Braille Translation (liblouis)</label>
          </div>
          <div className="buttonContainer" style={{ flexWrap: 'wrap' }}>
            <label>
              Language:{' '}
              <select value={selectedLanguage.name} onChange={handleLanguageChange}>
                {languageList.map(language => (
                  <option key={language.name} value={language.name}>{language.displayName}</option>
                ))}
              </select>
            </label>
            {selectedLanguage.grades.length > 0 && (
              <label>
                Grade:{' '}
                <select value={selectedGradeIndex ?? 0} onChange={handleGradeChange}>
                  {selectedLanguage.grades.map((grade, index) => (
                    <option key={grade} value={index}>{grade}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Word wrap (cells/line):{' '}
              <select value={selectedWordWrap} onChange={handleWordWrapChange}>
                {Object.entries(NumberOfBraillePerLine).map(([name, value]) => (
                  <option key={name} value={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="buttonContainer" style={{ flexWrap: 'wrap' }}>
            <input
              type="text"
              style={{ flex: 1, minWidth: '240px' }}
              value={translateInput}
              onChange={(e) => setTranslateInput(e.target.value)}
              placeholder="Text to translate"
            />
            <label>
              <input
                type="checkbox"
                checked={applyWordWrap}
                onChange={(e) => setApplyWordWrap(e.target.checked)}
              />
              {' '}Word wrap
            </label>
            <button className="selectButton" onClick={handleTranslate}>
              translateText()
            </button>
            <span>Hex: {translateOutputHex || '(none yet)'}</span>
          </div>
          <div className="buttonContainer" style={{ flexWrap: 'wrap' }}>
            <input
              type="text"
              style={{ flex: 1, minWidth: '240px' }}
              value={backTranslateInput}
              onChange={(e) => setBackTranslateInput(e.target.value)}
              placeholder="Braille cell hex to back-translate"
            />
            <button className="printButton" onClick={handleUseTranslatedHexForBackTranslate} disabled={!translateOutputHex}>
              Use translated hex
            </button>
            <button className="selectButton" onClick={handleBackTranslate}>
              backTranslateText()
            </button>
            <span>Text: {backTranslateOutput || '(none yet)'}</span>
          </div>
          <div className="buttonContainer" style={{ flexWrap: 'wrap' }}>
            <textarea
              rows={3}
              style={{ flex: 1, minWidth: '240px', fontFamily: 'inherit' }}
              value={multilineText}
              onChange={(e) => setMultilineText(e.target.value)}
              placeholder="Multi-line text (buildMultiLineData, per-device below) — Enter로 강제 개행, 나머지는 자동 줄바꿈"
            />
          </div>
          <div className="buttonContainer" style={{ flexWrap: 'wrap' }}>
            <label>
              Line spacing (행간):{' '}
              <select value={lineSpacing} onChange={(e) => setLineSpacing(Number(e.target.value))}>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
              </select>
            </label>
            <label>
              Letter spacing (자간):{' '}
              <select value={letterSpacing} onChange={(e) => setLetterSpacing(Number(e.target.value))}>
                <option value={0}>0</option>
                <option value={1}>1</option>
              </select>
            </label>
          </div>
        </div>
        <div className="container" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div className="labelContainer">
            <label>Event Log (message / key / onKeyDown / onKeyUp callbacks)</label>
          </div>
          <div style={{ maxHeight: '160px', overflowY: 'auto', background: 'white', border: '1px solid #ddd', borderRadius: '5px', padding: '8px', fontFamily: 'monospace', fontSize: '13px' }}>
            {eventLog.length === 0
              ? <div>(no events yet — connect a device and press a key)</div>
              : eventLog.map((entry, index) => <div key={index}>{entry}</div>)}
          </div>
        </div>
      </div>
  );
}
