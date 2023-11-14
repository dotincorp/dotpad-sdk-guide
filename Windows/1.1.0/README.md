# DotPadSDK-1.1.0 for Windows

## Change history
* libluis translation language has been added.

## SDK Sample Code
* [Sample Application](https://github.com/dotincorp/dotpad-sample-code/tree/main/Windows/1.1.0)

## Install
* Unzip the ipadic.zip compressed file used for Japanese at Dotjeom Station (folder name ipadic after unzipping)
* Unzip the compressed file tables.zip, the paranotation table used for Reblueis paraphrase (folder name tables after unzipping)

## File description
* DotPadSDK.dll: the library for control the Dot Pad
* TTBEngine.dll: the library for braille translation using in DotPadSDK.dll
* MeCab.dll: the library for braille translation using in MeCab.dll
* jsoncpp.dll: the library for JSON file parsing
* dot_pad_sdk.h: the header file that includes information about the APIs
* dot_pad_sdk_error.h: the header file that defines error values that will be returned after calling APIs
* mecabrc: the setting file for braille translation
* ipadic.zip: dictionary table file used for Japanese by Dotjeom Station
* tables.zip: translation table file used for ReBlouis translating

## SDK Specification
### DOT_PAD_SDK_ERROR DOT_PAD_INIT(int port_number);
* the function that initiates the Dot Pad
* an app should call this function before using the Dot Pad
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        COM ports
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_INIT_WITH_DEVICE_TYPE(int port_number, int deviceType);
* the function that initiates the Dot Pad
* an app should call this function before using the Dot Pad
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        COM ports
        device type
            0: 300(20*15)
            1: 300(30*10)
            2: 320
            3: 832
            4: 140
            5: 20
            6: 12
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_DEINIT(void);
* the function that de-initiates the Dot Pad
* an app should call this function after using the Dot Pad
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        none
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_DISPLAY(char* displayFile);
* the function that displays on the Dot Pad using the file path
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        display file(DTM file) path
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_DISPLAY_DATA(uint8_t* data, int len, bool refresh);
* the function that displays on the Dot Pad using the data
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        1st: display data (depends on the device type, 300 Dot Pad needs 300 bytes of data)
        2nd: the length of the data
        3rd: if true, refresh all displays
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_DISPLAY_DATA_PART(uint8_t* data, int len, int startIdx);
* the function that displays on the Dot Pad using the data
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        1st: display data (depends on the device type)
        2nd: the length of the data
        3rd: start index of the Dot Pad (from left top to right bottom)
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_RESET_DISPLAY();
* the function that reset the display
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        none
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_BRAILLE_DISPLAY(const wchar_t* strInput, int language);
* the function that displays on the braille of Dot Pad using string
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        1st: string data that will be converted to braille, UTF-16
        2nd: language option
            0x01: Arabic
            0x03: Chinese Mandarin
            0x05: English
            0x06: French
            0x07: German
            0x08: Italian
            0x0B: Russian
            0x09: Japanese
            0x0A: Korean
            0x0C: Spanish
            0x0D: Vietnamese
            0x10: Czech
            0x11: Polish
            0x12: Norwegian
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_BRAILLE_ASCII_DISPLAY(const char* brailleASCII);
* the function that displays on the braille of Dot Pad using braille ASCII data
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        braille ASCII data
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_RESET_BRAILLE_DISPLAY();
* the function that reset the braille display
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        none
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_SEND_KEY(int nKeyCode);
* the function that sends key input
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        1: previous
        2: next
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_GET_FW_VERSION(void(CALLBACK* cb)(char*));
* the function that gets the firmware version
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        function pointer
    ```
* callback function
    ```
    return
        none
    parameter
        firmware version characters pointer
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_GET_DEVICE_NAME(void(CALLBACK* cb)(char*));
* the function that gets the device name
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        function pointer
    ```
* callback function
    ```
    return
        none
    parameter
        device name charaters pointer
    ```

### DOT_PAD_SDK_ERROR GetDisplayInfo(int* width, int* height, int* braille);
* the function that gets the display info
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        1st: the number of pad width cells
        2nd: the number of pad height cells
        3rd: the number of pad braille cells
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_REGISTER_KEY_CALLBACK(void(CALLBACK* cb)(int));
* the function that registers a callback function to be called by key input
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        function pointer
    ```
* callback function
    ```
    return
        none
    parameter
        callback function pointer
        - pressed key information(e.g. 0/1/2/3 from the left on 320 Dot Pad)
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_REGISTER_DISPLAY_CALLBACK(void(CALLBACK* cb)(void));
* the function that registers a callback function to be called when the display is complete
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        function pointer
    ```
* callback function
    ```
    return
        none
    parameter
        callback function pointer
    ```

### DOT_PAD_SDK_ERROR DOT_PAD_GET_DTMS_DATA(const char* url);
* the function that set DTMS data using URL
    ```
    return
        DOT_PAD_SDK_ERROR
    parameter
        DTMS URL
    ```
