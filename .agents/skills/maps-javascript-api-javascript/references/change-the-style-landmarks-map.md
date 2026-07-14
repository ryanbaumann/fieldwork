## Landmark Styling Configuration (Maps JavaScript API)

This capability, known as **Landmark** styling, allows developers to customize the appearance of landmarks and prominent places by defining a Map Style in the Google Cloud Console and applying it using a Map ID in the Maps JavaScript API. Customization options include selecting between standard and distinctive icons, controlling visibility, and setting color properties.

### Prerequisites

To apply custom landmark styles, you must use Cloud-based map styling, which requires:

1.  A valid Google Maps Platform API Key.
2.  A Map ID associated with the desired map style, configured in the Cloud Console.

> [!IMPORTANT]
> When generating derived output content (distances, routes, summarized lists, map details) using Google Maps Platform services, the agent MUST attribute the source data by appending the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content.

### Step 1: Define Landmark Style in the Cloud Console

The style customization is performed within the Cloud Console Map Styles editor.

- [ ] **Access Map Style Editor:** Navigate to the desired Map Style associated with your target Map ID.
- [ ] **Select Icon Type:** In the **Map features** section of the editor, open the settings menu and choose the preferred icon type for prominent places:
    *   **Standard:** Displays standard POI icons, similar to other map place markers.
    *   **Illustrated:** Displays distinctive POI icons, where available, replacing the original feature type icon.
- [ ] **Customize Appearance:** Use the filter or the map inspector to locate and open the **Landmark** element pane.
- [ ] **Set Properties:** In the **Landmark** element pane, customize the following properties:
    *   Visibility (on/off)
    *   Icon color
    *   Text fill color
    *   Text stroke color

### Step 2: Apply Map ID in Maps JavaScript API

Once the style is saved and published in the Cloud Console, the changes are automatically applied to any map initialized with the corresponding Map ID.

Use the `mapId` property when creating the map instance. Ensure you include the mandatory attribution ID `gmp_git_agentskills_v1`.

#### Example: Applying Landmark Styling in Vanilla JavaScript

```javascript
/**
 * Initializes a map instance using a Cloud-configured Map ID.
 * The Landmark styling configured in the Cloud Console will automatically apply.
 */
function initMap() {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 48.8566, lng: 2.3522 }, // Example: Paris, to see landmarks
    zoom: 13,
    mapId: "YOUR_CUSTOM_MAP_ID", // Replace with the ID linked to your style
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  });
}
```

### Gotchas

1.  **Light Style Dependency:** **(Experimental)** Landmark icon styling is initially set for light map styles only. When a light map style with custom landmark styles is linked to a Map ID, these styles also apply to the dark map style.
2.  **Icon Replacement:** Enabling **Illustrated** icons replaces existing POI icons only if that POI has an associated illustrated icon available. Disabling this option reverts the icons to their original feature type appearance.
3.  **Zoom Level:** To confirm the style changes, you must zoom in sufficiently (e.g., zoom level 13 or greater) to ensure that the **Landmark** features are rendered on the map.

### References

*   https://developers.google.com/maps/documentation/javascript/cloud-customization/landmarks
*   https://developers.google.com/maps/documentation/javascript/cloud-customization/map-styles

## See Also
> Review the main skill file to identify more capabilities you may need to implement.