(function () {
    let currentLocationMarker = null;
    let currentAccuracyCircle = null;

    /*
     * Blue Google Maps-style location icon
     */
    const currentLocationIcon = L.divIcon({
        className: "annasetu-current-location",
        html: `
            <div class="current-location-dot">
                <div class="current-location-pulse"></div>
            </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    /*
     * Add current location to the map
     */
    function showCurrentLocation(map, centerMap = true) {

        if (!navigator.geolocation) {
            console.error("Geolocation is not supported by this browser.");
            return;
        }

        map.locate({
            setView: false,
            watch: false,
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        });

        map.once("locationfound", function (e) {

            const latlng = e.latlng;

            console.log(
                "Current location:",
                latlng.lat,
                latlng.lng
            );

            /*
             * Remove old marker/circle
             */
            if (currentLocationMarker) {
                map.removeLayer(currentLocationMarker);
            }

            if (currentAccuracyCircle) {
                map.removeLayer(currentAccuracyCircle);
            }

            /*
             * Blue current-location dot
             */
            currentLocationMarker = L.marker(
                latlng,
                {
                    icon: currentLocationIcon,
                    zIndexOffset: 1000
                }
            )
            .addTo(map)
            .bindPopup("<b>You are here</b>");

            /*
             * Accuracy circle
             */
            currentAccuracyCircle = L.circle(
                latlng,
                {
                    radius: e.accuracy,
                    className: "location-accuracy-circle",
                    weight: 1,
                    fillOpacity: 0.12
                }
            ).addTo(map);

            /*
             * Center map on user's location
             */
            if (centerMap) {
                map.setView(
                    latlng,
                    15,
                    {
                        animate: true
                    }
                );
            }
        });

        map.once("locationerror", function (e) {

            console.error(
                "Could not get current location:",
                e.message
            );

            alert(
                "Unable to get your current location. " +
                "Please allow location permission in your browser."
            );
        });
    }


    /*
     * Add a "My Location" button similar to Google Maps
     */
    function addMyLocationButton(map) {

        const LocationControl = L.Control.extend({

            options: {
                position: "topright"
            },

            onAdd: function () {

                const container = L.DomUtil.create(
                    "div",
                    "leaflet-bar leaflet-control"
                );

                const button = L.DomUtil.create(
                    "button",
                    "annasetu-location-button",
                    container
                );

                button.type = "button";
                button.title = "Show my location";
                button.setAttribute(
                    "aria-label",
                    "Show my current location"
                );

                button.innerHTML = "◎";

                /*
                 * Prevent map click/zoom when clicking button
                 */
                L.DomEvent.disableClickPropagation(button);
                L.DomEvent.on(
                    button,
                    "click",
                    function (e) {

                        L.DomEvent.stopPropagation(e);

                        button.classList.add("loading");

                        showCurrentLocation(
                            map,
                            true
                        );

                        setTimeout(function () {
                            button.classList.remove("loading");
                        }, 1500);
                    }
                );

                return container;
            }
        });

        map.addControl(
            new LocationControl()
        );
    }


    /*
     * Initialize current location
     */
    window.initAnnaSetuCurrentLocation = function (map) {

        if (!map) {
            console.error(
                "AnnaSetu: Leaflet map was not found."
            );
            return;
        }

        /*
         * Add My Location button
         */
        addMyLocationButton(map);

        /*
         * Automatically find location
         * when map opens.
         */
        showCurrentLocation(
            map,
            true
        );
    };

})();