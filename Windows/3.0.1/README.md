# DotPad SDK for Windows — v3.0.1

SDK for controlling DotPad braille display devices on Windows. Distributed as a DLL with a C header file; loaded dynamically at runtime.

---

## SDK Files

| File | Description |
|---|---|
| `DotPadSDK.dll` | Core SDK library — place in the same directory as your executable |
| `DotSDKAPI.h` | API declarations, enums, and function pointer type definitions |
| `TTBEngine.dll` | Braille translation library used by `DotPadSDK.dll` |
| `MeCab.dll` | Japanese morphological analysis library for braille translation |
| `mecabrc` | MeCab configuration file for braille translation |
| `ipadic.zip` | Japanese dictionary table — unzip to `ipadic/` next to the executable |
| `tables.zip` | LibLouis translation tables for ReBraille — unzip to `tables/` next to the executable |

A 32-bit (`Win32`/x86) build of `DotPadSDK.dll` is now provided alongside the existing 64-bit (`x64`) build — pick the one matching your host application's architecture.

---

## Setup

### 1. Copy DLL files

Place `DotPadSDK.dll`, `TTBEngine.dll`, `MeCab.dll`, and `liblouis.dll` in the same directory as your executable.

### 2. Unzip support tables

```
ipadic.zip  →  ipadic/     (required for Japanese braille translation)
tables.zip  →  tables/     (required for ReBraille translation)
```

### 3. Load the DLL dynamically

```cpp
HMODULE hDll = LoadLibrary(L"DotPadSDK.dll");

// Resolve function pointers
auto DOT_PAD_BLE_SCAN = (fn_DOT_PAD_BLE_SCAN)GetProcAddress(hDll, "DOT_PAD_BLE_SCAN");
// ... repeat for each function

// On app exit
DOT_PAD_DISCONNECT(nullptr);
FreeLibrary(hDll);
```

Always verify a function pointer is non-`NULL` before calling it.

### 4. Network access for Japanese translation

Japanese (`DOT_PAD_LANGUAGE_JAPANESE`) braille translation is performed via a cloud translation API rather than the local translation engine, so it requires an active network connection. If the request fails (no network, timeout, etc.), `DOT_PAD_BRAILLE_DISPLAY` / `DOT_PAD_TRANSLATE_TEXT` return `false` and no data is sent to the display. All other languages continue to translate locally and do not require network access.

---

## Basic Usage Flow

```
1. Register callbacks       DOT_PAD_REGISTER_MESSAGE_CALLBACK / DOT_PAD_REGISTER_KEY_CALLBACK
2. Scan for devices         DOT_PAD_BLE_SCAN / DOT_PAD_USB_SCAN
3. Connect                  DOT_PAD_CONNECT_BLE / DOT_PAD_CONNECT_SERIAL
4. Wait for callback        DOT_DATA_CODE_CONNECTED → device is ready
5. Send display data        DOT_PAD_DISPLAY_DATA / DOT_PAD_BRAILLE_DISPLAY
6. Disconnect on exit       DOT_PAD_DISCONNECT(nullptr)
7. Unload                   FreeLibrary(hDll)
```

---

## Enumerations

### `DOT_DATA_CODE`

Event/response codes delivered via the message callback.

| Value | Description |
|---|---|
| `DOT_DATA_CODE_CONNECTED` | Connection successful |
| `DOT_DATA_CODE_DISCONNECTED` | Connection disconnected |
| `DOT_DATA_CODE_DEVICE_NAME` | Device name result |
| `DOT_DATA_CODE_DEVICE_FW_VERSION` | Firmware version result |
| `DOT_DATA_CODE_DEVICE_HW_VERSION` | Hardware version result |

See `DotSDKAPI.h` for the full list.

### `DOT_KEY_CODE`

Key event codes delivered via the key callback (`DOT_PAD_REGISTER_KEY_CALLBACK`). Reports key state on release, including simultaneous key combinations.

