# DotPad SDK for Web — v3.0.0

JavaScript/TypeScript SDK for controlling DotPad braille display devices from a web browser via Web Bluetooth and Web Serial APIs. Includes a React demo application.

> **Browser support:** Chrome (and Chromium-based browsers) only. Web Bluetooth and Web Serial are not supported in Firefox or Safari.

---

## SDK Files

| File | Description |
|---|---|
| `DotPadSDK-3.0.0.js` | SDK library (ES module) |
| `DotPadSDK-3.0.0.d.ts` | TypeScript type definitions |

---

## Installation

Copy `DotPadSDK-3.0.0.js` and `DotPadSDK-3.0.0.d.ts` into your project and import directly:

```ts
import { DotPadScanner, DotPadSDK, DotDevice, DataCodes, KeyCodes, DisplayMode } from "./DotPadSDK-3.0.0";
```

No npm package is required.

---

## Basic Usage Flow

```
1. Instantiate              new DotPadScanner() / new DotPadSDK()
2. Register callbacks       sdk.setCallBack(messageCallback, keyCallback)
3. Scan for devices         scanner.startBleScan() / scanner.startUsbScan()
4. Connect                  sdk.connectBleDevice(device) / sdk.connectUsbDevice(port)
5. Wait for callback        DataCodes.Connected → device is ready
6. Send display data        sdk.displayGraphicData() / sdk.displayTextData()
7. Disconnect               sdk.disconnect(device) or sdk.disconnect() for all
```

---

## Classes

| Class | Description |
|---|---|
| `DotPadScanner` | Opens the browser's device picker for Bluetooth or Serial selection |
| `DotPadSDK` | Central manager for BLE/USB connections; supports simultaneous multi-device connections |
| `DotDevice` | Represents a single connected DotPad device with its board info and output state |

---

## Enumerations

### `DisplayMode`

| Value | Description |
|---|---|
| `GraphicMode` | Output data sequentially from the top-left cell downward (graphic area) |
| `TextMode` | Output pins 7 and 8 as a cursor (braille text area) |

### `DataCodes`

Event/response codes delivered via the message callback.

| Value | Description |
|---|---|
| `Connected` | Device initialized and ready to use |
| `ConnectedFail` | Connection attempt failed |
| `Disconnected` | Connection terminated |
| `BoardInfo` | Board layout info received (graphic/text support, rows/columns) |
| `BleMacAddress` | BLE MAC address received |
| `DeviceName` | Device name received |
| `DeviceFWVersion` | Firmware version received |
| `DeviceHWVersion` | Hardware version received |
| `ResponseDisplayLineAck` | Line data acknowledged |
| `ResponseDisplayLineNonAck` | Line data not acknowledged |
| `ResponseDisplayLineComplete` | Line output complete |
| `CommandError` | Command error |
| `CommandNone` | Undefined command |

### `KeyCodes`

Key event codes delivered via the key callback.

| Value | Description |
|---|---|
| `KeyFunction1` – `KeyFunction4` | Single function key press |
| `KeyFunction12` / `13` / `14` / `23` / `24` / `34` | Simultaneous function key combinations |
| `PanningLeft` | Panning Left key |
| `PanningRight` | Panning Right key |
| `PanningAll` | Panning Left + Right simultaneously |
| `LPF1` | Panning Left + Function 1 |
| `RPF4` | Panning Right + Function 4 |
| `KeyElse` | Key combination not defined in `KeyCodes` |

---

## API Reference

### DotPadScanner

| Function | Description |
|---|---|
| `async startBleScan(): Promise<BluetoothDevice \| undefined>` | Opens the browser Bluetooth picker; returns the selected device |
| `async startUsbScan(): Promise<SerialPort \| undefined>` | Opens the browser Serial picker; returns the selected port |

### DotPadSDK — Connection

