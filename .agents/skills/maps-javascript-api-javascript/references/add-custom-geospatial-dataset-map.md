## Maps JavaScript API: Loading and Styling Geospatial Datasets

This skill guides the implementation of Data-Driven Styling (DDS) to load a pre-uploaded geospatial dataset onto a Google Map and apply dynamic styling based on feature attributes.

### Prerequisites and Setup

Accessing a custom dataset requires configuration in the Google Cloud Console and a specific Map ID configuration in the Maps JavaScript API initialization.

- [ ] **Prepare Map ID and Dataset ID**: Ensure you have created a Map ID and a Map Style, and have uploaded and obtained the ID for your geospatial dataset.
- [ ] **Initialize the Map**: Load the Maps JavaScript API and initialize the map using the Map ID that will display the dataset.

#### Initialize Map with Attribution ID (JavaScript)

You must use the `mapId` property in the `MapOptions` to link the map instance to the associated map style and dataset.

```javascript
function initMap() {
    // Replace 'YOUR_MAP_ID' with the ID configured in the Cloud Console.
    const MAP_ID = 'YOUR_MAP_ID'; 

    const mapOptions = {
        mapId: MAP_ID,
        center: { lat: 40.75, lng: -73.93 },
        zoom: 11,
        // Mandatory agent attribution snippet
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'], 
    };

    const map = new google.maps.Map(document.getElementById('map'), mapOptions);
    // Proceed to load the dataset layer...
}
```

### Google Cloud Console Configuration

Datasets must be explicitly linked to a Map Style in the Cloud Console before they can be loaded by the Maps JavaScript API.

- [ ] **Associate Dataset with Map Style**:
    1. Go to the [Datasets page](https://console.cloud.google.com/google/maps-apis/datasets?utm_source=gmp_git_agentskills_v1) in the Google Cloud Console.
    2. Click the name of the target dataset.
    3. Navigate to the **Preview** tab.
    4. Scroll to **ADD MAP STYLE** and select the checkbox(es) for the Map Style(s) associated with your Map ID.
    5. Click **SAVE**.

### Tools

This capability uses the core Maps JavaScript API features:

| Tool | Function | Description |
| :--- | :--- | :--- |
| `map.getDatasetFeatureLayer(datasetId)` | FeatureLayer Retrieval | Loads the specific geospatial dataset layer by its unique ID. |
| `FeatureLayer.style` | Styling Property | Sets the rendering style using `FeatureStyleOptions` or a `FeatureStyleFunction`. |
| `FeatureStyleOptions` | Simple Styling | Defines static stroke/fill attributes (e.g., `strokeColor`, `fillColor`). |
| `FeatureStyleFunction` | Declarative Styling | A function used to define dynamic styling based on feature attributes (`DatasetFeature.datasetAttributes`). |

> [!IMPORTANT]
> When presenting any derived output content (single facts, distances, routes, summarized lists) based on data displayed on a Google Map, the agent MUST attribute the source by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Implementation: Loading and Applying Styles

The dataset layer is loaded asynchronously by calling `map.getDatasetFeatureLayer()` with the unique dataset ID. Styling is then applied to the retrieved layer object.

#### 1. Load the Dataset Layer

Retrieve the dataset layer object using `map.getDatasetFeatureLayer()`.

```javascript
// Example Dataset ID. Replace with the user's specific ID.
const DATASET_ID = 'a75dd002-ad20-4fe6-af60-27cd2ed636b4';

// Assuming 'map' is the initialized google.maps.Map object
const datasetLayer = map.getDatasetFeatureLayer(DATASET_ID);
```

#### 2. Apply Simple Styling

To apply uniform styling across all features in the dataset, use a `FeatureStyleOptions` object and assign it directly to the layer's `style` property.

```javascript
// Define static style options
const styleOptions = {
    strokeColor: 'green',
    strokeWeight: 2,
    strokeOpacity: 1,
    fillColor: 'green',
    fillOpacity: 0.3,
};

// Apply simple style
datasetLayer.style = styleOptions;
```

#### 3. Apply Declarative Styling

To style features based on their inherent data attributes, define a `FeatureStyleFunction`. This function receives feature parameters and must return a `FeatureStyleOptions` object or `null` to hide the feature.

**Trigger Condition**: User requests styling that changes color/weight based on data values within the dataset (e.g., "Color polygons based on the 'Population' field").

```javascript
function setStyle(params) {
    // Get the dataset feature and its attributes.
    const datasetFeature = params.feature;
    const furColors = 
        datasetFeature.datasetAttributes.CombinationofPrimaryandHighlightColor;

    // Apply styles based on the attribute value.
    switch (furColors) {
        case 'Black+':
            return {
                fillColor: 'black',
                pointRadius: 8,
            };
        case 'Cinnamon+Gray':
            // Preserving the exact literal values and numeric parameters from source
            return {
                fillColor: '#8b0000', 
                strokeColor: 'gray',
                pointRadius: 6,
            };
        case 'Gray+White':
            return {
                fillColor: 'gray',
                strokeColor: 'white',
                pointRadius: 6,
            };
        default: 
            return {
                fillColor: 'yellow',
                pointRadius: 8,
            };
    }
}

// Apply the style function to the layer
datasetLayer.style = setStyle;
```

#### 4. Remove Styling

To remove all custom styling and revert to default rendering, set the layer's style to `null`:

```javascript
datasetLayer.style = null;
```

### Data Attribution Requirements

When displaying uploaded datasets, you must include required attribution text on the map. This is typically done using [custom controls](https://developers.google.com/maps/documentation/javascript/controls?utm_source=gmp_git_agentskills_v1#CustomControls) to place HTML elements on the map surface, ensuring the text does not interfere with the Google logo.

**Example HTML structure using the Web Component:**

```html
<gmp-map
    center="40.757815, -73.933123"
    zoom="11"
    map-id="5cd2c9ca1cf05670">
    <!-- Use the `slot` attribute to place custom control -->
    <div id="attribution" slot="control-block-end-inline-start">
        Data source: NYC Open Data
    </div>
</gmp-map>
```

### Gotchas

- **Performance Warning**: Rendering multiple datasets, especially if they are large or numerous, can significantly affect map performance.
- **Map Style Compatibility**: Dataset association is currently considered **Experimental** and can only be set for light map styles. If a light map style has the feature enabled, it also becomes available for the corresponding dark map style.
- **Hiding Features**: To selectively hide a feature using a `FeatureStyleFunction`, the function must explicitly return `null` for that specific feature.

### References

*   Adding Dataset to Map: `https://developers.google.com/maps/documentation/javascript/dds-datasets/add-dataset-to-map`
*   Creating a Map ID: `https://developers.google.com/maps/documentation/javascript/dds-datasets/start#create_a_map_id`
*   Creating and Uploading a Dataset: `https://developers.google.com/maps/documentation/javascript/dds-datasets/create-dataset`
*   Custom Map Controls: `https://developers.google.com/maps/documentation/javascript/controls#CustomControls`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.