| Value | Description |
|---|---|
| `DOT_KEY_CODE_FUNCTION1` – `DOT_KEY_CODE_FUNCTION4` | Single function key press |
| `DOT_KEY_CODE_FUNCTION12` / `13` / `14` / `23` / `24` / `34` | Simultaneous function key combinations |
| `DOT_KEY_CODE_PANNING_LEFT` | Panning Left key |
| `DOT_KEY_CODE_PANNING_RIGHT` | Panning Right key |
| `DOT_KEY_CODE_PANNING_ALL` | Panning Left + Right simultaneously |
| `DOT_KEY_CODE_LPF1` | Panning Left + Function 1 |
| `DOT_KEY_CODE_RPF4` | Panning Right + Function 4 |
| `DOT_KEY_CODE_ELSE` | Key combination not defined in `DOT_KEY_CODE` |

### `DOT_PAD_KEY` (v3.0.1+)

Key codes delivered via the new individual key-down/key-up callbacks (`DOT_PAD_REGISTER_KEY_DOWN_CALLBACK` / `DOT_PAD_REGISTER_KEY_UP_CALLBACK`). Unlike `DOT_KEY_CODE`, each key is reported separately the instant it is pressed and again the instant it is released — simultaneous combinations are not reported here and should still be read from the legacy `DOT_KEY_CODE` callback if needed.

| Value | Description |
|---|---|
| `DOT_PAD_KEY_FUNCTION1` – `DOT_PAD_KEY_FUNCTION4` | Function key 1–4 |
| `DOT_PAD_KEY_PANNING_LEFT` | Panning Left key |
| `DOT_PAD_KEY_PANNING_RIGHT` | Panning Right key |

### `DOT_PAD_LANGUAGE` (v3.0.1+)

