import { BookOpen, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type Guide = { title: string; content: ReactNode };

export default function Help({
  compact = false,
  admin = false,
}: {
  compact?: boolean;
  admin?: boolean;
}) {
  const entries: Guide[] = [
    {
      title: "Cách tư vấn laptop",
      content: (
        <>
          <p>
            Chức năng này gợi ý laptop theo ngân sách và công việc bạn cần làm.
            Mỗi đề xuất có phần giải thích để bạn hiểu vì sao máy phù hợp và cần
            cân nhắc điều gì.
          </p>
          <h4>Bước 1 — Nhập nhu cầu</h4>
          <ol>
            <li>
              Mở <strong>Tư vấn laptop</strong> ở menu bên trái. Trên điện
              thoại, nhấn biểu tượng menu ở góc trên bên trái trước.
            </li>
            <li>
              Điền <strong>Ngân sách tối thiểu</strong> và{" "}
              <strong>Ngân sách tối đa</strong> bằng VND. Nhập{" "}
              <mark>20000000 → 20.000.000 VND</mark>; hệ thống tự thêm dấu phân
              cách. Nếu chỉ muốn giới hạn giá cao nhất, để mức tối thiểu bằng{" "}
              <strong>0</strong>. Mức tối đa phải lớn hơn hoặc bằng mức tối
              thiểu.
            </li>
            <li>
              Chọn <strong>Mục đích chính</strong> gần nhất với công việc của
              bạn: học tập, văn phòng, lập trình, gaming, thiết kế đồ họa, dựng
              video, AI / Data Science hoặc kỹ thuật. Nếu có nhu cầu thứ hai,
              chọn thêm <strong>Mục đích phụ</strong>.
            </li>
            <li>
              Chọn <strong>Mức độ chơi game</strong> nếu có chơi game và{" "}
              <strong>Nhu cầu di chuyển</strong> theo thực tế. Ví dụ: thường
              xuyên mang máy đi học hoặc đi làm thì chọn{" "}
              <strong>Thường xuyên</strong>.
            </li>
          </ol>
          <h4>Bước 2 — Bổ sung cấu hình nếu bạn đã có yêu cầu</h4>
          <p>
            Trong <strong>Ưu tiên cấu hình</strong>, bạn có thể chọn RAM tối
            thiểu, dung lượng ổ lưu trữ, trọng lượng tối đa, loại/hãng GPU và
            tần số quét màn hình. Nếu chưa biết nên chọn gì, để{" "}
            <strong>Không yêu cầu</strong>; hệ thống sẽ bổ sung các tiêu chí từ
            nhu cầu đã nhập.
          </p>
          <ul>
            <li>
              <strong>RAM và ổ lưu trữ:</strong> đơn vị GB; lựa chọn 1 TB tương
              ứng 1024 GB trong hệ thống.
            </li>
            <li>
              <strong>Trọng lượng:</strong> đơn vị kg.{" "}
              <strong>Tần số quét:</strong> đơn vị Hz, chẳng hạn 120 Hz.
            </li>
            <li>
              Mở <strong>Lựa chọn chi tiết từ danh mục</strong> nếu cần chọn
              hãng, CPU, GPU, màu hoặc màn hình cụ thể. Gõ để thấy gợi ý, nhấn
              vào gợi ý phù hợp; xóa lựa chọn nếu muốn mở rộng tìm kiếm.
            </li>
            <li>
              <strong>Facts bổ sung từ tri thức mở rộng</strong> dành cho yêu
              cầu đã được quản trị viên bổ sung. Chọn thuộc tính rồi nhập giá
              trị đúng kiểu. Có thể nhấn dấu × trên một giá trị để bỏ yêu cầu
              đó.
            </li>
          </ul>
          <div className="help-callout">
            <strong>Ví dụ dễ bắt đầu:</strong> ngân sách 0–30.000.000 VND, mục
            đích Lập trình, di chuyển Vừa phải. Chạy tư vấn trước; sau đó thêm
            RAM 16 GB hoặc yêu cầu khác để so sánh kết quả.
          </div>
          <h4>Bước 3 — Tìm và đọc kết quả</h4>
          <ol>
            <li>
              Nhấn <strong>Tìm laptop phù hợp</strong> và chờ xử lý. Hệ thống
              hiển thị tối đa 6 đề xuất cùng giá, cấu hình và điểm phù hợp.
            </li>
            <li>
              Nhấn <strong>Xem chi tiết &amp; điểm phù hợp</strong> để xem từng
              tiêu chí: yêu cầu, thông số thực tế, trạng thái{" "}
              <strong>Đạt / Chưa đạt / Chưa rõ</strong> và điểm nhận được.
            </li>
            <li>
              Đọc phần <strong>Có tiêu chí cần cân nhắc</strong> trước khi quyết
              định. Máy vẫn có thể được gợi ý khi chưa đạt một số yêu cầu cấu
              hình; giá phải nằm trong khoảng ngân sách đã nhập.
            </li>
            <li>
              Nhấn <strong>Xem cách suy luận</strong> để xem các luật đã áp dụng
              và các yêu cầu được tạo thêm. Trong cửa sổ này,{" "}
              <strong>Working Memory</strong> thể hiện những thông tin hệ thống
              đang sử dụng cho phiên tư vấn.
            </li>
          </ol>
          <div className="help-callout">
            <strong>Điểm phù hợp không phải điểm hiệu năng máy.</strong> Điểm
            100% nghĩa là đáp ứng các tiêu chí đang được chấm trong phiên này;
            không bảo đảm đáp ứng mọi nhu cầu ngoài các thông tin đã cung cấp.
            Thông số <strong>Chưa rõ</strong> không được tính là đạt.
          </div>
          <h4>Nếu không có kết quả hoặc muốn tư vấn lại</h4>
          <p>
            Kiểm tra khoảng ngân sách, bỏ bớt lựa chọn hãng/CPU/màu quá cụ thể,
            hoặc điều chỉnh yêu cầu rồi nhấn tìm lại. Hệ thống{" "}
            <strong>không tự nâng ngân sách</strong>. Giá và cấu hình lấy từ
            danh mục, không cập nhật trực tiếp từ cửa hàng; nên đối chiếu thông
            tin của máy trước khi mua.
          </p>
          <h4>Xem lại phiên đã lưu</h4>
          <p>
            Mỗi lần tư vấn thành công sẽ được lưu. Mở{" "}
            <strong>Lịch sử suy diễn → Chi tiết</strong> để xem lại kết quả và
            cách suy luận; nhấn <strong>Xuất log JSON</strong> để tải bản ghi.
            Kết quả cũ giữ thông tin tại thời điểm tư vấn dù danh mục hoặc luật
            sau đó thay đổi.
          </p>
          <div className="help-callout">
            <strong>Lịch sử riêng:</strong> Admin và User có lịch sử tách biệt.
            Với User demo, hãy dùng lại cùng trình duyệt và địa chỉ web để xem
            các phiên trước. Trình duyệt khác, chế độ ẩn danh hoặc xóa dữ liệu
            trang web sẽ tạo một hồ sơ User khác; các phiên cũ không tự chuyển
            sang hồ sơ mới.
          </div>
        </>
      ),
    },
    {
      title: "Cách tìm laptop",
      content: (
        <>
          <p>
            <strong>Danh sách laptop</strong> giúp bạn chủ động tra cứu sản phẩm
            mà không cần chạy tư vấn.
          </p>
          <ol>
            <li>
              Mở <strong>Danh sách laptop</strong> từ menu. Nhập một phần tên,
              mã sản phẩm, CPU hoặc GPU vào ô tìm kiếm. Ví dụ: nhập{" "}
              <mark>RTX</mark> để tìm các dòng có thông tin GPU tương ứng.
            </li>
            <li>
              Dùng ô <strong>Nhãn hàng</strong> để thu hẹp danh sách. Nhập từ
              khóa rồi chọn gợi ý. Từ khóa tìm kiếm và nhãn hàng được áp dụng
              đồng thời; nếu danh sách trống, xóa bớt một điều kiện.
            </li>
            <li>
              Trong <strong>Sắp xếp</strong>, chọn thứ tự tên, giá tăng dần hoặc
              giá giảm dần theo nhu cầu. Giá hiển thị theo VND với dấu phân
              cách, ví dụ <strong>15.900.000 ₫</strong>.
            </li>
            <li>
              Cuộn xuống phần phân trang. Nhấn trực tiếp{" "}
              <strong>số trang</strong> để chuyển tới trang muốn xem hoặc dùng
              nút mũi tên để lùi/tiến một trang. Mỗi trang tối đa{" "}
              <strong>12 laptop</strong>. Dấu <strong>…</strong> cho biết còn
              các trang ở giữa và không phải nút bấm.
            </li>
            <li>
              Nhấn <strong>Xem chi tiết</strong> trên một laptop để xem CPU,
              GPU, RAM, ổ lưu trữ, trọng lượng, màn hình, tần số quét và màu
              sắc. Nhấn nút đóng hoặc phím <strong>Esc</strong> để trở lại danh
              sách.
            </li>
          </ol>
          <div className="help-callout">
            <strong>
              “Chưa xác minh” nghĩa là thiếu thông tin đáng tin cậy.
            </strong>{" "}
            Ví dụ, không có tần số quét không đồng nghĩa với màn hình 0 Hz. Hãy
            đối chiếu thông số với nhà cung cấp; không suy đoán từ tên laptop.
          </div>
          <p>
            <strong>Mẹo:</strong> khi thay đổi từ khóa, nhãn hàng hoặc cách sắp
            xếp, danh sách trở về trang 1. Header luôn ở đầu màn hình khi cuộn;
            bạn có thể mở <strong>Trợ giúp</strong> hoặc{" "}
            <strong>Đổi tài khoản</strong> tại đó.
          </p>
          {admin && (
            <div className="help-callout">
              <strong>Dành cho Admin:</strong> đánh dấu checkbox của từng laptop
              hoặc chọn tất cả trên trang hiện tại. Có thể chọn thêm ở các trang
              khác. Nút <strong>Xóa đã chọn</strong> xuất hiện khi có ít nhất
              một lựa chọn; kiểm tra danh sách trong hộp xác nhận trước khi xóa.{" "}
              <strong>Bỏ chọn tất cả</strong> giúp hủy toàn bộ lựa chọn.
            </div>
          )}
        </>
      ),
    },
    {
      title: "Thêm, sửa và xóa sản phẩm",
      content: (
        <>
          <ol>
            <li>
              Chọn <strong>Quản trị demo</strong> trong menu Đổi tài khoản, rồi
              mở <strong>Quản lý sản phẩm</strong>.
            </li>
            <li>
              Nhấn <strong>Thêm laptop</strong>. Điền{" "}
              <strong>Mã sản phẩm</strong> duy nhất và{" "}
              <strong>Tên sản phẩm</strong>; bổ sung các thông số đã biết. Nhập
              giá bằng VND, RAM/dung lượng chuẩn bằng GB, trọng lượng chuẩn bằng
              kg.
            </li>
            <li>
              Nhấn <strong>Lưu laptop</strong>. Nếu báo trùng mã, tìm sản phẩm
              hiện có để sửa hoặc dùng một mã khác.
            </li>
            <li>
              Để cập nhật, nhấn biểu tượng bút của sản phẩm, chỉnh thông tin rồi
              lưu. Để xóa, đánh dấu các laptop cần xóa và nhấn{" "}
              <strong>Xóa đã chọn</strong>; kiểm tra các mã trước khi xác nhận.
            </li>
          </ol>
          <div className="help-callout">
            <strong>Xóa không thể hoàn tác trên giao diện.</strong> Lịch sử tư
            vấn vẫn giữ bản chụp sản phẩm cũ. Nếu import lại file Excel còn chứa
            mã đã xóa, laptop đó sẽ được thêm lại. Thông số chưa biết nên để
            trống thay vì tự điền 0.
          </div>
          <p>
            Admin có thể mở <strong>Dữ liệu gốc từ Excel</strong> trong chi tiết
            laptop để đối chiếu dòng đã nhập. Các giá trị gốc và giá trị chuẩn
            hóa có thể khác cách biểu diễn, ví dụ “1 TB SSD” và 1024 GB.
          </p>
        </>
      ),
    },
    {
      title: "Import Excel",
      content: (
        <>
          <ol>
            <li>
              Mở <strong>Import dữ liệu</strong>, nhấn{" "}
              <strong>Tải file Excel mẫu</strong>. File{" "}
              <strong>Laptop_template.xlsx</strong> chỉ chứa đúng 12 tên cột của
              file dữ liệu gốc, không chứa sản phẩm mẫu.
            </li>
            <li>
              Giữ nguyên dòng header. Điền một laptop trên mỗi dòng, bắt đầu từ{" "}
              <strong>dòng 2 của sheet đầu tiên</strong>. Mã sản phẩm và tên sản
              phẩm không được để trống; dùng mã riêng cho từng laptop.
            </li>
            <li>
              Lưu file dạng <strong>.xlsx</strong>, dung lượng tối đa{" "}
              <strong>20 MB</strong>. Nhấn vùng chọn file và chọn file vừa điền.
            </li>
            <li>
              Kiểm tra tùy chọn{" "}
              <strong>Cập nhật laptop nếu trùng mã sản phẩm</strong>. Bật: ghi
              đè thông tin laptop cùng mã. Tắt: bỏ qua mã đã tồn tại. Nhấn{" "}
              <strong>Import vào cơ sở dữ liệu</strong>.
            </li>
            <li>
              Đọc báo cáo{" "}
              <strong>Thêm mới / Cập nhật / Bỏ qua / Thất bại</strong>. Mở{" "}
              <strong>Lưu ý chuẩn hóa</strong> để xem các trường chưa xác định,
              hoặc tải báo cáo đầy đủ để kiểm tra từng dòng lỗi.
            </li>
          </ol>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cột</th>
                  <th>Cách điền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>STT</td>
                  <td>
                    Số thứ tự dòng, ví dụ 1, 2, 3; không dùng để xác định bản
                    ghi cần cập nhật.
                  </td>
                </tr>
                <tr>
                  <td>Mã sản phẩm / Tên sản phẩm</td>
                  <td>
                    Mã duy nhất và tên đầy đủ. Hệ thống đối chiếu trùng bằng mã
                    sản phẩm.
                  </td>
                </tr>
                <tr>
                  <td>Giá sản phẩm</td>
                  <td>
                    Số tiền VND đầy đủ, ví dụ 20000000; không nhập “20” để biểu
                    thị 20 triệu.
                  </td>
                </tr>
                <tr>
                  <td>Nhãn hàng / CPU / GPU</td>
                  <td>
                    Ghi đúng hãng và tên bộ xử lý/card đồ họa của cấu hình thực
                    tế.
                  </td>
                </tr>
                <tr>
                  <td>RAM / Dung lượng bộ nhớ</td>
                  <td>Ví dụ 16 GB và 512 GB SSD hoặc 1 TB SSD.</td>
                </tr>
                <tr>
                  <td>Trọng lượng / Màu sắc</td>
                  <td>Ví dụ 1.5 kg và Bạc. Thông số chưa biết để trống.</td>
                </tr>
                <tr>
                  <td>Màn hình</td>
                  <td>
                    Ghi các thông tin đã biết, ví dụ 15.6 inch, 1920x1080, 144
                    Hz.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="help-callout">
            <strong>
              File có dòng lỗi vẫn có thể nhập thành công các dòng khác.
            </strong>{" "}
            Sửa các dòng báo lỗi rồi nhập lại. “Không xác định: refresh_rate_hz”
            nghĩa là không đọc được tần số quét từ cột Màn hình; không đồng
            nghĩa cả dòng bị từ chối. Nếu nhập lại cả file, chọn chế độ cập nhật
            phù hợp để tránh ghi đè ngoài ý muốn.
          </div>
        </>
      ),
    },
    {
      title: "Tạo luật IF–THEN",
      content: (
        <>
          <ol>
            <li>
              Mở <strong>Luật suy diễn → Tạo luật mới</strong>. Điền mã luật duy
              nhất, tên, nhóm và <strong>priority</strong>.
            </li>
            <li>
              Ở phần <strong>IF</strong>, chọn thuộc tính, toán tử và giá trị.
              Ví dụ <code>purpose = gaming</code>. Dùng AND nếu cần tất cả điều
              kiện, OR nếu chỉ cần một điều kiện trong nhóm.
            </li>
            <li>
              Ở phần <strong>THEN</strong>, chọn fact kết luận và giá trị, ví dụ{" "}
              <code>min_ram = 16</code>. Có thể thêm nhiều điều kiện, nhóm và
              kết luận.
            </li>
            <li>
              Lưu và bật luật. Chạy một phiên ở <strong>Tư vấn laptop</strong>{" "}
              với đầu vào tương ứng, sau đó mở{" "}
              <strong>Xem cách suy luận</strong> để kiểm tra luật có được áp
              dụng không và sinh ra yêu cầu gì.
            </li>
          </ol>
          <div className="help-callout">
            <strong>
              Priority quyết định thứ tự chọn luật, không cộng trực tiếp vào
              điểm laptop.
            </strong>{" "}
            Luật bị tắt không tham gia các phiên mới. Có thể sao chép luật để
            tạo biến thể, nhưng cần đổi mã và kiểm tra điều kiện/kết luận trước
            khi bật.
          </div>
        </>
      ),
    },
    {
      title: "Bổ sung tri thức và allowed values",
      content: (
        <>
          <ol>
            <li>
              Mở <strong>Thu nhận tri thức</strong> để thêm thuộc tính. Dùng tên
              định danh rõ ràng, nhãn dễ hiểu và kiểu dữ liệu đúng: số, chuỗi,
              enum hoặc boolean.
            </li>
            <li>
              Với enum, khai báo <strong>allowed values</strong> là những giá
              trị được phép. Chọn chiến lược gộp khi có nhiều kết luận cùng tác
              động tới thuộc tính.
            </li>
            <li>
              Nếu thuộc tính dùng để so khớp laptop, chọn trường sản phẩm, toán
              tử và nhóm điểm phù hợp. Nếu chỉ là thông tin trung gian cho luật
              khác, không cần ánh xạ trường sản phẩm.
            </li>
            <li>
              Tạo luật tham chiếu thuộc tính mới. Mở{" "}
              <strong>Facts bổ sung từ tri thức mở rộng</strong> trong form tư
              vấn để nhập và kiểm tra.
            </li>
          </ol>
          <div className="help-callout">
            <strong>
              Thuộc tính đang được luật tham chiếu không thể xóa, đổi tên hoặc
              tắt.
            </strong>{" "}
            Khi cần thay đổi, xử lý các luật liên quan trước. Giá trị trong luật
            phải phù hợp với kiểu và danh sách giá trị được phép.
          </div>
        </>
      ),
    },
    {
      title: "Fact và Working Memory là gì?",
      content: (
        <>
          <p>
            <strong>Fact</strong> là một thông tin gồm tên và giá trị, ví dụ{" "}
            <code>purpose = gaming</code> hoặc{" "}
            <code>budget_max = 30000000</code>. Facts ban đầu đến từ form tư
            vấn; facts mới được bổ sung qua các luật.
          </p>
          <p>
            <strong>Working Memory</strong> là tập facts của một phiên suy diễn.
            Mở <strong>Xem cách suy luận → Working Memory</strong> để xem kết
            quả sau các bước. Đối chiếu facts ban đầu, facts cuối và nguồn luật
            khi cần giải thích vì sao hệ thống yêu cầu một cấu hình.
          </p>
        </>
      ),
    },
    {
      title: "Forward Chaining là gì?",
      content: (
        <>
          <p>
            <strong>Suy diễn tiến</strong> bắt đầu từ những facts đã biết, tìm
            luật đang bật có điều kiện phù hợp, chọn luật, áp dụng kết luận rồi
            tiếp tục kiểm tra. Fact mới có thể kích hoạt luật khác: nhu cầu
            gaming → cần GPU rời → ưu tiên GPU dedicated.
          </p>
          <p>
            Trong dấu vết suy luận, đọc từng bước để biết điều kiện nào khớp và
            fact nào được thêm hoặc giữ lại. Mỗi luật chạy tối đa một lần mỗi
            phiên. Nếu hệ thống báo <strong>chạm giới hạn vòng lặp</strong>, kết
            quả suy diễn chưa đầy đủ; cần kiểm tra chuỗi luật và đầu vào.
          </p>
        </>
      ),
    },
    {
      title: "Conflict Set và chọn luật",
      content: (
        <>
          <p>
            <strong>Conflict Set</strong> là tập luật cùng phù hợp tại một bước.
            Hệ thống ưu tiên{" "}
            <mark>
              priority cao hơn → nhiều điều kiện hơn → mã luật tăng dần
            </mark>
            . Vì vậy luật có priority lớn thường được áp dụng trước nếu đã thỏa
            điều kiện.
          </p>
          <p>
            Xem phần lý do chọn luật trong trace để đối chiếu. Luật không sinh
            thêm facts vẫn được ghi nhận đã chạy; hệ thống tiếp tục xét các luật
            còn lại.
          </p>
        </>
      ),
    },
    {
      title: "Giải quyết kết luận khác nhau",
      content: (
        <>
          <p>
            Mỗi thuộc tính dùng một chiến lược gộp để xử lý nhiều giá trị được
            đề xuất:
          </p>
          <ul>
            <li>
              <strong>first:</strong> giữ giá trị đầu tiên, bao gồm giá trị do
              người dùng đã nhập.
            </li>
            <li>
              <strong>max:</strong> giữ số lớn hơn, phù hợp với RAM hoặc dung
              lượng tối thiểu.
            </li>
            <li>
              <strong>min:</strong> giữ số nhỏ hơn, phù hợp với giới hạn trọng
              lượng hoặc ngân sách tối đa.
            </li>
            <li>
              <strong>or:</strong> một yêu cầu true sẽ tiếp tục được giữ true.
            </li>
          </ul>
          <p>
            Khi kết quả khác dự đoán, kiểm tra cả{" "}
            <strong>giá trị đề xuất</strong> và{" "}
            <strong>giá trị thực sự được giữ lại</strong> trong trace. Đừng chỉ
            đọc câu kết luận của một luật riêng lẻ.
          </p>
        </>
      ),
    },
    {
      title: "Đọc kết quả và điểm phù hợp",
      content: (
        <>
          <p>
            Ngân sách và các yêu cầu ánh xạ vào nhóm ràng buộc bắt buộc (chẳng
            hạn hãng, CPU, màu) dùng để lọc. Các yêu cầu cấu hình dùng để chấm
            điểm; máy thiếu một phần vẫn có thể xuất hiện kèm thông tin đánh
            đổi.
          </p>
          <p>
            Trọng số:{" "}
            <strong>
              ngân sách 25, RAM 20, GPU 25, lưu trữ 10, màn hình 10, trọng lượng
              10
            </strong>
            . Chỉ nhóm có yêu cầu tham gia tính điểm. Các tiêu chí cùng nhóm
            chia đều trọng số; tiêu chí chưa đạt hoặc chưa xác minh nhận 0 điểm.
          </p>
          <div className="help-callout">
            <strong>Công thức:</strong> điểm phù hợp = 100 × điểm đạt / tổng
            trọng số các nhóm có yêu cầu. Điểm không phụ thuộc trực tiếp vào số
            luật đã chạy hay priority. Kết quả bằng điểm được xếp theo giá thấp
            hơn, rồi mã sản phẩm.
          </div>
        </>
      ),
    },
    {
      title: "Lịch sử và explanation",
      content: (
        <>
          <ol>
            <li>
              Mở <strong>Lịch sử suy diễn</strong>. Danh sách chỉ gồm các phiên
              thuộc tài khoản demo đang chọn; bộ đếm và lịch sử gần đây trên
              Tổng quan cũng theo tài khoản đó.
            </li>
            <li>
              Nhấn <strong>Chi tiết</strong> để xem các đề xuất. Chọn{" "}
              <strong>Xem cách suy luận</strong> để đọc facts, luật, các bước áp
              dụng và lý do; chọn <strong>Xuất log JSON</strong> nếu muốn giữ
              một bản ghi ngoài hệ thống.
            </li>
            <li>
              Để xóa, đánh dấu checkbox của từng phiên hoặc chọn tất cả trên
              trang hiện tại. Có thể chuyển trang và chọn tiếp; số lượng đã chọn
              được giữ lại.
            </li>
            <li>
              Nhấn <strong>Xóa đã chọn</strong>, đối chiếu mã phiên và thời gian
              trong hộp xác nhận. Nhấn <strong>Hủy</strong> để quay lại hoặc
              nhấn nút xóa để thực hiện. Dùng <strong>Bỏ chọn tất cả</strong>{" "}
              khi muốn chọn lại từ đầu.
            </li>
          </ol>
          <div className="help-callout">
            <strong>
              Xóa phiên sẽ xóa cả dấu vết suy luận của phiên đó và không thể
              hoàn tác trên giao diện.
            </strong>{" "}
            Laptop và luật hiện tại không bị xóa. Hãy xuất JSON trước nếu cần
            lưu kết quả. Các phiên cũ chưa có thông tin chủ sở hữu được giữ ở
            lịch sử Admin.
          </div>
        </>
      ),
    },
    {
      title: "Phạm vi phiên bản demo",
      content: (
        <>
          <p>
            <strong>Đổi tài khoản</strong> chuyển giữa Admin và User demo. Admin
            quản lý dữ liệu và tri thức; User tra cứu và tư vấn. User demo được
            nhận diện theo trình duyệt, chưa có đăng nhập để đồng bộ lịch sử
            giữa các thiết bị.
          </p>
          <p>
            Đây là chế độ chạy local,{" "}
            <strong>không phải cơ chế xác thực tài khoản bảo mật</strong>. Dữ
            liệu giá lấy từ Excel, phân loại CPU/GPU dựa trên chuỗi thông số và
            có giới hạn. Các thông số thiếu hoặc tham khảo cần được kiểm chứng
            với nguồn sản phẩm.
          </p>
          <p>
            Trường <code>score_delta</code> trong kết luận hiện chỉ được lưu để
            mở rộng; không làm thay đổi công thức chấm điểm laptop.
          </p>
        </>
      ),
    },
  ];
  return (
    <>
      {!compact && (
        <div className="page-heading">
          <div>
            <div className="eyebrow">HƯỚNG DẪN SỬ DỤNG</div>
            <h1>Hướng dẫn sử dụng</h1>
            <p>
              {admin
                ? "Tư vấn, quản lý dữ liệu và kiểm tra cách hệ thống suy luận."
                : "Làm theo từng bước để tìm và chọn laptop phù hợp với bạn."}
            </p>
          </div>
          <BookOpen size={28} />
        </div>
      )}
      {admin && (
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
      )}
      <p className="muted mb-4">
        Nhấn vào tên mục để mở hoặc thu gọn hướng dẫn. Các bước thao tác và lưu
        ý quan trọng được in đậm hoặc tô nền.
      </p>
      <div className="help-list">
        {(admin ? entries : entries.slice(0, 2)).map(
          ({ title, content }, i) => (
            <details key={title} className="panel" open={i < 2}>
              <summary>
                <span className="number-chip">{i + 1}</span>
                {title}
              </summary>
              <div className="help-content">{content}</div>
            </details>
          ),
        )}
      </div>
    </>
  );
}
