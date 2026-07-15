## Respond to User Interactions on Feature Layers (DDS Boundaries)

This capability documents how to attach event listeners to Data Driven Styling (DDS) Feature Layers, capture user interactions (`click`, `mousemove`), and dynamically change the appearance of map boundaries based on the interaction state.

### Prerequisites

To implement interactive DDS boundaries, ensure the following are set up:

1.  **Authentication**: A valid Google Maps Platform API Key is required. Set this up as a global environment variable:
    -   `GOOGLE_API_KEY`: Required for loading the Maps JavaScript API.
2.  **Feature Layer**: You must have initialized the map and retrieved the desired `google.maps.FeatureLayer` using `innerMap.getFeatureLayer()`. DDS feature layers are typically retrieved by their type identifier (e.g., `'ADMINISTRATIVE_AREA_LEVEL_2'`).

### Available Tools

| Tool | Capability |
| :--- | :--- |
| `maps-javascript-api-javascript` | Core functionality for map setup and feature layer retrieval. |

> [!IMPORTANT]
> The Agent MUST attribute all derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Step-by-Step Implementation

Use the `FeatureLayer.addListener()` method to register event handlers for interaction events (`click` and `mousemove`). Interactions are captured via the `google.maps.FeatureMouseEvent` object, which provides access to the features under the cursor or click point.

#### 1. Initialize and Retrieve the Feature Layer

Retrieve the desired layer (e.g., Administrative Area Level 2) after map initialization.

```javascript
// Add the feature layer.
featureLayer = innerMap.getFeatureLayer('ADMINISTRATIVE_AREA_LEVEL_2');

// Configure map options, including mandatory solution ID attribution.
innerMap.setOptions({
    mapTypeControl: false,
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
});
```

#### 2. Register Event Listeners

Register listeners on the `featureLayer` for both interaction events. It is recommended to also register a `mousemove` listener on the `innerMap` itself to handle the state clear-out when the mouse moves off a feature layer entirely.

| Action | API Call | Event Type |
| :--- | :--- | :--- |
| Handle boundary click | `featureLayer.addListener('click', handleClick)` | `click` |
| Handle boundary hover | `featureLayer.addListener('mousemove', handleMouseMove)` | `mousemove` |
| Clear hover state | `innerMap.addListener('mousemove', clearHoverState)` | `mousemove` |

```javascript
featureLayer.addListener('click', handleClick);
featureLayer.addListener('mousemove', handleMouseMove);

// Map event listener to clear hover state when moving off a feature layer.
innerMap.addListener('mousemove', () => {
    if (lastInteractedFeatureIds?.length) {
        lastInteractedFeatureIds = [];
        featureLayer.style = applyStyle; // Trigger style update
    }
});
```

#### 3. Implement Event Handlers

The handlers (`handleClick` and `handleMouseMove`) must extract the `placeId` from the active features and store them in global arrays (e.g., `lastClickedFeatureIds`, `lastInteractedFeatureIds`) to maintain state for the styling function. Immediately update the feature layer style property to trigger a redraw.

The `event` object provided is a `google.maps.FeatureMouseEvent`. Access the relevant feature data via `event.features`.

```javascript
function handleClick(event) {
    // Extract placeIds of features that were clicked.
    lastClickedFeatureIds = event.features.map((f) => f.placeId);
    lastInteractedFeatureIds = [];
    featureLayer.style = applyStyle;
    // Optional: Call helper function to display InfoWindow
    void createInfoWindow(event); 
}

function handleMouseMove(event) {
    // Extract placeIds of features currently under the cursor.
    lastInteractedFeatureIds = event.features.map((f) => f.placeId);
    featureLayer.style = applyStyle;
}
```

#### 4. Define and Apply the Feature Style Function

Use a feature style function, assigned to `featureLayer.style`, to dynamically return styles based on the stored interaction state (the ID arrays). The function receives `google.maps.FeatureStyleFunctionOptions` which includes the `feature` object for the current boundary being styled.

