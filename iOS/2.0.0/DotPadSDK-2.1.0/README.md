# DotPadSDK 2.1.0 for iOS

### 2.1.0 Update
- Cell Retry
    - After printing, reprint three times as it may not print properly
    - There are three types: A, B, and C, but type C is provided by default
    - The default is None. To use it, you must connect the dotpad and run the settings function
    ~~~
    DotPadSDK.shared.dotPadAPI.dotPadCommunication.setRefreshType(type: .TYPE_C)
    ~~~
- Refresh Graphic Display
    - The data of the 300 cells to be printed is compared with the previously printed data and only the changed parts are printed
    ~~~
    DotPadSDK.shared.dotPadAPI.dotPadProcessData.refreshGraphicData(dotDataHexString: "")
    ~~~