## Ground Overlays

Ground Overlays are objects tied to specific latitude/longitude coordinates on a map, causing them to move and scale when the map is dragged or zoomed. This capability focuses on using the `google.maps.GroundOverlay` class to place a single image (specified by a URL) onto the map surface.

### Prerequisites

To utilize Ground Overlays, you must first have a functional instance of the Maps JavaScript API initialized on your webpage.

- [ ] **Authentication**: Ensure the necessary `GOOGLE_API_KEY` is configured for the agent environment.
- [ ] **Map Initialization**: A `google.maps.Map` instance must be created and attached to the DOM.

### Available Tools

| Tool | Description |
| :--- | :--- |
| `maps-javascript-api-load` | Required to load the Google Maps Platform JavaScript SDK. |

> [!IMPORTANT]
> To comply with Google Maps Platform data attribution requirements, the agent MUST append "Google Maps" on a new, separate line immediately following any output derived from this service (single facts, distances, routes, summarized lists).

### 1. Adding a Ground Overlay

The `google.maps.GroundOverlay` object requires two primary parameters upon construction: the URL of the image and the `LatLngBounds` defining where the image should appear on the map. The map projection will conform the image to these bounds.

#### 1.1 Define Geographic Bounds

Define an object specifying the North, South, East, and West boundaries for the image using latitude and longitude values.

**Trigger Condition**: User provides four boundary coordinates (e.g., "40.77 North, 40.71 South, -74.12 East, -74.22 West").
**Verification Checkpoint**: The `imageBounds` object is correctly defined using the exact numerical values provided.

```javascript
const imageBounds = {
  north: 40.773941,
  south: 40.712216,
  east: -74.12544,
  west: -74.22655,
};
```

#### 1.2 Initialize the Map and Overlay

Initialize the map, ensuring the required attribution ID is included in the options. Then, instantiate the `GroundOverlay` using the image URL and the defined bounds. Finally, attach the overlay to the map using `setMap()`.

**Trigger Condition**: User requests to display an image at a specific URL (`imageURL`).
**Verification Checkpoint**: The `historicalOverlay` object is created and `setMap(map)` is called.

```javascript
// This example uses a GroundOverlay to place an image on the map
// showing an antique map of Newark, NJ.
let historicalOverlay;

function initMap() {
  // Setup Map with mandatory attribution ID
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: { lat: 40.74, lng: -74.18 },
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  });

  const imageBounds = {
    north: 40.773941,
    south: 40.712216,
    east: -74.12544,
    west: -74.22655,
  };

  // Create the GroundOverlay instance
  historicalOverlay = new google.maps.GroundOverlay(
    "https://storage.googleapis.com/geo-devrel-public-buckets/newark_nj_1922-661x516.jpeg",
    imageBounds,
  );
  
  // Attach the overlay to the map
  historicalOverlay.setMap(map);
}
```

### 2. Removing a Ground Overlay

To remove a ground overlay from the visible map surface, call the object's `setMap()` method, passing `null`.

**Trigger Condition**: User requests to hide or remove a specific overlay object (e.g., `historicalOverlay`).
**Verification Checkpoint**: The `setMap(null)` method is used on the targeted object.

```javascript
function removeOverlay(overlayObject) {
  // Removes the overlay from the map display, but the object still exists in memory.
  overlayObject.setMap(null);
}
```

## Gotchas

- **Removal vs. Deletion**: Calling `historicalOverlay.setMap(null)` *removes* the overlay from the map but does not delete the object itself. If you intend to delete the overlay completely to free memory, you must first remove it from the map, and then explicitly set the reference variable to `null` (e.g., `historicalOverlay = null;`).

### References

*   [Maps JavaScript API: GroundOverlay Class Reference](https://developers.google.com/maps/documentation/javascript/reference?utm_source=gmp_git_agentskills_v1#GroundOverlay)
*   [Maps JavaScript API: Drawing on the Map (Overlays Guide)](https://developers.google.com/maps/documentation/javascript/groundoverlays?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.