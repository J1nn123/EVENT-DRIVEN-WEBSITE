class MarkerHandler {
  constructor(pin, map) {
    this.pin = pin;
    this.map = map;

    // Add marker to the map
    this.marker = L.marker([pin.pin_lat, pin.pin_long])
      .addTo(map)
      .bindPopup(pin.pin_name);

    
    if (pin.pin_polygon_vertices && Array.isArray(pin.pin_polygon_vertices)) {
      this.polygon = L.polygon(pin.pin_polygon_vertices, { color: "blue" })
        .addTo(map)
        .bindPopup(`${pin.pin_name} Area`);
    }

    // Add click event for the marker
    this.marker.on("click", () => this.handleClick());
  }
  handleClick() {
    const display = document.getElementById("infoDisplay");
    display.innerHTML = ""; // Clear existing content
    const cardContainer = document.createElement("div");
    cardContainer.className = "card";

    const label = document.createElement("h4");
    label.textContent = this.pin.pin_name;
    cardContainer.appendChild(label);

    const info = document.createElement("p");
    info.textContent = "Number of PCs: " + this.pin.pin_num_pc;
    cardContainer.appendChild(info);

    const printersInfo = document.createElement("p");
    printersInfo.textContent = "Number of Printers: " + this.pin.pin_num_printers;
    cardContainer.appendChild(printersInfo);

    // Add buttons
    const btnContainer = document.createElement("div");
    btnContainer.id = "btnContainer";
    cardContainer.appendChild(btnContainer);

    const reserveBtn = document.createElement("button");
    reserveBtn.textContent = "Reserve";
    reserveBtn.className = "btn modern-btn reserve-btn"; // Add class
    reserveBtn.style.backgroundColor = "green";
    btnContainer.appendChild(reserveBtn);

    const occupyBtn = document.createElement("button");
    occupyBtn.textContent = "Occupy";
    occupyBtn.className = "btn modern-btn occupy-btn"; // Add class
    occupyBtn.style.backgroundColor = "red";
    btnContainer.appendChild(occupyBtn);

    reserveBtn.addEventListener("click", () => {
        cardContainer.style.backgroundColor = "green";
        if (this.polygon) {
            this.polygon.setStyle({ color: "green" });
        }
    });

    occupyBtn.addEventListener("click", () => {
        cardContainer.style.backgroundColor = "red";
        if (this.polygon) {
            this.polygon.setStyle({ color: "red" });
        }
    });

    // Add an image
    const image = document.createElement("img");
    image.src = this.pin.pin_image_url || "default-image.jpg";
    image.alt = `${this.pin.pin_name} Image`;
    image.style.width = "100%";
    image.style.marginTop = "10px";
    cardContainer.appendChild(image);

    display.appendChild(cardContainer); // Add details to the navbar display
    this.map.setZoom(18);
}
}

class MapHandler {
  constructor(mapElementId, jsonData) {
    this.map = L.map(mapElementId).setView([8.359997, 124.868352], 18);
    this.allMarkers = [];
    
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    this.loadMapData(jsonData);
  }

  loadMapData(jsonData) {
    if (!jsonData || !jsonData.map_polygon_vertices || !jsonData.map_pins) {
      throw new Error("Invalid JSON structure");
    }

    var features = L.featureGroup();

    // Create the map polygon (this is the main polygon)
    const polygon = L.polygon(jsonData.map_polygon_vertices, { color: "blue" })
      .addTo(this.map)
      .bindPopup(jsonData.map_name);

    features.addLayer(polygon);

    jsonData.map_pins.forEach(pin => {
      let markerHandler = new MarkerHandler(pin, this.map);
      this.allMarkers.push(markerHandler);
      features.addLayer(markerHandler.marker);
    });

    this.map.fitBounds(features.getBounds());
  }

  searchLocation(searchValue) {
    this.allMarkers.forEach(markerHandler => {
      const matchesSearch = markerHandler.pin.pin_name.toLowerCase().includes(searchValue.toLowerCase());
  
      if (matchesSearch) {
        markerHandler.marker.addTo(this.map); 
        if (markerHandler.polygon) {
          markerHandler.polygon.addTo(this.map); // Show polygon
        }
      } else {
        this.map.removeLayer(markerHandler.marker); 
        if (markerHandler.polygon) {
          this.map.removeLayer(markerHandler.polygon); // Hide polygon
        }
      }
    });
  }
}
fetch("./map.json")
  .then((response) => response.json())
  .then((jsonData) => {
    const mapHandler = new MapHandler("map", jsonData);

    document.getElementById("searchInput").addEventListener("input", (event) => {
      const searchValue = event.target.value.toLowerCase();
      mapHandler.searchLocation(searchValue);
    });
  })
  .catch((error) => console.error("Error fetching JSON:", error));