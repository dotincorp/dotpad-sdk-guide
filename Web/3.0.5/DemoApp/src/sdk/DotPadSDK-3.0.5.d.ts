// TypeScript definitions for DotPadSDK 3.0.5

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
  // 펑션키 조합
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
  KeyFunction123: "KeyFunction123",
  KeyFunction124: "KeyFunction124",
  KeyFunction134: "KeyFunction134",
  KeyFunction234: "KeyFunction234",
  KeyFunction1234: "KeyFunction1234",
  // 패닝키 단독
  PanningAll: "PanningAll",
  PanningLeft: "PanningLeft",
  PanningRight: "PanningRight",
  // 좌패닝 + 펑션키
  LPF1: "LPF1",
  LPF2: "LPF2",
  LPF3: "LPF3",
  LPF4: "LPF4",
  LPF12: "LPF12",
  LPF13: "LPF13",
  LPF14: "LPF14",
  LPF23: "LPF23",
  LPF24: "LPF24",
  LPF34: "LPF34",
  LPF123: "LPF123",
  LPF124: "LPF124",
  LPF134: "LPF134",
  LPF234: "LPF234",
  LPF1234: "LPF1234",
  // 우패닝 + 펑션키
  RPF1: "RPF1",
  RPF2: "RPF2",
  RPF3: "RPF3",
  RPF4: "RPF4",
  RPF12: "RPF12",
  RPF13: "RPF13",
  RPF14: "RPF14",
  RPF23: "RPF23",
  RPF24: "RPF24",
  RPF34: "RPF34",
  RPF123: "RPF123",
  RPF124: "RPF124",
  RPF134: "RPF134",
  RPF234: "RPF234",
  RPF1234: "RPF1234",
  // 양쪽 패닝 + 펑션키
  APF1: "APF1",
  APF2: "APF2",
  APF3: "APF3",
  APF4: "APF4",
  APF12: "APF12",
  APF13: "APF13",
  APF14: "APF14",
  APF23: "APF23",
  APF24: "APF24",
  APF34: "APF34",
  APF123: "APF123",
  APF124: "APF124",
  APF134: "APF134",
  APF234: "APF234",
  APF1234: "APF1234",
  // 매핑되지 않은 조합
  KeyElse: "KeyElse"
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
  readonly connectDevice: BluetoothDevice | SerialPort | null;
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

export namespace DotBrailleModule {
  function setEngineAssetBaseUrl(url: string): void;
  type MathRule = 'nemeth' | 'ueb' | 'korean' | 'korean-science' | 'cmu' | 'marburg' | 'czech';
  /** MathML -> braille cell hex. Throws an Error with `code` (engine error code) and `response` on failure. */
  function translateMath(mathml: string, rule?: MathRule): Promise<string>;
}