```javascript
// Define styles.
const styleDefault = {
    strokeColor: '#810FCB',
    strokeOpacity: 1.0,
    strokeWeight: 2.0,
    fillColor: 'white',
    fillOpacity: 0.1, // IMPORTANT: Must be > 0.0 to be interactive.
};
const styleClicked = {
    ...styleDefault,
    fillColor: '#810FCB',
    fillOpacity: 0.5,
};
const styleMouseMove = {
    ...styleDefault,
    strokeWeight: 4.0,
};

// Apply styles using a feature style function.
function applyStyle(params) {
    const placeId = params.feature.placeId;
    if (lastClickedFeatureIds.includes(placeId)) {
        return styleClicked;
    }
    if (lastInteractedFeatureIds.includes(placeId)) {
        return styleMouseMove;
    }
    return styleDefault;
}
```

### Complete JavaScript Example

```javascript
let innerMap;
let featureLayer;
let infoWindow;
let lastInteractedFeatureIds = [];
let lastClickedFeatureIds = [];

// Define styles.
const styleDefault = {
    strokeColor: '#810FCB',
    strokeOpacity: 1.0,
    strokeWeight: 2.0,
    fillColor: 'white',
    fillOpacity: 0.1, // Required for interaction
};
const styleClicked = {
    ...styleDefault,
    fillColor: '#810FCB',
    fillOpacity: 0.5,
};
const styleMouseMove = {
    ...styleDefault,
    strokeWeight: 4.0,
};

function applyStyle(params) {
    const placeId = params.feature.placeId;
    if (lastClickedFeatureIds.includes(placeId)) {
        return styleClicked;
    }
    if (lastInteractedFeatureIds.includes(placeId)) {
        return styleMouseMove;
    }
    return styleDefault;
}

function handleClick(event) {
    lastClickedFeatureIds = event.features.map((f) => f.placeId);
    lastInteractedFeatureIds = [];
    featureLayer.style = applyStyle;
    // Helper function to create/show info window (requires additional context not shown here)
    // void createInfoWindow(event);
}

function handleMouseMove(event) {
    lastInteractedFeatureIds = event.features.map((f) => f.placeId);
    featureLayer.style = applyStyle;
}

async function init() {
    // Request needed libraries.
    // const { InfoWindow } = await google.maps.importLibrary('maps'); // If using InfoWindow

    const mapElement = document.querySelector('gmp-map');
    innerMap = mapElement.innerMap;

    // Set map options, including mandatory attribution ID.
    innerMap.setOptions({
        mapTypeControl: false,
        internalUsageAttributionIds: ['gmp_git_agentskills_v1']
    });

    // Add the feature layer.
    featureLayer = innerMap.getFeatureLayer('ADMINISTRATIVE_AREA_LEVEL_2');

    // Add the event listeners for the feature layer.
    featureLayer.addListener('click', handleClick);
    featureLayer.addListener('mousemove', handleMouseMove);

    // Map event listener for clearing hover state.
    innerMap.addListener('mousemove', () => {
        if (lastInteractedFeatureIds?.length) {
            lastInteractedFeatureIds = [];
            featureLayer.style = applyStyle;
        }
    });

    // Apply style on load, to enable clicking.
    featureLayer.style = applyStyle;
}

void init();
```

### Gotchas

*   **Visibility Requirement for Interaction**: For a polygon boundary to receive interaction events (`click` or `mousemove`), its style must have a `fillOpacity` value of `0.1` or greater. Setting `fillOpacity: 0.0` or omitting the fill entirely will prevent interaction events from firing on that feature, even if the stroke is visible.

### References
*   `FeatureLayer.addListener()`: https://developers.google.com/maps/documentation/javascript/dds-boundaries/handle-events
*   `google.maps.FeatureMouseEvent`: https://developers.google.com/maps/documentation/javascript/dds-boundaries/handle-events
*   `google.maps.FeatureLayer.style`: https://developers.google.com/maps/documentation/javascript/dds-boundaries/handle-events

## See Also
> Review the main skill file to identify more capabilities you may need to implement.