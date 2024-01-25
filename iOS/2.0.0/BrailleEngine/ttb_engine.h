 #ifndef __TTB_ENGINE_H_
#define __TTB_ENGINE_H_

// version: v0.0.1-non_ja

#include <stdint.h>

#define MAX_INPUT_SIZE 2048
#define MAX_OUTPUT_SIZE MAX_INPUT_SIZE*3
#define NUM_USER_OPT 9


/**
* 점자 번역 함수
*
* prototype
*     int BrailleTranslator(uint16_t* input, uint8_t* output, int appOpt[NUM_USER_OPT]);
*
* parameter
*     uint16_t* input:
*         UTF-16 문자 인코딩을 사용하는 입력 묵자 배열의 시작 포인터
*         최대 2048 bytes
*     uint8_t* output:
*         사용하는 기기 한 줄의 셀 개수에 맞게 재배치된 점자 코드 배열의 시작 포인터
*         최대 6144 bytes
*     int appOpt[NUM_USER_OPT]: 사용자 옵션
*         1st element:
*             한국어, 영어, 아랍어, 중국어(간체자), 프랑스어, 독일어, 이탈리아어, 러시아어, 스페인어, 베트남어 혹은 체코어 점역 엔진 선택
*             0x0A: 한국어 점역 엔진 / 0x05: 영어 점역 엔진 / 0x01: 아랍어 점역 엔진 / 0x03: 중국어(간체자) 점역 엔진 / 0x06: 프랑스어 점역 엔진 / 0x07: 독일어 점역 엔진 / 0x08: 이탈리아어 점역 엔진 / 0x0B: 러시아어 점역 엔진 / 0x0C: 스페인어 점역 엔진 / 0x0D: 베트남어 점역 엔진 / 0x10: 체코어
*         2nd element:
*             영어 점역 엔진 Grade 선택
*             1: Grade 1 / 2: Grade 2
*         3rd element:
*             대문자를 소문자로 변환 선택 (입력받은 데이터에 포함된 영어 대문자 26자를 소문자로 변환)
*             0: 원본 데이터 유지 / 1: 소문자로 변환
*         4th element:
*             컴퓨터 점자 사용 여부 선택
*             0: 컴퓨터 점자 사용하지 아니함 / 1: 컴퓨터 점자 사용
*         5th element:
*             한 줄에 표시되는 셀 개수 설정
*         6th element:
*             중국어 간체자 Rule 선택
*             1: Xianxing (Shengdiao) / 2: Shuang pin / 3: Xianxing (No Shengdiao)
*         7th element:
*             프랑스어 약어 사용 선택
*             1: 약어 미사용 / 2: 약어 사용
*         8th element:
*             독일어 Grade 선택
*             1: Grade 1 / 2: Grade 2
*         9th element:
*             베트남어 Grade 선택
*             1: Grade 1 / 2: Grade 2
*
* return
*     번역된 점자 셀 개수 (점자 셀에 맞게 재배치된 셀 개수)
*/
int BrailleTranslator(uint16_t* input, uint8_t* output, int appOpt[NUM_USER_OPT]);
#endif // __TTBENGINE_H_
