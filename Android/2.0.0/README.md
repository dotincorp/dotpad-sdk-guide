# DotPadSDK Android

## Version 2.0.0 Function description
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