#include <liblouis.h>

#include <stdarg.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
 * A small UTF-8 boundary for the browser build. Keeping the conversion here
 * means JavaScript does not need to know whether liblouis was built with a
 * 16-bit or 32-bit widechar type.
 */

static char g_last_error[256];
static char *g_result;
static size_t g_result_capacity;

static void set_error(const char *format, ...) {
    va_list args;
    va_start(args, format);
    vsnprintf(g_last_error, sizeof(g_last_error), format, args);
    va_end(args);
}

static int reserve_result(size_t required) {
    char *buffer;

    if (required <= g_result_capacity) return 1;

    buffer = (char *)realloc(g_result, required);
    if (!buffer) {
        set_error("Not enough memory for the translation result.");
        return 0;
    }

    g_result = buffer;
    g_result_capacity = required;
    return 1;
}

static uint32_t decode_utf8(const unsigned char *text, size_t length,
                            size_t *offset) {
    const unsigned char first = text[*offset];
    uint32_t codepoint;
    size_t extra;
    uint32_t minimum;

    if (first < 0x80) {
        ++*offset;
        return first;
    }
    if ((first & 0xe0) == 0xc0) {
        codepoint = first & 0x1f;
        extra = 1;
        minimum = 0x80;
    } else if ((first & 0xf0) == 0xe0) {
        codepoint = first & 0x0f;
        extra = 2;
        minimum = 0x800;
    } else if ((first & 0xf8) == 0xf0) {
        codepoint = first & 0x07;
        extra = 3;
        minimum = 0x10000;
    } else {
        ++*offset;
        return 0xfffd;
    }

    if (*offset + extra >= length) {
        ++*offset;
        return 0xfffd;
    }

    for (size_t i = 1; i <= extra; ++i) {
        const unsigned char next = text[*offset + i];
        if ((next & 0xc0) != 0x80) {
            ++*offset;
            return 0xfffd;
        }
        codepoint = (codepoint << 6) | (next & 0x3f);
    }

    *offset += extra + 1;
    if (codepoint < minimum || codepoint > 0x10ffff ||
        (codepoint >= 0xd800 && codepoint <= 0xdfff)) {
        return 0xfffd;
    }
    return codepoint;
}

static widechar *utf8_to_widechars(const char *text, int *out_length) {
    const size_t bytes = strlen(text);
    const unsigned char *input = (const unsigned char *)text;
    widechar *result = (widechar *)malloc((bytes + 1) * sizeof(widechar));
    const int widechar_bytes = lou_charSize();
    size_t offset = 0;
    int length = 0;

    if (!result) {
        set_error("Not enough memory for the input text.");
        return NULL;
    }

    while (offset < bytes) {
        uint32_t codepoint = decode_utf8(input, bytes, &offset);
        if (widechar_bytes == 2 && codepoint > 0xffff) {
            const uint32_t pair = codepoint - 0x10000;
            result[length++] = (widechar)(0xd800 + (pair >> 10));
            result[length++] = (widechar)(0xdc00 + (pair & 0x3ff));
        } else {
            result[length++] = (widechar)codepoint;
        }
    }

    *out_length = length;
    return result;
}

static size_t append_utf8(char *out, size_t offset, uint32_t codepoint) {
    if (codepoint < 0x80) {
        out[offset++] = (char)codepoint;
    } else if (codepoint < 0x800) {
        out[offset++] = (char)(0xc0 | (codepoint >> 6));
        out[offset++] = (char)(0x80 | (codepoint & 0x3f));
    } else if (codepoint < 0x10000) {
        out[offset++] = (char)(0xe0 | (codepoint >> 12));
        out[offset++] = (char)(0x80 | ((codepoint >> 6) & 0x3f));
        out[offset++] = (char)(0x80 | (codepoint & 0x3f));
    } else {
        out[offset++] = (char)(0xf0 | (codepoint >> 18));
        out[offset++] = (char)(0x80 | ((codepoint >> 12) & 0x3f));
        out[offset++] = (char)(0x80 | ((codepoint >> 6) & 0x3f));
        out[offset++] = (char)(0x80 | (codepoint & 0x3f));
    }
    return offset;
}