Named constants for the `language` argument used by `DOT_PAD_BRAILLE_DISPLAY`, `DOT_PAD_TRANSLATE_TEXT`, and `DOT_PAD_SET_LANGUAGE`. Replaces the previously undocumented raw integer codes — see the language table under [4.3 Settings](#43-settings) for the full list.

---

## API Reference

### 4.1 Device Connection and Disconnection

| Function | Description |
|---|---|
| `DOT_PAD_BLE_SCAN(cb)` | Start BLE scan; calls `cb(deviceName)` for each discovered device |
| `DOT_PAD_BLE_SCAN_STOP()` | Stop BLE scan |
| `DOT_PAD_USB_SCAN(cb)` | Start USB scan; calls `cb(portName)` for each discovered port |
| `DOT_PAD_CONNECT_BLE(deviceName)` | Connect via BLE; returns device handle (`null` on failure). Connection complete on `DOT_DATA_CODE_CONNECTED` callback. |
| `DOT_PAD_CONNECT_SERIAL(portName)` | Connect via USB serial; same semantics as BLE connect |
| `DOT_PAD_DISCONNECT(deviceHandle)` | `nullptr` disconnects all devices; specific handle disconnects that device only |
| `DOT_PAD_GET_CONNECTED_DEVICE_COUNT()` | Returns the number of currently connected devices |
| `DOT_PAD_GET_CONNECTED_DEVICE_HANDLE(index, &handle)` | Retrieves the handle at `index` (0-based); returns `true` on success |

### 4.2 Device Output

| Function | Description |
|---|---|
| `DOT_PAD_DISPLAY_FILE(filePath, deviceHandle)` | Display graphic data from a file path |
| `DOT_PAD_DISPLAY_DATA(data, len, deviceHandle)` | Display graphic data from a byte array |
| `DOT_PAD_RESET_DISPLAY(deviceHandle)` | Reset the graphic display (all pins down) |
| `DOT_PAD_BRAILLE_DISPLAY(str, language, grade, engGradeIfKorean, deviceHandle, cb)` | Convert text to braille and display; result string returned via callback. Returns `false` if translation fails (e.g. Japanese cloud request error) — nothing is sent to the display in that case. |
| `DOT_PAD_BRAILLE_DISPLAY_DATA(data, size, deviceHandle)` | Send raw braille cell data directly |
| `DOT_PAD_BRAILLE_ASCII_DISPLAY(brailleASCII, deviceHandle)` | Display a Braille ASCII string |
| `DOT_PAD_RESET_BRAILLE_DISPLAY(deviceHandle)` | Reset the braille display (all pins down) |

### 4.2b Text-to-Braille Translation (no device required) (v3.0.1+)

| Function | Description |
|---|---|
| `DOT_PAD_TRANSLATE_TEXT(str, cellCount, cb)` | Converts text to braille cell data without a connected device or display. The result is zero-padded to a multiple of `cellCount` and delivered via `cb(translatedData, dataSize)`. Uses the language/grade previously set with `DOT_PAD_SET_LANGUAGE` / `DOT_PAD_SET_ENGLISH_GRADE_IF_KOREAN`. Returns `false` if translation fails. |

### 4.3 Settings

| Function | Description |
|---|---|
| `DOT_PAD_SET_LANGUAGE(language, grade)` | Set braille language and grade |
| `DOT_PAD_SET_ENGLISH_GRADE_IF_KOREAN(grade)` | English braille grade used when the active language is Korean |

**Supported languages** (also available as the `DOT_PAD_LANGUAGE` enum):

| Code | Language | Code | Language |
|---|---|---|---|
| 0 | None | 13 | Vietnamese |
| 1 | Arabic | 14 | Bulgarian |
| 2 | Chinese (Traditional) | 15 | Portuguese |
| 3 | Chinese (Simplified) | 16 | Czech |
| 4 | Dutch | 17 | Polish |
| 5 | English | 18 | Norwegian |
| 6 | French | 19 | Kazakh |
| 7 | German | 20 | Danish |
| 8 | Italian | 21 | Greek |
| 9 | Japanese ⁽¹⁾ | 22 | Swedish |
| 10 | Korean | 23 | Finnish |
| 11 | Russian | 24 | Thai |
| 12 | Spanish | 25 | Uzbek |

⁽¹⁾ Japanese translation requires network access — see [Network access for Japanese translation](#4-network-access-for-japanese-translation).

### 4.4 Device Information

| Function | Description |
|---|---|
| `DOT_PAD_GET_DEVICE_NAME(deviceHandle)` | Request device name (result via message callback) |
| `DOT_PAD_GET_FW_VERSION(deviceHandle)` | Request firmware version (result via message callback) |
| `DOT_PAD_GET_HW_VERSION(deviceHandle)` | Request hardware version (result via message callback) |
| `DOT_PAD_GET_DISPLAY_INFO(deviceHandle, &width, &height, &braille)` | Query display dimensions and braille support flag |

### 4.5 Listeners

| Function | Callback Signature | Description |
|---|---|---|
| `DOT_PAD_REGISTER_KEY_CALLBACK(cb)` | `(deviceHandle, DOT_KEY_CODE, message)` | Hardware key input events (reported on release, includes combinations) |
| `DOT_PAD_REGISTER_MESSAGE_CALLBACK(cb)` | `(deviceHandle, DOT_DATA_CODE, message)` | Connection and status events |
| `DOT_PAD_REGISTER_DISPLAY_CALLBACK(cb)` | `(deviceHandle)` | Display output completion |
| `DOT_PAD_REGISTER_KEY_DOWN_CALLBACK(cb)` (v3.0.1+) | `(deviceHandle, DOT_PAD_KEY, dotKeyBinary)` | Fires the instant a single key is pressed. `dotKeyBinary` is a bitmask binary string of that key group's current state. |
| `DOT_PAD_REGISTER_KEY_UP_CALLBACK(cb)` (v3.0.1+) | `(deviceHandle, DOT_PAD_KEY, dotKeyBinary)` | Fires the instant a single key is released. |

### 4.6 Vibrator (v3.0.1+)

| Function | Description |
|---|---|
| `DOT_PAD_REQUEST_VIBRATOR(deviceHandle, onMs, offMs, repeatCount)` | Trigger the device vibrator. `deviceHandle = nullptr` requests all connected devices. `onMs`/`offMs`: vibration-on / pause duration in milliseconds. `repeatCount`: number of pulses (1–5). |
