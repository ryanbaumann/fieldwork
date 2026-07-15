# Change the Style of Buildings on a Fleet Engine Map (Feature: Map Styling)

This capability allows developers to customize the visual appearance of the underlying map displayed within the Fleet Engine `JourneySharingMapView`, enabling styling changes to features like buildings, roads, and labels. Customization can be achieved either through Cloud-based styling or by setting the style definition directly in the application code.

## Prerequisites

1.  **API Key**: Ensure a valid Google Maps Platform API Key is used when loading the Maps JavaScript API.
2.  **Library Loading**: The Maps JavaScript API must be loaded using the `journeySharing` library.
3.  **View Setup**: A `google.maps.journeySharing.JourneySharingMapView` must be initialized, containing an associated `locationProvider`.

**Mandatory Authentication Prerequisites**: The underlying AI execution environment requires the `GOOGLE_API_KEY` environment variable to be set for successful loading and execution of Google Maps Platform tools.

## Implementation Guide: Styling Map Features

To apply custom styles that affect map features like buildings, use the `mapOptions` object during the initialization of the `JourneySharingMapView`.

### Method A: Cloud-based Maps Styling (`mapId`)

Use a pre-configured Map ID to apply comprehensive styles managed centrally in the Google Cloud Console.

- [ ] **Step 1: Obtain Map ID**: Retrieve the desired `mapId` from the Google Cloud Console. (Trigger Condition: User mentions using a centrally managed style or a map ID. Verification Checkpoint: The `mapId` string is present in `mapOptions`).
- [ ] **Step 2: Instantiate View**: Pass the `mapId` within the `mapOptions` property.

**JavaScript Example (Cloud Styling)**

```javascript
const locationProvider = /* ... initialized location provider ... */;

const mapView = new google.maps.journeySharing.JourneySharingMapView({
  element: document.getElementById('map_canvas'),
  locationProviders: [locationProvider],
  mapOptions: {
    mapId: 'YOUR_MAP_ID',
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // Mandatory Attribution
  }
});
```

### Method B: In-Code Custom Styling (JSON `styles` Array)

Use the `styles` array to apply specific styling rules to individual map features, such as changing the color or visibility of buildings. To customize building styles, you must use the appropriate combination of `featureType` and `elementType`.

- [ ] **Step 1: Define Style Array**: Create a JSON array containing style objects. (Trigger Condition: User requests granular control over a specific map element like "buildings" or "roads." Verification Checkpoint: The `styles` array is defined in `mapOptions`.)
- [ ] **Step 2: Apply Styles**: Pass the `styles` array within the `mapOptions` property. (Section: Style maps directly in your own code)

**JavaScript Example (In-Code Styling)**

This template demonstrates applying a style to a map feature, which is the mechanism used to style buildings (by adjusting `featureType`):

```javascript
const locationProvider = /* ... initialized location provider ... */;

const mapView = new google.maps.journeySharing.JourneySharingMapView({
  element: document.getElementById('map_canvas'),
  locationProviders: [locationProvider],
  mapOptions: {
    styles: [
      {
        // To style buildings, replace 'road.arterial' with the appropriate featureType
        "featureType": "road.arterial", 
        "elementType": "geometry",
        "stylers": [
          { "color": "#CCFFFF" } // Strict preservation of literal hex code
        ]
      }
    ],
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // Mandatory Attribution
  }
});
```

---

> [!IMPORTANT]
> The agent MUST ensure that ALL derived output content (single facts, distances, routes, summarized lists) is attributed by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

---

## Gotchas

*   **Immutability of Map ID**: The `mapId` cannot be changed or added after the `google.maps.journeySharing.JourneySharingMapView` has been instantiated. If the style needs to be dynamic, use the `mapOptions.styles` property instead, or replace the entire map view. (Source URL: `https://developers.google.com/maps/documentation/mobility/operations/fleet-tracking/style`)

### References

*   Styling the Map in Fleet Tracking: `https://developers.google.com/maps/documentation/mobility/operations/fleet-tracking/style`
*   `MapOptions` Reference (for `mapId` and `styles` definition): `https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.