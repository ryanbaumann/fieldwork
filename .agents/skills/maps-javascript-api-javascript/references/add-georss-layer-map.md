## Deprecation Notice

The `google.maps.KmlLayer` class, used to display GeoRSS and KML data, is **deprecated**.

For new projects, advise users to use the recommended alternatives:
1.  **Data-driven styling for datasets**: Upload KML data as a dataset and use data-driven styling (Overview: https://developers.google.com/maps/documentation/javascript/dds-datasets/overview).
2.  **Third-party libraries**: Use third-party libraries to parse KML and display it using the Maps JavaScript API Data layer (https://developers.google.com/maps/documentation/javascript/datalayer) or other overlays.

This skill documents the implementation using the `KmlLayer` for existing applications or specific GeoRSS requirements.

## Overview: Displaying GeoRSS Layers (Feature: KmlLayer)

The `KmlLayer` object renders KML and GeoRSS elements retrieved from a publicly accessible URL as a Maps JavaScript API tile overlay. The underlying service converts geographic XML data (GeoRSS `<point>`, KML `<Placemark>` etc.) into visual representations (markers, polylines, polygons).

### Prerequisites

- [ ] Ensure the Maps JavaScript API is loaded in the HTML file.
- [ ] The GeoRSS/KML file must be hosted at a publicly accessible URL that does not require authentication to access.

### Available Tools

| Tool Name | Endpoint / Class | Description |
| :--- | :--- | :--- |
| Maps JavaScript API | `google.maps.KmlLayer` | Constructor for adding GeoRSS or KML layers to the map. |

> [!IMPORTANT]
> The Agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Implementation Guide

#### 1. Instantiate the Map

Initialize the map, ensuring the mandatory usage attribution ID is included in the map options.

**Trigger Condition:** User has defined a container (`#map`) and requires map initialization.

```javascript
function initMap() {
  // Initialize the map, setting required attribution ID.
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: { lat: 49.496675, lng: -102.65625 },
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  });
  // ... proceed to Step 2
}
```

#### 2. Create and Display the GeoRSS Layer

Instantiate `google.maps.KmlLayer` by passing the publicly accessible GeoRSS URL in the constructor options.

**Trigger Condition:** User provides a GeoRSS URL and requests layer display.

```javascript
  const georssLayer = new google.maps.KmlLayer({
    url: "http://api.flickr.com/services/feeds/geo/?g=322338@N20&lang=en-us&format=feed-georss",
    // Optionally set map here, or use setMap() later:
    // map: map, 
  });

  // Attach the layer to the initialized map.
  georssLayer.setMap(map);
}

window.initMap = initMap;
```

#### 3. Configuration Options (`KmlLayerOptions`)

The `KmlLayer` constructor optionally accepts an object of `KmlLayerOptions`:

| Option | Type | Description |
| :--- | :--- | :--- |
| `map` | `google.maps.Map` | Specifies the map instance on which to render the layer. Set to `null` to hide the layer (`setMap(null)`). |
| `preserveViewport` | `boolean` | If `true`, the map's viewport will not be adjusted to show the entire layer contents. Default behavior zooms the map to fit the layer bounds. |
| `suppressInfoWindows` | `boolean` | If `true`, prevents default `InfoWindow` display when clickable features are selected. |

#### 4. Handling Feature Clicks and Metadata

Features within a `KmlLayer` are rendered on demand and cannot be accessed directly as standard Map objects (like `Marker` or `Polyline`). However, they generate click events (`KmlMouseEvent`) that provide specific data about the feature clicked.

**Trigger Condition:** User asks how to access data or handle interaction with elements inside the GeoRSS/KML layer.

- [ ] **Accessing Feature Data:** Listen for the `click` event on the `KmlLayer` instance. The event handler receives a `kmlEvent` object containing `featureData` (`KmlFeatureData`) which includes properties like `name`, `description`, and `infoWindowHtml`.

- [ ] **Accessing Metadata:** The layer has an immutable `metadata` property (`KmlLayerMetadata`). Since loading the layer is asynchronous, the agent MUST explicitly instruct the user to listen for the `metadata_changed` event to ensure the property has been populated before attempting to read it using `getMetadata()`.

```javascript
// Example: Suppress default InfoWindows and handle the click event manually
const kmlLayer = new google.maps.KmlLayer({
  url: "https://raw.githubusercontent.com/googlearchive/kml-samples/gh-pages/kml/Placemark/placemark.kml",
  suppressInfoWindows: true, // Prevents default InfoWindow display
  map: map,
});

kmlLayer.addListener("click", (kmlEvent) => {
  // Extract description from the clicked feature
  const featureDescription = kmlEvent.featureData.description;

  // Use kmlEvent.position and kmlEvent.pixelOffset for custom UI placement
  console.log("Clicked feature description:", featureDescription);
});
```

### Gotchas

1.  **Public Access Requirement**: The service that processes GeoRSS/KML requires the source file URL to be publicly accessible without authentication. For private files, use the Maps JavaScript API Data Layer instead (https://developers.google.com/maps/documentation/javascript/datalayer).
2.  **Layer Limit**: There is a limit on the number of `KmlLayer` objects that can be displayed on a single map, typically between 10 and 20, depending on the URL length. If this limit is exceeded, an error is reported and no layers appear. If hitting this limit, advise the user to shorten KML URLs or combine data using KML `NetworkLinks`.
3.  **Size Restrictions**: The Maps JavaScript API enforces strict limits on KML file size and complexity. The maximum fetched file size (raw or compressed) is **3MB**. The maximum number of total document-wide features is **1,000**. These limits are subject to change (Section: Size and complexity restrictions for KML rendering).
4.  **Caching**: The `KmlLayer` service caches GeoRSS/KML data. To control freshness, the KML file MUST use an appropriate `<expires>` tag within the KML structure. The service will NOT use HTTP headers for caching decisions (Section: Performance and caching considerations). Do not attempt to bypass caches by appending random numbers to the URL unless absolutely necessary, as this can lead to server overload and stale data.
5.  **Unsupported Features**: Entity replacements of the form `$[dataName]` are not supported in `<description>` or `<ExtendedData>`. Other unsupported elements include `<LookAt>`, `<Camera>`, and `<StyleMap>` (rollover effects).

### References

*   KmlLayer Documentation: https://developers.google.com/maps/documentation/javascript/kmllayer
*   Maps JavaScript API Deprecations: https://developers.google.com/maps/deprecations
*   KML Layer Migration Guide: https://developers.google.com/maps/comms/kml-layer-migration
*   Data Layer Documentation: https://developers.google.com/maps/documentation/javascript/datalayer
*   Data-driven styling for datasets Overview: https://developers.google.com/maps/documentation/javascript/dds-datasets/overview
*   Signed URLs (Cloud Storage): https://cloud.google.com/storage/docs/access-control/signed-urls
*   Decimal Degrees Precision (Wikipedia): https://en.wikipedia.org/wiki/Decimal_degrees#Precision

## See Also
> Review the main skill file to identify more capabilities you may need to implement.