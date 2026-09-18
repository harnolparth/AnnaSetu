if (initCommon(["ngo"])) {
  const page = currentPage();
  if (page === "dashboard") {
    (async () => {
      try {
        const [a, r, d] = await Promise.all([
          api("/api/ngos/donations/available"),
          api("/api/ngos/requests"),
          api("/api/ngos/deliveries"),
        ]);
        const av = a.donations || [],
          rq = r.requests || [],
          dl = d.deliveries || [];
        const set = (id, v) => {
          const el = document.getElementById(id);
          if (el) el.textContent = v;
        };
        set("ngoRequests", rq.length);
        set("ngoAccepted", rq.filter((x) => x.status === "Accepted").length);
        set("ngoPending", rq.filter((x) => x.status === "Pending").length);
        set("ngoAvailable", av.length);
        set(
          "ngoMeals",
          av.reduce((s, x) => s + Number(x.no_of_meals || 0), 0),
        );
        const recent = document.getElementById("recent");
        if (recent)
          recent.innerHTML = table(
            ["Food", "Donor", "Status", "Requested"],
            rq
              .slice(-5)
              .reverse()
              .map(
                (x) =>
                  `<tr><td>${esc(x.food_name)}</td><td>${esc(x.donor_name)}</td><td>${badge(x.status)}</td><td>${fmt(x.request_date)}</td></tr>`,
              ),
          );
      } catch (e) {
        toast(e.message, true);
      }
    })();
  }
  if (page === "available") {
    (async () => {
      try {
        const d = await api("/api/ngos/donations/available");
        document.getElementById("list").innerHTML = table(
          [
            "ID",
            "Food",
            "Type",
            "Qty",
            "Meals",
            "Donor",
            "Pickup",
            "Expiry",
            "Action",
          ],
          d.donations.map(
            (x) =>
              `<tr><td>${x.donation_id}</td><td>${esc(x.food_name)}</td><td>${esc(x.food_type)}</td><td>${x.quantity}</td><td>${x.no_of_meals}</td><td>${esc(x.donor_name)}</td><td>${esc(x.pickup_address)}</td><td>${fmt(x.expiry_date)}</td><td><button class="btn primary" onclick="requestDonation(${x.donation_id})">Request</button></td></tr>`,
          ),
        );
      } catch (e) {
        document.getElementById("list").textContent = e.message;
      }
    })();
    window.requestDonation = async (id) => {
      try {
        await api(`/api/ngos/donations/${id}/requests`, { method: "POST" });
        toast("Request sent");
        location.reload();
      } catch (e) {
        toast(e.message, true);
      }
    };
  }
  if (page === "requests") {
    (async () => {
      try {
        const d = await api("/api/ngos/requests");
        document.getElementById("list").innerHTML = table(
          ["ID", "Food", "Qty", "Meals", "Donor", "Requested", "Status"],
          d.requests.map(
            (x) =>
              `<tr><td>${x.request_id}</td><td>${esc(x.food_name)}</td><td>${x.quantity}</td><td>${x.no_of_meals}</td><td>${esc(x.donor_name)}</td><td>${fmt(x.request_date)}</td><td>${badge(x.status)}</td></tr>`,
          ),
        );
      } catch (e) {
        document.getElementById("list").textContent = e.message;
      }
    })();
  }
  if (page === "deliveries") {
    (async () => {
      try {
        const d = await api("/api/ngos/deliveries");
        document.getElementById("list").innerHTML = table(
          ["ID", "Food", "Donor", "Volunteer", "Pickup", "Status", "Delivered"],
          d.deliveries.map(
            (x) =>
              `<tr><td>${x.delivery_id}</td><td>${esc(x.food_name)}</td><td>${esc(x.donor_name)}</td><td>${esc(x.volunteer_name || "Not accepted")}</td><td>${esc(x.pickup_address)}</td><td>${badge(x.status)}</td><td>${fmt(x.delivery_time)}</td></tr>`,
          ),
        );
      } catch (e) {
        document.getElementById("list").textContent = e.message;
      }
    })();
  }
}
