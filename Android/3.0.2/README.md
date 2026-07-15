# DotPad SDK for Android — v3.0.2

Sample application demonstrating the DotPad SDK for Android. The app connects to a Dot Pad device via BLE or USB and controls its tactile display (braille text output, graphic output, key input handling).

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
3.0.2/
└── DemoApp/
    └── appnew/
        ├── libs/
        │   └── DotPadFrameworks-3.0.2.aar   ← SDK library
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

Copy `android-sdk-x.x.x.aar` into your module's `libs/` folder, then add to `build.gradle.kts`:

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
| `displayBrailleDown(dotDevice: DotDevice? = null)` | Lower only the braille (text) area, leaving the graphic area untouched. `null` = all devices. |
| `displayGraphicDown(dotDevice: DotDevice? = null)` | Lower only the graphic area, leaving the braille (text) area untouched. `null` = all devices. |
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

#### Supported Languages

`selectLanguage` in `setBrailleLanguages()` takes the **Display Name** below (the value returned by `getBrailleLanguages()` keys), not the enum name.

| Display Name | Grades | Engine |
|---|---|---|
| English | Grade1, Grade2 | Dot |
| 한국어 (Korean) | Grade1, Grade2 | Dot |
| 日本語 (Japanese) | — | Dot |
| 简体中文 (Chinese, Simplified) | Xianxing (Shengdiao), Xianxing (No Shengdiao), Shuang Pin | Dot |
| català (Catalan) | — | Dot |
| polski (Polish) | — | Dot |
| norsk (Norwegian) | — | Dot |
| 中華民國 (Chinese, Taiwan) | — | LibLouis |
| français (French) | Grade1, Grade2 | LibLouis |
| deutsch (German) | Grade1, Grade2 | LibLouis |
| español (Spanish) | — | LibLouis |
| Русский (Russian) | — | LibLouis |
| Italiano (Italian) | — | LibLouis |
| čeština (Czech) | — | LibLouis |
| Tiếng Việt (Vietnamese) | Grade1, Grade2 | LibLouis |
| العربية (Arabic) | Grade1, Grade2 | LibLouis |
| Português (Portuguese) | Grade1, Grade2 | LibLouis |
| қазақ (Kazakh) | — | LibLouis |
| dansk (Danish) | Grade1, Grade2 | LibLouis |
| Ελληνικά (Greek) | — | LibLouis |
| svenska (Swedish) | Grade1, Grade2 | LibLouis |
| Suomalainen (Finnish) | — | LibLouis |
| แบบไทย (Thai) | — | LibLouis |
| ខ្មែរ (Khmer) | — | LibLouis |
| монгол (Mongolian) | Grade1, Grade2 | LibLouis |
| Oʻzbekcha (Uzbek) | — | LibLouis |

> Languages without listed grades translate with a single default grade (no `selectGrade` needed). Japanese uses the Dot engine but is translated via a network API call (see note above); all other engines run fully offline.

### DotPadProcess — Vibrator

```kotlin
fun requestVibrator(
    dotDevice: DotDevice? = null,
    onMs: Int = VibratorDefault.onMs,       // default 70
    offMs: Int = VibratorDefault.offMs,     // default 50
    repeatCount: Int = VibratorDefault.repeatCount  // default 2, max 5
)
```

Triggers the device's vibration motor. `onMs` is the ON duration per pulse, `offMs` is the pause between pulses, and `repeatCount` is the number of pulses (1–5). Omit `dotDevice` to vibrate all connected devices at once. Defaults are centralized in `VibratorDefault` and can be overridden per call.

```kotlin
// Usage example
DotPadProcess.requestVibrator(dotDevice)                 // default pattern
DotPadProcess.requestVibrator(dotDevice, onMs = 100, offMs = 100, repeatCount = 3)
```

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
