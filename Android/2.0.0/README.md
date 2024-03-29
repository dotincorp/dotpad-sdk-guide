# DotPadSDK 2.0.0 for Android

## Overview
* A Android library for Dot Incorporation's Dot Pad
* To be used for application development for the Dot Pad

## SDK Sample Code
* [Sample Application](https://github.com/dotincorp/dotpad-sample-code/tree/main/Android/2.0.0)

## Dot Pad Line ID and Cell Index
   <img src="images/dotpad.png">
    
## SDK Specification
### startScan()
* This function scans the Dot Pad device.
    ```
    import com.dotincorp.sdk.BleRepository

    bleRepository.startScan()
    ```

### connect()
* This function connects to the Dot Pad device.
    ```
    import com.dotincorp.sdk.process.DotPadProcess

    val process = DotPadProcess()
    process.connect(bluetoothDevice, MyApplication.instance)
    ```    

### disconnect()
* This function disconnects from the Dot Pad device.
    ```
    import com.dotincorp.sdk.process.DotPadProcess

    val process = DotPadProcess()
    process.disconnect()
    ```    

### displayGraphicData(data:String)
* This function print data to the Dot Pad graphic area.
* Graphic data is data converted from 8 bits to a hex string.
    ```
    import com.dotincorp.sdk.process.DotPadProcess

    val process = DotPadProcess()
    val data =
        "00000000000000000000000000000080CC6E170000000000000000000000" +
        "000000000000000000008888888C047C7F13000000000000000000000000" +
        "00000000000000C06C5F1B7B7B3F3FFFFFFFDDFFEFCE0000000000000000" +
        "000000000000003D7D784DF9A7A1213D3B39FBFFBF130000000000000000" +
        "00000000000000DF15FB05B4C5596D0EFDD9F10D00000000000000000000" +
        "00000000000000D7DEDA9AAF78E96EFB764F7B0400000000000000000000" +
        "00000000000000709FD78FCF3CB97939BF4FEFE900000000000000000000" +
        "000000000000000073CBA3D4FFC4BDEE3BC6BBED390C0000000000000000" +
        "00000000000000000010D7EBEA67FFF0B6B79CDF35030000000000000000" +
        "000000000000000000000000117366372733010000000000000000000000"    
    process.displayGraphicData(data)
    ```

### displayGraphicDataLine(lineId:Int, startCellIndex:Int, data:String)
* This function prints data on specific lines and cells in the Dot Pad graphic area.
* parameter : lineId(1..10), startCellIndex(0..29), data(Graphic Data)
    ```
    import com.dotincorp.sdk.process.DotPadProcess
    val process = DotPadProcess()
    val data = "FF"
    process.displayGraphicDataLine(2, 3, data) // print data to the 3rd cell of the 2nd line
    ```

### displayTextDataLine(lineId:Int, startCellIndex:Int, data:String)
* This function prints data on specific lines and cells in the Dot Pad graphic area.
* parameter : lineId(1..10), startCellIndex(0..29), data(Braille Data)
    ```
    import com.dotincorp.sdk.process.DotPadProcess
    val process = DotPadProcess()
    val data = "FF"
    process.displayTextDataLine(2, 3, data) // print data to the 3rd cell of the 2nd line
    ```    

### displayTextData(text:String)
* This function prints braille data in the Dot Pad text area.
* The braille language follows the language set in the OS.
    ```
    import com.dotincorp.sdk.process.DotPadProcess

    val process = DotPadProcess()
    var data = "I love the dot pad"
    process.displayTextData(data)
    ```
