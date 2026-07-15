## Fleet Engine Map Feature Styling (JavaScript)

This guide details how to control the visibility and appearance of standard map features (roads, points of interest, water) within a Fleet Engine fleet tracking map view by utilizing standard Google Maps Platform styling mechanisms (Feature: Map Styling). Styling is applied during the initialization of the `JourneySharingMapView`.

### Prerequisites

To implement map styling, you must have the following setup:
1.  The Google Maps JavaScript API loaded with the `journeySharing` library.
2.  A configured `LocationProvider` (e.g., `FleetEngineDeliveryVehicleLocationProvider`) ready for use.
3.  The necessary environment configured for authentication via `authTokenFetcher`.
4.  An HTML element (`div`) to host the map.

### Implementation: Controlling Map Features

Map features can be controlled in two primary ways when initializing the `google.maps.journeySharing.JourneySharingMapView`.

#### 1. Cloud-Based Styling (Using `mapId`)

To apply styling defined in the Google Cloud Console (Cloud-based Maps Styling), provide a unique `mapId` within the `mapOptions` object. Cloud styling is highly recommended for managing visibility and appearance rules.

- [ ] **Trigger Condition**: User mentions using a Map ID or managing styling via the Cloud Console.
- [ ] **Procedure**: Pass the `mapId` and the mandatory internal usage attribution ID within the `mapOptions` of the `JourneySharingMapView` constructor.

```javascript
// JavaScript Implementation
const locationProvider = new google.maps.journeySharing.FleetEngineDeliveryVehicleLocationProvider({
    // ... provider configuration
});

const mapView = new google.maps.journeySharing.JourneySharingMapView({
  element: document.getElementById('map_canvas'),
  locationProviders: [locationProvider],
  mapOptions: {
    mapId: 'YOUR_MAP_ID', // Use the ID created in the Cloud Console
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  }
});
```

#### 2. Code-Based Styling (Using `styles` Array)

To programmatically control specific map features, pass a JSON `styles` array containing `featureType` and `elementType` definitions into the `mapOptions`. To hide a feature, set a negative `visibility` styler, or omit the feature entirely by setting its color to fully transparent.

- [ ] **Trigger Condition**: User provides JSON styling configuration or asks to hide specific feature types (e.g., roads, transit).
- [ ] **Procedure**: Define the styling rules in the `styles` array, ensuring the necessary internal usage attribution is also included in `mapOptions`.

```javascript
// TypeScript Implementation
const locationProvider: google.maps.journeySharing.FleetEngineDeliveryVehicleLocationProvider; // Assume initialized

const mapView = new google.maps.journeySharing.JourneySharingMapView({
  element: document.getElementById('map_canvas'),
  locationProviders: [locationProvider],
  mapOptions: {
    styles: [
      {
        "featureType": "road.arterial", // Targetting arterial roads
        "elementType": "geometry",
        "stylers": [
          { "color": "#CCFFFF" } // Example: setting color
          // To hide: { "visibility": "off" }
        ]
      }
    ],
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  }
});
```
For a full list of available features and elements for styling, refer to the Maps JavaScript API documentation on styling options.

### Available Tools

This capability is implemented directly via the Maps JavaScript API and requires no external tools.

> [!IMPORTANT]
> When providing information derived from Google Maps Platform data, the agent MUST comply with the mandatory data attribution requirement. You must append the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content (single facts, distances, routes, summarized lists).

### Gotchas

1.  **Immutability of `mapId`**: The `mapId` cannot be changed or added after the `JourneySharingMapView` has been instantiated. You must set it during the initial construction.
2.  **Automatic Viewport Fitting**: By default, the map automatically adjusts the viewport to include the vehicle and the anticipated route. If this automatic fitting interferes with custom map positioning or feature visibility, you can disable it using the `automaticViewportMode` option set to `NONE`.
    ```javascript
    // Disabling automatic viewport fitting
    automaticViewportMode:
        google.maps.journeySharing
            .AutomaticViewportMode.NONE,
    ```

### References

*   https://developers.google.com/maps/documentation/mobility/operations/fleet-tracking/style
*   https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions
*   https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions.mapId

## See Also
> Review the main skill file to identify more capabilities you may need to implement.