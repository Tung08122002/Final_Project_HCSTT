import math
import re


def clean(value):
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    return str(value).strip() or None


def number(value):
    text = clean(value)
    if not text or re.search(r"chưa|unknown|n/a", text, re.I):
        return None
    match = re.search(r"-?\d+(?:[.,]\d+)?", text)
    return float(match[0].replace(",", ".")) if match else None


def normalize_price(value):
    if isinstance(value, (int, float)):
        return float(value) if math.isfinite(value) else None
    text = clean(value)
    if not text or re.search(r"chưa|liên hệ|unknown", text, re.I):
        return None
    if re.search(r"triệu|tr\b", text, re.I):
        n = number(text)
        return n * 1_000_000 if n is not None else None
    # A decimal suffix from spreadsheets is not a thousands separator.
    if re.fullmatch(r"-?\d+\.\d{1,2}", text):
        return float(text)
    digits = re.sub(r"[^\d-]", "", text)
    return float(digits) if digits and digits != "-" else None


def normalize_weight(value):
    n = number(value)
    return (
        round(n / 1000 if re.search(r"\bg\b", clean(value) or "", re.I) else n, 3)
        if n is not None
        else None
    )


def normalize_storage(value):
    text = clean(value) or ""
    if re.search(r"-\s*\d", text):
        return -1  # Schema rejects negative capacity; original input remains in report.
    parts = re.findall(r"(\d+(?:[.,]\d+)?)\s*(TB|GB)", text, re.I)
    if parts:
        return sum(
            float(n.replace(",", ".")) * (1024 if unit.upper() == "TB" else 1) for n, unit in parts
        )
    return number(value) if re.fullmatch(r"\d+(?:\.\d+)?", text) else None


def normalize_ram(value):
    return normalize_storage(value)


def normalize_screen_size(value):
    n = number(value)
    return n if n is not None and 8 <= n <= 25 else None


def normalize_refresh_rate(value):
    m = re.search(r"(\d+)\s*hz", clean(value) or "", re.I)
    return float(m[1]) if m else None


def normalize_resolution(value):
    m = re.search(
        r"(\d{3,4}\s*[x×]\s*\d{3,4}|WQXGA|WUXGA|QHD\+?|FHD\+?|[234]K\+?|HD)",
        clean(value) or "",
        re.I,
    )
    return m[0].upper() if m else None


def normalize_gpu(value):
    text = (clean(value) or "").lower()
    if not text or "chưa" in text or "unknown" in text:
        return {"gpu_type": None, "gpu_vendor": None, "gpu_level": None}
    dedicated = bool(re.search(r"rtx|gtx|geforce|quadro|radeon\s*(?:rx|pro)|arc\s*a\d", text))
    integrated = bool(
        re.search(
            r"tích hợp|integrated|iris|intel.*graphics|radeon.*(?:graphics|\d{3}m)|apple|adreno",
            text,
        )
    )
    vendor = next(
        (
            v
            for token, v in [
                ("nvidia", "NVIDIA"),
                ("amd", "AMD"),
                ("radeon", "AMD"),
                ("intel", "Intel"),
                ("apple", "Apple"),
                ("adreno", "Qualcomm"),
            ]
            if token in text
        ),
        None,
    )
    m = re.search(r"rtx\s*(\d{4})", text)
    # Demo tiers, not benchmark claims; generation alone does not imply performance.
    level = (
        (3 if int(m[1]) % 100 >= 70 else 2 if int(m[1]) % 100 >= 50 else 1)
        if m
        else (1 if dedicated or integrated else None)
    )
    return {
        "gpu_type": "dedicated" if dedicated else "integrated" if integrated else None,
        "gpu_vendor": vendor,
        "gpu_level": level,
    }


def normalize_cpu(value):
    text = clean(value)
    return {
        "cpu_vendor": next(
            (
                v
                for token, v in [
                    ("intel", "Intel"),
                    ("amd", "AMD"),
                    ("apple", "Apple"),
                    ("qualcomm", "Qualcomm"),
                ]
                if token in (text or "").lower()
            ),
            None,
        )
    }
