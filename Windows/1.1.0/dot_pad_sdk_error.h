#ifndef DOT_PAD_SDK_ERROR_H_
#define DOT_PAD_SDK_ERROR_H_

typedef enum {
	DOT_ERROR_NONE = 0x00, // 성공

	HV_ERROR_UNSUPPORTED_FEATURE, // 지원하지 않는 기능

	DOT_ERROR_DOT_PAD_COULD_NOT_INIT, // DotPadSDK가 로드되지 않은 상태
	DOT_ERROR_DOT_PAD_ALREADY_INIT, // DotPadSDK가 이미 성공적으로 로드되어 있는 상태

	DOT_ERROR_TTB_DLL_LOAD_FAIL, // 점역엔진 DLL 로드 실패
	DOT_ERROR_TTB_DLL_GET_FUNC_FAIL, // 점역엔진 DLL 내 함수 포인터 획득 실패
	DOT_ERROR_TTB_DLL_COULD_NOT_LOAD, // 점역엔진 DLL 이 로드되지 않은 상태
	DOT_ERROR_TTB_COULD_NOT_SET_LANGUAGE, // 점역 엔진 언어 설정 에러

	DOT_ERROR_DISPLAY_FILE_INVALID, // 디스플레이 파일이 유효하지 아니함

	DOT_ERROR_DISPLAY_TYPE_SET, // 디스플레이 유형 설정 오류

	DOT_ERROR_HAS_NO_BRAILLE_DISPLAY, // 디바이스에 점자 출력 부분이 없는 경우

	DOT_ERROR_READ_EEPROM_PARAM, // read EEPROM parameter error
	DOT_ERROR_WRITE_EEPROM_PARAM, // write EEPROM parameter error

	DOT_ERROR_FW_BINARY_INVALID, // firmware binary is invalid

	DOT_ERROR_COM_PORT_ERROR = 0x10, // COM 포트 열기 실패
	DOT_ERROR_COM_HANDLE_INIT_ERROR, // COM 포트 핸들 초기화 실패
	DOT_ERROR_COM_PORT_ALREADY_OPENED, // COM 포트가 이미 사용중일 경우
	DOT_ERROR_COM_PORT_DISCONNECTED, // COM 포트 연결이 되어 있지 않은 상태

	DOT_ERROR_COM_WRITE_ERROR = 0x20, // COM 포트 전송 실패
	DOT_ERROR_COM_INVALID_DATA, // 유효하지 않은 데이터 값
	DOT_ERROR_COM_NOT_RESPONSE, // COM 포트로 커맨드 전송 후 응답이 없음 (3회 재시도 시 실패)
	DOT_ERROR_COM_RESPONSE_TIMEOUT, // COM 포트로 커맨드 전송 후 프로그램 오류로 인한 무한 대기를 방지하기 위한 10초 timeout 발생

	DOT_ERROR_BRAILLE_NOT_TRANSLATE = 0x40, // 점역이 안된 상태
	DOT_ERROR_KEY_OUT_OF_RANGE, // 키 범위를 벗어난 경우
	DOT_ERROR_DISPLAY_THREAD_NOT_READY, // COM 포트 오류로 display 스레드가 생성이 되지 않은 상태

	DOT_ERROR_ACCESS_INVALID_MEM = 0x80, // 유효하지 않은 메모리 접근
	DOT_ERROR_DISPLAY_IN_PROGRESS, // 점자 표시가 진행 중인 상태

	DOT_ERROR_CERTIFY_NG = 0x80000000, // 인증 실패
	DOT_ERROR_RESPONSE_TIMEOUT, // 응답 타임아웃

	DOT_ERROR_DISPLAY_DATA_INVALIDE_FILE, // display 데이터가 존재하지 않을 경우
	DOT_ERROR_DISPLAY_DATA_INVALIDE_LENGTH, // display 데이터 파일명의 길이가 유효하지 않을 경우
	DOT_ERROR_DISPLAY_DATA_SYNC_DATA_FAIL, // display 데이터의 SYNC 데이터 오류

	DOT_ERROR_DISPLAY_DATA_UNCHAGNED, // 현재 출력 데이터가 이전과 같은 경우
	DOT_ERROR_DISPLAY_DATA_RANGE_INVALID, // 디스플레이 데이터가 유효하지 않음

	DOT_ERROR_INVALID_DEVICE, // 유효하지 않은 장치

	DOT_ERROR_MAX
}DOT_PAD_SDK_ERROR;


#define IS_DOT_COM_NOT_RSP_ERROR(nError) ((nError & DOT_ERROR_COM_WRITE_ERROR) ? TRUE : FALSE)

#endif // !DOT_PAD_SDK_ERROR_H_
