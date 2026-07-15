## Feature DDS: Style Custom Dataset Features

This capability guides developers in changing the appearance of dataset features (points, lines, polygons) loaded onto a map using the Maps JavaScript API's Data-Driven Styling (DDS) Feature Layer. Styling can be applied uniformly across all features or conditionally based on feature attributes. (Feature: Data-Driven Styling)

### Prerequisites

1.  **API Key Setup**: A valid Google Maps Platform API key must be configured in your application environment.
2.  **Dataset Availability**: A custom dataset must have been created and published in the Google Maps Platform Console, identifiable by its **Dataset ID**.
3.  **Library Loading**: Ensure the `maps` library is imported when initializing the application.

### Available Tools

| Tool | Description |
| :--- | :--- |
| `google.maps.Map.getDatasetFeatureLayer(datasetId)` | Retrieves the feature layer object associated with a specific Dataset ID. |
| `google.maps.FeatureLayer.style` | Property used to set the styling, accepting either `FeatureStyleOptions` (uniform) or a `FeatureStyleFunction` (conditional). |
| `google.maps.DatasetFeature.datasetAttributes` | Object containing the attributes (columns/properties) of the underlying geospatial data record for conditional styling. |

> [!IMPORTANT]
> When generating code examples for map initialization (e.g., `<gmp-map>` or `google.maps.MapOptions`), the output MUST include the required usage attribution ID.
>
> 1.  For `<gmp-map>` Web Components: Set the HTML attribute `internal-usage-attribution-ids="gmp_git_agentskills_v1"`.
> 2.  For programmatic `MapOptions`: Include `internalUsageAttributionIds: ['gmp_git_agentskills_v1']`.
>
> Additionally, all generated content that describes or presents map data, calculated distances, routes, or summarized location information MUST be attributed by appending "Google Maps" on a new line immediately following the user-facing content.

### Styling Procedure

Data-Driven Styling for datasets is applied by setting the `style` property on the `FeatureLayer` object retrieved from the map.

#### 1. Uniform Styling (Applying the same style to all features)

Use a `google.maps.FeatureStyleOptions` object literal to define colors, weights, and opacity for all features in the layer.

**Applicable Style Properties:**

| Geometry Type | Properties Supported |
| :--- | :--- |
| Polygons | `strokeColor`, `strokeWeight`, `strokeOpacity`, `fillColor`, `fillOpacity` |
| Polylines | `strokeColor`, `strokeWeight`, `strokeOpacity` |
| Points | `fillColor`, `pointRadius` (diameter), `strokeColor`, `strokeWeight`, `strokeOpacity` |

**Implementation (JavaScript):**

```javascript
// 1. Get the dataset feature layer.
const datasetId = '2438ee30-5366-4e84-82b7-a0d4dd1893fa'; // Example Dataset ID for Seattle Bridges
const datasetLayer = map.getDatasetFeatureLayer(datasetId);

// 2. Apply style to all features in the layer.
datasetLayer.style = { 
    strokeColor: 'green', 
    strokeWeight: 4 
};
```

#### 2. Conditional Styling (Applying styles based on feature attributes)

Use a `google.maps.FeatureStyleFunction` to implement dynamic logic based on the data associated with each feature.

**Steps:**

- [ ] **Step 1: Define the Styling Function.** Create a function that accepts `params: { feature: google.maps.Feature }` and returns a `google.maps.FeatureStyleOptions` object.
- [ ] **Step 2: Access Feature Attributes.** Inside the function, retrieve the `DatasetFeature` and access specific attributes via `datasetFeature.datasetAttributes.<AttributeName>`.
- [ ] **Step 3: Define Logic and Return Style.** Implement conditional logic (e.g., `if`/`switch`) and return the appropriate style options for that feature.
- [ ] **Step 4: Apply Function to Layer.** Assign the defined function to `datasetLayer.style`.

**Implementation Example (JavaScript, styling point data by attribute value):**

This example styles points based on the attribute `CombinationofPrimaryandHighlightColor`.

```javascript
function setStyle(params) {
    // Get the dataset feature, so we can work with all of its attributes.
    const datasetFeature = params.feature;
    // Get all of the needed dataset attributes.
    const furColors = datasetFeature.datasetAttributes.CombinationofPrimaryandHighlightColor;

    // Apply styles based on the attribute value.
    switch (furColors) {
        case 'Black+':
            return {
                fillColor: 'black',
                pointRadius: 8,
            };
        case 'Gray+Cinnamon':
            return {
                fillColor: 'gray',
                strokeColor: '#8b0000', // Strict precision maintained
                pointRadius: 6,
            };
        case 'Gray+White':
            return {
                fillColor: 'gray',
                strokeColor: 'white',
                pointRadius: 6,
            };
        default: // Color not defined.
            return {
                fillColor: 'yellow',
                pointRadius: 8,
            };
    }
}

async function initMap() {
    // Request needed libraries.
    const [{ event }] = await Promise.all([
        google.maps.importLibrary('core'),
        google.maps.importLibrary('maps'),
    ]);

    // Assume 'mapElement' is a previously defined gmp-map or standard map container
    const mapElement = document.querySelector('gmp-map');
    const innerMap = mapElement.innerMap; // Use mapElement.innerMap if using Web Component

    // Dataset ID for custom squirrel dataset
    const datasetId = 'a99635b0-5e73-4b2a-8ae3-cb40f4b7f47e';
    const datasetLayer = innerMap.getDatasetFeatureLayer(datasetId);
    
    // Apply the conditional style function (Step 4)
    datasetLayer.style = setStyle;
}
```

### ## Gotchas

1.  **Style Update Requirement**: The feature style function is only executed when `featureLayer.style` is explicitly set. If you need to update styles (e.g., in response to a user interaction or data change), you must reassign the function or object to the `style` property, even if the underlying function logic has changed.
2.  **Consistency in Styling**: The style function must always return consistent results for the same feature. Avoid implementing logic that relies on local randomness or side effects within the `FeatureStyleFunction`, as it runs over every feature in the affected layer during application, potentially leading to unintended display results.
3.  **Performance Optimization**: Because the style function runs over every feature in a layer, optimization is critical. To avoid impacting rendering times when a layer is no longer needed or visible, set the layer's style property to `null`: `datasetLayer.style = null;`.

### ### References

*   [FeatureStyleOptions Reference](https://developers.google.com/maps/documentation/javascript/reference/data-driven-styling?utm_source=gmp_git_agentskills_v1#FeatureStyleOptions)
*   [Data-Driven Styling Guide](https://developers.google.com/maps/documentation/javascript/dds-datasets/style-data-features?utm_source=gmp_git_agentskills_v1)
*   [TypeScript Guide](https://developers.google.com/maps/documentation/javascript/using-typescript?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.