| Function | Description |
|---|---|
| `getConnectedDevices(): DotDevice[]` | Returns the list of currently connected devices |
| `connectBleDevice(device: BluetoothDevice): Promise<DotDevice \| null \| undefined>` | Connect a BLE device; returns `DotDevice` on success, `null` on failure |
| `connectUsbDevice(device: SerialPort): Promise<DotDevice \| null \| undefined>` | Connect a USB serial device; same semantics |
| `disconnect(device?: DotDevice \| null): void` | Disconnect one device, or call with no argument / `null` to disconnect all |

```ts
// Disconnect all
sdk.disconnect();

// Disconnect a specific device
sdk.disconnect(targetDevice);
```

### DotPadSDK — Display

| Function | Description |
|---|---|
| `displayGraphicData(hexData, device?, displayMode?)` | Send hex graphic data. `device = null` broadcasts to all connected devices. Default mode: `GraphicMode`. Internally diffs against existing output to minimize transmitted lines. |
| `displayTextData(hexData, device?, displayMode?)` | Send hex braille text data. Default mode: `TextMode`. |
| `displayLineData(lineId, startCellIndex, hexData, displayMode, device?)` | Send data for a single line. `device = null` broadcasts to all. |
| `displayAllUp(device?)` | Raise all pins on the graphic and text areas |
| `displayAllDown(device?)` | Lower all pins on the graphic and text areas |

```ts
// Graphic area — all devices
sdk.displayGraphicData("FF".repeat(300));

// Graphic area — specific device
sdk.displayGraphicData("FF".repeat(300), targetDevice, DisplayMode.GraphicMode);

// Text area — all devices
sdk.displayTextData("FF".repeat(20));

// Specific line (e.g. row 3, starting at cell 5)
sdk.displayLineData(3, 5, "C0FCCF0C", DisplayMode.GraphicMode);
```

### DotPadSDK — Listeners

```ts
sdk.setCallBack(
  // Message callback — connection and status events
  (device: DotDevice, dataCode: DataCodes, msg: string) => {
    if (dataCode === DataCodes.Connected) {
      console.log("Device ready:", device);
    }
  },
  // Key callback — hardware key events
  (device: DotDevice, keyCode: KeyCodes, msg: string) => {
    console.log("Key:", keyCode, msg);
  }
);
```

### DotDevice Properties

| Property | Type | Description |
|---|---|---|
| `isConnect` | `boolean` | Whether the device is currently connected |
| `cellType` | `string` | Device model / cell type |
| `numberCellRows` | `number` | Number of graphic cell rows |
| `numberCellColumns` | `number` | Number of graphic cell columns |
| `numberBrailleCellColumns` | `number` | Number of braille text cell columns |

---

## Project Structure

```
3.0.0/
├── DotPadSDK-3.0.0.js         ← SDK library
├── DotPadSDK-3.0.0.d.ts       ← TypeScript definitions
├── WEB SDK Guide v3.0.0_EN.pdf
├── WEB SDK Guide v3.0.0_KO.pdf
├── download/
│   └── web-sdk-3.0.0.zip
└── DemoApp/                   ← React demo application
    ├── package.json
    ├── src/
    │   ├── App.tsx             ← Main UI (scan, connect, display controls)
    │   ├── index.tsx
    │   └── sdk/
    │       ├── DotPadSDK-3.0.0.js
    │       └── DotPadSDK-3.0.0.d.ts
    └── images/
        ├── screen01.png
        ├── screen02.png
        └── screen03.png
```

---

## Demo App

### Requirements

- Node.js 16+
- Chrome (or any Chromium-based browser)

### Run

```bash
cd DemoApp
npm install
npm start
```

Open Chrome and navigate to `http://localhost:3000`.

### Features

| Control | Description |
|---|---|
| **Select USB DotPad** | Opens browser Serial picker to add a USB device |
| **Select BLE DotPad** | Opens browser Bluetooth picker to add a BLE device |
| **Connect / Disconnect** | Per-device connect/disconnect toggle |
| **Graphic Area (300 cells)** | Print full image, print full braille, print partial image/braille, reset |
| **Text Area (20 cells)** | Print braille, print braille with panning, reset |

Per-device controls become available in the device row after a successful connection.
