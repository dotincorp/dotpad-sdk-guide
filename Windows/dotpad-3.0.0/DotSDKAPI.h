#pragma once

#include <windows.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C"
{
#endif

	// ========== Enum 정의 ==========
	// DataCodes: 디바이스 메시지 코드
	typedef enum {
		DOT_DATA_CODE_CONNECTED = 0,
		DOT_DATA_CODE_DISCONNECTED,
		DOT_DATA_CODE_BOARD_INFO,
		DOT_DATA_CODE_BLE_MAC_ADDRESS,
		DOT_DATA_CODE_DEVICE_NAME,
		DOT_DATA_CODE_DEVICE_FW_VERSION,
		DOT_DATA_CODE_DEVICE_HW_VERSION,
		DOT_DATA_CODE_RESPONSE_DISPLAY_LINE_ACK,
		DOT_DATA_CODE_RESPONSE_DISPLAY_LINE_NON_ACK,
		DOT_DATA_CODE_RESPONSE_DISPLAY_LINE_COMPLETE,
		DOT_DATA_CODE_COMMAND_ERROR,
		DOT_DATA_CODE_COMMAND_NONE
	} DOT_DATA_CODE;

	// KeyCodes: 키 입력 코드
	typedef enum {
		DOT_KEY_CODE_FUNCTION1 = 0,
		DOT_KEY_CODE_FUNCTION2,
		DOT_KEY_CODE_FUNCTION3,
		DOT_KEY_CODE_FUNCTION4,
		DOT_KEY_CODE_FUNCTION12,
		DOT_KEY_CODE_FUNCTION13,
		DOT_KEY_CODE_FUNCTION14,
		DOT_KEY_CODE_FUNCTION23,
		DOT_KEY_CODE_FUNCTION24,
		DOT_KEY_CODE_FUNCTION34,
		DOT_KEY_CODE_ELSE,
		DOT_KEY_CODE_PANNING_ALL,
		DOT_KEY_CODE_PANNING_LEFT,
		DOT_KEY_CODE_PANNING_RIGHT,
		DOT_KEY_CODE_LPF1,
		DOT_KEY_CODE_RPF4
	} DOT_KEY_CODE;

#ifdef DOT_PAD_SDK_DLL_EXPORTS
#define DOTPADSDK_API __declspec(dllexport)
#else
#define DOTPADSDK_API __declspec(dllimport)
#endif

	namespace DOT_PAD_SDK_API {
		// Device Handle: void* 타입, nullptr이면 모든 기기에 적용
		// 성공 시 device handle 반환, 실패 시 nullptr 반환

		// ========== 연결 관리 ==========
		// BLE 연결 (deviceName: "DotPad320-xxx" 형식)
		DOTPADSDK_API void* DOT_PAD_CONNECT_BLE(const wchar_t* deviceName);
		
		// Serial 연결 (portName: "COM3" 형식)
		DOTPADSDK_API void* DOT_PAD_CONNECT_SERIAL(const wchar_t* portName);
		
		// 연결 해제 (deviceHandle이 nullptr이면 모든 기기 해제)
		DOTPADSDK_API bool DOT_PAD_DISCONNECT(void* deviceHandle);
		
		// 연결된 기기 개수 조회
		DOTPADSDK_API int DOT_PAD_GET_CONNECTED_DEVICE_COUNT();
		
		// 연결된 기기 handle 조회 (index: 0부터 시작)
		DOTPADSDK_API bool DOT_PAD_GET_CONNECTED_DEVICE_HANDLE(int index, void** deviceHandle);
		
		// 기기 이름 조회
		DOTPADSDK_API bool DOT_PAD_GET_DEVICE_NAME(void* deviceHandle);

		// 기기 FW Version 조회
		DOTPADSDK_API bool DOT_PAD_GET_FW_VERSION(void* deviceHandle);

		// 기기 HW Version 조회
		DOTPADSDK_API bool DOT_PAD_GET_HW_VERSION(void* deviceHandle);

		// ========== 스캔 ==========
		// BLE 스캔 시작
		DOTPADSDK_API void DOT_PAD_BLE_SCAN(void(CALLBACK* cb)(const wchar_t*));
		
		// BLE 스캔 중지
		DOTPADSDK_API void DOT_PAD_BLE_SCAN_STOP();
		
		// USB 스캔 시작
		DOTPADSDK_API void DOT_PAD_USB_SCAN(void(CALLBACK* cb)(const wchar_t*));

		// ========== Display (Graphic) ==========
		// 파일에서 그래픽 데이터 표시
		DOTPADSDK_API bool DOT_PAD_DISPLAY_FILE(const char* displayFile, void* deviceHandle);
		
		// 그래픽 데이터 표시
		DOTPADSDK_API bool DOT_PAD_DISPLAY_DATA(uint8_t* data, int len, void* deviceHandle);
		
		// 그래픽 디스플레이 리셋
		DOTPADSDK_API bool DOT_PAD_RESET_DISPLAY(void* deviceHandle);

		// ========== Display (Braille/Text) ==========
		// 점자 표시 (텍스트를 점자로 변환)
		DOTPADSDK_API bool DOT_PAD_BRAILLE_DISPLAY(const wchar_t* strInput, int language, int grade, int englishGradeIfKorean, void* deviceHandle, void(CALLBACK* callback)(void* deviceHandle, const uint8_t* translatedData, size_t dataSize));
		
		DOTPADSDK_API bool DOT_PAD_BRAILLE_DISPLAY_DATA(const uint8_t* brailleData, size_t dataSize, void* deviceHandle);

		// Braille ASCII 표시
		DOTPADSDK_API bool DOT_PAD_BRAILLE_ASCII_DISPLAY(const char* brailleASCII, void* deviceHandle);
		
		// 점자 디스플레이 리셋
		DOTPADSDK_API bool DOT_PAD_RESET_BRAILLE_DISPLAY(void* deviceHandle);

		// ========== 설정 ==========
		// 언어 설정
		DOTPADSDK_API void DOT_PAD_SET_LANGUAGE(int language, int grade);
		
		// 한국어 사용 시 영어 점자 등급 설정
		DOTPADSDK_API void DOT_PAD_SET_ENGLISH_GRADE_IF_KOREAN(int grade);

		// ========== 정보 조회 ==========
		// 디스플레이 정보 조회
		DOTPADSDK_API bool DOT_PAD_GET_DISPLAY_INFO(void* deviceHandle, int* width, int* height, int* braille);

		// ========== 콜백 등록 ==========
		// 키 입력 콜백 (deviceHandle: 어떤 기기에서 입력되었는지, keyCode: DOT_KEY_CODE enum 값)
		DOTPADSDK_API void DOT_PAD_REGISTER_KEY_CALLBACK(void(CALLBACK* cb)(void* deviceHandle, DOT_KEY_CODE keyCode, const char* message));
		
		// 메시지 콜백 (연결, 해제, 펌웨어 버전 등, messageCode: DOT_DATA_CODE enum 값)
		DOTPADSDK_API void DOT_PAD_REGISTER_MESSAGE_CALLBACK(void(CALLBACK* cb)(void* deviceHandle, DOT_DATA_CODE messageCode, const char* message));
		
		// 디스플레이 완료 콜백
		DOTPADSDK_API void DOT_PAD_REGISTER_DISPLAY_CALLBACK(void(CALLBACK* cb)(void* deviceHandle));
	}

#if !defined(DOT_PAD_SDK_DLL_EXPORTS)
	// Function pointer types for dynamic loading (LoadLibrary)
	namespace DOT_PAD_SDK_API {
		// 연결 관리
		typedef void*(*DOT_PAD_CONNECT_BLE_FUNC)(const wchar_t* deviceName);
		typedef void*(*DOT_PAD_CONNECT_SERIAL_FUNC)(const wchar_t* portName);
		typedef bool(*DOT_PAD_DISCONNECT_FUNC)(void* deviceHandle);
		typedef int(*DOT_PAD_GET_CONNECTED_DEVICE_COUNT_FUNC)();
		typedef bool(*DOT_PAD_GET_CONNECTED_DEVICE_HANDLE_FUNC)(int index, void** deviceHandle);
		typedef bool(*DOT_PAD_GET_DEVICE_NAME_FUNC)(void* deviceHandle);
		typedef bool(*DOT_PAD_GET_FW_VERSION_FUNC)(void* deviceHandle);
		typedef bool(*DOT_PAD_GET_HW_VERSION_FUNC)(void* deviceHandle);

		// 스캔
		typedef void(*DOT_PAD_BLE_SCAN_FUNC)(void(CALLBACK* cb)(const wchar_t*));
		typedef void(*DOT_PAD_BLE_SCAN_STOP_FUNC)();
		typedef void(*DOT_PAD_USB_SCAN_FUNC)(void(CALLBACK* cb)(const wchar_t*));

		// Display (Graphic)
		typedef bool(*DOT_PAD_DISPLAY_FILE_FUNC)(const char* displayFile, void* deviceHandle);
		typedef bool(*DOT_PAD_DISPLAY_DATA_FUNC)(uint8_t* data, int len, void* deviceHandle);
		typedef bool(*DOT_PAD_RESET_DISPLAY_FUNC)(void* deviceHandle);

		// Display (Braille/Text)
		typedef bool(*DOT_PAD_BRAILLE_DISPLAY_FUNC)(const wchar_t* strInput, int language, int grade, int englishGradeIfKorean, void* deviceHandle, void(CALLBACK* callback)(void* deviceHandle, const uint8_t* translatedData, size_t dataSize));
		typedef bool(*DOT_PAD_BRAILLE_DISPLAY_DATA_FUNC)(const uint8_t* brailleData, size_t dataSize, void* deviceHandle);
		typedef bool(*DOT_PAD_BRAILLE_ASCII_DISPLAY_FUNC)(const char* brailleASCII, void* deviceHandle);
		typedef bool(*DOT_PAD_RESET_BRAILLE_DISPLAY_FUNC)(void* deviceHandle);

		// 설정
		typedef void(*DOT_PAD_SET_LANGUAGE_FUNC)(int language, int grade);
		typedef void(*DOT_PAD_SET_ENGLISH_GRADE_IF_KOREAN_FUNC)(int grade);

		// 정보 조회
		typedef bool(*DOT_PAD_GET_DISPLAY_INFO_FUNC)(void* deviceHandle, int* width, int* height, int* braille);

		// 콜백 등록
		typedef void(*DOT_PAD_REGISTER_KEY_CALLBACK_FUNC)(void(CALLBACK* cb)(void* deviceHandle, DOT_KEY_CODE keyCode, const char* message));
		typedef void(*DOT_PAD_REGISTER_MESSAGE_CALLBACK_FUNC)(void(CALLBACK* cb)(void* deviceHandle, DOT_DATA_CODE messageCode, const char* message));
		typedef void(*DOT_PAD_REGISTER_DISPLAY_CALLBACK_FUNC)(void(CALLBACK* cb)(void* deviceHandle));
	}
#endif

#ifdef __cplusplus
}
#endif
