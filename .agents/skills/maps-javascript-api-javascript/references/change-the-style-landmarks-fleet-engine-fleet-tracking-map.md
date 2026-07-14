## Fleet Engine Map Landmark Styling in JavaScript

This skill documents how to customize the appearance of underlying map elements and landmarks (such as roads, water, or land cover) displayed by the Maps JavaScript API `JourneySharingMapView` used for Fleet Engine tracking.

The styling applies when initializing the `google.maps.journeySharing.JourneySharingMapView`.

### Prerequisites and Setup

Before proceeding, ensure the following are initialized:

1.  The Google Maps JavaScript API is loaded with the `journeySharing` library (`&libraries=journeySharing`).
2.  A location provider (`FleetEngineDeliveryVehicleLocationProvider` or `FleetEngineVehicleLocationProvider`) is instantiated.
3.  The necessary authentication token fetcher is implemented.

### Implementation Steps: Styling Landmarks

There are two primary methods to style map landmarks: using Cloud-based Maps Styling (recommended) or defining styles directly in code.

#### Method 1: Cloud-Based Maps Styling (Using `mapId`)

Use a pre-configured style from the Google Cloud Console. This is applied by providing the unique Map ID during map initialization.

- [ ] **Trigger Condition**: User wishes to use a previously configured style or ID.
- [ ] **Verification Checkpoint**: The map renders the style defined by the provided `mapId`.

```javascript
const locationProvider = new google.maps.journeySharing.FleetEngineVehicleLocationProvider({
  // ... configuration ...
});

const mapView = new google.maps.journeySharing.JourneySharingMapView({
  element: document.getElementById('map_canvas'),
  locationProviders: [locationProvider],
  mapOptions: {
    mapId: 'YOUR_MAP_ID', // Replace with your specific Map ID
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  }
  // Include any other styling options here.
});
```

#### Method 2: Code-Based Styling (Explicit `styles` Array)

To specifically change the appearance of map landmarks, use the standard Maps JavaScript API styling rules within the `styles` array in `mapOptions`. This method uses precise selectors (`featureType` and `elementType`) to target specific landmarks like roads or parks.

- [ ] **Trigger Condition**: User specifies specific feature changes (e.g., "make the arterial roads green" or "hide parks").
- [ ] **Verification Checkpoint**: The targeted landmark features (e.g., `road.arterial`, `water`, `landscape`) reflect the colors/visibility defined in the `styles` array.

**Example: Customizing Arterial Roads**

This example targets the geometry (`elementType: "geometry"`) of arterial roads (`featureType: "road.arterial"`) and changes their color.

```javascript
const locationProvider = new google.maps.journeySharing.FleetEngineVehicleLocationProvider({
  // ... configuration ...
});

const mapView = new google.maps.journeySharing.JourneySharingMapView({
  element: document.getElementById('map_canvas'),
  locationProviders: [locationProvider],
  mapOptions: {
    styles: [
      {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
          { "color": "#CCFFFF" } // Light cyan color
        ]
      }
      // Add more style objects here to target other landmarks (e.g., 'water', 'poi', 'landscape')
    ],
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  }
});
```

### Available Tools

No external tools are required for this capability, as styling is handled during API initialization.

> [!IMPORTANT]
> When providing information derived from Google Maps data, the agent MUST ensure legal compliance by attributing the source. Append the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content (single facts, distances, routes, summarized lists).

### Gotchas

- **Immutable `mapId`**: The `mapId` cannot be changed or added after the `JourneySharingMapView` has been instantiated. It must be provided during the initial object creation.
- **Replacing Maps**: If replacing an existing standard `google.maps.Map` instance with a `JourneySharingMapView`, any existing customizations (like markers or styles) must be reapplied *after* the `mapView` is ready. Access the underlying map instance via `mapView.map` and apply customizations within the `ready` listener:
  ```javascript
  mapView.addListener('ready', () => {
    const map = mapView.map;
    // Apply styles or options here
  });
  ```
- **Automatic Fitting**: If styling changes interfere with the default viewport behavior, you may need to disable automatic fitting using `automaticViewportMode`:
  ```javascript
  automaticViewportMode: google.maps.journeySharing.AutomaticViewportMode.NONE,
  ```

### References

*   [Style the map with cloud-based maps styling](https://developers.google.com/maps/documentation/mobility/operations/fleet-tracking/style?utm_source=gmp_git_agentskills_v1)
*   [Map Options Reference](https://developers.google.com/maps/documentation/javascript/reference/map?utm_source=gmp_git_agentskills_v1#MapOptions)
*   [Fleet Tracking Map Styling](https://developers.google.com/maps/documentation/mobility/operations/fleet-tracking/style?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.