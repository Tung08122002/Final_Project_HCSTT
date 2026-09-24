import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Laptop,
  MessageSquare,
  Package,
  BookOpen,
  GitBranch,
  Lightbulb,
  History,
  Upload,
  CircleHelp,
  Menu,
  X,
  ChevronDown,
  Layers3,
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Consultation from "./pages/Consultation";
import Products from "./pages/Products";
import Rules from "./pages/Rules";
import Knowledge from "./pages/Knowledge";
import HistoryPage from "./pages/History";
import ImportData from "./pages/ImportData";
import Help from "./pages/Help";
import { Modal } from "./components/ui";
import { getDemoRole, setDemoRole } from "./services/account";
const links = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "consult", label: "Tư vấn laptop", icon: MessageSquare },
  { id: "catalog", label: "Danh sách laptop", icon: Laptop },
  { id: "products", label: "Quản lý sản phẩm", icon: Package, admin: true },
  { id: "knowledge", label: "Cơ sở tri thức", icon: BookOpen, admin: true },
  { id: "rules", label: "Luật suy diễn", icon: GitBranch, admin: true },
  {
    id: "acquisition",
    label: "Thu nhận tri thức",
    icon: Lightbulb,
    admin: true,
  },
  { id: "history", label: "Lịch sử suy diễn", icon: History },
  { id: "import", label: "Import dữ liệu", icon: Upload, admin: true },
  { id: "help", label: "Hướng dẫn sử dụng", icon: CircleHelp },
];
export default function App() {
  const [page, setPage] = useState(location.hash.slice(1) || "dashboard"),
    [admin, setAdmin] = useState(() => getDemoRole() === "admin"),
    [mobile, setMobile] = useState(false),
    [help, setHelp] = useState(false),
    [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleMenu = useRef<HTMLDivElement>(null);
  const switchAccount = (isAdmin: boolean) => {
    setDemoRole(isAdmin ? "admin" : "user");
    setAdmin(isAdmin);
    setRoleMenuOpen(false);
    setHelp(false);
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    const listener = () => setPage(location.hash.slice(1) || "dashboard");
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  useEffect(() => {
    if (!roleMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!roleMenu.current?.contains(event.target as Node))
        setRoleMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRoleMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [roleMenuOpen]);
  const navigate = (p: string) => {
    location.hash = p;
    setPage(p);
    setMobile(false);
    window.scrollTo(0, 0);
  };
  const current = links.find((l) => l.id === page);
  const effectivePage = !admin && current?.admin ? "catalog" : page;
  return (
    <div className="app-shell">
      {mobile && (
        <div className="sidebar-backdrop" onClick={() => setMobile(false)} />
      )}
      <aside className={"sidebar " + (mobile ? "show" : "")}>
        <a
          className="brand"
          href="#dashboard"
          onClick={() => navigate("dashboard")}
        >
          <span>
            <Layers3 size={24} />
          </span>
          <div>
            Laptop<span>Advisor</span>
            <small>KNOWLEDGE-BASED SYSTEM</small>
          </div>
        </a>
        <button
          className="mobile-close icon-button"
          aria-label="Đóng menu"
          onClick={() => setMobile(false)}
        >
          <X size={20} />
        </button>
        <div className="nav-label">KHÁM PHÁ & TƯ VẤN</div>
        <nav>
          {links
            .filter((l) => admin || !l.admin)
            .map((l, i) => (
              <div key={l.id}>
                {i === 3 && admin && (
                  <div className="nav-label mt-6">QUẢN TRỊ TRI THỨC</div>
                )}
                {l.id === "help" && <div className="nav-divider" />}
                <button
                  className={
                    "nav-item " + (effectivePage === l.id ? "active" : "")
                  }
                  onClick={() => navigate(l.id)}
                >
                  <l.icon size={18} />
                  <span>{l.label}</span>
                  {effectivePage === l.id && <i />}
                </button>
              </div>
            ))}
        </nav>
        <div className="sidebar-note">
          <span className="status-dot" />
          <b>Tri thức dẫn lối lựa chọn</b>
          <p>
            IF–THEN · Forward Chaining
            <br />
            Explanation Facility
          </p>
        </div>
        <div className="sidebar-foot">
          HCSTT · Final Project <span>v1.0</span>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="flex gap-3 items-center">
            <button
              className="icon-button mobile-menu"
              aria-label="Mở menu"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb">
              Không gian làm việc <span>/</span>{" "}
              <b>{links.find((l) => l.id === effectivePage)?.label}</b>
            </span>
          </div>
          <div className="topbar-actions">
            <button
              className="help-button"
              aria-label="Trợ giúp"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={18} />
              <span>Trợ giúp</span>
            </button>
            <span className="topbar-divider" />
            <div className="role-switch" ref={roleMenu}>
              <span className="avatar">{admin ? "AD" : "US"}</span>
              <div className="role-current">
                <b>{admin ? "Quản trị demo" : "Người dùng"}</b>
                <small>Phiên bản local</small>
              </div>
              <button
                type="button"
                className="role-dropdown-trigger"
                aria-label="Đổi tài khoản"
                aria-haspopup="menu"
                aria-expanded={roleMenuOpen}
                onClick={() => setRoleMenuOpen((open) => !open)}
              >
                Đổi tài khoản
                <ChevronDown size={14} />
              </button>
              {roleMenuOpen && (
                <div
                  className="role-menu"
                  role="menu"
                  aria-label="Chọn tài khoản"
                >
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={admin}
                    onClick={() => {
                      switchAccount(true);
                    }}
                  >
                    <span className="avatar small">AD</span>
                    <span>
                      <b>Quản trị demo</b>
                      <small>Quản lý dữ liệu và tri thức</small>
                    </span>
                    {admin && <span className="role-check">✓</span>}
                  </button>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={!admin}
                    onClick={() => {
                      switchAccount(false);
                    }}
                  >
                    <span className="avatar small">US</span>
                    <span>
                      <b>Người dùng</b>
                      <small>Tra cứu và nhận tư vấn</small>
                    </span>
                    {!admin && <span className="role-check">✓</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main key={admin ? "admin" : "user"}>
          {effectivePage === "dashboard" ? (
            <Dashboard navigate={navigate} />
          ) : effectivePage === "consult" ? (
            <Consultation admin={admin} />
          ) : effectivePage === "catalog" ? (
            <Products key="catalog" canDelete={admin} />
          ) : effectivePage === "products" ? (
            <Products admin key="products" />
          ) : effectivePage === "rules" ? (
            <Rules />
          ) : effectivePage === "knowledge" ||
            effectivePage === "acquisition" ? (
            <Knowledge
              key={effectivePage}
              acquisition={effectivePage === "acquisition"}
              navigate={navigate}
            />
          ) : effectivePage === "history" ? (
            <HistoryPage admin={admin} />
          ) : effectivePage === "import" ? (
            <ImportData />
          ) : (
            <Help admin={admin} />
          )}
          <footer className="page-footer">
            <span>
              Hệ thống tư vấn lựa chọn laptop sử dụng hệ cơ sở tri thức và suy
              diễn tiến
            </span>
            <span>Knowledge → Reasoning → Recommendation</span>
          </footer>
        </main>
      </div>
      {help && (
        <Modal title="Hướng dẫn sử dụng" onClose={() => setHelp(false)} wide>
          <Help compact admin={admin} />
        </Modal>
      )}
    </div>
  );
}
