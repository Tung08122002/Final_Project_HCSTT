def build_explanation(result):
    fired = ", ".join(result["matched_rules"]) or "không có luật nào"
    return {
        "summary": f"Đã áp dụng {len(result['steps'])} luật ({fired}), tạo hoặc củng cố yêu cầu kỹ thuật rồi chấm điểm sản phẩm.",
        "matching_policy": "Ngân sách và lựa chọn hãng/CPU/màu là ràng buộc bắt buộc. Cấu hình kỹ thuật là tiêu chí chấm điểm; kết quả chưa đạt được ghi rõ đánh đổi.",
        "scoring_policy": "Trọng số: ngân sách 25, RAM 20, GPU 25, lưu trữ 10, màn hình 10, trọng lượng 10. Chỉ tính nhóm có yêu cầu; chia đều điểm giữa tiêu chí cùng nhóm; dữ liệu chưa xác định không nhận điểm. Chuẩn hóa điểm về 100.",
        "warning": "Luật và phân hạng GPU phục vụ demo, không thay thế benchmark. Giá và cấu hình lấy từ Excel, cần xác minh trước khi mua.",
        "empty_message": "Không có sản phẩm thỏa ngân sách / bộ lọc bắt buộc. Hãy mở rộng ngân sách hoặc bỏ bớt lựa chọn."
        if not result["recommended_products"]
        else None,
    }
