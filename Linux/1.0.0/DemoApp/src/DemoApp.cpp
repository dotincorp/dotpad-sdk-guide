#include <iostream>
#include "../lib/dotpad_sdk-1.0.0.h"

class ExternalSender : public SendDataProtocol {
public:
    void sendDataFunc(DataCodes dataCode, const std::string& dataStr) override {
        // Handle the callback event
        std::cout << "Received dataCode: " << int(dataCode) << ", dataStr: " << dataStr << std::endl;
    }
};

int main()
{
    // 20셀 디바이스 (ttyUSB0)
    const char* device = "/dev/ttyUSB0";
    DotAPI* dotAPI = new DotAPI();
    
    int fd = dotAPI->connect(device);
    printf("* serial port = %d\n", fd);
    if (fd < 0) { 
        delete dotAPI;
        return 1; 
    }

    ExternalSender externalSender;
    dotAPI->setSendDataProtocol(&externalSender);
    
    // default Korea
    // dotAPI->setBrailleLanguage(LanguageCode::Korean);
    // dotAPI->setBrailleLanguageGrade(2);

    std::string input;
    while (true) {
        std::cout << "Enter 'close' to exit: ";
        std::getline(std::cin, input);
        if (input == "close") {
            break;
        } else if (input == "refresh") {
            dotAPI->setRefresh(3, 1000);
        } else if (input == "next") {
            dotAPI->displayTextDataNext();
        } else if (input == "prev") {
            dotAPI->displayTextDataPrev();
        } else {
            dotAPI->displayTextData(input.data());
        }
    }

    // 소켓 닫기
    delete dotAPI;

    return 0;
}