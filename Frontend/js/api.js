const API_BASE =
  localStorage.getItem("annasetu_api_base") || "http://127.0.0.1:5000";
const token = () => localStorage.getItem("annasetu_token") || "";
const role = () => localStorage.getItem("annasetu_role") || "";
const userName = () => localStorage.getItem("annasetu_name") || role();
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const fmt = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleString();
};
function badge(s) {
  s = String(s || "");
  const c = ["Rejected", "Cancelled"].includes(s)
    ? "danger"
    : ["Pending", "Available"].includes(s)
      ? "warn"
      : ["Delivered", "Completed", "Accepted"].includes(s)
        ? ""
        : "dark";
  return `<span class="badge ${c}">${esc(s || "Unknown")}</span>`;
}
async function api(path, options = {}) {
  const o = {
    ...options,
    headers: { ...(options.headers || {}), "Content-Type": "application/json" },
  };
  if (token()) o.headers.Authorization = `Bearer ${token()}`;
  const r = await fetch(API_BASE + path, o);
  let d = {};
  try {
    d = await r.json();
  } catch {}
  if (!r.ok)
    throw new Error(d.error || d.message || `Request failed (${r.status})`);
  return d;
}
function toast(m, e = false) {
  const x = document.createElement("div");
  x.className = "toast" + (e ? " err" : "");
  const host = document.getElementById("toast");
  if (host) {
    host.appendChild(x);
    x.textContent = m;
    setTimeout(() => x.remove(), 3000);
  }
}
function table(h, rows) {
  if (!rows.length) return '<div class="empty">No records found.</div>';
  return `<div class="table-wrap"><table class="table"><thead><tr>${h.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>`;
}
function guard(allowed) {
  if (!token() || !role() || (allowed && !allowed.includes(role()))) {
    location.href = "../index.html";
    return false;
  }
  return true;
}
function logout() {
  localStorage.clear();
  location.href = "../index.html";
}
