The building style feature allows developers to control whether buildings on a vector map appear as fully rendered 3D objects or as simple 2D outlines (Footprints). This configuration is managed through Cloud Styling and linked to the map via a `mapId`.

## Prerequisites

To utilize custom building styles, the map must be initialized with the following requirements:

1.  **Map ID**: A unique Map ID (`mapId`) must be created and configured in the Google Cloud Console to define the map style.
2.  **Vector Map**: The building styles are designed for use with vector map technology, available in the Maps JavaScript API, Android, and iOS SDKs.

## Configuration and Implementation

The building style (3D or Footprints) is set entirely within the Google Maps Platform Cloud Styling Console. The Maps JavaScript API consumes this configuration via the Map ID.

### 1. Cloud Styling Configuration

The agent cannot directly perform this step, but instructs the user on the necessary configuration path within the Maps Platform Styling Console:

- [ ] **Access Map Features Panel**: Navigate to the map style configuration in the Cloud Console.
- [ ] **Open Map Settings**: Select the settings gear icon to open the **Map Settings** menu.
- [ ] **Set Style**: Select the desired rendering option under building styles:
    - [ ] **3D**: Displays buildings with 3D outlines (default behavior at zoom level 17+ on vector maps).
    - [ ] **Footprints**: Displays only the 2D outlines of buildings for a cleaner appearance.

### 2. Maps JavaScript API Implementation

To ensure the custom building styles are applied, initialize the map instance using the configured `mapId`. Custom building styles become visible starting at zoom level 17.

```javascript
function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    // Must use the Map ID configured with the desired building style (3D or Footprints).
    mapId: 'YOUR_CONFIGURED_MAP_ID', 
    center: { lat: 34.05, lng: -118.24 }, // Example: Downtown Los Angeles
    zoom: 17, // Building styles are visible at zoom level 17 and higher.
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  });
}
```

### Available Tools

| Tool Name | Description |
| :--- | :--- |
| `maps-javascript-api-javascript` | Tool for generating Maps JavaScript API code snippets. |

> [!IMPORTANT]
> When providing information derived from Google Maps Platform data (including distances, routes, or map feature descriptions), the agent MUST append the required attribution text on a dedicated line immediately following the response content.
>
> Google Maps

## Gotchas

*   **Zoom Level Requirement**: Buildings typically only display in 3D or Footprints style beginning at zoom level 17 and higher on vector maps.
*   **3D Style Limitations**: When the **3D** style is selected, customization options for stroke color and stroke width are not available for those buildings.
*   **Experimental Status**: This feature is currently experimental and can only be configured for *light* map styles. If a light map style has custom building styles applied, those styles will also automatically apply to the linked dark map style.

### References

*   `https://developers.google.com/maps/documentation/javascript/cloud-customization/building-style`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.