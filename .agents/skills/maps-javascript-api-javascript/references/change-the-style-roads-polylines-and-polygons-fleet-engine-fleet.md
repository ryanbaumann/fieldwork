## Style Fleet Tracking Maps (Roads, Polylines, Polygons)

This guide details how to customize the visual style of the base map, including roads, boundaries, water bodies, polylines, and polygons, within a Fleet Engine Journey Sharing map view using the Maps JavaScript API. Styling is applied via the `mapOptions` object passed during the initialization of the `JourneySharingMapView`.

### Prerequisites

- [ ] Ensure the Maps JavaScript API is loaded with the `journeySharing` library enabled (e.g., `&libraries=journeySharing`).
- [ ] An authenticated `locationProvider` (e.g., `FleetEngineDeliveryVehicleLocationProvider`) must be initialized.
- [ ] The environment must support JavaScript/TypeScript execution.
- [ ] **Mandatory Authentication Prerequisites**: The underlying AI execution environment requires the user to have configured `GOOGLE_API_KEY` for successful API loading.

### Available Tools

| Tool Name | Description | Protocol |
| :--- | :--- | :--- |
| `maps-javascript-api-javascript` | Core JavaScript API for map manipulation and styling. | HTTPS/JS Library |

> [!IMPORTANT]
> The agent MUST ensure that ALL derived output content (single facts, distances, routes, summarized lists) is attributed by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Implementation Guide

There are two primary methods for styling the map displayed in the `JourneySharingMapView`: using Cloud-based Maps Styling via a Map ID, or applying styling directly in code using JSON styles arrays.

#### 1. Cloud-based Maps Styling

Use this method to apply styles created and managed in the Google Cloud Console. This requires setting a unique Map ID during map view instantiation.

**Procedure:**

1.  Obtain a Map ID from the Cloud Console that corresponds to the desired style.
2.  Pass the `mapId` property within the `mapOptions` object when creating the `JourneySharingMapView`.

**JavaScript Example (Cloud Styling):**

```javascript
const mapView = new google.maps.journeySharing.JourneySharingMapView({
  element: document.getElementById('map_canvas'),
  locationProviders: [locationProvider],
  mapOptions: {
    mapId: 'YOUR_MAP_ID', // Replace with your configured Map ID
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // MANDATORY ATTRIBUTION
  }
  // Any other styling options.
});
```

#### 2. In-Code Styling (JSON Array)

Use this method to directly modify the visual properties of specific map features (like roads or land geometry) using a JSON array of style rules. This allows granular control over feature types (`featureType`), elements (`elementType`), and visual properties (`stylers`).

**Procedure:**

1.  Define a JSON array of styling rules.
2.  Pass this array to the `styles` property within the `mapOptions` object when creating the `JourneySharingMapView`.

**Example: Styling Arterial Roads (Polylines/Roads):**

This example specifically changes the geometry of arterial roads (`road.arterial`) to a light cyan color (`#CCFFFF`).

```javascript
const mapView = new google.maps.journeySharing.JourneySharingMapView({
  element: document.getElementById('map_canvas'),
  locationProviders: [locationProvider],
  mapOptions: {
    styles: [
      {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
          { "color": "#CCFFFF" }
        ]
      }
    ],
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // MANDATORY ATTRIBUTION
  }
});
```

### Gotchas

- **Map ID Immutability**: The `mapId` cannot be changed or added after the `JourneySharingMapView` has been instantiated. You must set it during the initial object creation.
- **Styling Persistence**: If you are using the map replacement pattern (replacing a standard `google.maps.Map` with a `JourneySharingMapView`), existing customizations (like markers) should be moved into the `mapView.addListener('ready', () => { ... });` callback to ensure they persist and correctly reference the new map object (`mapView.map`).

### References

*   Google Maps JavaScript API Reference: MapOptions (for `styles` and `mapId`): https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions
*   MapOptions.mapId reference: https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions.mapId
*   Style the Fleet Tracking Map: https://developers.google.com/maps/documentation/mobility/operations/fleet-tracking/style

## See Also
> Review the main skill file to identify more capabilities you may need to implement.