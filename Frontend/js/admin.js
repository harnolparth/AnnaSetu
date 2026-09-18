if (initCommon(["admin"])) {
  const page = currentPage();
  if (page === "dashboard") {
    (async () => {
      try {
        const s = (await api("/api/admin/stats")).stats;
        const ids = [
          "adminDonors",
          "adminNgos",
          "adminVolunteers",
          "adminDonations",
          "adminRequests",
          "adminDeliveries",
          "adminCompleted",
          "adminAvailable",
        ];
        const vals = [
          s.donors,
          s.ngos,
          s.volunteers,
          s.donations,
          s.requests,
          s.deliveries,
          s.completed_deliveries,
          s.available_donations,
        ];
        ids.forEach((id, i) => {
          const el = document.getElementById(id);
          if (el) el.textContent = vals[i];
        });
      } catch (e) {
        toast(e.message, true);
      }
    })();
  }
  if (page === "users") {
    (async () => {
      try {
        const d = await api("/api/admin/users");
        document.getElementById("list").innerHTML = table(
          ["ID", "Name", "Role", "Email", "Phone"],
          d.users.map(
            (x) =>
              `<tr><td>${x.id}</td><td>${esc(x.name)}</td><td>${esc(x.user_type)}</td><td>${esc(x.email)}</td><td>${esc(x.phone)}</td></tr>`,
          ),
        );
      } catch (e) {
        document.getElementById("list").textContent = e.message;
      }
    })();
  }
  if (page === "statistics") {
    (async () => {
      try {
        const s = (await api("/api/admin/stats")).stats,
          items = [
            ["Donors", s.donors],
            ["NGOs", s.ngos],
            ["Volunteers", s.volunteers],
            ["Donations", s.donations],
            ["Requests", s.requests],
            ["Deliveries", s.deliveries],
            ["Completed", s.completed_deliveries],
            ["Available", s.available_donations],
          ];
        document.getElementById("cards").innerHTML = items
          .map(
            (x) =>
              `<div class="card stat-card"><div class="stat-icon">▥</div><div><div class="stat-label">${x[0]}</div><div class="stat">${x[1]}</div></div></div>`,
          )
          .join("");
        new Chart(document.getElementById("chart"), {
          type: "bar",
          data: {
            labels: items.map((x) => x[0]),
            datasets: [
              { label: "Count", data: items.map((x) => x[1]), borderRadius: 7 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true, precision: 0 },
              x: { grid: { display: false } },
            },
          },
        });
      } catch (e) {
        document.getElementById("cards").textContent = e.message;
      }
    })();
  }
}
