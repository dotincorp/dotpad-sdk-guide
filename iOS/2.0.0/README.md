# DotPadSDK 2.0.0 for iOS

## Overview
* An iOS Swift library for Dot Incorporation's Dot Pad
* Available for use as a Framework in Xcode
* The open source BluetoothKit(https://github.com/rhummelmose/BluetoothKit) was used for Bluetooth Low Energy (BLE)
* To be used for app development for the Dot Pad

## SDK Sample Code
* [Sample Application](https://github.com/dotincorp/dotpad-sample-code/tree/main/iOS/2.0.0)

## Directory
```
DotPadSDK-2.x.x.framework
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

### SDK
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

- Installation
    - Download from Git and import into project

- Usage
    - For the basics, refer to code for the DotPadDemoApp.
    - DotPadFrameworks reset
        ~~~
        import DotPadFrameworks
        DotPadSDK.shared.dotPadAPI.dotPadCommunication.delegate_SDP = self
        ~~~
    - Searching for and connecting to Dot Pad using BLE
        ~~~
        DotPadSDK.shared.dotPadAPI.dotPadCommunication.scan()
        DotPadSDK.shared.dotPadAPI.dotPadCommunication.connect(discoveries[indexPath.row].remotePeripheral)
        DotPadSDK.shared.dotPadAPI.dotPadCommunication.disconnect()
        ~~~
    - Displaying to Graphic area(for 320 Pad, data : String)
        ~~~
        DotPadSDK.shared.dotPadAPI.dotPadProcessData.displayGraphicData(data: String(repeating: "FF", count: 300))
        ~~~
    - Displaying to DotPad text area
        - Long sentences are printed when the right/left padding keys are pressed
        ~~~
        BrailleString.text = DotPadSDK.shared.dotPadAPI.dotPadProcessData.displayTextData(text: padTextField.text!)
        ~~~

