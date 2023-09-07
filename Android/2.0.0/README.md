# DotPadSDK 2.0.0 for Android

## Overview
* A Android library for Dot Incorporation's Dot Pad
* To be used for application development for the Dot Pad

## SDK Sample Code
* [Sample Application](https://github.com/dotincorp/dotpad-sample-code/tree/main/Android/2.0.0)

## SDK Specification
### displayGraphicData(data:String)
* This function outputs graphic data to the Dot Pad

    ```
    return
        none
    parameter
        Graphic Data
    ```

### displayGraphicData(lineId:Int, startCellIndex:Int, data:String)
* This function outputs from a specific cell on that line

    ```
    return
        none
    parameter
        line Id(ex: 0 ~ 10)
        Start Cell Index(ex: 0 ~ 29)
        Graphic Data
    ```

### displayTextData(text:String)
* the function that displays on the braille of Dot Pad using braille ASCII data

    ```
    return
        none
    parameter
        ASCII Text Data
    ```

### setTextToBrailleText(text : String)
* This function uses Braille ASCII data and sets it to be displayed in Braille of Dot Pad.
    ```
    return
        none
    parameter
        ASCII Text Data
    ```

### displayBrailleData()
* If there is a value set to be displayed in Braille of Dot Pad, it is a function that outputs it
    ```
    return
        none
    parameter
        Braille Hex Data
    ```
