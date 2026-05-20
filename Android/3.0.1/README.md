# DotPad SDK for Android — v3.0.1

Sample application demonstrating the DotPad SDK for Android. The app connects to a Dot Pad device via BLE or USB and controls its tactile display (braille text output, graphic output, key input handling).

---

## Change History

### v3.0.1 — 2026-04-27
- Added single-key state callbacks: `onKeyDown` / `onKeyUp`
- Added `DotPadKey` enum for individual key identification
- Panning Key and Function Key provide separate `dotKeyBinary` values

### v3.0.0 — 2026-03-10
- Improved BLE connection stability (GATT callback flow, MTU, descriptor handling)
- Auto-retry and reconnect on DeviceName / BoardInfo init failure (max 3 retries)
- Fixed BLE scan list not updating when stale null-name devices were present
- CCCD descriptor retry logic (max 3 retries → reconnect on failure)
- Fixed characteristic collision in multi-device environments
- BLE Command Characteristic caching (removes redundant re-discovery)
- Improved device list synchronization in multi-thread environments
- `ConnectionStateChangeError` DataCode added

### v3.0.0 — 2026-02-09
- Added `receivedErrorCallback` to `DotDeviceMessage` interface
- Added `ErrorCodes` enum
- `connect()` no longer returns `DotDevice` directly; device is provided via `DataCodes.Connected` callback
- `disconnect()` now disconnects both connected and connecting devices when called with no argument

### v3.0.0 — 2026-01-28
- USB device type detection moved from app to SDK (DotPad320A / DotPad320X auto-detected)
- Added `CommandSendFail` and `Reconnecting` DataCodes
- BLE connection and reconnection stabilization

### v3.0.0 — 2026-01-07
- Fixed app crash caused by memory interference in Dot braille library

### v3.0.0 — 2025-11-28
- Initial release

---

## Requirements

| Item | Version |
|---|---|
| Min SDK | API 26 (Android 8.0) |
| Target SDK | API 33 |
| Compile SDK | API 34 |
| Kotlin | 2.0.21 |
| AGP | 8.13.0 |
| Gradle Wrapper | 8.13 |

---

## Project Structure

```
3.0.1/
├── Android SDK Guide v3.0.1_KO.pdf
└── DemoApp/
    └── appnew/
        ├── libs/
        │   └── DotPadFrameworks-3.0.1.aar   ← SDK library
        ├── assets/
        │   └── *.dtms                         ← Sample DTMS file
        └── src/main/java/com/dotincorp/demoappnew/
            ├── AppApplication.kt
            ├── MainActivity.kt
            ├── ui/screens/
            │   ├── ScanScreen.kt              ← BLE / USB scan UI
            │   ├── ConnectScreen.kt           ← Connected device control UI
            │   └── pop/BrailleSelectDialog.kt
            └── viewModel/
                ├── ScanViewModel.kt           ← DotPadScanner wrapper
                └── ConnectViewModel.kt        ← DotPadProcess wrapper
```

---

## Setup

### 1. Add the AAR

Copy `DotPadFrameworks-x.x.x.aar` into your module's `libs/` folder, then add to `build.gradle.kts`:

```kotlin
dependencies {
    implementation(fileTree(mapOf("dir" to "libs", "include" to listOf("*.aar"))))
    implementation("com.squareup.okhttp3:okhttp:4.12.0") // required for Japanese braille translation
}
```

### 2. Set Application Context

`DotPadProcess.application` must be set before any SDK call. The easiest way is to pass your `Application` instance to `DotPadScanner` — it sets this automatically.

```kotlin
// AppApplication.kt
class AppApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // If not using DotPadScanner, set manually:
        // DotPadProcess.application = this
    }
}
```

### 3. Declare Permissions

**AndroidManifest.xml**

```xml
<!-- USB -->
<uses-feature android:name="android.hardware.usb.host" />

<!-- BLE -->
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>

<!-- File / DTMS open -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>
<uses-permission android:name="android.permission.READ_MEDIA_DOCUMENTS"/>
```

Request runtime permissions for BLE on API 31+ (`BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`) and for older APIs (`BLUETOOTH`, `BLUETOOTH_ADMIN`, `ACCESS_FINE_LOCATION`).

---

## Basic Usage Flow

