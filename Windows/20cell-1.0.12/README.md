# 20Cell-1.0.12 for Windows

## Change history
* Add key callback function

## C++ Sample Source
// DotCell.dll의 정의된 콜백 함수 선언
DOT_CELL_REGISTER_KEY_CALLBACK_FUNC dot_cell_register_key_callback

// 콜백을 받을 함수 선언
void CALLBACK DisplayDialogBoxByKeyNoti(const int key);

//선언한 콜백함수에 콜백을 받을 함수를 적용
dot_cell_register_key_callback(DisplayDialogBoxByKeyNoti);


//콜백 받을 함수를 정의
void CALLBACK DisplayDialogBoxByKeyNoti(const int key) {
// 이곳에 필요한 기능 구현
CString msg;
msg.Format(_T("Key: %X"), key);
if (key != 0) {
AfxMessageBox(msg);
}
}
