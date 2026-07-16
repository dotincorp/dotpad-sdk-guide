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

The translation result depends on the currently configured language, grade, and word-wrap cell count, so set those beforehand. Use `setBrailleLanguage(_:)` with a `BrailleLanguage` — it sets the language and its default grade in one call:

```swift
// Language (e.g. Korean) — configures the SDK for that language, including its default grade
sdk.dotPadAPI.setBrailleLanguage(.korean)

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

> `setBrailleLanguage(...)` / `setBrailleLanguageGrade(...)` can be called either before or after connecting a device — the language/grade currently configured always applies to the next `translateText(...)` call, whether or not a device is connected.

#### Selecting a Language: `BrailleLanguage`

`BrailleLanguage` is the list of every language the SDK supports. Pick one and call `setBrailleLanguage(_:)` — that's all you need to configure translation for that language.

```swift
// Discover every language the SDK supports
let languages = sdk.dotPadAPI.getBrailleLanguages()   // [BrailleLanguage]
for language in languages {
    print(language.displayName, language.englishDescription, language.languageCode)
}

// Select one — everything the SDK needs is set automatically,
// and grade defaults to that language's defaultGradeValue (skipped if the language has no grade concept)
sdk.dotPadAPI.setBrailleLanguage(.korean)

// Or specify the grade explicitly
sdk.dotPadAPI.setBrailleLanguage(.english, grade: 1)

// Look a language up by its raw code, e.g. to reflect the currently active language in a picker
if let current = BrailleLanguage.from(languageCode: sdk.dotPadAPI.getBrailleLanguage()) {
    print(current.displayName)
}