```
1. DotPadScanner(application)       → sets DotPadProcess.application automatically
2. scanner.listener = DotPadSearchListener
3. scanner.startBleScan()           → onBLEScan callbacks arrive
   scanner.startUsbScan()           → onUSBScan callback arrives
4. DotPadProcess.setCallBack(DotDeviceMessage)
5. DotPadProcess.connect(bluetoothDevice)
   DotPadProcess.connect(usbDevice)
6. DataCodes.Connected callback → device is ready for use
```

> **DotPad320A** supports USB connection via A-to-C cable only (C-type adapter supported).  
> **DotPad320X** supports C-to-C cable.

---

## Classes

| Class | Description |
|---|---|
| `DotPadScanner` | Scans for BLE and USB devices. Instantiating it automatically sets `DotPadProcess.application`. |
| `DotPadProcess` | Singleton that manages all BLE / USB connections. Supports simultaneous multi-device connections. Prevents duplicate connections using the device identifier (BLE address / `vendorId:productId:deviceName` for USB). |

---

## Listeners

### DotPadScanner — `DotPadSearchListener`

| Function | Description |
|---|---|
| `onBLEScan(device: BluetoothDevice)` | Called for each unique BLE device discovered |
| `onUSBScan(devices: List<UsbDevice>)` | Called with the full list of connected USB devices |
| `isBLEScanning(isScanning: Boolean)` | BLE scan state change |
| `onError(msg: String)` | Error message |

### DotPadProcess — `DotDeviceMessage`

Register with `DotPadProcess.setCallBack(dotDeviceMessage)`.

The interface provides both device-agnostic and device-specific variants:

```kotlin
// Device-agnostic (simple single-device setups)
fun receivedMessageCallBack(dataCode: DataCodes, msg: String)
fun sendMessageCallback(protocol: String)           // raw protocol log
fun receivedErrorCallback(errorCode: ErrorCodes, msg: String)

// Device-specific (recommended for multi-device)
fun receivedMessageCallBackWithDevice(device: DotDevice, dataCode: DataCodes, msg: String)
fun receivedKeyCallBack(device: DotDevice?, keyCode: KeyCodes, msg: String)

// Single-key state (v3.0.1+)
fun onKeyDown(device: DotDevice?, key: DotPadKey, dotKeyBinary: String)
fun onKeyUp(device: DotDevice?, key: DotPadKey, dotKeyBinary: String)
```

> Panning Keys and Function Keys have different response structures; `dotKeyBinary` is provided separately for each.

---

## Enumerations

### `DataCodes`

| Code | Description |
|---|---|
| `Connected` | Device fully initialized and ready to use |
| `ConnectedFail` | Connection attempt failed |
| `Disconnected` | Connection closed |
| `Reconnecting` | Reconnection attempt in progress |
| `BoardInfo` | Board layout / capability info received |
| `BleMacAddress` | BLE MAC address received |
| `DeviceName` | Device name received |
| `DeviceFWVersion` | Firmware version received |
| `DeviceHWVersion` | Hardware version received |
| `ResponseDisplayLineAck` | Line data acknowledged |
| `ResponseDisplayLineNonAck` | Line data not acknowledged |
| `ResponseDisplayLineComplete` | Line output complete |
| `CommandError` | Command error |
| `CommandNone` | Undefined command |
| `CommandSendFail` | Command transmission failure |
| `ConnectionStateChangeError` | GATT `onConnectionStateChange` error |

### `KeyCodes`

`KeyFunction1–4`, `KeyFunction12/13/23/24/34` (combo keys), `KeyElse`, `PanningAll`, `PanningLeft`, `PanningRight`, `LPF1` (Panning Left + F1), `RPF4` (Panning Right + F4)

### `DotPadKey` (v3.0.1+)

Single-key enum used with `onKeyDown` / `onKeyUp`:

`KeyFunction1`, `KeyFunction2`, `KeyFunction3`, `KeyFunction4`, `PanningLeft`, `PanningRight`

### `ErrorCodes`

| Code | Description |
|---|---|
| `ApplicationNotSet` | `DotPadProcess.application` not configured |
| `UsbPermissionDenied` | USB permission denied |
| `AlreadyConnected` | Device already connected |
| `AlreadyConnecting` | Connection already in progress |
| `ConnectFailed` | Connection failed |

