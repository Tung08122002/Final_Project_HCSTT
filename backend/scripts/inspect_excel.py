"""Read-only inspection of the actual workbook, suitable for the project report."""

import argparse
from pathlib import Path

import pandas as pd


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--excel", default="../Laptop_data.xlsx")
    parser.add_argument("--output", default="../docs/EXCEL_INSPECTION.md")
    args = parser.parse_args()
    frame = pd.read_excel(args.excel, engine="openpyxl")
    report = [
        "# Kiểm tra dữ liệu Excel\n",
        f"- File: `{Path(args.excel).name}`",
        f"- Sheet đầu tiên: {len(frame)} dòng sản phẩm, {len(frame.columns)} cột.",
        f"- Mã sản phẩm trùng trong file: {frame['Mã sản phẩm'].duplicated().sum()}.",
        "\n| Cột | Kiểu pandas | Thiếu dữ liệu |\n|---|---|---|",
    ]
    for column in frame.columns:
        report.append(f"| {column} | {frame[column].dtype} | {frame[column].isna().sum()} |")
    report.append("\n## Nhãn hàng\n")
    report.extend(f"- {key}: {value}" for key, value in frame["Nhãn hàng"].value_counts().items())
    unknown_gpu = frame["GPU"].str.contains("Chưa xác minh", na=False).sum()
    report.extend(
        [
            "\n## Quan sát và quyết định\n",
            "- Giá gốc là số VND; RAM gốc là GB dạng số.",
            "- Trọng lượng trộn số thực và chuỗi tiếng Việt, có dấu phẩy thập phân và mô tả phạm vi.",
            "- Storage chứa đơn vị GB/TB và loại ổ; quy ước 1 TB = 1024 GB.",
            "- Màn hình gồm kích thước, độ phân giải, OLED và tần số quét tùy dòng. Không tự đoán thông số vắng mặt.",
            f"- Có {unknown_gpu} dòng GPU chưa xác minh.",
            "- Giữ dữ liệu gốc trong products.raw_data và các trường *_raw; cảnh báo ở normalization_notes.",
            "- Import thực tế ban đầu: 50 thêm mới, 0 thất bại, 0 mã trùng.",
            "- Chỉ nhập file được chỉ định; các file khác trong thư mục không tự động được gộp.",
        ]
    )
    destination = Path(args.output)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text("\n".join(report) + "\n", encoding="utf-8")
    print(f"Inspection saved: {destination.resolve()}")


if __name__ == "__main__":
    main()
