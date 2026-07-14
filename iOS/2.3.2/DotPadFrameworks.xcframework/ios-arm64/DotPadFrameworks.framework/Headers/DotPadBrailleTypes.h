#import <Foundation/Foundation.h>

#define NUM_USER_OPT 11

typedef enum
{
    NONE = 0x0,
    ARABIC = 0x1,
    CHINESE_TRADITIONAL = 0x2,
    CHINESE_SIMPLIFIED = 0x3,
    DUTCH = 0x4,
    ENGLISH = 0x5,
    FRENCH = 0x6,
    GERMAN = 0x7,
    ITALIAN = 0x8,
    JAPANESE = 0x9,
    KOREAN = 0xA,
    RUSSIAN = 0xB,
    SPANISH = 0xC,
    VIETNAMESE = 0xD,
    BULGARIAN = 0xE,
    PORTUGUESE = 0xF,
    CZECH = 0x10,
    POLISH = 0x11,
    NORWEGIAN = 0x12,
    KAZAKH = 0x13,
    DANISH = 0x14,
    GREEK = 0x15,
    SWEDISH = 0x16,
    FINNISH = 0x17,
    THAI = 0x18,
    CATALAN = 0x19,
    KHMER = 0x1A,
    SLOVAK = 0x1B,
    CANTONESE = 0x1C,
    TAIWAN = 0x1D,
    MANDARIN = 0x1E,
    MANDARIN_WITHOUT_TONES = 0x1F,
    MANDARIN_WITH_TONES = 0x20,
    MANDARIN_DOUBLE_PHONIC = 0x21,
    UZBEK = 0x22,
    MONGOLIAN = 0x23,
    HEBREW = 0x24,
    ROMANIAN = 0x25,
    HUNGARIAN = 0x26,
    WELSH = 0x27,
    SERBIAN = 0x28,
    ENGLISH_OLD = 0x29,
    CROATIAN = 0x2A
    // DUTCH = 0x25,
} LanguageName;

NS_ASSUME_NONNULL_BEGIN

@interface Louis : NSObject
@property (strong, nonatomic) NSDictionary *languageTable;

- (int)brailleTranslator:(NSString *)input output:(uint8_t*)output options:(int[NUM_USER_OPT])options pinOption:(NSInteger) pinOption translateOption:(NSInteger) translateOption;

/// braille(Unicode U+2800–U+28FF) → 묵자(print) 역변환.
/// liblouis 의 lou_backTranslateString 을 호출해 contraction(UEB grade 2 등) 을 풀어낸다./
/// 실패 시 nil 반환 — 호출자에서 hand-coded 폴백을 쓰도록.
/// @param brailleText 입력 점자 문자열 (Unicode 점자)
/// @param language LanguageName enum 값 (ENGLISH=0x5, KOREAN=0xA 등)
/// @param grade 점자 등급 (1: g1 uncontracted, 2: g2 contracted)
/// @param pinOption 6-dot 면 1, 8-dot 면 2
- (nullable NSString *)brailleBackTranslate:(NSString *)brailleText
                                   language:(int)language
                                      grade:(int)grade
                                  pinOption:(NSInteger)pinOption;

/// 묵자(print) → braille(Unicode U+2800–U+28FF) 순방향 변환.
/// liblouis 의 lou_translateString 을 호출 — `getLanguageKey` / `getTranslateTable` 로 테이블 선택.
/// `brailleTranslator:` 와 달리 wordwrap 후처리를 건너뛰고 raw Unicode 점자를 그대로 반환한다.
/// 수식(UEB G1, 영문) 점역 등 줄바꿈 제어가 외부(`wrapBrailleTo20`)에서 따로 이뤄지는 경로 전용.
/// 실패 시 nil 반환.
/// @param inputText 입력 묵자 문자열 (예: "1/2", "x^2", "sqrt(x)")
/// @param language LanguageName enum (ENGLISH=0x5 등)
/// @param grade 1: g1 (수식 권장), 2: g2 contracted
/// @param pinOption 6-dot 면 1, 8-dot 면 2
- (nullable NSString *)brailleForwardTranslate:(NSString *)inputText
                                       language:(int)language
                                          grade:(int)grade
                                      pinOption:(NSInteger)pinOption;

@end

NS_ASSUME_NONNULL_END
