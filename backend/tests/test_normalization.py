import pytest

from app.utils.normalization import *


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("Khoảng 1,53 kg", 1.53),
        ("Tối đa 1,53 kg", 1.53),
        ("Từ 1,59 kg (tùy cấu hình)", 1.59),
        (1.98, 1.98),
        ("1530 g", 1.53),
        ("Chưa xác minh", None),
    ],
)
def test_weight(raw, expected):
    assert normalize_weight(raw) == expected


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("1 TB SSD", 1024),
        ("512 GB SSD", 512),
        ("1 TB SSD + 512 GB SSD", 1536),
        ("Chưa xác minh", None),
        (16, 16),
    ],
)
def test_capacity(raw, expected):
    assert normalize_storage(raw) == expected


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("19.499.000 ₫", 19499000),
        ("19,499,000 VND", 19499000),
        ("19,5 triệu", 19500000),
        (19499000, 19499000),
        ("Liên hệ", None),
    ],
)
def test_price(raw, expected):
    assert normalize_price(raw) == expected


def test_display_and_unknown_gpu():
    assert normalize_screen_size("15.6 inch FHD 144Hz") == 15.6
    assert normalize_refresh_rate("15.6 inch FHD 144Hz") == 144
    assert normalize_refresh_rate("14 OLED") is None
    assert normalize_screen_size("14 OLED") == 14
    assert normalize_resolution("16 inch 2K+ 180Hz") == "2K+"
    assert normalize_gpu("Chưa xác minh")["gpu_type"] is None
    assert normalize_gpu("NVIDIA RTX 4050")["gpu_type"] == "dedicated"
    assert normalize_gpu("Intel Graphics (tích hợp)")["gpu_type"] == "integrated"


def test_decimal_price_and_negative_capacity():
    assert normalize_price("19499000.0") == 19499000
    assert normalize_storage("-8 GB") < 0
