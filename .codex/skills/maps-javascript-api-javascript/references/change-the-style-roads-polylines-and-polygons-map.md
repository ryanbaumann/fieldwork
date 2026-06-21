The Maps JavaScript API, when configured with a Map ID enabled for Cloud-based Map Styling, allows developers to customize the visual appearance of features represented as polygons (areas) or polylines (lines), which includes roads, trails, and various boundaries.

### Prerequisites and Setup

Before applying custom styles, the map must be initialized using a `mapId` associated with a customized style in the Google Cloud Console.

1.  **Mandatory Authentication Prerequisite**: Ensure the `GOOGLE_API_KEY` is configured in the environment for successful script loading and map initialization.
2.  **Load the API**: Include the Maps JavaScript API script, specifying your API key and Map ID.

```html
<script
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&v=beta&map_ids=YOUR_MAP_ID">
</script>
```

3.  **Initialize the Map**: Pass the custom `mapId` and the mandatory internal usage attribution ID during map creation.

```javascript
function initMap() {
  const mapOptions = {
    center: { lat: 40.7, lng: -74.0 },
    zoom: 12,
    mapId: 'YOUR_MAP_ID', // Must match the Cloud Style configuration
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  };
  const map = new google.maps.Map(document.getElementById('map'), mapOptions);
}
```

### Styling Polygons and Polylines

For map features represented by shapes (polygons) or lines (polylines), the agent can apply the following style elements:

| Style Element | Purpose | Affected Features |
| :--- | :--- | :--- |
| **Visibility** | Shows or hides the feature. | All shape/line features. |
| **Fill color** | Sets the interior color for polygons or lines. | Polygons and Polylines. |
| **Stroke color** | Sets the outline color for polygons or the line color for polylines. | Polygons and Polylines (Section Polygons and Polylines). |
| **Stroke width** | Sets the thickness of the outline/line. Results may vary depending on the zoom level. | Polygons and Polylines (Section Polygons and Polylines). |

**Note on Opacity**: Opacity can be adjusted for `Fill color`, `Stroke color`, `Text fill color`, and `Text stroke color` by defining colors using an alpha channel (e.g., RGBA or hex with alpha). The appearance depends on underlying map features (Section Opacity).

### Target Features for Road, Polyline, and Polygon Styling

The ability to style `Fill color`, `Stroke color`, and `Stroke width` applies specifically to features classified as shapes or lines (Section Polygons and Polylines).

#### 1. Road and Line Features (Polylines)
These features are typically found under the `Infrastructure` and `Natural` hierarchies:

*   **Road Network**:
    *   `Road` (including `Arterial`, `Highway`, `Local`, `No outlet`)
    *   `Railway track` (including `Commercial`, `Commuter`)
    *   `Trail` (including `Paved`, `Unpaved`)
    *   Other infrastructure components like `Pedestrian mall`, `Parking aisle`, `Ramp`.
*   **Examples** referenced in documentation: `Highway`, `Railway track`, `Trail`.

#### 2. Area/Shape Features (Polygons)
These include features under `Recreation`, `Political`, and `Natural` hierarchies:

*   **Political**: `Reservation`, `Country`, `State or province`, `Sublocality`, `Land parcel`.
*   **Recreation**: `Beach`, `Golf course`, `Park`, `Town square`.
*   **Natural**: `Land` (including `Land cover` details like `Forest`, `Water` (like `River`, `Lake`), `Island`.
*   **Examples** referenced in documentation: `Beach`, `Country`, `Town square`, `Reservation`.

### Step-by-Step Styling Procedure

Use the following procedure when defining map styles in the Cloud Console to ensure specific features receive the intended look:

- [ ] **Identify the Feature Type**: Determine the specific map feature to be styled (e.g., `Road.Highway`, `Natural.Water.River`).
- [ ] **Define Style Inheritance**: Determine if the style should inherit from a parent feature (e.g., styling `Road network` to affect all child roads) or override a specific child feature (Section Inherit from parents, Override the parent style).
- [ ] **Set Visibility**: If the feature should be hidden, set the `Visibility` style element to hide the feature (Section Visibility).
- [ ] **Apply Shape Styles**: For polygon/polyline features, configure the required appearance using `Fill color`, `Stroke color`, and `Stroke width`. If no outline is desired, set the `Stroke width` to 0 or match `Stroke color` to `Fill color` (Section Stroke width).
- [ ] **Customize Zoom Levels (If necessary)**: If the appearance should change based on the zoom level, define level-specific styling (Section Customize zoom levels).

## Gotchas

The agent MUST be aware of the following limitations regarding `Stroke color` and `Stroke width` when responding to user styling queries (Section Polygons and Polylines):

1.  **Political Features Limitation**: `Stroke color` and `Stroke width` customizations are **not available** for the following political map features:
    *   `Country`
    *   `Border`
    *   `State or province`
    *   `Sublocality`
2.  **3D Buildings Limitation**: `Stroke color` and `Stroke width` customizations are **not available** for `3D style buildings`.

### References

https://developers.google.com/maps/documentation/javascript/cloud-customization/taxonomy
https://developers.google.com/maps/documentation/javascript/cloud-customization/zoom-levels
https://developers.google.com/maps/documentation/javascript/cloud-customization/overlap

## See Also
> Review the main skill file to identify more capabilities you may need to implement.