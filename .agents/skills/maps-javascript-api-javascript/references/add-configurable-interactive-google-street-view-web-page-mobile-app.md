## Google Maps JavaScript API: Configurable Street View (Feature: Street View Panoramas)

This guide details how to initialize and configure an interactive Google Street View panorama using the Maps JavaScript API. Street View is managed via the `StreetViewPanorama` object.

### Prerequisites

1.  A Google Cloud project with the Maps JavaScript API enabled.
2.  An API Key (`GOOGLE_API_KEY`) configured for the execution environment.
3.  A dedicated DOM element (usually a `<div>`) to host the panorama, which must have a minimum size of 200x200 pixels for optimum display.

### Available Tools

| Tool | Capability | API Method/Object |
| :--- | :--- | :--- |
| Street View Renderer | Displays 360° panoramic imagery in a container. | `google.maps.StreetViewPanorama` |
| Street View Service | Programmatically finds and fetches metadata for panoramas near a location. | `google.maps.StreetViewService.getPanorama()` |

> [!IMPORTANT]
> When presenting any distance, route, location, or image data derived from the Google Maps Platform, the downstream agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the final generated content to comply with data attribution requirements.

### 1. Implementation Steps

The `StreetViewPanorama` can be displayed either standalone or linked to a standard `google.maps.Map` instance.

#### 1.1 Standalone Street View Panorama

To display Street View in a container element without a map, initialize `StreetViewPanorama` with the target DOM element and configuration options (`StreetViewOptions`).

**Procedure Checklist:**

- [ ] Select a target `<div>` element (e.g., `<div id="pano"></div>`).
- [ ] Initialize `google.maps.StreetViewPanorama`, providing the DOM element and initial `position`.
- [ ] Configure the initial `point-of-view` using the `pov` property (heading and pitch).

**Example (Displaying a Panorama at Fenway Park):**

```javascript
function initialize() {
  const fenway = { lat: 42.345573, lng: -71.098326 };

  // Initialize the StreetViewPanorama in the element with ID "pano"
  const panorama = new google.maps.StreetViewPanorama(
    document.getElementById("pano"),
    {
      position: fenway,
      pov: {
        heading: 34, // Rotation angle around the camera locus (0 = true north, 90 = true east)
        pitch: 10,   // Vertical angle variance (+90 straight up, -90 straight down)
      },
    },
  );
}

window.initialize = initialize;
```

#### 1.2 Integrated Street View with a Map

Street View is automatically enabled on a map via the **Pegman control**. If you want to explicitly manage the Street View pane or link it to a custom `StreetViewPanorama` object, you must override the default:

- [ ] Initialize a standard `google.maps.Map`.
- [ ] Initialize or retrieve the `StreetViewPanorama` object.
- [ ] Call `map.setStreetView(panorama)` to connect the map to the custom or configured panorama.

```javascript
function initialize() {
  const fenway = { lat: 42.345573, lng: -71.098326 };

  // 1. Initialize the Map
  const map = new google.maps.Map(document.getElementById("map"), {
    center: fenway,
    zoom: 14,
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  });

  // 2. Initialize the StreetViewPanorama (in a separate container)
  const panorama = new google.maps.StreetViewPanorama(
    document.getElementById("pano"),
    {
      position: fenway,
      pov: { heading: 34, pitch: 10 },
    },
  );

  // 3. Link the map and the panorama
  map.setStreetView(panorama);
}
```

### 2. Configuration and Controls

You can customize the interactive controls displayed on the panorama by setting fields in the `StreetViewPanoramaOptions` object during initialization.

| Option | Description | Default |
| :--- | :--- | :--- |
| `panControl` | Displays the compass/pan control for rotating the view. | `true` |
| `zoomControl` | Displays the zoom slider/buttons. | `true` |
| `addressControl` | Displays the address text overlay and Google Maps link. | `true` |
| `fullscreenControl`| Displays the fullscreen toggle button. | `true` |
| `linksControl` | Displays navigation arrows for traveling to adjacent panoramas. | `true` |
| `enableCloseButton`| Displays a button to close the Street View viewer. | `true` |
| `motionTracking` | Enables or disables motion tracking on supporting mobile devices. | `true` |
| `motionTrackingControl`| Displays the UI control to toggle motion tracking. | `true` |

**Example (Disabling Pan and Links Controls):**

When initializing the panorama, pass the control options:

```javascript
function initPano() {
  const panorama = new google.maps.StreetViewPanorama(
    document.getElementById("map"),
    {
      position: { lat: 42.345573, lng: -71.098326 },
      // Disable panning and link arrows
      linksControl: false,
      panControl: false,
      // Customize address control position
      addressControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_CENTER,
      },
    },
  );
}
```

