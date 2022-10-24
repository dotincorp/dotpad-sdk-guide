#ifndef DOT_PAD_SDK_H_
#define DOT_PAD_SDK_H_

#ifdef __cplusplus
extern "C"
{
#endif


#include "dot_pad_sdk_error.h"


#ifdef DOT_PAD_SDK_DLL_EXPORTS
#define DOTPADSDK_API __declspec(dllexport)
#else
#define DOTPADSDK_API __declspec(dllimport)
#endif


	namespace DOT_PAD_SDK_API {
		// function in DotPadSDK DLL
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_INIT(int port_number);
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_INIT_WITH_DEVICE_TYPE(int port_number, int deviceType);
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_DEINIT(void);
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_DISPLAY(char* displayFile);
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_DISPLAY_DATA(uint8_t* data, int len);
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_RESET_DISPLAY();
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_BRAILLE_DISPLAY(const wchar_t* strInput, int language);
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_BRAILLE_ASCII_DISPLAY(const char* brailleASCII);
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_RESET_BRAILLE_DISPLAY();
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_SEND_KEY(int nKeyCode);
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_GET_FW_VERSION(char* FWVersion);
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_GET_HW_VERSION(unsigned char& HWVersion);
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_GET_DEVICE_NAME(char* deviceName);
		DOTPADSDK_API DOT_PAD_SDK_ERROR DOT_PAD_REGISTER_CALLBACK(void(CALLBACK* cb)(int));
#if !defined(DOT_PAD_SDK_DLL_EXPORTS)
		// function type retrieved from DotPadSDK DLL
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_INIT_FUNC)(int port_number);
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_INIT_WITH_DEVICE_TYPE_FUNC)(int port_number, int deviceType);
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_DEINIT_FUNC)(void);
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_DISPLAY_FUNC)(char* displayFile);
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_DISPLAY_DATA_FUNC)(uint8_t* data, int len);
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_RESET_DISPLAY_FUNC)();
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_BRAILLE_DISPLAY_FUNC)(const wchar_t* strInput, int language);
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_BRAILLE_ASCII_DISPLAY_FUNC)(const char* brailleASCII);
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_RESET_BRAILLE_DISPLAY_FUNC)();
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_SEND_KEY_FUNC)(int nKeyCode);
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_GET_FW_VERSION_FUNC)(char* FWVersion);
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_GET_HW_VERSION_FUNC)(unsigned char& HWVersion);
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_GET_DEVICE_NAME_FUNC)(char* deviceName);
		typedef DOT_PAD_SDK_ERROR(*DOT_PAD_REGISTER_CALLBACK_FUNC)(void(CALLBACK* cb)(int));
#endif
	}


#ifdef __cplusplus
}
#endif

#endif // !DOT_PAD_SDK_H_
