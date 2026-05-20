import React, { useEffect, useRef, useState } from 'react';
import { DotPadScanner, DotPadSDK, DotDevice, DataCodes, DisplayMode } from "./sdk/DotPadSDK-3.0.0";
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
  const deviceKey = (d: Device) => `${d.connectionType}-${d.name}`;

  useEffect(() => {
    dotpadsdk.current = new DotPadSDK();
    dotpadscanner.current = new DotPadScanner();
  }, []);

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
          setDevices(devices => devices.map(d => (d.name === device.name && d.connectionType === device.connectionType) ? { ...d, connected, connectDevice } : d));
          dotpadsdk.current?.setCallBack(dotpadMessageCallBack, dotpadKeyCallback);
        }
      } finally {
        setConnectingKey(null);
      }
    } else {
      dotpadsdk.current?.disconnect(device.connectDevice ?? null);
      setDevices(devices => devices.map(d => (d.name === device.name && d.connectionType === device.connectionType) ? { ...d, connected, connectDevice: null } : d));
    }
  };

  // Function to select a DotPad device (USB)
  const handleSelectUsbDevice = async () => {
    const device = await dotpadscanner.current?.startUsbScan();
    if (device) {
      const deviceInfo: Device = {
        target: device,
        name: (device as { name?: string }).name ?? 'USB DotPad',
        connectionType: 'usb',
        connected: false,
        connectDevice: null
      };
      setDevices(currentDevices => [...currentDevices, deviceInfo]);
    }
  };

  // Function to select a DotPad device (BLE)
  const handleSelectBleDevice = async () => {
    const device = await dotpadscanner.current?.startBleScan();
    if (device) {
      const deviceInfo: Device = {
        target: device,
        name: device.name ?? 'BLE DotPad',
        connectionType: 'ble',
        connected: false,
        connectDevice: null
      };
      setDevices(currentDevices => [...currentDevices, deviceInfo]);
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

  // DotPad function key callback
  const dotpadKeyCallback = (device: DotDevice, keyCode: string, keyMsg: string) => {
    console.log("=> dotpad key code : " + keyCode + " msg : " + keyMsg);
  }

  const dotpadMessageCallBack = (device: DotDevice, dataCode: string, msg: string) => {
    switch (dataCode) {
      case DataCodes.Disconnected : {
        setDevices(devices => devices.map(d => d.connectDevice === device ? { ...d, connected: false, connectDevice: null } : d));
      } break;
    }

    console.log("" + dataCode + " : " + msg)
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
              <React.Fragment key={`${device.connectionType}-${device.name}`}>
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
      </div>
  );
}