### 3. Events

The `StreetViewPanorama` object fires several events when its state changes. These are crucial for monitoring user interaction or programmatic changes:

| Event Name | Trigger Condition |
| :--- | :--- |
| `pano_changed` | Fires when the unique panorama ID (`getPano()`) changes. |
| `position_changed` | Fires when the underlying `LatLng` position changes. |
| `pov_changed` | Fires when the `StreetViewPov` (heading or pitch) changes. |
| `links_changed` | Fires when the adjacent links/navigation paths change. |
| `visible_changed` | Fires when the panorama's visibility state changes. |

### 4. Advanced: Custom Panoramas

To display custom, user-provided 360° imagery instead of Google's data, you must implement a custom provider function and register it.

**Procedure Checklist:**

- [ ] Create an image source that conforms to the 2:1 aspect ratio equirectangular projection.
- [ ] Implement a `pano` provider function that accepts a Panorama ID (`pano: string`) and returns a `StreetViewPanoramaData` object.
- [ ] Define the `StreetViewPanoramaData` structure, including `location`, `copyright`, and `tiles`.
- [ ] Define a `getTileUrl` function within `tiles` that returns the URL for image tiles based on `pano`, `zoom`, `tileX`, and `tileY`.
- [ ] Call `panorama.registerPanoProvider(yourProviderFunction)`.
- [ ] Set the initial panorama using a custom ID in `StreetViewPanoramaOptions.pano`. **DO NOT** set `position` if displaying a custom panorama; set `location.latLng` within the returned `StreetViewPanoramaData` instead.

**Example (Registering a Custom Panorama Provider):**

```javascript
// 1. Define the tile URL logic
function getCustomPanoramaTileUrl(pano, zoom, tileX, tileY) {
  // Returns a tile image URL based on parameters
  return (
    "https://developers.google.com/maps/documentation/javascript/examples/full/images/" +
    "panoReception1024-" +
    zoom +
    "-" +
    tileX +
    "-" +
    tileY +
    ".jpg"
  );
}

// 2. Define the provider function (returns metadata for a given Pano ID)
function getCustomPanorama(pano) {
  if (pano === "reception") {
    return {
      location: {
        pano: "reception",
        description: "Google Sydney - Reception",
        // Position should be set here, not in the StreetViewPanorama constructor
        latLng: new google.maps.LatLng(-33.86684, 151.19583), 
      },
      links: [],
      copyright: "Imagery (c) 2010 Google",
      tiles: {
        tileSize: new google.maps.Size(1024, 512),
        worldSize: new google.maps.Size(2048, 1024),
        centerHeading: 105,
        getTileUrl: getCustomPanoramaTileUrl, // Link to the tile function
      },
    };
  }
  return null;
}

// 3. Initialization and Registration
function initPano() {
  const panorama = new google.maps.StreetViewPanorama(
    document.getElementById("map"),
    { 
      // Set the initial view using the custom pano ID
      pano: "reception", 
      visible: true 
    },
  );

  // Register the custom provider
  panorama.registerPanoProvider(getCustomPanorama);
}
```

### Gotchas

1.  **Billing Distinction**: Only `StreetViewPanorama` objects created explicitly via the constructor are billed (Feature: Dynamic Street View Pro SKU). The default built-in Street View experience accessed via the Pegman control and the `StreetViewService` calls (`getPanorama()`) are **not** billed. (Pricing: /maps/documentation/javascript/usage-and-billing#dynamic-street-view-pro-sku)
2.  **Custom Panorama Position**: When using a custom panorama provider via `registerPanoProvider()`, you **must not** set the `position` in the `StreetViewPanorama` constructor options. Instead, define the location by setting `location.latLng` within the returned `StreetViewPanoramaData` object. Setting `position` directly attempts to load Google's default Street View imagery.
3.  **Coordinate Precision**: When defining the Point-of-View (POV), `heading` is measured in degrees clockwise from true north (e.g., 90 degrees is true east). `pitch` is measured from the camera's default horizon (0), with positive values looking up (to +90) and negative values looking down (to -90). Ensure these values are preserved exactly as required for strict precision.

### References

*   [Street View Reference (Rendering)](https://developers.google.com/maps/documentation/javascript/reference/street-view?utm_source=gmp_git_agentskills_v1)
*   [Street View Service Reference](https://developers.google.com/maps/documentation/javascript/reference/street-view-service?utm_source=gmp_git_agentskills_v1)
*   [Maps JavaScript API Loading](https://developers.google.com/maps/documentation/javascript/load-maps-js-api?utm_source=gmp_git_agentskills_v1)
*   [Street View Usage Guide](https://developers.google.com/maps/documentation/javascript/streetview?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.