# DotPad SDK for Web — v3.0.2

JavaScript/TypeScript SDK for controlling DotPad braille display devices from a web browser via Web Bluetooth and Web Serial APIs. Includes a React demo application.

> **Browser support:** Chrome (and Chromium-based browsers) only. Web Bluetooth and Web Serial are not supported in Firefox or Safari.

---

## SDK Files

| File | Description |
|---|---|
| `DotPadSDK-3.0.2.js` | SDK library (ES module) |
| `DotPadSDK-3.0.2.d.ts` | TypeScript type definitions |
| `lib/liblouis.js`, `lib/liblouis.wasm`, `lib/liblouis.data` | liblouis (wasm) braille translation engine — required only if you use braille translation (see [Braille Translation](#braille-translation) below) |

---

## Installation

Copy `DotPadSDK-3.0.2.js` and `DotPadSDK-3.0.2.d.ts` into your project and import directly:

```ts
import { DotPadScanner, DotPadSDK, DotDevice, DataCodes, KeyCodes, DotPadKey, DisplayMode } from "./DotPadSDK-3.0.2";
```

No npm package is required.

### Braille translation assets (liblouis)

If you use `translateText`, `backTranslateText`, `buildMultiLineData`, or `displayTextData(..., needsTranslation: true)`, the SDK loads a liblouis WebAssembly engine at runtime. Copy the three `lib/` files somewhere your app serves as **static, unprocessed files** (bundlers like webpack try to statically resolve/bundle the default `./lib/` path, which fails since it's a directory, not a single asset — so for a bundled app, place these files in your public/static assets folder instead, e.g. `public/liblouis/` for Create React App), then point the SDK at them once, before any translation call:

```ts
import { LiblouisManager } from "./DotPadSDK-3.0.2";

LiblouisManager.setAssetBaseUrl(`${window.location.origin}/liblouis/`);
```

If you don't call `setAssetBaseUrl`, the SDK looks for `lib/` next to the SDK file itself — which only works for simple `<script type="module">` setups where the SDK file and `lib/` folder are served from the same static directory, not for bundled apps.

---

## Basic Usage Flow

```
1. Instantiate              new DotPadScanner() / new DotPadSDK()
2. Register callbacks       sdk.setCallBack(messageCallback, keyCallback, onKeyDown?, onKeyUp?)
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

### `DotPadKey` (v3.0.1+)

Single-key enum used with the `onKeyDown` / `onKeyUp` callbacks — unlike `KeyCodes`, it identifies exactly one physical key per event, with no combo values.

| Value | Description |
|---|---|
| `KeyFunction1` – `KeyFunction4` | Function key |
| `PanningLeft` | Panning Left key |
| `PanningRight` | Panning Right key |

> **Note:** the hardware only reports panning key *press/release events* — it does not scroll its own display buffer. If you build a paged/panning UI (see the Demo App's Translated Text panel), your app must slice the translated hex into per-page windows itself and re-send each window with `startCellIndex = 0` on every page change (see [Braille Translation](#braille-translation) below).

### `GradeOption`, `PinOption`, `TranslateEngine`, `NumberOfBraillePerLine` (v3.0.2+)

Used with the braille translation API — see [Braille Translation](#braille-translation).

| Enum | Values | Description |
|---|---|---|
| `GradeOption` | `Grade1`, `Grade2`, `Grade3` | Contraction grade (uncontracted / contracted / further-contracted, depending on language) |
| `PinOption` | `Dot6`, `Dot8` | 6-dot vs 8-dot (computer braille) cell — determined automatically per language, not user-selectable |
| `TranslateEngine` | `Dot`, `Louis` | Which translation engine a language uses internally |
| `NumberOfBraillePerLine` | `BraillePerLine8`, `12`, `20`, `32` | Word-wrap width (in cells) for `translateText`/`displayTextData` |

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
| `displayTextData(inputData, device?, displayMode?, needsTranslation?, callback?)` | Send braille text. If `needsTranslation` is omitted/`false` (default), `inputData` is treated as point-cell hex, same as before. If `true` (**v3.0.2+**), `inputData` is plain text — it's translated using the language set by `setBrailleLanguage` and word-wrapped to the device's actual cell width before being sent. `callback(device, hex)` (optional) receives the translated hex per device. |
| `displayLineData(lineId, startCellIndex, hexData, displayMode, device?)` | Send data for a single line. `device = null` broadcasts to all. `startCellIndex` is a **write offset within that line's fixed-size buffer**, not a scroll/page position — see the panning note above. |
| `displayAllUp(device?)` | Raise all pins on the graphic and text areas |
| `displayAllDown(device?)` | Lower all pins on the graphic and text areas |

```ts
// Graphic area — all devices
sdk.displayGraphicData("FF".repeat(300));

// Graphic area — specific device
sdk.displayGraphicData("FF".repeat(300), targetDevice, DisplayMode.GraphicMode);

// Text area — hex, all devices (pre-translated, unchanged behavior)
sdk.displayTextData("FF".repeat(20));

// Text area — plain text, translated automatically (v3.0.2+)
await sdk.displayTextData("Hello, DotPad!", targetDevice, DisplayMode.TextMode, true, (device, hex) => {
  console.log("translated hex sent:", hex);
});

// Specific line (e.g. row 3, starting at cell 5)
sdk.displayLineData(3, 5, "C0FCCF0C", DisplayMode.GraphicMode);
```

### DotPadSDK — Vibration (v3.0.1+)

| Function | Description |
|---|---|
| `requestVibrator(device?, onMs?, offMs?, repeatCount?)` | Triggers the device's vibration motor. `device = null` (default) broadcasts to all connected devices. Defaults: `onMs` `70`, `offMs` `50`, `repeatCount` `2` (clamped to `1`–`5`). |

```ts
// Default pattern, all connected devices
sdk.requestVibrator();

// Custom pattern, specific device
sdk.requestVibrator(targetDevice, 100, 70, 5);
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
  // Key callback — hardware key events (combos included)
  (device: DotDevice, keyCode: KeyCodes, msg: string) => {
    console.log("Key:", keyCode, msg);
  },
  // Key down callback (v3.0.1+, optional) — single-key press
  (device: DotDevice, key: DotPadKey, dotKeyBinary: string) => {
    console.log("Key down:", key, dotKeyBinary);
  },
  // Key up callback (v3.0.1+, optional) — single-key release
  (device: DotDevice, key: DotPadKey, dotKeyBinary: string) => {
    console.log("Key up:", key, dotKeyBinary);
  }
);
```

| Parameter | Description |
|---|---|
| `onKeyDownCallBack?` | Called when a hardware key is pressed. `key` is a `DotPadKey`; `dotKeyBinary` is the raw key state as a binary string. |
| `onKeyUpCallBack?` | Called when a hardware key is released. Same parameters as `onKeyDownCallBack`. |

> Both are optional — omit them (or pass `null`) if you only need `keyCallBack`.

### DotDevice Properties

| Property | Type | Description |
|---|---|---|
| `isConnect` | `boolean` | Whether the device is currently connected |
| `cellType` | `string` | Device model / cell type |
| `numberCellRows` | `number` | Number of graphic cell rows |
| `numberCellColumns` | `number` | Number of graphic cell columns |
| `numberBrailleCellColumns` | `number` | Number of braille text cell columns (the physical width of the text line — the window size to slice into when paging translated text) |

---

## Braille Translation (v3.0.2+)

Powered by [liblouis](https://liblouis.io) (via WebAssembly).

### API

| Function | Description |
|---|---|
| `setBrailleLanguage(language: BrailleLanguageEntry, gradeOption?: number \| null)` | Set the active language (and optionally grade) used by `translateText`, `backTranslateText`, and `displayTextData(..., needsTranslation: true)`. |
| `setBrailleGrade(gradeOption: number)` | Change grade without changing language. |
| `setNumberOfBraillePerLine(count: number)` | Set the word-wrap width (in cells) used by `translateText`. `displayTextData` sets this automatically from the target device's `numberBrailleCellColumns` before translating. |
| `getNumberOfBraillePerLine(): number` | Read the current word-wrap width. |
| `translateText(inputText: string, applyWordWrap?: boolean): Promise<string>` | Translate plain text to point-cell hex using the current language/grade. `applyWordWrap` defaults to `true`. |
| `backTranslateText(inputHex: string): Promise<string>` | Translate point-cell hex back to plain text, using the current language/grade. |
| `buildMultiLineData(inputText: string, device?: DotDevice \| null, lineSpacing?: number, letterSpacing?: number): Promise<{ pages: string[]; pageCount: number; totalLines: number }>` | Lay out multi-line text into the graphic area with letter/line spacing. `"\n"` in `inputText` is a forced line break; everything else auto-wraps to the graphic width. Returns ready-to-display hex pages — pass each directly to `displayGraphicData()`. `lineSpacing`: `1`\|`2`\|`3` (default `2`). `letterSpacing`: `0`\|`1` (default `1`). |

```ts
import { BrailleLanguage, GradeOption, NumberOfBraillePerLine, LiblouisManager } from "./DotPadSDK-3.0.2";

LiblouisManager.setAssetBaseUrl(`${window.location.origin}/liblouis/`);

sdk.setBrailleLanguage(BrailleLanguage.English, GradeOption.Grade2);
sdk.setNumberOfBraillePerLine(NumberOfBraillePerLine.BraillePerLine20);

// Plain text → point-cell hex (no device needed)
const hex = await sdk.translateText("Hello, DotPad!");

// Point-cell hex → plain text
const text = await sdk.backTranslateText(hex);

// Multi-line graphic layout, paged
const { pages, pageCount } = await sdk.buildMultiLineData(
  "Line one.\nA longer paragraph that wraps automatically across the graphic width.",
  targetDevice
);
sdk.displayGraphicData(pages[0], targetDevice, DisplayMode.GraphicMode);
// ...on Next: sdk.displayGraphicData(pages[1], targetDevice, DisplayMode.GraphicMode);
```

#### Paging translated text on the 20/32-cell text line

`translateText`/`displayTextData` word-wrap into a single long hex string (each line padded to `numberBrailleCellColumns` cells), but the physical text line can only show one window at a time. Unlike the graphic area, the device does **not** track a scroll position for you — to page through it, slice the hex yourself and always write with `startCellIndex = 0`:

```ts
const fullHex = await sdk.translateText(longText); // wrapped to device.numberBrailleCellColumns per line
const cellCount = device.numberBrailleCellColumns;
let offset = 0; // in cells

function showPage(newOffset: number) {
  offset = Math.max(0, Math.min(newOffset, fullHex.length / 2 - cellCount));
  const window = fullHex.substring(offset * 2, (offset + cellCount) * 2);
  device.displayTextData(window, 0, DisplayMode.TextMode); // always 0 — see note above
}

showPage(0);
// Next ▶: showPage(offset + cellCount)
// ◀ Prev: showPage(offset - cellCount)
```

Hook this up to `PanningLeft`/`PanningRight` in your key callback to make the hardware panning buttons page through the text.

### Supported Languages

`BrailleLanguage` is an object of frozen entries (e.g. `BrailleLanguage.English`); pass one directly to `setBrailleLanguage()`. Grade indices map positionally to `GradeOption.Grade1`/`Grade2`/`Grade3` — languages with no listed grade translate with a single default.

| Display Name | Grades |
|---|---|
| English | Grade1, Grade2 |
| 한국어 (Korean) | Grade1, Grade2 |
| 日本語 (Japanese) | — |
| 简体中文 (Chinese, Simplified) | Xianxing (Shengdiao), Xianxing (No Shengdiao), Shuang Pin |
| català (Catalan) | — |
| polski (Polish) | — |
| norsk (Norwegian) | — |
| 中華民國 (Chinese, Taiwan) | — |
| français (French) | Grade1, Grade2 |
| deutsch (German) | Grade1, Grade2 |
| español (Spanish) | — |
| Русский (Russian) | — |
| Italiano (Italian) | — |
| čeština (Czech) | — |
| Tiếng Việt (Vietnamese) | Grade1, Grade2 |
| العربية (Arabic) | Grade1, Grade2 |
| Português (Portuguese) | Grade1, Grade2 |
| қазақ (Kazakh) | — |
| dansk (Danish) | Grade1, Grade2 |
| Ελληνικά (Greek) | — |
| svenska (Swedish) | Grade1, Grade2 |
| Suomalainen (Finnish) | — |
| แบบไทย (Thai) | — |
| ខ្មែរ (Khmer) | — |
| монгол (Mongolian) | Grade1, Grade2 |
| Oʻzbekcha (Uzbek) | — |
| Nederlands (Dutch) | Grade1, Grade2 |
| Română (Romanian) | — |
| Magyar (Hungarian) | Grade1, Grade2 |
| Cymraeg (Welsh) | Grade1, Grade2 |
| Србија (Serbian) | — |
| Hrvatski (Croatian) | — |
| मराठी (Marathi) | — |
| English (EBAE) | Grade1, Grade2 |

### Known limitation: `backTranslateText` accuracy

`backTranslateText` round-trips reliably for plain, unaccented Latin-alphabet text (confirmed: English, Danish, Welsh). Languages with diacritics/accents (French, German, Portuguese, etc.), non-Latin scripts (Korean, Japanese, Arabic, Thai, etc.), or heavily-contracted grades may not reconstruct the original text exactly — this reflects the completeness of each liblouis table's own backward-translation rules, not a bug specific to this SDK. `translateText` (forward) is not affected and works correctly across all listed languages.

---

## Project Structure

```
3.0.2/
├── DotPadSDK-3.0.2.js         ← SDK library
├── DotPadSDK-3.0.2.d.ts       ← TypeScript definitions
├── lib/                        ← liblouis (wasm) braille engine — ship alongside the SDK file
│   ├── liblouis.js
│   ├── liblouis.wasm
│   └── liblouis.data
├── download/
│   └── web-sdk-3.0.2.zip
└── DemoApp/                   ← React demo application
    ├── package.json
    ├── public/
    │   └── liblouis/           ← liblouis assets served statically (see Braille Translation setup)
    │       ├── liblouis.js
    │       ├── liblouis.wasm
    │       └── liblouis.data
    └── src/
        ├── App.tsx             ← Main UI (scan, connect, display, translation controls)
        ├── index.tsx
        └── sdk/
            ├── DotPadSDK-3.0.2.js
            └── DotPadSDK-3.0.2.d.ts
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
| **Translated Text** (v3.0.2+) | Per device: send plain text (translated + word-wrapped automatically), page through the result with **◀ Prev** / **Next ▶** (also wired to the physical Panning keys), test vibration |
| **Multi-line Graphic** (v3.0.2+) | Per device: build a multi-line/multi-page graphic layout from plain text (`buildMultiLineData`) and page through it with **◀ Prev** / **Next ▶** |
| **Braille Translation** (v3.0.2+) | Language/grade/word-wrap-width selectors, standalone `translateText()` / `backTranslateText()` testing (no device required), line/letter spacing controls for the multi-line layout |
| **Event Log** (v3.0.2+) | Live feed of message/key/`onKeyDown`/`onKeyUp` callback events |

Per-device controls become available in the device row after a successful connection.

> **v3.0.2 additions:** braille translation (`translateText`/`backTranslateText`/`buildMultiLineData`/`setBrailleLanguage`), Marathi added to the supported language list, word-wrap toggle on `translateText`, and text-line paging (◀ Prev / Next ▶, plus physical Panning key support) in the Demo App.
>
> **v3.0.1 additions:** pressing the device's **Function 1** key triggers `requestVibrator` as a demo of the vibration API; `onKeyDown` / `onKeyUp` events are logged to the Event Log.