// Or by display name, e.g. if you persisted the selection as a string
if let selected = BrailleLanguage.fromDisplayName("한국어") {
    sdk.dotPadAPI.setBrailleLanguage(selected)
}
```

| Method | Description |
|--------|-------------|
| `getBrailleLanguages() -> [BrailleLanguage]` | Returns every language the SDK supports, with its display name, English description, and grade options. |
| `setBrailleLanguage(_ language: BrailleLanguage, grade: Int? = nil)` | Configures the SDK for the given language in one call. If `grade` is omitted, applies that language's `defaultGradeValue` (languages with no grade concept, e.g. Japanese, are left untouched). |
| `BrailleLanguage.fromDisplayName(_ name: String) -> BrailleLanguage?` | Looks up a language by its display name. |
| `BrailleLanguage.from(languageCode: Int32) -> BrailleLanguage?` | Looks up a language by its raw code — e.g. the value returned by `getBrailleLanguage()`. |

> `defaultGrade` (`String?`) is the human-readable label (e.g. `"Grade2"`, or `"Xianxing (Shengdiao)"` for Chinese); `defaultGradeValue` (`Int?`) is the numeric value actually passed to `setBrailleLanguageGrade(gradeValue:)`. These don't always line up by simple `1`/`2`/`3` — Chinese's three options in particular don't map to `gradeValue` in list order — so use `defaultGradeValue`, not the index of `defaultGrade` within `grades`, if you need the number yourself.

> **Japanese:** `BrailleLanguage.japanese` is translated via a remote API call rather than on-device, so it requires a network connection — see [Japanese Remote Translation](#japanese-remote-translation) below.

#### Braille Grade (`gradeValue: Int`)

> If you're using `setBrailleLanguage(_:)` (recommended, see above), you don't need this table for the default case — it already applies the language's default grade for you. Use `setBrailleLanguageGrade(gradeValue:)` directly (or `setBrailleLanguage(_:grade:)`) only when you want a **non-default** grade, or need the raw value for some other reason.

`setBrailleLanguageGrade(gradeValue:)` takes a plain `Int` (1–3), which the SDK maps internally to `GradeOption`:

| Grade | `GradeOption` raw value |
|---|---|
| 1 | `0x01` |
| 2 | `0x02` |
| 3 | `0x03` |

Grade generally distinguishes how much text abbreviation/contraction is applied during translation (Grade 1 = uncontracted, letter-for-letter braille; Grade 2 = contracted braille using standard abbreviation rules). Not every language exposes all three grades — most languages that support grade selection only use **Grade 1 / Grade 2**. The one exception is **Chinese (Simplified)**, whose three variants map to grade values differently:

| Chinese (Simplified) option | `gradeValue` |
|---|---|
| Xianxing (Shengdiao) — tonal, letter-for-letter | 1 |
| Shuang Pin — Pinyin shorthand | 2 |
| Xianxing (No Shengdiao) — non-tonal, letter-for-letter | 3 |

Languages without a documented default below either don't support grade selection, or should be left at the SDK's default (`Grade2`).

| Default grade | Languages |
|---|---|
| Grade 2 | English, Korean, Arabic, Vietnamese, German, Mongolian |
| Grade 1 | French, Portuguese, Danish, Swedish, Uzbek |
| Xianxing (Shengdiao) | Chinese (Simplified) |

```swift
// Example: English, Grade 2 (contracted)
sdk.dotPadAPI.setBrailleLanguageGrade(gradeValue: 2)
```

#### Full Reference: Language / Engine / Grade

Combines the language and grade tables above into a single lookup — every language the SDK currently supports (via `BrailleLanguage`), its available grades, default grade, and internal translation engine (`.Dot` = the SDK's own built-in engine, `.Louis` = the open-source [Liblouis](http://liblouis.io/) library):

| Language | Code (hex) | Grades | Default Grade | `defaultGradeValue` | Engine |
|---|---|---|---|---|---|
| Arabic | `0x01` | Grade1, Grade2 | Grade2 | 2 | `.Dot` |
| Chinese (Simplified) | `0x03` | Xianxing (Shengdiao), Xianxing (No Shengdiao), Shuang Pin | Xianxing (Shengdiao) | 1 | `.Dot` |
| Dutch | `0x04` | Grade1, Grade2 | — | — | `.Louis` |
| English | `0x05` | Grade1, Grade2 | Grade2 | 2 | `.Louis` |
| French | `0x06` | Grade1, Grade2 | Grade1 | 1 | `.Louis` |
| German | `0x07` | Grade1, Grade2 | Grade2 | 2 | `.Louis` |
| Italian | `0x08` | — | — | — | `.Louis` |
| Japanese | `0x09` | — | — | — | `.Dot`* |
| Korean | `0x0A` | Grade1, Grade2 | Grade2 | 2 | `.Dot` |
| Russian | `0x0B` | — | — | — | `.Dot` |
| Spanish | `0x0C` | — | — | — | `.Louis` |
| Vietnamese | `0x0D` | Grade1, Grade2 | Grade2 | 2 | `.Louis` |
| Portuguese | `0x0F` | Grade1, Grade2 | Grade1 | 1 | `.Louis` |
| Czech | `0x10` | — | — | — | `.Louis` |
| Polish | `0x11` | — | — | — | `.Louis` |
| Norwegian | `0x12` | — | — | — | `.Louis` |
| Kazakh | `0x13` | — | — | — | `.Louis` |
| Danish | `0x14` | Grade1, Grade2 | Grade1 | 1 | `.Louis` |
| Greek | `0x15` | — | — | — | `.Louis` |
| Swedish | `0x16` | Grade1, Grade2 | Grade1 | 1 | `.Louis` |
| Finnish | `0x17` | — | — | — | `.Louis` |
| Thai | `0x18` | — | — | — | `.Louis` |
| Catalan | `0x19` | — | — | — | `.Louis` |
| Khmer | `0x1A` | — | — | — | `.Louis` |
| Chinese (Traditional, TW) | `0x1D` | — | — | — | `.Louis` |
| Uzbek | `0x22` | — | Grade1 | 1 | `.Louis` |
| Mongolian | `0x23` | Grade1, Grade2 | Grade2 | 2 | `.Louis` |
| Romanian | `0x25` | — | — | — | `.Louis` |
| Hungarian | `0x26` | Grade1, Grade2 | — | — | `.Louis` |
| Welsh | `0x27` | Grade1, Grade2 | — | — | `.Louis` |
| Serbian | `0x28` | — | — | — | `.Louis` |
| Croatian | `0x2A` | — | — | — | `.Louis` |

> \* Japanese: see [Japanese Remote Translation](#japanese-remote-translation) — `.Dot` routes through the remote translation API rather than a local table.
> Languages listing "—" for Grades/Default Grade don't expose grade selection; leave `setBrailleLanguageGrade(...)` untouched (SDK default `Grade2`) for those. Uzbek is a source quirk: it has no enumerated `grades` list but does report a `defaultGradeValue` of 1.

### 8. Braille Text Output with Async Translation (`displayTextData(text:completion:)`)

In addition to the synchronous `displayTextData(text:) -> String` used in [section 3](#3-braille-text-output), the SDK provides an async, completion-based variant that translates the text and sends it directly to the connected device, returning the resulting braille string via a callback:

```swift
sdk.dotPadAPI.displayTextData(text: "Hello") { brailleUnicode in
    // brailleUnicode: readable braille unicode string for the first display-width chunk
}
```

Internally this shares the same translation path as `translateText(_:completion:)` — the result is identical to the synchronous `displayTextData(text:)` for every language/engine combination, except **Japanese with the `.Dot` engine** (see below), where it awaits a network response before sending to the device.

#### Japanese Remote Translation

`BrailleLanguage.japanese`'s local translator has no Japanese table, so `translateText(_:completion:)` and `displayTextData(text:completion:)` route Japanese text to the remote translation API instead of translating locally. This remote routing applies to Japanese only — every other language still translates fully locally.

```swift
sdk.dotPadAPI.setBrailleLanguage(.japanese)                   // configures the SDK for Japanese in one call