---

## API Reference

### DotPadScanner

| Function | Description |
|---|---|
| `startBleScan()` | Starts BLE scan; delivers unique devices via `onBLEScan` |
| `stopBleScan()` | Stops BLE scan |
| `startUsbScan()` | Enumerates connected USB devices via `onUSBScan` |

### DotPadProcess — Connection

| Function | Description |
|---|---|
| `connect(device: BluetoothDevice)` | BLE connect. Returns existing instance if already connected. Delivers `DataCodes.Connected` + `DotDevice` on success. |
| `connect(device: UsbDevice)` | USB connect. Same duplicate-prevention logic. |
| `disconnect(dotDevice: DotDevice? = null)` | Disconnect. `null` disconnects all devices and clears internal list. |
| `getConnectedDevices(): List<DotDevice>` | Returns currently connected device list. |

### DotPadProcess — Display

| Function | Description |
|---|---|
| `displayGraphicData(hexData: String, dotDevice: DotDevice? = null, displayMode: DisplayMode = GraphicMode)` | Send hex graphic data. `null` = all devices. |
| `displayTextData(inputData: String, dotDevice: DotDevice? = null, needsTranslation: Boolean = true, displayMode: DisplayMode = TextMode, callback: ((DotDevice, String) -> Unit)? = null)` | Send text. If `needsTranslation = true`, internally translates to braille first. Callback returns the braille string used per device. |
| `displayGraphicData(dotDataBoolean: List<List<Boolean>>, dotDevice: DotDevice? = null)` | Convert 2D boolean array to hex and display in graphic area. |
| `displayTextData(dotDataBoolean: List<List<Boolean>>, dotDevice: DotDevice? = null)` | Convert 2D boolean array to hex and display in text area. |
| `displayLineData(lineId: Int, startCellIndex: Int, hexData: String, displayMode: DisplayMode, dotDevice: DotDevice? = null)` | Send data for a specific line. |
| `displayAllUp(dotDevice: DotDevice? = null)` | Raise all pins. |
| `displayAllDown(dotDevice: DotDevice? = null)` | Lower all pins. |
| `setAutoRefresh(enabled: Boolean, dotDevice: DotDevice? = null)` | Enable auto re-display on reconnect (useful for D2 devices). |

### DotPadProcess — Device Info

```kotlin
fun requestDeviceInfo(dotDevice: DotDevice, type: DeviceInfo)
// DeviceInfo: DeviceName, FirmwareVersion, HardwareVersion
// Response delivered via DotDeviceMessage callback
```

### DotPadProcess — DTMS

```kotlin
fun getDTMStoURI(jsonString: String): DTMS
```

Parses a DTMS JSON string into a `DTMS` object. See the sample `.dtms` file in `appnew/assets/`.

```kotlin
// Usage example
dtms.setItemIdx(0)
DotPadProcess.displayTextData(dtms.getBrailleText(), null, false)
DotPadProcess.displayGraphicData(dtms.getGraphicData())
```

### DotPadProcess — Braille Translation

| Function | Description |
|---|---|
| `getBrailleLanguages(): Map<String, List<String>>` | Returns supported languages and their grades |
| `setBrailleLanguages(selectLanguage: String, selectGrade: String?)` | Set active braille language and grade |
| `translateText(inputText: String, callback: (String) -> Unit)` | Translate plain text to braille string asynchronously |

> Japanese braille translation requires a network connection. Add `com.squareup.okhttp3:okhttp` to Gradle dependencies when using it.

### DotPadProcess — BLE Reconnection

| Variable | Default | Description |
|---|---|---|
| `reconnectAttempts: Int` | `10` | Maximum reconnection attempts |
| `reconnectTimeoutMs: Long` | `3000` | Reconnection timeout (ms) |

---

## Demo App Features

| Screen | Features |
|---|---|
| **Scan** | Toggle BLE / USB mode, start/stop scan, tap device to connect |
| **Connect** | Connected device list, text input → braille display, ALL UP / ALL DOWN, send sample graphic, open DTMS file, braille language settings, per-device individual control |

Key navigation handled in the demo:

| Key | Action |
|---|---|
| Panning Left | Previous braille page |
| Panning Right | Next braille page |
| Function 3 | Previous DTMS page |
| Function 4 | Next DTMS page |
