# Kiểm tra dữ liệu Excel

- File: `Laptop_data.xlsx`
- Sheet đầu tiên: 50 dòng sản phẩm, 12 cột.
- Mã sản phẩm trùng trong file: 0.

| Cột | Kiểu pandas | Thiếu dữ liệu |
|---|---|---|
| STT | int64 | 0 |
| Mã sản phẩm | str | 0 |
| Tên sản phẩm | str | 0 |
| Giá sản phẩm | int64 | 0 |
| Nhãn hàng | str | 0 |
| CPU | str | 0 |
| GPU | str | 0 |
| RAM | int64 | 0 |
| Trọng lượng | object | 0 |
| Dung lượng bộ nhớ | str | 0 |
| Màu sắc | str | 0 |
| Màn hình | str | 0 |

## Nhãn hàng

- Dell: 15
- Acer: 12
- ASUS: 8
- HP: 7
- Lenovo: 4
- Gigabyte: 2
- MSI: 1
- Apple: 1

## Quan sát và quyết định

- Giá gốc là số VND; RAM gốc là GB dạng số.
- Trọng lượng trộn số thực và chuỗi tiếng Việt, có dấu phẩy thập phân và mô tả phạm vi.
- Storage chứa đơn vị GB/TB và loại ổ; quy ước 1 TB = 1024 GB.
- Màn hình gồm kích thước, độ phân giải, OLED và tần số quét tùy dòng. Không tự đoán thông số vắng mặt.
- Có 7 dòng GPU chưa xác minh.
- Giữ dữ liệu gốc trong products.raw_data và các trường *_raw; cảnh báo ở normalization_notes.
- Import thực tế ban đầu: 50 thêm mới, 0 thất bại, 0 mã trùng.
- Chỉ nhập file được chỉ định; các file khác trong thư mục không tự động được gộp.
