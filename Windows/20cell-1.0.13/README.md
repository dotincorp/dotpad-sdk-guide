# 20Cell for Windows (ver 1.0.13)

## Change history
* Added 20-cell button key callback function (2024.02.27)
* Added retry_interval (2024.04.08)
* Added japanese language (2024.10.08)

## C++ Sample Source
* 헤더파일 
```
// DotCell.dll의 정의된 콜백 함수 선언
DOT_CELL_REGISTER_KEY_CALLBACK_FUNC dot_cell_register_key_callback

// 콜백을 받을 함수 선언
void CALLBACK DisplayDialogBoxByKeyNoti(const int key);
```

* 본문파일
```
// 선언한 콜백함수에 콜백을 받을 함수를 적용
dot_cell_register_key_callback(DisplayDialogBoxByKeyNoti);

// 콜백 받을 함수를 정의
void CALLBACK DisplayDialogBoxByKeyNoti(const int key) {
    // key값 : 1(위클릭), 2(아래클릭), 0(키업)
}
```

* DotCellApp.ini 파일
```
// Cell retry interval time 0.1s
retry_interval=100
```

* Japanese language
```
The ipadic folder, which contains the necessary subfiles, must be located in the same directory as TTBEngine.dll.
```