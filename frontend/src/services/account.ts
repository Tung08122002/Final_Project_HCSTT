// Local demo identity, not an authentication credential. User identity persists
// in this browser; the selected role is per tab to avoid mixing in-flight work.
export type DemoRole = "admin" | "user";
const roleKey = "laptop-advisor.demo-role";
const userKey = "laptop-advisor.demo-user";
let role: DemoRole =
  sessionStorage.getItem(roleKey) === "user" ? "user" : "admin";
let userId = localStorage.getItem(userKey);
if (!userId || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(userId)) {
  userId = crypto.randomUUID();
  localStorage.setItem(userKey, userId);
}
export const getDemoRole = () => role;
export function setDemoRole(next: DemoRole) {
  role = next;
  sessionStorage.setItem(roleKey, role);
}
export function accountHeaders(): Record<string, string> {
  return { "X-Demo-Role": role, "X-Demo-User": userId! };
}
