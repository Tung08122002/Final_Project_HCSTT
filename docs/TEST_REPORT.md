# Báo cáo kiểm thử

Ngày thực hiện: **17/09/2026**, cập nhật **21/09/2026**. Môi trường Windows, Python **3.13.12**, Node.js **24.19.0**, SQLite built-in. File gốc `Laptop_data.xlsx` được giữ nguyên.

| Kiểm tra | Kết quả |
|---|---|
| Đọc Excel thực tế | 50 dòng, 12 cột, 8 nhãn hàng, 0 mã trùng |
| Import lần đầu | 50 created, 0 failed |
| Import lại qua API/UI | 50 updated; không tạo sản phẩm trùng |
| Import chế độ bỏ qua | 50 skipped |
| Pytest | **55 passed**, 1.17 giây |
| Ruff check | **All checks passed** |
| Ruff format | **Pass** |
| TypeScript + Vite production build | **Pass**, 1593 modules; JS ~319 kB, gzip ~95 kB |
| Playwright Chromium | **7 passed**, 21.2 giây |
| API health, frontend HTTP | Hoạt động tại 127.0.0.1:8000 và :5173 |
| Script local | Đã kiểm tra dừng đúng các process dự án và khởi động lại hai dịch vụ |

## Backend

- Gaming medium → min_ram=16 và require_dedicated_gpu=true; fact mới kích hoạt R026.
- Office không fire luật gaming.
- AND, OR trong nhóm và giữa nhóm; numeric comparison, IN, NOT IN, CONTAINS.
- Fact vắng mặt không được coi là bằng chứng của phủ định.
- Conflict resolution theo priority, specificity và mã luật; log đầy đủ conflict set.
- Chống fire trùng, circular reasoning, giới hạn iterations; no-op không dừng luật còn lại.
- Gộp max/min/or, giữ immutable initial input; luật bị tắt không chạy.
- Seed rules hợp lệ với metadata thuộc tính.
- Chuẩn hóa dữ liệu Việt, TB/GB, trọng lượng, màn hình; không đoán GPU/tần số quét thiếu.
- Product/Rule/Attribute CRUD, unique, unknown attribute/operator, invalid type, bảo vệ dependency.
- Xóa hàng loạt laptop theo ID trong một giao dịch; ID không hợp lệ hoặc đã mất không xóa dở danh sách.
- Thêm thuộc tính và rule mới → fact mới tham gia matching mà không sửa source.
- Import file thật, duplicate rows, reimport/update/skip, partial failures và giữ raw data.
- Ngân sách bắt buộc, GPU unknown không nhận điểm, kiểm tra trực tiếp yêu cầu GPU rời, false không cấm GPU rời.
- Consultation snapshot và inference trace giữ nguyên sau xóa luật và sản phẩm.

Tests backend dùng SQLite in-memory riêng và thay lifespan để không tác động database demo. Có **2 cảnh báo deprecation từ Starlette/AnyIO** về httpx và BlockingPortal; không có test thất bại.

## Trình duyệt

1. Dashboard → tư vấn gaming → đề xuất → trace → Working Memory → điểm từng tiêu chí → lịch sử.
2. Tạo laptop trong Quản lý sản phẩm → sửa giá → mở Danh sách laptop → chọn một laptop ở vai trò Quản trị demo → hủy và xác nhận xóa bằng nút Xóa đã chọn.
3. Chọn hai laptop trong Danh sách laptop → nút xóa hàng loạt xuất hiện → hủy giữ nguyên → xác nhận xóa cả hai.
4. Dropdown Đổi tài khoản → chuyển Quản trị demo/Người dùng; phân trang 100 trang hiển thị số đầu/cuối và dấu `…`, mở trực tiếp trang 100.
5. Visual Rule Builder → nhập giá trị VND có dấu phân nhóm → lưu → tắt → nhân bản; xác nhận không còn nút Kiểm thử và dọn luật tạm.
6. Thêm/sửa thuộc tính → help → mobile 390×844 → menu → tư vấn; kiểm tra không tràn chiều ngang toàn trang.
7. Chọn Excel → import lại → báo cáo 50 thành công.

Đã kiểm tra ngân sách/giá tự phân nhóm ba chữ số trong giao diện nhưng request tư vấn vẫn gửi số VND thuần; lịch sử và luật hiển thị tiền có dấu phân nhóm. Đã sửa liên kết label–control để dropdown có nhãn rõ ràng, đồng thời kiểm tra modal, điều hướng và JavaScript errors trong luồng tư vấn.

Ảnh chụp bản chạy thực tế: [Dashboard](dashboard.png), [Working Memory](inference.png), [Mobile](mobile.png).

Playwright dùng database demo đang chạy, giữ các phiên tư vấn demo để có lịch sử minh họa. Sản phẩm, thuộc tính và luật tạm được dọn sau các bài đã pass; catalog cuối có 50 laptop, 26 thuộc tính, 30 luật. Có thể tái chạy theo hướng dẫn README; nên dùng DB riêng nếu không muốn reimport đè dữ liệu đang chỉnh sửa.

## Giới hạn xác minh

Đã kiểm tra Chromium desktop/mobile giả lập; chưa xác minh Safari, Firefox, nhiều người dùng đồng thời, PostgreSQL hoặc deployment public. Demo role switch chưa phải lớp phân quyền bảo mật. Phân hạng GPU là heuristic, chưa xác thực bằng benchmark.
