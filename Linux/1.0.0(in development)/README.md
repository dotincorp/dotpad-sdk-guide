# Dot API SDK

Welcome to the Dot API SDK repository! This SDK allows developers to interact with Dot devices, providing functions to display Braille text data, set Braille languages, and handle device connections.

## Table of Contents

- [Introduction](#introduction)
- [Installation](#installation)
- [Usage](#usage)
  - [Connecting to a Device](#connecting-to-a-device)
  - [Setting Braille Language](#setting-braille-language)
  - [Displaying Text Data](#displaying-text-data)
  - [Send Data Protocol](#send-data-protocol)
- [API Documentation](#api-documentation)
  - [Classes and Methods](#classes-and-methods)
  - [Enumerations](#enumerations)
- [Download](#download)

## Introduction

The Dot API SDK is designed to help developers create applications that communicate with Dot devices. This API provides a set of methods to manage device connections, display Braille text, and configure device settings.

## Installation

To use the Dot API SDK, download the header file and include it in your project.

```bash
# Download the header file directly from the repository
wget https://github.com/dotincorp/dotpad-sdk-guide/tree/main/Linux/1.0.0(in%20development)/dotpad_sdk-1.0.0.h
```

## Usage

### Connecting to a Device

This version only supports 20-cell devices.

To connect to a Dot device, use the `connect` method with the device address.

```cpp
#include "dotpad_sdk-1.0.0.h"

DotAPI dot;
int status = dot.connect("device_address");
if (status == 0) {
    std::cout << "Connected successfully!" << std::endl;
} else {
    std::cout << "Connection failed!" << std::endl;
}
```

### Setting Braille Language

Set the Braille language using the `setBrailleLanguage` method.

```cpp
dot.setBrailleLanguage(LanguageCode::English);
```

### Displaying Text Data

Display text data on the device using the `displayTextData` method.

```cpp
dot.displayTextData("Hello, world!");
```

### Send Data Protocol

Implement the `SendDataProtocol` interface to handle custom data sending.

```cpp
class MySendData : public SendDataProtocol {
public:
    void sendDataFunc(DataCodes dataCode, const std::string& dataStr) override {
        // Handle data sending
    }
};

MySendData sendData;
dot.setSendDataProtocol(&sendData);
```

## API Documentation

### Classes and Methods

#### `DotAPI`

- `DotAPI()`: Constructor to initialize the DotAPI object.
- `~DotAPI()`: Destructor to clean up resources.
- `int connect(const char* device)`: Connect to a Dot device.
- `void setBrailleLanguage(LanguageCode code)`: Set the Braille language.
- `void setBrailleLanguageGrade(int grade)`: Set the Braille language grade.
- `int displayTextData(const char* text)`: Display text data on the device.
- `int displayTextDataNext()`: Display the next text data.
- `int displayTextDataPrev()`: Display the previous text data.
- `void setSendDataProtocol(SendDataProtocol* delegate)`: Set the send data protocol delegate.
- `void setRefresh(int refreshCount, int interval)`: Set the refresh rate and interval.

### Enumerations

#### `LanguageCode`

- `Arabic`
- `Chinese`
- `English`
- `French`
- `German`
- `Italian`
- `Korean`
- `Russian`
- `Spanish`
- `Vietnamese`
- `Portuguese`
- `Japanese`
- `Czech`
- `Kazakh`
- `Danish`
- `Greek`
- `Swedish`
- `Finnish`
- `Thai`
- `Catalan`
- `Khmer`
- `Slovak`
- `Cantonese`
- `Taiwan`
- `Mandarin`
- `Mandarin_Without_Tones`
- `Mandarin_With_Tones`
- `Mandarin_Double_Phonic`

## Download

You can download the latest version of the Dot API SDK file from the link below:

[Download dotpad_sdk-1.0.0](https://github.com/dotincorp/dotpad-sdk-guide/tree/main/Linux/1.0.0(in%20development))