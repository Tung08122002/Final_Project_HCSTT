"""History ownership for the local demo; this is not login/authentication."""

from dataclasses import dataclass
from typing import Literal
from uuid import UUID

from fastapi import Depends, Header, HTTPException


@dataclass(frozen=True)
class DemoAccount:
    owner_id: str
    role: Literal["admin", "user"]


def current_account(
    x_demo_role: Literal["admin", "user"] = Header(...),
    x_demo_user: UUID | None = Header(None),
) -> DemoAccount:
    if x_demo_role == "admin":
        return DemoAccount("demo-admin", "admin")
    if x_demo_user is None:
        raise HTTPException(422, "Thiếu mã người dùng demo (X-Demo-User)")
    return DemoAccount(f"demo-user:{x_demo_user}", "user")


def admin_account(account: DemoAccount = Depends(current_account)) -> DemoAccount:
    if account.role != "admin":
        raise HTTPException(403, "Chỉ quản trị viên được xóa lịch sử suy diễn")
    return account
