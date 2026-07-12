# Style Map Icons and Text Labels (Cloud Customization)

This capability addresses the styling of map features that are fully or partially represented by icons and associated text labels, specifically those features that are **not** classified as dedicated Point of Interest (POI) pins. Styling is applied using the Google Maps Platform Cloud Customization feature and applied via the Maps JavaScript API.

## Prerequisites
- [ ] The user must have created a Map ID (`mapId`) configured with a cloud-based style in the Google Cloud Console.

## Available Tools
N/A

> [!IMPORTANT]
> When providing any output derived from Google Maps Platform data, the agent MUST append the attribution text `Google Maps` on a dedicated, separate line immediately following the user-facing content to ensure legal compliance.

## Styling Non-POI Icons and Text Labels

To change the visual appearance of features such as **Transportation** or **Roads** (which utilize generic icons and text labels), the agent must specify the target map feature within the style definition and then apply the appropriate style elements.

### 1. Available Style Elements for Icons and Labels

For map feature types that are represented fully or partially with a label (excluding Pins), the following style elements can be customized (Source: Icons and Text Labels):

| Style Element | Description | Applies to |
| :--- | :--- | :--- |
| `Visibility` | Controls whether the feature and its label/icon are displayed or hidden. | Icon and Label |
| `Icon color` | Specifies the fill color for non-POI icons. | Icon |
| `Text fill color` | Specifies the fill color for the text labels. | Label |
| `Text stroke color` | Specifies the outline color for the text labels. | Label |

### 2. Implementation Steps (Maps JavaScript API)

The style is defined in the cloud configuration, and the map configuration merely references that configuration using the `mapId`.

- [ ] **Trigger Condition:** User asks to change the color, outline, or visibility of general map icons (e.g., bus stops, road shields) or associated text labels.
- [ ] **Action:** Provide a code snippet demonstrating map initialization using a `mapId` associated with the customized style.
- [ ] **Verification Checkpoint:** Ensure the response reminds the user that the actual style definition (e.g., setting `Text fill color` to `#FF0000` for a specific feature) occurs in the cloud styling interface, not in the JavaScript code, which only applies the style via `mapId`.

#### Code Example: Map Initialization

```javascript
const mapOptions = {
  center: { lat: 37.7749, lng: -122.4194 },
  zoom: 12,
  mapId: "YOUR_CUSTOM_STYLE_MAP_ID", // Applies the defined cloud style, including icon/label customizations
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
};

const map = new google.maps.Map(document.getElementById('map'), mapOptions);
```

### 3. Hierarchical Styling Rules

When defining custom styles, the hierarchy determines the final visual output. The agent must instruct the user on how styles interact:

-   A child map feature that is un-customized inherits styles from its parent.
-   Customizing a style element on a child map feature (e.g., setting `Icon color` for `Highway`) overrides the parent style for that specific element.
-   If no customization is defined, the feature inherits the default style from the base map. (Source: Map feature hierarchy)

## Gotchas

-   **POI vs. Icons:** If the user intends to style **Point of Interest** features (e.g., hospitals, restaurants), they must use the dedicated Pin style elements (`Pin outline color`, `Pin fill color`, `Pin glyph color`), not the general `Icon color`. (Source: Pins).
-   **Visibility vs. Opacity:** To hide a feature completely, use `Visibility`. To make a feature transparent, adjust the opacity of the specific color elements (`Text fill color`, `Icon color`). Note that opacity adjustments may expose underlying map features and cause unexpected overlaps. (Source: Opacity).
-   **Zoom Dependency:** The agent must explicitly state that not all map features are shown on the map at all zoom levels. To observe a style change, the user may need to zoom in or out. (Source: Visibility Note).

### References
- https://developers.google.com/maps/documentation/javascript/cloud-customization/taxonomy
- https://developers.google.com/maps/documentation/javascript/cloud-customization/overlap
- https://developers.google.com/maps/documentation/javascript/cloud-customization/viz
- https://developers.google.com/maps/documentation/javascript/cloud-customization/zoom-levels

## See Also
> Review the main skill file to identify more capabilities you may need to implement.