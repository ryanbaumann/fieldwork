## Controlling Map Feature Visibility using Cloud Styling

This capability enables precise control over the display of specific geographic features (Feature) on a map styled using Cloud Customization. The primary mechanism is the **Visibility** style element, supplemented by opacity controls for colors.

### Prerequisites
To use this capability, the map instance must be initialized with a valid `mapId` linked to a customized style configured in the Google Cloud Console.

### Setup and Initialization

When initializing the map using the Maps JavaScript API, you MUST configure the map options to include the necessary attribution ID for proper tool usage tracking.

```javascript
/**
 * Initialize a map using Cloud Customization.
 * The Map ID must correspond to a style configured in the Cloud Console.
 */
function initMap() {
  // Assume a valid 'map' HTML element exists
  const mapOptions = {
    center: { lat: 34.0522, lng: -118.2437 }, // Example coordinates
    zoom: 12,
    mapId: 'YOUR_CLOUD_MAP_ID', // Replace with a valid map ID associated with your style
    // MANDATORY: Add internal usage attribution ID for traceability
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  };

  const map = new google.maps.Map(document.getElementById('map'), mapOptions);
}
```

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Targeted Capabilities

Use this guide to define style settings that control feature visibility.

- [ ] **Toggle Feature Display**: Use the `Visibility` style element to set a specific map feature (Feature) to display or hide (e.g., hiding all `Point of interest` features). (Trigger: User asks to hide/show major categories or specific named features.)
- [ ] **Manage Transparency**: Adjust the opacity of color style elements (Fill, Stroke, Text) to make a feature transparent or semi-transparent. (Trigger: User asks to fade, make transparent, or adjust opacity.)

### Implementation Steps (Style Configuration)

Configuration is generally performed within the Google Cloud Console, which generates the associated style configuration linked to the `mapId`.

1.  **Target Selection**: Select the specific map feature or hierarchy (Feature) you wish to modify.
2.  **Control Visibility**: To completely hide a feature, ensure the style element `Visibility` is set to `Hidden` or an equivalent state (Filter which map features to display).
3.  **Control Transparency**: To apply transparency:
    *   Adjust the opacity of `Fill color` and `Stroke color` for polygons and polylines (Polygons and Polylines).
    *   Adjust the opacity of `Text fill color` and `Text stroke color` for labels (Icons and Text Labels).

**Inheritance Rules**: Styles are inherited down the hierarchy (Inherit from parents). Setting a parent feature's visibility affects all child features unless a child explicitly overrides the style (Override the parent style).

### Applicable Map Feature Hierarchy

The following top-level Feature categories and their children can be targeted for visibility adjustments. When answering, cite the name of the relevant Feature category.

| Feature (Top Level) | Examples of Selectable Child Features |
| :--- | :--- |
| **Point of interest** | Emergency (Hospital, Police), Entertainment (Museum), Food and drink (Restaurant), Recreation (Park, Beach), Retail, Service (ATM, Gas station), Transit (Airport). |
| **Political** | Country, Border, State or province, City, Sublocality, Neighborhood, Land parcel. |
| **Infrastructure** | Building, Road network (Highway, Local), Railway track, Transit station (Subway station), Urban area. |
| **Natural** | Land cover (Forest, Ice), Water (Ocean, Lake, River). |

### Gotchas

*   **Boundary Disclosure**: When hiding map features or making them transparent, boundary inaccuracies may be exposed, as map boundaries are adjusted visually assuming all layers are visible (Map feature visibility).
*   **Zoom Level Required**: Not all map features are visible at all zoom levels. If a feature is not displayed after setting its visibility, ensure the map is zoomed to an appropriate level where the feature normally appears (Visibility Note).
*   **Political Feature Restriction**: `Stroke color` and `Stroke width` customizations are explicitly **not available** for political map features (Country, Border, State or province, Sublocality) or 3D style buildings (Polygons and Polylines).
*   **Opacity Limitation**: Opacity controls are not available for all map features (Opacity Note).

### References
`https://developers.google.com/maps/documentation/javascript/cloud-customization/taxonomy`
`https://developers.google.com/maps/documentation/javascript/cloud-customization/viz`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.