// Japanese has no Grade1/Grade2 concept locally, so BrailleLanguage.japanese has no defaultGradeValue and
// setBrailleLanguage(.japanese) leaves the grade untouched — set it explicitly, it's sent as the request's OPTION value
sdk.dotPadAPI.setBrailleLanguageGrade(gradeValue: 2)
sdk.dotPadAPI.setNumberOfBraillePerLine(20)                   // sent as the request's word-wrap cell count

sdk.dotPadAPI.translateText("こんにちは") { hexString in
    // hexString returned by the remote API
}
sdk.dotPadAPI.displayTextData(text: "こんにちは") { brailleUnicode in
    // translated remotely, then sent to the connected device
}
```

> **Important:** the remote API is only reached through `translateText(_:completion:)` and `displayTextData(text:completion:)`. Other APIs that translate text — the synchronous `displayTextData(text:) -> String`, or any local-translation path — always translate locally regardless of language, and **do not** call the remote API even for Japanese. If your app uses Japanese, make sure every text-to-braille call site uses one of these two async APIs — otherwise Japanese text is silently passed to the SDK's built-in `.Dot` engine, which has no Japanese table and will not produce correct output.

| Method | Description |
|--------|-------------|
| `displayTextData(text: String, completion: @escaping (String) -> Void)` | Translates `text` (locally, or via the remote API for Japanese) and sends the result to the connected device. Returns the braille unicode string for the first display-width chunk via `completion`. |

---

## Features

| Feature | Description |
|---------|-------------|
| BLE Scan / Connect | Scan for nearby DotPad devices and connect |
| Device Info | Check the connected device's name and type |
| Braille Text Output | Convert input text to braille and display on braille cells |
| Graphic Data Output | Send hex data to DotPad320 graphic display |
| All Up / All Down | Raise all pins or reset displays |
| Manual Braille Navigation | Disable auto next/prev on panning key input and trigger it manually |
| Key Press / Release Events | Receive `onKeyDown` / `onKeyUp` callbacks for hardware key state changes |
| Text-to-Braille Translation | Convert text to braille hex data via `translateText`, without a device connection |
| Language List | Discover every supported language via `getBrailleLanguages()` and configure one in a single call via `setBrailleLanguage(_:)` |
| Async Braille Text Output | Translate text (or fetch via the remote API for Japanese) and send it to the connected device via `displayTextData(text:completion:)` |
| Japanese Remote Translation | `BrailleLanguage.japanese` translates Japanese text via a remote API call instead of on-device |

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
// Discover supported languages and select one — the SDK configures itself for that language, including its default grade
let languages = sdk.dotPadAPI.getBrailleLanguages()
sdk.dotPadAPI.setBrailleLanguage(.korean)
sdk.dotPadAPI.setNumberOfBraillePerLine(20)
sdk.dotPadAPI.translateText("Hello") { hexString in
    // hexString: translated braille data
}

// 8. Async translate + display in one call (Japanese is translated via a remote API call)
sdk.dotPadAPI.displayTextData(text: "Hello") { brailleUnicode in
    // brailleUnicode: readable braille string for the first display-width chunk
}
```

---
