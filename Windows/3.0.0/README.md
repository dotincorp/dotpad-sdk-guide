# DotPadSDK 3.0.0 for Windows

## Change history
* libluis translation language has been added.

## SDK Sample Code
* [Sample Application](https://github.com/dotincorp/dotpad-sample-code/tree/main/Windows/3.0.0)

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