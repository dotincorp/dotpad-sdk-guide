# Third-Party Notices

The DotPad SDK includes the third-party open source components listed below. Each component is licensed under its own terms, which take precedence over the [DotPad SDK License Agreement](LICENSE-SDK.md) for that component. Full license texts are in the [LICENSES](LICENSES) directory.

When you distribute your application together with the DotPad SDK, include the notices for the components in the SDK release you ship.

Release archives under `*/download/` do not include these notices, except `lib/LICENSES/liblouis-LGPL-2.1.txt` in the Web SDK 3.0.2 and 3.0.3 archives. If you redistribute the SDK, copy [LICENSE-SDK.md](LICENSE-SDK.md), this file and the license texts for the components you ship from [LICENSES](LICENSES).

## Summary

| Component | License | Platforms / SDK versions |
|---|---|---|
| [liblouis](#liblouis) | LGPL-2.1-or-later | Android 3.0.0+, iOS 2.1.0+, Web 3.0.2+, Windows 1.1.0+ |
| [liblouis translation tables](#liblouis-translation-tables) | LGPL-2.1-or-later, some LGPL-3.0-or-later | Same as liblouis |
| [MeCab](#mecab) | BSD-3-Clause (chosen from GPL / LGPL / BSD) | Windows (all versions using `MeCab.dll`) |
| [IPAdic](#ipadic) | IPAdic License | Windows (all versions using `ipadic.zip`) |
| [JsonCpp](#jsoncpp) | MIT (or Public Domain) | Windows 1.0.0 – 1.4.0, 3.0.0 |
| [BluetoothKit](#bluetoothkit) | MIT | iOS (all versions) |
| [usb-serial-for-android](#usb-serial-for-android) | MIT | Android 2.0.0+ |

---

## liblouis

- Project: https://liblouis.io
- Source: https://github.com/liblouis/liblouis
- License: GNU Lesser General Public License, version 2.1 or later — [LICENSES/LGPL-2.1.txt](LICENSES/LGPL-2.1.txt)

```
Based on the Linux screenreader BRLTTY, copyright (C) 1999-2006 by The BRLTTY Team
Copyright (C) 2004, 2005, 2006 ViewPlus Technologies, Inc. www.viewplus.com
Copyright (C) 2004, 2005, 2006 JJB Software, Inc. www.jjb-software.com
Copyright (C) 2016 Mike Gray, American Printing House for the Blind
Copyright (C) 2016 Davy Kager, Dedicon
and the liblouis contributors
```

| Platform | SDK version | liblouis version | Form |
|---|---|---|---|
| Web | 3.0.2, 3.0.3 | 3.38.0 | WebAssembly module (`lib/liblouis.js`, `lib/liblouis.wasm`, `lib/liblouis.data`) |
| Windows | 1.1.0 | 3.27.0 | Shared library (`liblouis.dll`) |
| Windows | 1.2.0 – 3.0.3 | 3.31.0 | Shared library (`liblouis.dll`) |
| Android | 3.0.0 – 3.0.2 | 3.32.0 | Shared library (`jni/<abi>/liblouis.so`) |
| Android | 3.0.3 | 3.27.0 | Shared library (`jni/<abi>/liblouis.so`) |
| iOS | 2.1.0 – 2.3.2 | 3.26.0 | Linked into `DotPadFrameworks` |

The source code of each liblouis version is available from the upstream repository at the matching tag, for example https://github.com/liblouis/liblouis/tree/v3.38.0.

### Using a modified liblouis

Under the LGPL, you may replace the bundled liblouis with a modified version:

- **Android**: replace `jni/<abi>/liblouis.so` in the `.aar`.
- **Windows**: replace `liblouis.dll` next to your executable.
- **iOS**: liblouis is statically linked into `DotPadFrameworks` in iOS SDK 2.1.0 – 2.3.2, so it cannot be replaced separately.
- **Web**: rebuild the WebAssembly module with the wrapper source and build script in `Web/3.0.2/lib/liblouis-web/` (also included in the Web SDK 3.0.3 release archive).

## liblouis translation tables

The braille translation tables shipped with the SDK (`tables/`, `tables.zip`, `assets/tables/` and `liblouis.data`) come from liblouis.

- Most tables: LGPL-2.1-or-later — [LICENSES/LGPL-2.1.txt](LICENSES/LGPL-2.1.txt)
- Some tables: LGPL-3.0-or-later — [LICENSES/LGPL-3.0.txt](LICENSES/LGPL-3.0.txt), which incorporates [LICENSES/GPL-3.0.txt](LICENSES/GPL-3.0.txt)
- Tables supplied by ViewPlus Technologies, Inc.; hyphenation tables are those used in TeX and OpenOffice.
- Each table file states its own copyright holders and license in its header.

The following LGPL-3.0-or-later tables, and aliases that include them, are in the SDK releases:

| SDK releases | Tables |
|---|---|
| Android 3.0.0 – 3.0.3, iOS 2.3.1 – 2.3.2, Windows 3.0.1 – 3.0.3, Web 3.0.2 – 3.0.3 | `Es-Es-G0.utb`, `et-g0.utb`, `grc-international-es.utb`, `is-chardefs6.cti`, `is-chardefs8.cti`, `is.tbl`, `pt-pt-g2.ctb`, `pt.tbl`, `sr-Cyrl.ctb`, `sr-common.cti`, `sr-cyrletters.cti`, `sr-g1.ctb`, `sr-latletters.cti` |
| iOS 2.1.0 – 2.3.0, Windows 1.1.0 – 3.0.0 | `Es-Es-G0.utb`, `et-g0.utb`, `is-chardefs6.cti`, `is-chardefs8.cti`, `is.tbl`, `pt-pt-g2.ctb`, `pt.tbl`, `sr-g1.ctb` |

In the Web SDK, these tables are packed into `liblouis.data`. The build script in `Web/3.0.2/lib/liblouis-web/` is written to leave them out, but the published Web 3.0.2 and 3.0.3 builds include them.

## MeCab

- Project: https://taku910.github.io/mecab/
- Used in: Windows SDK (`MeCab.dll`, `mecabrc`), for Japanese braille translation
- License: MeCab is offered under GPL, LGPL or BSD. The DotPad SDK uses MeCab under the **BSD-3-Clause** license — [LICENSES/MeCab-BSD.txt](LICENSES/MeCab-BSD.txt)

```
Copyright (c) 2001-2008, Taku Kudo
Copyright (c) 2004-2008, Nippon Telegraph and Telephone Corporation
All rights reserved.
```

## IPAdic

- Used in: Windows SDK (`ipadic.zip`), Japanese dictionary for MeCab. `ipadic.zip` does not contain the original COPYING file; the license text is in [LICENSES/IPAdic.txt](LICENSES/IPAdic.txt).
- License: IPAdic License — [LICENSES/IPAdic.txt](LICENSES/IPAdic.txt)

```
Copyright 2000, 2001, 2002, 2003 Nara Institute of Science
and Technology.  All Rights Reserved.
```

A large portion of the dictionary entries originate from ICOT Free Software. The ICOT "NO WARRANTY" provisions in [LICENSES/IPAdic.txt](LICENSES/IPAdic.txt) apply.

## JsonCpp

- Project: https://github.com/open-source-parsers/jsoncpp
- Used in: Windows SDK 1.0.0 – 1.4.0 and 3.0.0 (`jsoncpp.dll`)
- License: MIT or Public Domain — [LICENSES/JsonCpp-MIT.txt](LICENSES/JsonCpp-MIT.txt)

```
Copyright (c) 2007-2010 Baptiste Lepilleur and The JsonCpp Authors
```

## BluetoothKit

- Project: https://github.com/rhummelmose/BluetoothKit
- Used in: iOS SDK (linked into `DotPadFrameworks`), for Bluetooth Low Energy communication
- License: MIT — [LICENSES/BluetoothKit-MIT.txt](LICENSES/BluetoothKit-MIT.txt)

```
Copyright (c) 2015 Rasmus Taulborg Hummelmose - https://github.com/rasmusth
```

## usb-serial-for-android

- Project: https://github.com/mik3y/usb-serial-for-android
- Used in: Android SDK 2.0.0 – 3.0.3 (compiled into `classes.jar` in the `.aar`, repackaged as `com.dotincorp.libs.usbserial`), for USB serial communication
- License: MIT — [LICENSES/usb-serial-for-android-MIT.txt](LICENSES/usb-serial-for-android-MIT.txt)

```
Copyright (c) 2011-2013 Google Inc.
Copyright (c) 2013 Mike Wakerly
```

## Microsoft Visual C++ Runtime

Windows SDK `20cell-1.0.12` includes `msvcp140.dll`, a Microsoft Visual C++ runtime file redistributed under the Microsoft Visual Studio redistribution terms. It is not open source software. You can install the official runtime from https://learn.microsoft.com/cpp/windows/latest-supported-vc-redist instead.