static const char *widechars_to_utf8(const widechar *input, int length,
                                     int forward) {
    const int widechar_bytes = lou_charSize();
    size_t offset = 0;

    /* Four bytes per widechar covers UTF-8 and leaves room for the NUL byte. */
    if (!reserve_result((size_t)length * 4 + 1)) return NULL;

    for (int i = 0; i < length; ++i) {
        uint32_t codepoint;

        if (forward) {
            /* lou_translate returns a cell bit-mask, not a U+28xx character. */
            codepoint = 0x2800 | ((uint32_t)input[i] & 0xff);
        } else {
            codepoint = (uint32_t)input[i];
            if (widechar_bytes == 2 && codepoint >= 0xd800 &&
                codepoint <= 0xdbff && i + 1 < length) {
                const uint32_t low = (uint32_t)input[i + 1];
                if (low >= 0xdc00 && low <= 0xdfff) {
                    codepoint = 0x10000 + ((codepoint - 0xd800) << 10) +
                                (low - 0xdc00);
                    ++i;
                }
            }
            if (codepoint >= 0xd800 && codepoint <= 0xdfff) codepoint = 0xfffd;
        }

        offset = append_utf8(g_result, offset, codepoint);
    }
    g_result[offset] = '\0';
    return g_result;
}

/* Exported from the module; the JavaScript facade calls this after .data loads. */
int ll_set_data_path(const char *path) {
    if (!path || !*path) {
        set_error("The liblouis table path must not be empty.");
        return 0;
    }

    if (setenv("LOUIS_TABLEPATH", path, 1) != 0) {
        set_error("Could not set the liblouis table path.");
        return 0;
    }
    g_last_error[0] = '\0';
    return 1;
}

/*
 * direction: 0 = print text to Unicode braille, 1 = Unicode braille to text.
 * The returned pointer remains valid until the next ll_translate call.
 */
const char *ll_translate(const char *table, const char *text, int direction) {
    widechar *input = NULL;
    widechar *output = NULL;
    char *unicode_table = NULL;
    const char *table_list = table;
    int input_length;
    int output_capacity;
    const char *result = NULL;

    g_last_error[0] = '\0';
    if (!table || !*table || !text || (direction != 0 && direction != 1)) {
        set_error("A table, text, and valid direction are required.");
        return NULL;
    }

    /*
     * lou_backTranslate treats its input as characters in the display table.
     * Keeping U+2800..U+28ff intact and putting unicode.dis first therefore
     * makes the JavaScript API consistently accept Unicode braille in both
     * directions. Without it, input is interpreted as a legacy display
     * encoding (for example Braille ASCII) rather than Unicode braille.
     */
    if (strncmp(table, "unicode.dis,", 12) != 0) {
        const size_t bytes = strlen(table) + sizeof("unicode.dis,");
        unicode_table = (char *)malloc(bytes);
        if (!unicode_table) {
            set_error("Not enough memory for the table list.");
            return NULL;
        }
        snprintf(unicode_table, bytes, "unicode.dis,%s", table);
        table_list = unicode_table;
    }

    input = utf8_to_widechars(text, &input_length);
    if (!input) goto done;

    /* Indicators can expand one input character into several cells. */
    output_capacity = input_length * 8 + 64;
    for (int attempt = 0; attempt < 4; ++attempt) {
        int translated_input_length = input_length;
        int output_length = output_capacity;
        int translated;

        output = (widechar *)malloc((size_t)output_capacity * sizeof(widechar));
        if (!output) {
            set_error("Not enough memory for the translation buffer.");
            goto done;
        }

        translated = direction == 0
            ? lou_translate(table_list, input, &translated_input_length, output,
                            &output_length, NULL, NULL, 0, 0, 0, 0)
            : lou_backTranslate(table_list, input, &translated_input_length,
                                output, &output_length, NULL, NULL, 0, 0, 0,
                                dotsIO | ucBrl);

        if (translated) {
            result = widechars_to_utf8(output, output_length, direction == 0);
            goto done;
        }

        free(output);
        output = NULL;
        output_capacity *= 2;
    }

    set_error("liblouis could not translate with table '%s'.", table_list);

done:
    free(output);
    free(input);
    free(unicode_table);
    return result;
}

const char *ll_last_error(void) {
    return g_last_error;
}
