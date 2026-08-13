// TypeScript definitions for DotPadSDK 3.0.2

export const DisplayMode = {
  GraphicMode: 'GraphicMode',
  TextMode: 'TextMode'
};

export const DeviceInfo = Object.freeze({
  DeviceName: "DeviceName",
  FirmwareVersion: "FirmwareVersion",
  HardwareVersion: "HardwareVersion"
});

export const DataCodes = Object.freeze({
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

export const KeyCodes = Object.freeze({
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

export const DotPadKey = Object.freeze({
  KeyFunction1: "KeyFunction1",
  KeyFunction2: "KeyFunction2",
  KeyFunction3: "KeyFunction3",
  KeyFunction4: "KeyFunction4",
  PanningLeft: "PanningLeft",
  PanningRight: "PanningRight"
});

export class DotDevice {
  readonly isConnect: boolean;
  readonly cellType: string;
  readonly numberCellRows: number;
  readonly numberCellColumns: number;
  readonly numberBrailleCellColumns: number;

  connectBleDevice(device: BluetoothDevice): Promise<boolean>;
  connectUsbDevice(device: SerialPort): Promise<boolean>;
  disconnect(): Promise<void>;
  sendCommand(packet: ArrayBuffer): Promise<boolean>;
  displayGraphicData(hexData: string, startLineIndex?: number, startCellIndex?: number, displayMode?: DisplayMode): void;
  displayTextData(hexData: string, startCellIndex?: number, displayMode?: DisplayMode): void;
  displayLineData(lineId: number, startCellIndex: number, hexData: string, displayMode: DisplayMode): void;
  requestDeviceInfo(deviceInfo: string): Promise<void>;
  requestVibrator(onMs: number, offMs: number, repeatCount: number): Promise<void>;
}

export class DotPadScanner {
  startBleScan(): Promise<BluetoothDevice | undefined>;
  startUsbScan(): Promise<SerialPort | undefined>;
}

export class DotPadSDK {
  getConnectedDevices(): DotDevice[];
  connectBleDevice(device: BluetoothDevice): Promise<DotDevice | null | undefined>;
  connectUsbDevice(device: SerialPort): Promise<DotDevice | null | undefined>;
  disconnect(device?: DotDevice | null | undefined): void;
  requestDeviceInfo(device: DotDevice, type:DeviceInfo): void;
  requestVibrator(device?: DotDevice | null | undefined, onMs?: number, offMs?: number, repeatCount?: number): void;
  displayGraphicData(hexData: string, device?: DotDevice | null | undefined, displayMode?: DisplayMode): void;
  displayTextData(inputData: string, device?: DotDevice | null | undefined, displayMode?: DisplayMode, needsTranslation?: boolean, callback?: ((device: DotDevice, hex: string) => void) | null): Promise<void>;
  displayLineData(lineId: number, startCellIndex: number, hexData: string, displayMode: DisplayMode, device?: DotDevice | null | undefined): void;
  displayAllUp(device?: DotDevice | null | undefined): void;
  displayAllDown(device?: DotDevice | null | undefined): void;
  setCallBack(messageCallBack: ((device: DotDevice, dataCode: DataCodes, msg: string) => void) | null, keyCallBack: ((device: DotDevice, keyCode: KeyCodes, msg: string) => void) | null, onKeyDownCallBack?: ((device: DotDevice, key: DotPadKey, dotKeyBinary: string) => void) | null, onKeyUpCallBack?: ((device: DotDevice, key: DotPadKey, dotKeyBinary: string) => void) | null): void;
  setBrailleLanguage(language: BrailleLanguageEntry, gradeOption?: number | null): void;
  setBrailleGrade(gradeOption: number): void;
  setNumberOfBraillePerLine(count: number): void;
  getNumberOfBraillePerLine(): number;
  translateText(inputText: string, applyWordWrap?: boolean): Promise<string>;
  backTranslateText(inputHex: string): Promise<string>;
  buildMultiLineData(inputText: string, device?: DotDevice | null | undefined, lineSpacing?: number, letterSpacing?: number): Promise<{ pages: string[]; pageCount: number; totalLines: number }>;
}

export interface BrailleLanguageEntry {
  readonly name: string;
  readonly displayName: string;
  readonly grades: string[];
}

export const BrailleLanguage: Readonly<Record<string, BrailleLanguageEntry>>;

export const GradeOption: Readonly<{ Grade1: number; Grade2: number; Grade3: number }>;
export const PinOption: Readonly<{ Dot6: number; Dot8: number }>;
export const TranslateEngine: Readonly<{ Dot: string; Louis: string }>;
export const NumberOfBraillePerLine: Readonly<{ BraillePerLine8: number; BraillePerLine12: number; BraillePerLine20: number; BraillePerLine32: number }>;

export namespace LiblouisManager {
  function setAssetBaseUrl(url: string): void;
  function translateText(inputText: string, userOption: { languageCode: BrailleLanguageEntry; gradeOption: number; pinOption: number; numberOfBraillePerLine: number }): Promise<string>;
  function backTranslateText(inputHex: string, userOption: { languageCode: BrailleLanguageEntry; gradeOption: number; pinOption: number; numberOfBraillePerLine: number }): Promise<string>;
}
