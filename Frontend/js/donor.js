if (initCommon(["donor"])) {
  const page = currentPage();

  // ========================================
  // DONOR DASHBOARD
  // ========================================

  if (page === "dashboard") {
    (async () => {
      try {
        const d = (await api("/api/donors/donations")).donations || [];

        const total = d.length;

        const delivered = d.filter(
          (x) => x.status === "Delivered"
        ).length;

        const active = d.filter(
          (x) =>
            !["Delivered", "Rejected", "Cancelled"].includes(x.status)
        ).length;

        const meals = d.reduce(
          (a, x) => a + Number(x.no_of_meals || 0),
          0
        );

        const values = [
          total,
          delivered,
          active,
          meals
        ];

        [
          "donorTotal",
          "donorDelivered",
          "donorActive",
          "donorMeals"
        ].forEach((id, i) => {
          const el = document.getElementById(id);

          if (el) {
            el.textContent = values[i];
          }
        });

        const recent = document.getElementById("recent");

        if (recent) {
          recent.innerHTML = table(
            ["Food", "Meals", "Expiry", "Status"],

            d
              .slice(-5)
              .reverse()
              .map(
                (x) => `
                  <tr>
                    <td>${esc(x.food_name)}</td>
                    <td>${x.no_of_meals}</td>
                    <td>${fmt(x.expiry_date)}</td>
                    <td>${badge(x.status)}</td>
                  </tr>
                `
              )
          );
        }

      } catch (e) {
        toast(e.message, true);
      }
    })();
  }


  // ========================================
  // ADD DONATION
  // ========================================

  if (page === "add-donation") {

    const form = document.getElementById("f");

    // ----------------------------------------
    // Publish Donation
    // ----------------------------------------

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();

        const d = Object.fromEntries(
          new FormData(e.target)
        );

        d.quantity = Number(d.quantity);
        d.no_of_meals = Number(d.no_of_meals);

        for (const k of [
          "available_from",
          "available_until",
          "expiry_date"
        ]) {
          if (d[k]) {
            d[k] = d[k] + ":00";
          }
        }

        try {
          await api("/api/donors/donations", {
            method: "POST",
            body: JSON.stringify(d)
          });

          toast("Donation created");

          setTimeout(() => {
            location.href = "donations.html";
          }, 500);

        } catch (x) {
          toast(x.message, true);
        }
      };
    }


    // ----------------------------------------
    // Use My Location
    // ----------------------------------------

    const useLocationBtn =
      document.getElementById("useLocationBtn");

    const pickupAddress =
      document.getElementById("pickup_address");

    const locationStatus =
      document.getElementById("locationStatus");


    if (
      useLocationBtn &&
      pickupAddress &&
      locationStatus
    ) {

      useLocationBtn.addEventListener("click", () => {

        // Check browser support
        if (!navigator.geolocation) {

          locationStatus.textContent =
            "Geolocation is not supported by your browser.";

          return;
        }


        locationStatus.textContent =
          "Getting your location...";

        useLocationBtn.disabled = true;


        navigator.geolocation.getCurrentPosition(

          async (position) => {

            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;


            try {

              // Reverse geocoding using OpenStreetMap
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
              );


              if (!response.ok) {
                throw new Error(
                  "Address lookup failed"
                );
              }


              const data =
                await response.json();


              if (data.display_name) {

                pickupAddress.value =
                  data.display_name;

                locationStatus.textContent =
                  "✓ Pickup location detected.";

              } else {

                pickupAddress.value =
                  `${latitude}, ${longitude}`;

                locationStatus.textContent =
                  "✓ Location detected.";
              }


            } catch (error) {

              console.error(
                "Reverse geocoding error:",
                error
              );


              // If address lookup fails,
              // keep coordinates as fallback
              pickupAddress.value =
                `${latitude}, ${longitude}`;

              locationStatus.textContent =
                "✓ Location detected. Address lookup unavailable.";
            }


            useLocationBtn.disabled = false;
          },


          (error) => {

            useLocationBtn.disabled = false;


            switch (error.code) {

              case error.PERMISSION_DENIED:

                locationStatus.textContent =
                  "Location permission was denied.";

                break;


              case error.POSITION_UNAVAILABLE:

                locationStatus.textContent =
                  "Your location is currently unavailable.";

                break;


              case error.TIMEOUT:

                locationStatus.textContent =
                  "Location request timed out.";

                break;


              default:

                locationStatus.textContent =
                  "Unable to get your location.";
            }
          },


          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });
    }
  }


  // ========================================
  // MY DONATIONS
  // ========================================

  if (page === "donations") {

    async function loadDonations() {

      try {

        const d =
          await api("/api/donors/donations");


        document.getElementById("list").innerHTML =
          table(

            [
              "ID",
              "Food",
              "Type",
              "Qty",
              "Meals",
              "Expiry",
              "Status",
              "Requests"
            ],

            d.donations.map(
              (x) => `
                <tr>
                  <td>${x.donation_id}</td>

                  <td>
                    ${esc(x.food_name)}
                  </td>

                  <td>
                    ${esc(x.food_type)}
                  </td>

                  <td>
                    ${x.quantity}
                  </td>

                  <td>
                    ${x.no_of_meals}
                  </td>

                  <td>
                    ${fmt(x.expiry_date)}
                  </td>

                  <td>
                    ${badge(x.status)}
                  </td>

                  <td>
                    <button
                      class="btn secondary"
                      onclick="viewRequests(${x.donation_id})"
                    >
                      View
                    </button>
                  </td>
                </tr>
              `
            )
          );

      } catch (e) {

        document.getElementById("list").textContent =
          e.message;
      }
    }


    // ----------------------------------------
    // View NGO Requests
    // ----------------------------------------

    window.viewRequests = async (id) => {

      try {

        const d =
          await api(
            `/api/donors/donations/${id}/requests`
          );


        document.getElementById("list").innerHTML =

          `
            <div class="head">

              <h3>
                Requests for Donation #${id}
              </h3>

              <button
                class="btn secondary"
                onclick="loadDonations()"
              >
                Back
              </button>

            </div>
          `

          +

          table(

            [
              "ID",
              "NGO",
              "Date",
              "Status",
              "Action"
            ],

            d.requests.map(
              (x) => `

                <tr>

                  <td>
                    ${x.request_id}
                  </td>

                  <td>
                    ${esc(x.ngo_name)}
                  </td>

                  <td>
                    ${fmt(x.request_date)}
                  </td>

                  <td>
                    ${badge(x.status)}
                  </td>

                  <td>

                    ${
                      x.status === "Pending"

                        ? `

                          <button
                            class="btn primary"
                            onclick="decideRequest(${x.request_id}, 'accept')"
                          >
                            Accept
                          </button>

                          <button
                            class="btn danger"
                            onclick="decideRequest(${x.request_id}, 'reject')"
                          >
                            Reject
                          </button>

                        `

                        : "-"
                    }

                  </td>

                </tr>
              `
            )
          );

      } catch (e) {

        toast(e.message, true);
      }
    };


    // ----------------------------------------
    // Accept / Reject NGO Request
    // ----------------------------------------

    window.decideRequest = async (
      id,
      decision
    ) => {

      try {

        await api(
          `/api/donors/requests/${id}/decision`,
          {
            method: "PATCH",

            body: JSON.stringify({
              decision: decision
            })
          }
        );


        toast("Request updated");

        loadDonations();

      } catch (e) {

        toast(e.message, true);
      }
    };


    window.loadDonations =
      loadDonations;


    loadDonations();
  }
}