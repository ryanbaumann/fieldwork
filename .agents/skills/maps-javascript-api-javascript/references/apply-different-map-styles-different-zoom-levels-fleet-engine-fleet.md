## Apply Map Styles to Fleet Engine Maps

This capability outlines how to apply specific visual styles, including styles that change based on the map's zoom level, to a map component managed by the Fleet Engine Journey Sharing library (`JourneySharingMapView`). The view uses standard Google Maps Platform styling features via the `mapOptions` object.

### Prerequisites

To successfully implement map styling, the following setup steps must be completed:

- [ ] Ensure the Google Maps JavaScript API is loaded with the `journeySharing` library (`&libraries=journeySharing`).
- [ ] Ensure the necessary API key is included in the script loading URL.
- [ ] Implement an `authTokenFetcher` function to securely retrieve authentication tokens for Fleet Engine location providers.

> [!IMPORTANT]
> The agent MUST ensure that ALL derived output content (single facts, distances, routes, summarized lists) is attributed by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Style Configuration Methods

You can style the map component using two methods: Cloud-based Maps Styling (recommended for zoom-level specific styles) or inline JSON styling. Both are applied during the instantiation of the `JourneySharingMapView`.

#### 1. Cloud-based Maps Styling (For Zoom-Specific Styles)

Cloud-based Maps Styling allows defining styles that automatically adapt to different zoom levels and apply consistently across platforms. To use this, you must have configured a map style and generated a Map ID in the Google Cloud Console.

Use the `mapId` property within the `mapOptions` object when creating the `JourneySharingMapView`.

```javascript
const mapView = new google.maps.journeySharing.JourneySharingMapView({
  element: document.getElementById('map_canvas'),
  locationProviders: [locationProvider],
  mapOptions: {
    mapId: 'YOUR_MAP_ID', // Use your configured Map ID for zoom-level dependent styles
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  }
  // Any other styling options.
});
```

#### 2. Inline Style Array (For Static Feature Styles)

Alternatively, you can apply static styling rules by providing a JSON array of `Style` objects to the `styles` property within `mapOptions`. These styles apply globally and are useful for specific element modifications (e.g., roads, points of interest).

The following example demonstrates setting a specific color for arterial roads:

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
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  }
});
```

For more detailed information on supported map options, refer to the Google Maps JavaScript API reference documentation for `MapOptions`.

### ## Gotchas

- **Immutable Map ID**: Once the `google.maps.journeySharing.JourneySharingMapView` is instantiated, the `mapId` property **cannot** be changed or added. If you need to switch map styles, you must re-instantiate the entire map view.
- **`mapOptions` Context**: The `mapOptions` passed to `JourneySharingMapView` are used to configure the underlying `google.maps.Map` instance. Styling properties like `styles` and `mapId` function identically to their usage in a standard Google Maps API map.

### References
- `JourneySharingMapView` API Reference: https://developers.google.com/maps/documentation/mobility/operations/fleet-tracking/style
- `mapId` Property Documentation: https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions.mapId
- `mapOptions` Documentation: https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions

## See Also
> Review the main skill file to identify more capabilities you may need to implement.