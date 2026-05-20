# DotPad Demo App

A sample app that connects to DotPad braille display devices via BLE and outputs graphic/braille data using the DotPadFrameworks SDK.

---

## Requirements

- Xcode 15 or later
- iOS 15.0+
- Swift 5.0
- [XcodeGen](https://github.com/yonaskolb/XcodeGen)

---

## Project Setup

### Build DotPadFrameworks SDK

The demo app uses its own `Frameworks/` folder containing `DotPadFrameworks.xcframework`.  

### Build and Run

Open `DotPadDemoApp.xcodeproj` in Xcode, select the `DotPadDemoApp` scheme, and build.

> The simulator does not support BLE, so you must run on a physical iOS device.

---

## UI Layout and Usage

The app presents a single main screen with all controls.

### 1. BLE Connection

| Step | Action |
|------|--------|
| Tap **Start Scan** | Starts BLE scanning for nearby DotPad devices |
| Tap a device in the list | Connects to the device (list shows device name and RSSI signal strength) |
| Connection complete | Button text changes to **Disconnect** and device name is automatically retrieved |
| Tap **Disconnect** | Disconnects and resets the device list |

> After connection, the app waits 3 seconds then automatically requests the device name (`requestDeviceName()`).  
> Graphic/braille display support is automatically determined based on the device name.

### 2. Device Info

- Tap **Device Name** button → Requests the connected device's name and displays it in the adjacent text field
- If the device name contains `KM2-20` → Only braille display is enabled
- If the device name contains `DotPad320` → Both graphic and braille displays are enabled

### 3. Braille Text Output

1. Enter text in the **Text** input field
2. Tap **Display Braille Data**
3. Text is converted to braille and displayed on the DotPad braille cells
4. The converted braille string is also shown in the **Braille Output** label

### 4. Graphic Data Output (DotPad320 Only)

- Tap **Display Graphic Data**
- A predefined hex data string (600 characters, 300 bytes) is sent to the graphic display
- Does nothing if the connected device is not a DotPad320

### 5. Pin Control

| Button | Action |
|--------|--------|
| **All Up** | Raises all pins (graphic: `FF` × 300, braille: `FF` × 20) |
| **All Down** | Lowers all pins (resets graphic/braille displays) |

---

## Features

| Feature | Description |
|---------|-------------|
| BLE Scan / Connect | Scan for nearby DotPad devices and connect |
| Device Info | Check the connected device's name and type |
| Graphic Data Output | Send hex data to DotPad320 graphic display |
| Braille Text Output | Convert input text to braille and display on braille cells |
| All Up / All Down | Raise all pins or reset displays |

---

## Supported Devices

| Device | Graphic Display | Braille Display |
|--------|:-:|:-:|
| DotPad320 | O | O |
| KM2-20 | - | O |

---

## Code Structure

```
DotPadDemoApp/
├── AppDelegate.swift         # App entry point
├── SceneDelegate.swift       # Scene management
├── ViewController.swift      # Main screen (BLE connection, data output)
├── DotPadSDK.swift           # DotPadAPI singleton wrapper
├── BLEPeripheralCell.swift   # BLE device list cell
└── Base.lproj/
    └── Main.storyboard       # Main UI layout
```

### Key Classes

- **`DotPadSDK`**: Singleton wrapper that manages the `DotPadAPI` instance. Includes device type configuration (`setDeviceType`)
- **`ViewController`**: Implements `DotDeviceMessage` to receive device events (connection/disconnection/key input, etc.). Uses `sdk` property for simplified SDK access
- **`BLEPeripheralCell`**: Table view cell for BLE scan results (device name + RSSI signal strength)

### Callback Events (`DotDeviceMessage`)

Message events and key events are separated into distinct methods.

**`receivedMessageCallBack(_:_:)`** — connection/status events:

| DataCode | Description |
|----------|-------------|
| `Discovery_List` | BLE scan results updated |
| `Connected` | Device connection complete |
| `Disconnected` | Device disconnected |
| `DeviceName` | Device name/type received |
| `FirmwareInfo` | Firmware version received |

**`receivedKeyCallBack(_:_:)`** — hardware key input events:

| KeyCode | Description |
|---------|-------------|
| `PanningLeft` / `PanningRight` | Panning keys |
| `PanningAll` | Both panning keys simultaneously (`msg: "PanningAll"` / `"PanningAllLongPress"`) |
| `LPF1` / `RPF4` | Panning + function key combination |
| `KeyFunction1` ~ `KeyFunction4` | Function key press |
| `KeyFunction12` / `KeyFunction23` / `KeyFunction34` / `KeyFunction13` / `KeyFunction24` | Simultaneous function key input |
| `KeyElse` | Other key combinations (hex value in `msg`) |

---

## SDK Integration Summary

Minimal flow for integrating the SDK in the demo app:

```swift
// 1. Initialize singleton and register callback delegate
sdk.dotPadAPI.setCallBack(dotDeviceMessage: self)

// 2. BLE scan
sdk.dotPadAPI.dotPadDeviceScan(isScan: true)

// 3. Connect to device (selected from scan results after Discovery_List callback)
let devices = sdk.dotPadAPI.getDeviceFiltered()
sdk.dotPadAPI.connectDevice(peripheral: devices[0].remotePeripheral)

// 4-a. Display braille text
sdk.dotPadAPI.displayTextData(text: "Hello")

// 4-b. Display graphic hex data (DotPad320)
sdk.dotPadAPI.displayGraphicData(data: hexString)

// 5. Disconnect
sdk.dotPadAPI.dotPadDisconnect()
```

---
