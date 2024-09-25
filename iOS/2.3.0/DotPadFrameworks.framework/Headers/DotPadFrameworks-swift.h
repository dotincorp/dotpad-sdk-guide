#import <Foundation/Foundation.h>

#define NUM_USER_OPT 9

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
    MONGOLIAN = 0x23
} LanguageName;

NS_ASSUME_NONNULL_BEGIN

@interface Louis : NSObject
@property (strong, nonatomic) NSDictionary *languageTable;

- (int)brailleTranslator:(NSString *)input output:(uint8_t*)output options:(int[NUM_USER_OPT])options pinOption:(NSInteger) pinOption translateOption:(NSInteger) translateOption;

@end

NS_ASSUME_NONNULL_END
