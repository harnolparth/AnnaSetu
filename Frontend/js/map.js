if (guard(["donor", "ngo", "volunteer"])) {
  buildNav(role(), currentPage());
  const map = L.map("map").setView([18.5204, 73.8567], 11);
  navigator.geolocation.getCurrentPosition(
    function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        L.circleMarker([lat, lng], {
            radius: 8,
            color: "#1a73e8",
            fillColor: "#1a73e8",
            fillOpacity: 1
        })
        .addTo(map)
        .bindPopup("Your current location");

        map.setView([lat, lng], 14);
    },
    function (error) {
        console.log("Location permission denied or unavailable.", error);
    }
);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  initAnnaSetuCurrentLocation(map);
  async function geo(address) {
    const r = await fetch(
        "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
          encodeURIComponent(address),
      ),
      d = await r.json();
    return d[0] ? { lat: +d[0].lat, lon: +d[0].lon } : null;
  }
  (async () => {
    try {
      let data = [];
      if (role() === "donor")
        data = (await api("/api/donors/donations")).donations.map((x) => [
          x.food_name,
          x.pickup_address,
        ]);
      else if (role() === "ngo")
        data = (await api("/api/ngos/donations/available")).donations.map(
          (x) => [x.food_name, x.pickup_address],
        );
      else
        data = (await api("/api/deliveries/my")).deliveries.flatMap((x) => [
          [x.food_name, x.pickup_address],
          [x.ngo_name, x.ngo_address],
        ]);
      const bounds = [];
      for (const x of data.slice(0, 20)) {
        const g = await geo(x[1]);
        if (g) {
          L.marker([g.lat, g.lon])
            .addTo(map)
            .bindPopup("<b>" + esc(x[0]) + "</b><br>" + esc(x[1]));
          bounds.push([g.lat, g.lon]);
        }
      }
      if (bounds.length) map.fitBounds(bounds, { padding: [20, 20] });
    } catch (e) {
      toast(e.message, true);
    }
  })();
}
