import { useEffect, useRef, useState } from 'react';
import { DotPadSDK } from "./DotPadSDK-1.0.0"
import "./App.css";

export default function DotPad() {
  // Constants for full graphic and text output
  const CELL300_GRAPHIC_FULL = "0002200002200002200002200042f22f24000220000220000220000220000009900009900009900009900009f88f9000099000099000099000099000000440000440000440404e400004f00f40000440000440000440000440000002200002200002200002200002f00f2000022000022020272000022000888998888998888998888998888df88f988889988889988889988889a88c111991111991111991111991111bf11f91111991111991111991111951130004400004400004400004400004f00f40000440000440000440000440000002200002200002200002200002f00f20000a20000220000220000220000009900009900009900009d80809f00f90101b90000990000990000990000004400004400004400004500004f00f4000044000044000044000044000";
  const CELL300_TEXT_FULL = "000000000008800888800080000808000000000008800008000808800008000010000010000111100001100011000010000001100100100001100010000040000024000040000006200406200400000400200642400600000000000000800808800800000000000000000000000000000000000000000000000000100000000100000000000000000000000000000000000000000000000040000066200464000040600042600042000040200642200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  const CELL300_GRAPHIC_PARTIAL = "C0FCCF0C";
  const CELL300_TEXT_PARTIAL = "312536";
  const CELL20_TEXT_SHORT = "19151E";
  const CELL20_TEXT_FULL = "19151E001E15190019151E001E15190019151E001E15190019151E001E151900";

  // Device interface
  interface Device {
    target: null;
    name: string;
    connected: boolean;
  }

  const dotpadsdk = useRef<DotPadSDK>();
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    dotpadsdk.current = new DotPadSDK();
  }, []);

  // Function to update device connection information
  const updateDeviceConnection = async (device: any, connected: any) => {
    if (connected) {
      const isConnected = await dotpadsdk.current?.connect(device.target);
      if (isConnected) {
        await dotpadsdk.current?.addListenerKeyEvent(device.target, dotpadKeyCallback);
      }
    } else {
      await dotpadsdk.current?.disconnect(device.target);
    }
    setDevices(devices => devices.map(d => d.name === device.name ? { ...d, connected } : d));
  };

  // Function to select a DotPad device
  const handleSelectDevice = async () => {
    const device = await dotpadsdk.current?.request();
    const deviceInfo = {
      target: device,
      name: device.name,
      connected: false
    };
    setDevices(currentDevices => [...currentDevices, deviceInfo]);
  };

  // Function to print full graphic area (300 cells)
  const handleCell300FullPrint = async (hexData: string) => {
    devices.map(async (device) => {
      await dotpadsdk.current?.displayGraphicData(device, hexData);
    });
  };

  // Function to print a portion of the graphic area (300 cells)
  const handleCell300PartialPrint = async (lineId: number, cellIndex: number, hexData: string) => {
    devices.map(async (device) => {
      await dotpadsdk.current?.displayGraphicLineData(device, lineId, cellIndex, hexData);
    });
  };

  // Function to reset the graphic area (300 cells)
  const handleCell300Reset = async () => {
    devices.map(async (device) => {
      await dotpadsdk.current?.resetGraphicData(device);
    });
  };

  // Function to print the text area (20 cells)
  const handleCell20Print = async (hexData: string) => {
    devices.map(async (device) => {
      await dotpadsdk.current?.displayTextData(device, hexData);
    });
  };

  // Function to reset the text area (20 cells)
  const handleCell20Reset = async () => {
    devices.map(async (device) => {
      await dotpadsdk.current?.resetTextData(device);
    });
  };

  // DotPad function key callback
  const dotpadKeyCallback = async (keyCode: string) => {
    console.log("=> dotpad key code : " + keyCode);
  }

  return (
      <div className="tableContainer">
        <div className="buttonContainer">
          <button className="selectButton" onClick={handleSelectDevice}>
            Select DotPad
          </button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th className="header">DotPad Name</th>
              <th className="header">Connect/Disconnect</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.name} className="row">
                <td className="cell">{device.name}</td>
                <td className="cell">
                  {!device.connected && (
                    <button className="button" onClick={() => updateDeviceConnection(device, true)}>
                      Connect
                    </button>
                  )}
                  {device.connected && (
                    <button className="button" onClick={() => updateDeviceConnection(device, false)}>
                      Disconnect
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="container">
          <div className="labelContainer">
            <label>Graphic Area (300 cells)</label>
          </div>
          <div className="buttonContainer">
            <button className="selectButton" onClick={() => {
              handleCell300FullPrint(CELL300_GRAPHIC_FULL);
            }}>
              Print Full Image
            </button>
            <button className="printButton" onClick={() => {
              handleCell300PartialPrint(3, 5, CELL300_GRAPHIC_PARTIAL);
            }}>
              Print Partial Image
            </button>
            <button className="selectButton" onClick={() => {
              handleCell300FullPrint(CELL300_TEXT_FULL);
            }}>
              Print Full Braille
            </button>
            <button className="printButton" onClick={() => {
              handleCell300PartialPrint(3, 10, CELL300_TEXT_PARTIAL);
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
