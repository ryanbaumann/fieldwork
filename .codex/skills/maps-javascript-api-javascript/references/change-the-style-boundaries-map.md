## Setup and Prerequisites

Styling boundaries relies on the Data-Driven Styling (DDS) feature within the Maps JavaScript API (Feature: Data-Driven Styling). Ensure you have initialized the map correctly and enabled the required feature layers.

- [ ] **API Key and Libraries**: Ensure the Maps JavaScript API is loaded with your valid API key.
- [ ] **Map ID**: A Map ID must be created in Google Cloud Console with the **Data-Driven Styling** feature enabled.
- [ ] **Feature Layer Enabling**: The specific feature layer (e.g., `LOCALITY`, `ADMINISTRATIVE_AREA_LEVEL_1`) must be enabled on the associated Map Style configuration.

When initializing the map using the Web Component, include the required attribution ID:

```html
<gmp-map
    center="20.773,-156.01"
    zoom="12"
    map-id="8b37d7206ccf0121d4414bb0"
    internal-usage-attribution-ids="gmp_git_agentskills_v1"></gmp-map>
```

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) related to map features or geographic data by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Styling DDS Boundaries (Feature: Data-Driven Styling)

Styling boundary polygons requires defining appearance options using `google.maps.FeatureStyleOptions` and applying them using a `google.maps.FeatureStyleFunction` set on the map's `FeatureLayer`.

### Step 1: Get the Feature Layer Reference

Retrieve a reference to the desired feature layer using the map's `innerMap.getFeatureLayer()` method and the canonical layer name (e.g., `'LOCALITY'`).

**Trigger Condition**: User asks to style a specific geographic type (city, postal code, state).
**Verification Checkpoint**: `featureLayer` variable is successfully populated.

```javascript
// Request needed libraries and access the inner map first
await google.maps.importLibrary('maps');
const mapElement = document.querySelector('gmp-map');
const innerMap = mapElement.innerMap;

// Get the feature layer.
let featureLayer = innerMap.getFeatureLayer('LOCALITY');
```

### Step 2: Define Feature Style Options

Create a configuration object of type `google.maps.FeatureStyleOptions` to specify the visual properties for the fill and stroke of the polygon boundary.

```javascript
// Define a style with purple fill and border.
const featureStyleOptions = {
    strokeColor: '#810FCB', // The color of the boundary line
    strokeOpacity: 1.0,
    strokeWeight: 3.0,
    fillColor: '#810FCB', // The fill color of the boundary area
    fillOpacity: 0.5,
};
```
*Note: To uniformly style all features in the layer, set `featureLayer.style = featureStyleOptions` directly. Otherwise, proceed to Step 3 for conditional styling.*

### Step 3: Apply Conditional Styling using a Style Function

To apply styling conditionally (e.g., to highlight only a single region), define a `google.maps.FeatureStyleFunction`. This function runs over every feature in the layer and must return the desired `FeatureStyleOptions` or `null` (to use the default map style).

**Trigger Condition**: User asks to style a boundary based on a condition (e.g., by Place ID or feature property).
**Verification Checkpoint**: Only matching features are styled.

```javascript
// Apply the style to a single boundary based on its Place ID.
featureLayer.style = (options) => {
    const feature = options.feature;
    // The specific Place ID 'ChIJ0zQtYiWsVHkRk8lRoB1RNPo' corresponds to Hana, HI.
    if (feature.placeId === 'ChIJ0zQtYiWsVHkRk8lRoB1RNPo') {
        return featureStyleOptions;
    }
    // Return null for features that should not be styled.
    return null;
};
```

### Step 4: Remove Styling

To remove all applied styling and revert the layer to its default appearance, set the `style` property to `null`.

```javascript
featureLayer.style = null;
```

## Gotchas

*   **Function Consistency**: The `google.maps.FeatureStyleFunction` must return consistent results for the same input feature. If the style function involves logic, ensure it is deterministic. Random or inconsistent results will cause unintended behavior, as the function runs over every feature during rendering.
*   **Place ID Mismatch**: If the specified Place ID is not found, or does not match the selected feature layer type (e.g., attempting to use a city Place ID on a `POSTAL_CODE` layer), the style is not applied.
*   **Performance**: Since the style function runs over every feature in the layer, optimization is critical to avoid impacting rendering times. Only enable the layers you need and set the `style` property to `null` when the style is no longer required.
*   **Lookups**: To obtain the exact `placeId` needed to target a specific region, use the Places API (Text Search) or retrieve the ID from boundary click events:
    *   Use Places APIs and Geocoding for search: `https://developers.google.com/maps/documentation/javascript/dds-boundaries/dds-use-maps-places-apis#text-search`
    *   Use click events to get data: `https://developers.google.com/maps/documentation/javascript/dds-boundaries/handle-events`

### References

*   Styling Boundary Polygons: `https://developers.google.com/maps/documentation/javascript/dds-boundaries/style-polygon`
*   Data Driven Styling Coverage: `https://developers.google.com/maps/documentation/javascript/dds-boundaries/coverage`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.