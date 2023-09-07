# DotPadSDK 1.2.0 for iOS

## Overview
* An iOS Swift library for Dot Incorporation's Dot Pad
* Available for use as a Framework in Xcode
* The open source BluetoothKit(https://github.com/rhummelmose/BluetoothKit) was used for Bluetooth Low Energy (BLE)
* To be used for app development for the Dot Pad

## SDK Sample Code
[Sample Application](https://github.com/dotincorp/dotpad-sample-code/tree/main/iOS/1.2.0)

## Directory
```
DotPadSDK-1.x.x.framework
├── _CodeSignature
│   └── CodeResources
├── Headers
│   ├── DotPadFrameworks-Swift.h
│   └── DotPadFrameworks.h
├── Modules
│   ├── DotPadFrameworks.swiftmodule
│   │   ├── Project
│   │   │   ├── arm64-apple-ios.swiftsourceinfo
│   │   │   └── arm64.swiftsourceinfo
│   │   ├── arm64-apple-ios.swiftdoc
│   │   ├── arm64-apple-ios.swiftinterface
│   │   ├── arm64-apple-ios.swiftmodule
│   │   ├── arm64.swiftdoc
│   │   ├── arm64.swiftinterface
│   │   └── arm64.swiftmodule
│   └── module.modulemap
├── DotPadFrameworks
└── Info.plist
```

## SDK Specification
- Features
    - Communication
        - Searches for and connects to Dot Pad via BLE
        - Sends messages to and receives event information from Dot Pad
    - DataProcess
        - Creates messages according to Dot Pad type and sends to Communication module according to protocol
        - Forwards messages from Dot Pad to application
    - DotPad
        - Sets the Dot Pad type: resolution, Text area length, etc
    - BrailleText
        - Calls Braille translation engine for displaying Braille in the Dot Pad text area

- Requirements
    - iOS 8.0+ / OSX 10.10+
    - Swift 5
    - Xcode 13

- Installation
    - Download from Git and import into project
    - CoCoaPod : Coming soon
    - Swift Package Manager : Coming soon

- Usage
    - For the basics, refer to code for the DotPadDemoApp.
    - DotPadFrameworks reset
        ~~~
        import DotPadFrameworks
        DotPadSDK.shared.dotPad_API.dotPad_Communication.delegate_SDP = self
        ~~~
    - Searching for and connecting to Dot Pad using BLE
        ~~~
        DotPadSDK.shared.dotPad_API.dotPad_Communication.scan()
        DotPadSDK.shared.dotPad_API.dotPad_Communication.connect(discoveries[indexPath.row].remotePeripheral)
        DotPadSDK.shared.dotPad_API.dotPad_Communication.disconnect()
        ~~~
    - Displaying to Dot Pad graphics area
    - Displaying a DTM File(for 320 Pad)
        ~~~
        if let data = NSData(contentsOf: dtmFileUrl) {
            var buffer: [UInt8] = Array(repeating: 0x00, count: data.length)
            data.getBytes(&buffer, length: data.length)
            let dtmString = buffer.bytesToHex(spacing: "")
            let index = dtmString.index(dtmString.endIndex, offsetBy: -600)
            let mySubstring = dtmString[index...]
            if (DotPadSDK.shared.dotPad_API.dotPad_Communication.isConnected == true) {
                DotPadSDK.shared.dotPad_API.dotPad_ProcessData.sendMessage(writeString: String(mySubstring))
                DotPadSDK.shared.dotPad_API.dotPad_ProcessData.Print_BrailleText(selectedImageInfo.description)
            }
        }
        ~~~
    - Displaying to Graphic Editor(for 320 Pad, PixelPattern : Array<Array<Bool>>)
        ~~~
        if (DotPadSDK.shared.dotPad_API.dotPad_Communication.isConnected == true) {
            var result: Bool = false
            result =.  DotPadSDK.shared.dotPad_API.dotPad_ProcessData.Load_mapFile(DotPadSDK.shared.dotPad.getDeviceType(), PaintingCanvas!.canvas.getPixelPattern())
            if (result == false) {
                print("[DrawingPaintViewController] DrawingView : Load_mapFile is Failed")
            }
            DotPadSDK.shared.dotPad_API.dotPad_ProcessData.Make_DTM_Data(DotPadSDK.shared.dotPad.getDeviceType())
            DotPadSDK.shared.dotPad_API.dotPad_ProcessData.sendPixelPattern()
        }
        ~~~
    - Displaying to DotPad text area
        ~~~
        BrailleString.text = DotPadSDK.shared.dotPad_API.dotPad_ProcessData.Print_BrailleText(textToSend)
        ~~~

- License
    - DotPadFrameworks is released under the MIT License.

