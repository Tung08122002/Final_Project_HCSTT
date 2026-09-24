# Báo cáo kiểm thử

Ngày thực hiện: **17/09/2026**, cập nhật **24/09/2026**. Môi trường Windows, Python **3.13.12**, Node.js **24.19.0**, SQLite built-in. File gốc `Laptop_data.xlsx` được giữ nguyên.

| Kiểm tra | Kết quả |
|---|---|
| Đọc Excel thực tế | 50 dòng, 12 cột, 8 nhãn hàng, 0 mã trùng |
| Import lần đầu | 50 created, 0 failed |
| Import lại qua API/UI | 50 updated; không tạo sản phẩm trùng |
| Import chế độ bỏ qua | 50 skipped |
| Pytest | **60 passed**, 1.57 giây |
| Ruff check | **All checks passed** |
| Ruff format | **Pass** |
| TypeScript + Vite production build | **Pass**, 1594 modules; JS ~344 kB, gzip ~101 kB |
| Playwright Chromium | **11 passed**, 20.1 giây; backend/frontend kiểm thử riêng tại :8011/:5174 |
| Migration lịch sử | Giữ nguyên 9 phiên cũ, logs, 50 laptop và tri thức; thêm owner_id, backup tự động, SQLite integrity_check = ok |
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
- Tách lịch sử Admin và hai UUID User: kiểm tra danh sách, phân trang, tổng số, dashboard và truy cập trực tiếp chi tiết phiên khác trả 404; thiếu định danh hoặc UUID sai trả 422.
- Xóa nhiều phiên Admin theo sở hữu trong một giao dịch; ID rỗng/sai/thuộc User không xóa dở danh sách; User gọi xóa trả 403; logs của phiên bị xóa được dọn, phiên User khác vẫn giữ nguyên.
- Excel mẫu tải về đúng MIME/tên file, một sheet, chỉ một dòng chứa 12 header khớp file gốc; điền thêm một laptop vào mẫu rồi import thành công.
- Migration SQLite cũ giữ ID và snapshot, tạo backup trước ALTER; chạy lại không tạo backup trùng và có index cho owner_id.

Tests backend dùng SQLite in-memory riêng và thay lifespan để không tác động database demo. Có **2 cảnh báo deprecation từ Starlette/AnyIO** về httpx và BlockingPortal; không có test thất bại.

## Trình duyệt

1. Dashboard → tư vấn gaming → đề xuất → trace → Working Memory → điểm từng tiêu chí → lịch sử.
2. Tạo laptop trong Quản lý sản phẩm → sửa giá → mở Danh sách laptop → chọn một laptop ở vai trò Quản trị demo → hủy và xác nhận xóa bằng nút Xóa đã chọn.
3. Chọn hai laptop trong Danh sách laptop → nút xóa hàng loạt xuất hiện → hủy giữ nguyên → xác nhận xóa cả hai.
4. Dropdown Đổi tài khoản → chuyển Quản trị demo/Người dùng; phân trang 100 trang hiển thị số đầu/cuối và dấu `…`, mở trực tiếp trang 100.
5. Visual Rule Builder → nhập giá trị VND có dấu phân nhóm → lưu → tắt → nhân bản; xác nhận không còn nút Kiểm thử và dọn luật tạm.
6. Thêm/sửa thuộc tính → help → mobile 390×844 → menu → tư vấn; kiểm tra không tràn chiều ngang toàn trang.
7. Chọn Excel → import lại → báo cáo 50 thành công.
8. Tạo 17 phiên Admin trên DB kiểm thử → chọn toàn bộ trang 1 và một phiên trang 2 → hủy → xác nhận xóa 16 phiên → kiểm tra phiên không được chọn còn nguyên.
9. User lưu phiên riêng, tải lại trang vẫn thấy và xuất JSON đúng phiên; đổi Admin/User cập nhật lịch sử; trình duyệt thứ hai có UUID khác và không thấy phiên của User thứ nhất.
10. Admin thấy dữ liệu Excel gốc trong chi tiết laptop, User không thấy; cả trang Help và popup chỉ có 2 mục cho User, Admin có 13 mục; header giữ top=0 khi cuộn ở 1440px và 390px, không tràn trang theo chiều ngang.
11. Tải file Excel mẫu qua giao diện nhận đúng file `.xlsx`.

Đã kiểm tra ngân sách/giá tự phân nhóm ba chữ số trong giao diện nhưng request tư vấn vẫn gửi số VND thuần; lịch sử và luật hiển thị tiền có dấu phân nhóm. Đã sửa liên kết label–control để dropdown có nhãn rõ ràng, đồng thời kiểm tra modal, điều hướng và JavaScript errors trong luồng tư vấn.

Ảnh minh họa từ các lần kiểm tra trước: [Dashboard](dashboard.png), [Working Memory](inference.png), [Mobile](mobile.png). Lần kiểm tra mới lưu ảnh riêng tại `frontend/test-results`; đã xem thêm ảnh màn hình hướng dẫn User và chọn lịch sử Admin.

Lần kiểm tra 24/09 chạy Playwright với database riêng `.runtime/history-check-20260924/test.db`, không import hoặc xóa phiên trên database người dùng. Database thật chỉ được migration chủ sở hữu; đã đối chiếu với bản sao lưu: bảng products, rules, attributes, inference_logs và toàn bộ nội dung snapshot của 9 phiên cũ không đổi. Các phiên cũ thuộc `demo-admin` vì dữ liệu trước đây không lưu chủ sở hữu. API/ứng dụng demo tại :8000/:5173 tiếp tục hoạt động.

## Giới hạn xác minh

Đã kiểm tra Chromium desktop/mobile giả lập; chưa xác minh Safari, Firefox, nhiều người dùng đồng thời, PostgreSQL hoặc deployment public. Demo role switch chưa phải lớp phân quyền bảo mật. Phân hạng GPU là heuristic, chưa xác thực bằng benchmark.
