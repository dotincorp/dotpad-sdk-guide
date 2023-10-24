# DotPadSDK 2.0.0 for Android

## Overview
* A Android library for Dot Incorporation's Dot Pad
* To be used for application development for the Dot Pad

## SDK Sample Code
* [Sample Application](https://github.com/dotincorp/dotpad-sample-code/tree/main/Android/2.0.0)

## SDK Specification
### startScan()
* This function scans the device.
    ```
    import com.dotincorp.sdk.BleRepository
    bleRepository.startScan()
    ```

### connect()
* This function connects to the device.
    ```
    import com.dotincorp.sdk.process.DotPadProcess
    val process = DotPadProcess()
    process.connect(bluetoothDevice, MyApplication.instance)
    ```    

### disconnect()
* This function disconnects from the device.
    ```
    import com.dotincorp.sdk.process.DotPadProcess
    val process = DotPadProcess()
    process.disconnect()
    ```    

### displayGraphicData(data:String)
* This function outputs graphic data to the Dot Pad
    ```
    import com.dotincorp.sdk.process.DotPadProcess
    val process = DotPadProcess()
    process.displayGraphicData(data)
    ```

### displayGraphicData(lineId:Int, startCellIndex:Int, data:String)
* This function outputs from a specific cell on that line
* parameter : lineId(0~10), startCellIndex(0~29), data(Graphic Data)

    ```
    import com.dotincorp.sdk.process.DotPadProcess
    val process = DotPadProcess()
    process.displayGraphicData(2, 3, data)
    ```

### displayTextData(text:String)
* the function that displays on the braille of Dot Pad using braille ASCII data
    ```
    import com.dotincorp.sdk.process.DotPadProcess
    val process = DotPadProcess()
    process.displayTextData(data)
    ```

### setTextToBrailleText(text : String)
* This function uses Braille ASCII data and sets it to be displayed in Braille of Dot Pad.
    ```
    import com.dotincorp.sdk.process.DotPadProcess
    val process = DotPadProcess()
    process.setTextToBrailleText(data)
    ```

### displayBrailleData()
* If there is a value set to be displayed in Braille of Dot Pad, it is a function that outputs it
    ```
    import com.dotincorp.sdk.process.DotPadProcess
    val process = DotPadProcess()
    process.displayBrailleData(data)
    ```
