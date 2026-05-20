// TypeScript definitions for DotPadSDK 2.0.0

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
  CommandError:                "CommandError",
  CommandNone:                 "CommandNone"
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
  displayGraphicData(hexData: string, device?: DotDevice | null | undefined, displayMode?: DisplayMode): void;
  displayTextData(hexData: string, device?: DotDevice | null | undefined, displayMode?: DisplayMode): void;
  displayLineData(lineId: number, startCellIndex: number, hexData: string, displayMode: DisplayMode, device?: DotDevice | null | undefined): void;
  displayAllUp(device?: DotDevice | null | undefined): void;
  displayAllDown(device?: DotDevice | null | undefined): void;
  setCallBack(messageCallBack: ((device: DotDevice, dataCode: DataCodes, msg: string) => void) | null, keyCallBack: ((device: DotDevice, keyCode: KeyCodes, msg: string) => void) | null): void;
}
