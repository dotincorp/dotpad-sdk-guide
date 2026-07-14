# DotPadSDK 2.3.2 for iOS

A sample app that connects to DotPad braille display devices via BLE and outputs graphic/braille data using the DotPadFrameworks SDK.

---

## Requirements

- Xcode 15 or later
- iOS 15.0+
- Swift 5.0
- [XcodeGen](https://github.com/yonaskolb/XcodeGen)

---

## Project Setup

### 1. Build DotPadFrameworks SDK

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

### 6. Manual Braille Data Navigation

By default, pressing the panning keys automatically advances/rewinds the braille data currently loaded via `displayTextData(text:)`, one display-width chunk at a time. Three new APIs let the app take manual control over this behavior:

```swift
// Disable the SDK's automatic next/prev display on panning key input
sdk.dotPadAPI.setUseAutoBrailleNextPrev(false)

// Manually display the next chunk of the currently loaded braille text
sdk.dotPadAPI.displayBrailleDataNext()

// Manually display the previous chunk of the currently loaded braille text
sdk.dotPadAPI.displayBrailleDataPrev()
```

| Method | Description |
|--------|-------------|
| `setUseAutoBrailleNextPrev(_ use: Bool)` | Turns the SDK's built-in panning-key auto next/prev behavior on/off. Defaults to `true` (auto). Set to `false` when the app wants to own panning-key handling itself (e.g. custom paging logic). |
| `displayBrailleDataNext()` | Advances the offset of the currently loaded braille text by one display-width chunk and re-renders it on the device. If already at the last chunk, it does nothing and only triggers the device's vibration feedback. |
| `displayBrailleDataPrev()` | Rewinds the offset of the currently loaded braille text by one display-width chunk and re-renders it on the device. If already at the first chunk, it does nothing and only triggers the device's vibration feedback. |

> With `setUseAutoBrailleNextPrev(false)`, panning key presses still fire `PanningLeft` / `PanningRight` (via `receivedKeyCallBack(_:_:)`) and `onKeyDown` / `onKeyUp`, but no longer move the displayed braille data by themselves — call `displayBrailleDataNext()` / `displayBrailleDataPrev()` from those callbacks yourself to move between chunks.

The SDK also provides `requestVibrator(...)` for triggering the device's vibration feedback directly — this is the same call `displayBrailleDataNext()` / `displayBrailleDataPrev()` make internally when navigation hits the first/last chunk, and can be used on its own for custom feedback:

```swift
// Request vibration feedback with default pattern (onMs: 70, offMs: 50, repeatCount: 2)
sdk.dotPadAPI.requestVibrator()

// Or with custom timing
sdk.dotPadAPI.requestVibrator(onMs: 100, offMs: 50, repeatCount: 3)
```

| Parameter | Description |
|-----------|-------------|
| `onMs` | Duration of each vibration pulse (ms). Default `70`. |
| `offMs` | Duration of each pause between pulses (ms). Default `50`. |
| `repeatCount` | Number of vibration pulses, `1`~`5`. Default `2`. |

### 7. Text-to-Braille Translation (No Device Required)

`translateText(_:completion:)` converts input text to braille hex data via a callback, using the SDK's translation engine directly — it works even without a connected device.

```swift
sdk.dotPadAPI.translateText("Hello") { hexString in
    // hexString: translated braille data as a hex string (e.g. "0102...")
}
```

The translation result depends on the currently configured language, grade, and word-wrap cell count, so set those beforehand:

```swift
// Language (e.g. Korean) and translate engine
sdk.dotPadAPI.setupBrailleLanguage(translateEngine: .Dot, pinOption: nil, brailleLanguage: LanguageCode.Korean.rawValue)

// Grade (e.g. Grade 2)
sdk.dotPadAPI.setBrailleLanguageGrade(gradeValue: Int(GradeOption.Grade2.rawValue))

// Number of braille cells per line (word-wrap width)
sdk.dotPadAPI.setNumberOfBraillePerLine(20)

sdk.dotPadAPI.translateText("Hello") { hexString in
    // ...
}
```

| Method | Description |
|--------|-------------|
| `translateText(_ text: String, completion: @escaping (String) -> Void)` | Translates `text` to braille and returns the result as a hex string via `completion`. Does not require a device connection. |
| `setNumberOfBraillePerLine(_ count: Int32)` | Sets the number of braille cells displayed per line (word-wrap character count) used by translation. |

---

## Features

| Feature | Description |
|---------|-------------|
| BLE Scan / Connect | Scan for nearby DotPad devices and connect |
| Device Info | Check the connected device's name and type |
| Graphic Data Output | Send hex data to DotPad320 graphic display |
| Braille Text Output | Convert input text to braille and display on braille cells |
| All Up / All Down | Raise all pins or reset displays |
| Manual Braille Navigation | Disable auto next/prev on panning key input and trigger it manually |
| Key Press / Release Events | Receive `onKeyDown` / `onKeyUp` callbacks for hardware key state changes |
| Text-to-Braille Translation | Convert text to braille hex data via `translateText`, without a device connection |

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

### Key Press / Release Events (`onKeyDown` / `onKeyUp`)

In addition to `receivedKeyCallBack(_:_:)`, `SendDataProtocol` now provides granular key press/release callbacks:

```swift
func onKeyDown(key: DotPadKey, dotKeyBinary: String) {
    // Called when a hardware key is pressed
}

func onKeyUp(key: DotPadKey, dotKeyBinary: String) {
    // Called when a hardware key is released
}
```

- `key`: `DotPadKey` enum — `.KeyFunction1` ~ `.KeyFunction4`, `.PanningLeft`, `.PanningRight`
- `dotKeyBinary`: raw key state as a binary string

Both methods have empty default implementations, so you only need to override the ones you use.

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

// 5. Manual braille data navigation (optional)
sdk.dotPadAPI.setUseAutoBrailleNextPrev(false)
sdk.dotPadAPI.displayBrailleDataNext()
sdk.dotPadAPI.displayBrailleDataPrev()

// 6. Disconnect
sdk.dotPadAPI.dotPadDisconnect()

// 7. Text-to-braille translation (optional, no device required)
sdk.dotPadAPI.setupBrailleLanguage(translateEngine: .Dot, pinOption: nil, brailleLanguage: LanguageCode.Korean.rawValue)
sdk.dotPadAPI.setBrailleLanguageGrade(gradeValue: Int(GradeOption.Grade2.rawValue))
sdk.dotPadAPI.setNumberOfBraillePerLine(20)
sdk.dotPadAPI.translateText("Hello") { hexString in
    // hexString: translated braille data
}
```

---
