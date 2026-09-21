import { BookOpen, ArrowRight } from "lucide-react";
const entries = [
  [
    "Cách tư vấn laptop",
    "Mở Tư vấn laptop, nhập ngân sách và mục đích. Số tiền được tự phân nhóm, ví dụ 30000000 hiển thị thành 30.000.000 VND. Các cấu hình khác có thể để trống. Nhấn Tìm laptop phù hợp. Xem chi tiết để đọc điểm từng tiêu chí; Xem cách suy luận để xem luật đã áp dụng.",
  ],
  [
    "Cách tìm laptop",
    "Mở Danh sách laptop. Tìm theo tên, mã, CPU hoặc GPU; dùng gợi ý nhãn hàng và sắp xếp giá. Danh mục có phân trang. Ở vai trò Quản trị demo, đánh dấu một hoặc nhiều laptop (có thể ở các trang khác nhau), sau đó nhấn Xóa đã chọn và xác nhận.",
  ],
  [
    "Thêm, sửa và xóa sản phẩm",
    "Ở chế độ Quản trị demo, mở Quản lý sản phẩm. Nhấn Thêm laptop hoặc biểu tượng bút để sửa. Giá, RAM và trọng lượng không được âm. Xóa cần xác nhận và không làm mất bản chụp trong lịch sử.",
  ],
  [
    "Import Excel",
    "Chọn tệp .xlsx có đủ 12 cột theo trang Import dữ liệu. Bật cập nhật để ghi đè các mã đã tồn tại; tắt để bỏ qua. Đọc báo cáo dòng lỗi và cảnh báo chuẩn hóa. Dữ liệu gốc được giữ lại.",
  ],
  [
    "Tạo luật IF–THEN",
    "Vào Luật suy diễn → Tạo luật mới. Chọn thuộc tính, toán tử và giá trị ở IF; chọn fact kết luận và giá trị ở THEN. Thêm điều kiện vào cùng nhóm AND/OR hoặc nhóm khác, đặt priority rồi lưu. Mở Tư vấn laptop để xem luật được áp dụng trong dấu vết suy luận.",
  ],
  [
    "Bổ sung tri thức và allowed values",
    "Vào Thu nhận tri thức để tạo thuộc tính. Thuộc tính enum cần allowed values. Chọn trường sản phẩm và toán tử để fact tham gia matching, hoặc để trống cho fact trung gian. Tạo luật mới tham chiếu thuộc tính đó. Form tư vấn có Facts bổ sung để nhập tri thức mở rộng.",
  ],
  [
    "Fact và Working Memory là gì?",
    "Fact là cặp tên–giá trị, ví dụ purpose = gaming. Working Memory là bộ facts của một phiên, bắt đầu từ yêu cầu người dùng và thay đổi khi luật tạo hoặc gộp facts. Nó được lưu riêng cho từng phiên.",
  ],
  [
    "Forward Chaining là gì?",
    "Suy diễn tiến bắt đầu từ facts đã biết, kiểm tra tất cả luật đang bật và chưa chạy, chọn một luật khớp, sinh facts rồi lặp lại. Facts mới có thể kích hoạt luật khác: require_dedicated_gpu = true → preferred_gpu_type = dedicated.",
  ],
  [
    "Conflict Set và chọn luật",
    "Conflict Set chứa các luật cùng khớp. Hệ thống chọn priority cao hơn, rồi nhiều điều kiện hơn, rồi rule_code tăng dần. Mỗi luật chạy tối đa một lần; có giới hạn vòng lặp. Luật không sinh facts vẫn được đánh dấu đã chạy và tiếp tục xét luật khác.",
  ],
  [
    "Giải quyết kết luận khác nhau",
    "Thuộc tính dùng chiến lược first, max, min hoặc or. first giữ giá trị xuất hiện trước (ưu tiên đầu vào); max lấy RAM/dung lượng cao hơn, min lấy giới hạn trọng lượng thấp hơn, or giữ yêu cầu true. Trace ghi giá trị đề xuất và giá trị thực sự giữ lại.",
  ],
  [
    "Đọc kết quả và điểm phù hợp",
    "Ngân sách cùng hãng/CPU/màu là ràng buộc bắt buộc. Cấu hình là tiêu chí mềm, laptop thiếu một phần vẫn có thể xuất hiện với đánh đổi rõ ràng. Dữ liệu chưa xác minh không nhận điểm. Điểm dùng các nhóm có yêu cầu rồi chuẩn hóa về 100; đây là điểm đáp ứng tiêu chí, không phải xác suất hoặc benchmark.",
  ],
  [
    "Lịch sử và explanation",
    "Mở Lịch sử suy diễn → Chi tiết. Xem initial/final facts, conflict sets, luật, facts mới và kết quả. Có thể tải JSON. Snapshot giữ nguyên kết quả lịch sử khi luật hay sản phẩm thay đổi.",
  ],
  [
    "Phạm vi phiên bản demo",
    "Chuyển vai trò chỉ thay đổi giao diện, không phải xác thực hay phân quyền bảo mật. Chạy trên máy local. Giá lấy từ file, không cập nhật trực tuyến. Phân loại GPU là heuristic có giới hạn; dữ liệu thiếu hoặc trọng lượng tham khảo cần kiểm chứng. score_delta được lưu để mở rộng nhưng không tác động công thức điểm hiện tại.",
  ],
];
export default function Help({ compact = false }: { compact?: boolean }) {
  return (
    <>
      {!compact && (
        <div className="page-heading">
          <div>
            <div className="eyebrow">HƯỚNG DẪN & GIẢI THÍCH</div>
            <h1>Hiểu cách hệ thống hoạt động</h1>
            <p>Hướng dẫn sử dụng và các khái niệm trong hệ cơ sở tri thức.</p>
          </div>
          <BookOpen size={28} />
        </div>
      )}
      <section className="panel mb-5">
        <h3 className="mb-4">Kiến trúc Knowledge-Based System</h3>
        <div className="architecture-flow">
          {[
            "User input",
            "Initial facts",
            "Working memory",
            "Rule base",
            "Forward chaining",
            "New facts",
            "Technical requirements",
            "Product database",
            "Product matching",
            "Scoring",
            "Recommendation",
            "Explanation",
          ].map((s, i) => (
            <span key={s}>
              <b>{s}</b>
              {i < 11 && <ArrowRight size={14} />}
            </span>
          ))}
        </div>
      </section>
      <div className="help-list">
        {entries.map(([title, text], i) => (
          <details key={title} className="panel" open={i === 0}>
            <summary>
              <span className="number-chip">{i + 1}</span>
              {title}
            </summary>
            <p>{text}</p>
          </details>
        ))}
      </div>
    </>
  );
}
