if (initCommon(["volunteer"])) {
  const page = currentPage();
  if (page === "dashboard") {
    (async () => {
      try {
        const [m, a] = await Promise.all([
          api("/api/deliveries/my"),
          api("/api/deliveries/available"),
        ]);
        const mine = m.deliveries || [],
          available = a.deliveries || [];
        const set = (id, v) => {
          const el = document.getElementById(id);
          if (el) el.textContent = v;
        };
        set("volTotal", mine.length);
        set(
          "volCompleted",
          mine.filter((x) => x.status === "Delivered").length,
        );
        set(
          "volProgress",
          mine.filter((x) =>
            ["Accepted", "Picked Up", "On The Way"].includes(x.status),
          ).length,
        );
        set("volAvailable", available.length);
        set(
          "volMeals",
          mine.reduce((s, x) => s + Number(x.no_of_meals || 0), 0),
        );
        const recent = document.getElementById("recent");
        if (recent)
          recent.innerHTML = table(
            ["Food", "NGO", "Status", "Pickup"],
            mine
              .slice(-5)
              .reverse()
              .map(
                (x) =>
                  `<tr><td>${esc(x.food_name)}</td><td>${esc(x.ngo_name)}</td><td>${badge(x.status)}</td><td>${esc(x.pickup_address)}</td></tr>`,
              ),
          );
      } catch (e) {
        toast(e.message, true);
      }
    })();
  }
  if (page === "availability") {
    (async () => {
      try {
        const d = await api("/api/volunteers/profile"),
          v = d.volunteer;
        document.getElementById("box").innerHTML =
          `<div class="stat-card"><div class="stat-icon">◉</div><div><div class="stat-label">Current availability</div><div class="stat">${v.availability ? "Available" : "Unavailable"}</div></div></div><p class="muted" style="margin:14px 0">Change your availability to control whether you can accept delivery tasks.</p><button class="btn ${v.availability ? "danger" : "primary"}" onclick="toggleAvailability(${!v.availability})">${v.availability ? "Set Unavailable" : "Set Available"}</button>`;
      } catch (e) {
        document.getElementById("box").textContent = e.message;
      }
    })();
    window.toggleAvailability = async (v) => {
      try {
        await api("/api/volunteers/availability", {
          method: "PATCH",
          body: JSON.stringify({ availability: v }),
        });
        location.reload();
      } catch (e) {
        toast(e.message, true);
      }
    };
  }
  if (page === "available") {
    (async () => {
      try {
        const d = await api("/api/deliveries/available");
        document.getElementById("list").innerHTML = table(
          [
            "ID",
            "Food",
            "Donor",
            "Pickup",
            "NGO",
            "NGO Address",
            "Expiry",
            "Action",
          ],
          d.deliveries.map(
            (x) =>
              `<tr><td>${x.delivery_id}</td><td>${esc(x.food_name)}</td><td>${esc(x.donor_name)}</td><td>${esc(x.pickup_address)}</td><td>${esc(x.ngo_name)}</td><td>${esc(x.ngo_address)}</td><td>${fmt(x.expiry_date)}</td><td><button class="btn primary" onclick="acceptDelivery(${x.delivery_id})">Accept</button></td></tr>`,
          ),
        );
      } catch (e) {
        document.getElementById("list").textContent = e.message;
      }
    })();
    window.acceptDelivery = async (id) => {
      try {
        await api(`/api/deliveries/${id}/accept`, { method: "POST" });
        toast("Delivery accepted");
        location.href = "my-deliveries.html";
      } catch (e) {
        toast(e.message, true);
      }
    };
  }
  if (page === "my-deliveries") {
    (async () => {
      try {
        const d = await api("/api/deliveries/my");
        document.getElementById("list").innerHTML = table(
          ["ID", "Food", "Pickup", "NGO", "Status", "Next"],
          d.deliveries.map((x) => {
            const n = {
              Accepted: "Picked Up",
              "Picked Up": "On The Way",
              "On The Way": "Delivered",
            }[x.status];
            return `<tr><td>${x.delivery_id}</td><td>${esc(x.food_name)}</td><td>${esc(x.pickup_address)}</td><td>${esc(x.ngo_name)}</td><td>${badge(x.status)}</td><td>${n ? `<button class="btn primary" onclick="setDeliveryStatus(${x.delivery_id},'${n}')">${n}</button>` : "Completed"}</td></tr>`;
          }),
        );
      } catch (e) {
        document.getElementById("list").textContent = e.message;
      }
    })();
    window.setDeliveryStatus = async (id, status) => {
      try {
        await api(`/api/deliveries/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        toast("Status updated");
        location.reload();
      } catch (e) {
        toast(e.message, true);
      }
    };
  }
}
