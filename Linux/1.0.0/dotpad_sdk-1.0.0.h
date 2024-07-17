#ifndef DOTPAD_SDK_H
#define DOTPAD_SDK_H

#include <iostream>

enum class DataCodes {
	DotCellKeyEvent
};

enum class LanguageCode : uint8_t {
    Arabic = 0x01,
    Chinese = 0x03,
    English = 0x05,
    French = 0x06,
    German = 0x07,
    Italian = 0x08,
    Korean = 0x0A,
    Russian = 0x0B,
    Spanish = 0x0C,
    Vietnamese = 0x0D,
    Portuguese = 0x0F,
    Japanese = 0x09,
    Czech = 0x10,
    Kazakh = 0x13,
    Danish = 0x14,
    Greek = 0x15,
    Swedish = 0x16,
    Finnish = 0x17,
    Thai = 0x18,
    Catalan = 0x19,
    Khmer = 0x1A,
    Slovak = 0x1B,
    Cantonese = 0x1C,
    Taiwan = 0x1D,
    Mandarin = 0x1E,
    Mandarin_Without_Tones = 0x1F,
    Mandarin_With_Tones = 0x20,
    Mandarin_Double_Phonic = 0x21
};

class SendDataProtocol {
	public:
		virtual void sendDataFunc(DataCodes dataCode, const std::string& dataStr) = 0;
};

class DotProcess;
class DotAPI
{
	public:
		DotAPI();
		~DotAPI();
		int connect(const char* device);
		void setBrailleLanguage(LanguageCode code);
		void setBrailleLanguageGrade(int grade);
		int displayTextData(const char* text);
		int displayTextDataNext();
		int displayTextDataPrev();
		void setSendDataProtocol(SendDataProtocol* delegate);
        void setRefresh(int refreshCount, int interval);
	private:
		DotProcess* dotProcess;
};

#endif