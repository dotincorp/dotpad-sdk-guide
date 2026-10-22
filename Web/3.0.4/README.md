# DotPad SDK for Web — v3.0.4

JavaScript/TypeScript SDK for controlling DotPad braille display devices from a web browser via Web Bluetooth and Web Serial APIs. Includes a React demo application.

> **Browser support:** Chrome (and Chromium-based browsers) only. Web Bluetooth and Web Serial are not supported in Firefox or Safari.

> **v3.0.4 changes:**
> - **New braille translation engine.** Braille translation now runs on Dot's own translation engine (`ttb-engine`, WebAssembly), which bundles both Dot's in-house engine and liblouis. Korean, English, Japanese, Portuguese, Kazakh, Serbian and Marathi are now translated by Dot's engine instead of liblouis.
> - **New: math translation.** `DotBrailleModule.translateMath(mathml, rule)` translates MathML to braille using Nemeth, UEB, Korean, Korean-science, CMU, Marburg or Czech math rules.
> - **Breaking:** `LiblouisManager` has been removed and replaced by `DotBrailleModule`. Replace `LiblouisManager.setAssetBaseUrl(url)` with `DotBrailleModule.setEngineAssetBaseUrl(url)` and deploy the new `lib/` files (see [Braille translation assets](#braille-translation-assets-ttb-engine)). Calling it is now **required** before any translation call.
> - Back-translation (`backTranslateText`) support differs per language with the new engine — see the Back-translation column in [Supported Languages](#supported-languages) and [Known limitations](#known-limitations).
> - Fixed an issue where sending display data repeatedly in quick succession could transmit the next packet while the device was still outputting the previous one, causing some output to be lost.
> - Added the `connectDevice` property to `DotDevice` type definitions.

---

## SDK Files

Download and unzip [`download/web-sdk-3.0.4.zip`](download/web-sdk-3.0.4.zip):

| File | Description |
|---|---|
| `DotPadSDK-3.0.4.js` | SDK library (ES module) |
| `DotPadSDK-3.0.4.d.ts` | TypeScript type definitions |
| `lib/ttb-engine.mjs`, `lib/ttb-engine.wasm`, `lib/liblouis.wasm`, `lib/liblouis-tables.data` | Braille translation engine (WebAssembly) — required only if you use braille translation (see [Braille Translation](#braille-translation-v302) below) |
| `lib/LIBLOUIS-COPYING.LESSER`, `lib/MORPHOBR-NOTICE.txt`, `lib/build-manifest.json` | License texts and build information — see [License Notice](#license-notice) below |

---

## Installation

Unzip `download/web-sdk-3.0.4.zip`, then copy `DotPadSDK-3.0.4.js` and `DotPadSDK-3.0.4.d.ts` into your project and import directly:

```ts
import { DotPadScanner, DotPadSDK, DotDevice, DataCodes, KeyCodes, DotPadKey, DisplayMode } from "./DotPadSDK-3.0.4";
```

No npm package is required.

### Braille translation assets (ttb-engine)

If you use `translateText`, `backTranslateText`, `buildMultiLineData`, `displayTextData(..., needsTranslation: true)` or `DotBrailleModule.translateMath`, the SDK loads the braille translation engine at runtime. Copy the files in `lib/` into one folder that your app serves as **static, unprocessed files** (for a bundled app, place them in your public/static assets folder, e.g. `public/braille/` for Create React App), then point the SDK at that folder once, before any translation call:

```ts
import { DotBrailleModule } from "./DotPadSDK-3.0.4";

// The URL must end with "/"
DotBrailleModule.setEngineAssetBaseUrl(`${window.location.origin}/braille/`);
```

- `ttb-engine.mjs`, `ttb-engine.wasm`, `liblouis.wasm` and `liblouis-tables.data` must always be deployed **together in the same folder**.
- `setEngineAssetBaseUrl` is **required** — unlike v3.0.3, there is no fallback path. If it hasn't been called, translation calls throw an error.
- Your server must serve `.wasm` files as `application/wasm` and `.mjs` files as JavaScript (`text/javascript`). Browsers refuse to load a module served with any other type (e.g. `application/octet-stream`), and translation then fails. Most servers and dev servers handle this by default; older nginx/IIS configurations and some static hosts may need the mapping added manually.
- If the engine files are hosted on a different origin than your app (e.g. a CDN), that server must send CORS headers (`Access-Control-Allow-Origin`).
- Do not merge `liblouis.wasm` with other files or inline it into your bundle — it must stay a separate file (LGPL requirement, see [License Notice](#license-notice)).
- The engine is lazy-loaded (`import()`) on the first translation call, so it does not affect the size of your app bundle. That first call downloads about **14.6 MB** (`ttb-engine.wasm` 4.9 MB + `liblouis-tables.data` 9.5 MB + others) and may take a few seconds on slower connections; later calls reuse the loaded engine. To avoid the delay at first use, you can warm the engine up early, e.g. `sdk.translateText("").catch(() => {})` right after calling `setEngineAssetBaseUrl`. Make sure your server lets browsers cache these files.

> **Migrating from v3.0.2 / v3.0.3:** remove the old `liblouis/` assets (`liblouis.js`, `liblouis.wasm`, `liblouis.data`, `LICENSES/`, `liblouis-web/`), deploy the new `lib/` files, and replace `LiblouisManager.setAssetBaseUrl(...)` with `DotBrailleModule.setEngineAssetBaseUrl(...)`. All other translation APIs (`translateText`, `backTranslateText`, `buildMultiLineData`, `setBrailleLanguage`, etc.) are unchanged.

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
| `connectDevice` | `BluetoothDevice \| SerialPort \| null` | The underlying browser device object |
| `cellType` | `string` | Device model / cell type |
| `numberCellRows` | `number` | Number of graphic cell rows |
| `numberCellColumns` | `number` | Number of graphic cell columns |
| `numberBrailleCellColumns` | `number` | Number of braille text cell columns (the physical width of the text line — the window size to slice into when paging translated text) |

---

## Braille Translation (v3.0.2+)

Powered by Dot's braille translation engine (`ttb-engine`, WebAssembly), which includes Dot's in-house engine and [liblouis](https://liblouis.io) (**v3.0.4+**; v3.0.2–v3.0.3 used liblouis only). The SDK picks the engine for each language internally — you don't need to choose it.

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
import { BrailleLanguage, GradeOption, NumberOfBraillePerLine, DotBrailleModule } from "./DotPadSDK-3.0.4";

DotBrailleModule.setEngineAssetBaseUrl(`${window.location.origin}/braille/`);

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

### Math Translation (v3.0.4+)

| Function | Description |
|---|---|
| `DotBrailleModule.setEngineAssetBaseUrl(url: string)` | Set the folder URL the engine files are served from (must end with `/`). Call once before the first translation call. |
| `DotBrailleModule.translateMath(mathml: string, rule?: MathRule): Promise<string>` | Translate MathML to point-cell hex. `rule` defaults to `"korean"`. |

`MathRule`: `"nemeth"` · `"ueb"` · `"korean"` · `"korean-science"` · `"cmu"` · `"marburg"` · `"czech"`

```ts
import { DotBrailleModule, DisplayMode } from "./DotPadSDK-3.0.4";

try {
  const hex = await DotBrailleModule.translateMath(
    "<math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>",
    "nemeth"
  );
  sdk.displayTextData(hex, targetDevice, DisplayMode.TextMode);
} catch (e) {
  // e.code: engine error code (e.g. -2 = MathML could not be parsed), e.response: raw engine response
  console.error(e);
}
```

`translateMath` does not depend on `setBrailleLanguage` — the math rule alone determines the output.

### Errors

Translation calls (`translateText`, `backTranslateText`, `buildMultiLineData`, `displayTextData(..., needsTranslation: true)`, `translateMath`) throw an `Error` when the engine cannot be loaded (e.g. `setEngineAssetBaseUrl` was not called, or the files are not reachable) or when the engine reports a failure. Engine failures carry `error.code` (numeric engine error code, if any) and `error.response` (raw engine response).

```
Braille back-translation failed: this language cannot be back-translated (code -4) (language=Kazakh)
Braille math translation failed: MathML could not be parsed (code -2) (rule=korean)
Unsupported math rule "foo". Use one of: nemeth, ueb, korean, korean-science, cmu, marburg, czech.
```

### Supported Languages

`BrailleLanguage` is an object of frozen entries (e.g. `BrailleLanguage.English`); pass one directly to `setBrailleLanguage()`. Grade indices map positionally to `GradeOption.Grade1`/`Grade2`/`Grade3` — languages with no listed grade translate with a single default.

`translateText` works for every language below except Japanese. **Back-translation** shows how well `backTranslateText` restores the original text after `translateText` (✓ restored · △ partially restored · ✗ not supported).

| Display Name | Grades | Back-translation |
|---|---|---|
| English | Grade1, Grade2 | ✓ |
| 한국어 (Korean) | Grade1, Grade2 | Grade1 △ (some characters may differ) · Grade2 ✓ |
| 日本語 (Japanese) | — | ✗ — translation itself is not available in this release (`translateText` returns an empty string) |
| 简体中文 (Chinese, Simplified) | Xianxing (Shengdiao), Xianxing (No Shengdiao), Shuang Pin | ✗ — returns incorrect text (braille encodes pronunciation, so characters cannot be restored) |
| català (Catalan) | — | ✓ |
| polski (Polish) | — | ✓ |
| norsk (Norwegian) | — | ✓ |
| 中華民國 (Chinese, Taiwan) | — | ✗ — returns incorrect text |
| français (French) | Grade1, Grade2 | ✓ |
| deutsch (German) | Grade1, Grade2 | Grade1 △ (capitalization lost) · Grade2 ✗ (contractions not restored) |
| español (Spanish) | — | △ (some words and `¡ ¿` are not restored) |
| Русский (Russian) | — | △ (capitalization and some letters lost) |
| Italiano (Italian) | — | ✓ |
| čeština (Czech) | — | ✓ |
| Tiếng Việt (Vietnamese) | Grade1, Grade2 | Grade1 ✓ · Grade2 △ |
| العربية (Arabic) | Grade1, Grade2 | ✓ |
| Português (Portuguese) | Grade1, Grade2 | ✓ |
| қазақ (Kazakh) | — | ✗ — throws an error |
| dansk (Danish) | Grade1, Grade2 | ✓ |
| Ελληνικά (Greek) | — | ✓ |
| svenska (Swedish) | Grade1, Grade2 | ✓ |
| Suomalainen (Finnish) | — | ✓ |
| แบบไทย (Thai) | — | ✓ |
| ខ្មែរ (Khmer) | — | ✗ — returns incorrect text |
| монгол (Mongolian) | Grade1, Grade2 | Grade1 ✓ · Grade2 ✗ (contractions not restored) |
| Oʻzbekcha (Uzbek) | — | △ (Latin text comes back in Cyrillic) |
| Nederlands (Dutch) | Grade1, Grade2 | △ (leading capital letter lost) |
| Română (Romanian) | — | ✓ |
| Magyar (Hungarian) | Grade1, Grade2 | Grade1 ✓ · Grade2 △ (contractions/capitalization not fully restored) |
| Cymraeg (Welsh) | Grade1, Grade2 | ✓ (some punctuation may differ) |
| Србија (Serbian) | — | ✓ (restored in Cyrillic) |
| Hrvatski (Croatian) | — | ✓ |
| मराठी (Marathi) | — | ✓ |
| English (EBAE) | Grade1, Grade2 | ✓ |

> Results are based on sample sentences; long or unusual text may still differ in languages marked ✓.

### Known limitations

- **Japanese:** the current engine build cannot translate Japanese — `translateText` returns an empty string.
- **`backTranslateText` for unsupported languages:** Kazakh throws an error. Chinese (Simplified, Taiwan) and Khmer do **not** throw — they return incorrect text, so don't rely on back-translation for these languages.

### License Notice

The braille translation engine includes liblouis, which is distributed under the GNU Lesser General Public License, version 2.1 or later (LGPL-2.1-or-later). The full license text is at `lib/LIBLOUIS-COPYING.LESSER`. `liblouis.wasm` is built from unmodified upstream liblouis ([github.com/liblouis/liblouis](https://github.com/liblouis/liblouis); the exact version is recorded in `lib/build-manifest.json` under `liblouis.upstream`) and is shipped as a separate file so it can be replaced with another build.

The included liblouis tables are unmodified upstream files. Tables released under LGPLv3 are intentionally excluded from this distribution (listed in `lib/build-manifest.json` under `liblouis.excludedByLicense`).

The Portuguese dictionary data is distributed under the Apache License 2.0 — see `lib/MORPHOBR-NOTICE.txt`.

> **If you redistribute this SDK** (serving it from a website counts as distribution), keep `LIBLOUIS-COPYING.LESSER`, `MORPHOBR-NOTICE.txt` and `build-manifest.json` alongside the engine files, keep `liblouis.wasm` as a separate file, and mention liblouis and its source location in your service's open-source notices.

---

## Project Structure

```
3.0.4/
├── download/
│   └── web-sdk-3.0.4.zip      ← unzip for DotPadSDK-3.0.4.js/.d.ts + lib/ (see SDK Files above)
└── DemoApp/                   ← React demo application
    ├── package.json
    ├── public/
    │   └── braille/            ← braille translation engine served statically (see Braille Translation setup)
    │       ├── ttb-engine.mjs
    │       ├── ttb-engine.wasm
    │       ├── liblouis.wasm
    │       ├── liblouis-tables.data
    │       ├── LIBLOUIS-COPYING.LESSER
    │       ├── MORPHOBR-NOTICE.txt
    │       └── build-manifest.json
    └── src/
        ├── App.tsx             ← Main UI (scan, connect, display, translation controls)
        ├── index.tsx
        └── sdk/
            ├── DotPadSDK-3.0.4.js
            └── DotPadSDK-3.0.4.d.ts
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
| **Math Translation** (v3.0.4+) | Enter MathML, choose a math rule and run `DotBrailleModule.translateMath()` (no device required) |
| **Event Log** (v3.0.2+) | Live feed of message/key/`onKeyDown`/`onKeyUp` callback events |

Per-device controls become available in the device row after a successful connection.

> **v3.0.4 changes:** switched to the new braille translation engine (assets moved from `public/liblouis/` to `public/braille/`, set up via `DotBrailleModule.setEngineAssetBaseUrl`), added the MathML math-translation panel, and translation errors are now shown in the output fields instead of failing silently.
>
> **v3.0.3:** internal fixes only (see the notice at the top of this document) — no Demo App or public API changes.
>
> **v3.0.2 additions:** braille translation (`translateText`/`backTranslateText`/`buildMultiLineData`/`setBrailleLanguage`), Marathi added to the supported language list, word-wrap toggle on `translateText`, and text-line paging (◀ Prev / Next ▶, plus physical Panning key support) in the Demo App.
>
> **v3.0.1 additions:** pressing the device's **Function 1** key triggers `requestVibrator` as a demo of the vibration API; `onKeyDown` / `onKeyUp` events are logged to the Event Log.
