const NAV = {
  donor: [
    ["dashboard", "▦", "Dashboard"],
    ["donations", "◫", "My Donations"],
    ["add-donation", "＋", "Add Donation"],
    ["map", "⌖", "Donation Map"],
    ["notifications", "♧", "Notifications"],
    ["profile", "♙", "Profile"],
  ],
  ngo: [
    ["dashboard", "▦", "Dashboard"],
    ["available", "⌕", "Available Food"],
    ["requests", "◫", "My Requests"],
    ["deliveries", "▣", "Deliveries"],
    ["map", "⌖", "Food Map"],
    ["notifications", "♧", "Notifications"],
    ["profile", "♙", "Profile"],
  ],
  volunteer: [
    ["dashboard", "▦", "Dashboard"],
    ["available", "⌕", "Available Tasks"],
    ["my-deliveries", "▣", "My Deliveries"],
    ["availability", "◉", "Availability"],
    ["map", "⌖", "Delivery Map"],
    ["notifications", "♧", "Notifications"],
    ["profile", "♙", "Profile"],
  ],
  admin: [
    ["dashboard", "▦", "Dashboard"],
    ["users", "♙", "Users"],
    ["statistics", "▥", "Statistics"],
    ["notifications", "♧", "Notifications"],
    ["profile", "♙", "Profile"],
  ],
};
function currentPage() {
  return (
    location.pathname
      .split("/")
      .pop()
      .replace(/\.html$/i, "") || "dashboard"
  );
}
function buildNav(r, current = currentPage()) {
  const nav = document.getElementById("nav");
  if (nav)
    nav.innerHTML =
      `<div class="nav-title">Navigation</div>` +
      (NAV[r] || [])
        .map(
          (x) =>
            `<a class="${x[0] === current ? "active" : ""}" href="${x[0]}.html"><span class="nav-icon">${x[1]}</span><span>${x[2]}</span></a>`,
        )
        .join("");
  const roleEl = document.getElementById("role"),
    userEl = document.getElementById("user"),
    logoutEl = document.getElementById("logout");
  if (roleEl) roleEl.textContent = r.toUpperCase();
  if (userEl) userEl.textContent = userName();
  if (logoutEl) logoutEl.onclick = logout;
  const topName = document.getElementById("topName"),
    topRole = document.getElementById("topRole"),
    avatar = document.getElementById("avatar");
  if (topName) topName.textContent = userName();
  if (topRole) topRole.textContent = r;
  if (avatar) avatar.textContent = (userName() || r).slice(0, 2).toUpperCase();
}
async function loadNotifications() {
  const list = document.getElementById("list");
  if (!list) return;
  try {
    const d = await api("/api/notifications");
    list.innerHTML = table(
      ["ID", "Type", "Message", "Created", "Status", "Action"],
      d.notifications.map(
        (x) =>
          `<tr><td>${x.notification_id}</td><td>${esc(x.notification_type)}</td><td>${esc(x.message)}</td><td>${fmt(x.created_at)}</td><td>${x.is_read ? "Read" : "Unread"}</td><td>${!x.is_read ? `<button class="btn secondary" onclick="readN(${x.notification_id})">Mark Read</button>` : "-"}</td></tr>`,
      ),
    );
  } catch (e) {
    list.textContent = e.message;
  }
}
async function readN(id) {
  try {
    await api(`/api/notifications/${id}/read`, { method: "PATCH" });
    loadNotifications();
  } catch (e) {
    toast(e.message, true);
  }
}
async function loadProfile() {
  const root = document.getElementById("profileRoot");
  if (!root) return;
  try {
    let p = {
      name: userName(),
      email: localStorage.getItem("annasetu_email") || "-",
      phone: localStorage.getItem("annasetu_phone") || "-",
      address: localStorage.getItem("annasetu_address") || "-",
    };
    if (role() === "ngo") {
      const d = await api("/api/ngos/profile");
      p = d.ngo || p;
    }
    if (role() === "volunteer") {
      const d = await api("/api/volunteers/profile");
      p = d.volunteer || p;
    }
    root.innerHTML = `<div class="profile-hero"><div class="profile-avatar">${(p.name || role()).slice(0, 2).toUpperCase()}</div><div><h1>${esc(p.name || "-")}</h1><p>${esc(role())} · AnnaSetu member</p></div></div><div class="form-grid"><label>Full Name<input value="${esc(p.name || "")}" disabled></label><label>Phone<input value="${esc(p.phone || "")}" disabled></label><label class="full-col">Address<textarea disabled>${esc(p.address || "")}</textarea></label><label class="full-col">Email<input value="${esc(p.email || "")}" disabled></label><label class="full-col">Role<input value="${esc(role())}" disabled></label></div>`;
  } catch (e) {
    root.innerHTML = `<div class="notice">${esc(e.message)}</div>`;
  }
}
function initCommon(allowed) {
  if (!guard(allowed)) return false;
  buildNav(role(), currentPage());
  if (currentPage() === "notifications") loadNotifications();
  if (currentPage() === "profile") loadProfile();
  return true;
}
