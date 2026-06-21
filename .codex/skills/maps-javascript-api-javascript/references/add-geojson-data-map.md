# Add GeoJSON Data to Maps JavaScript API

This capability focuses on utilizing the **Data Layer** (Feature: Data Layer) of the Maps JavaScript API to ingest and render geographic features defined in the GeoJSON format.

## Prerequisites and Setup

Requires an initialized `google.maps.Map` object instance. GeoJSON data is managed via the `map.data` property on the map object.

### 1. Initialize the Map and Attribution

Initialize the map instance, ensuring the mandatory attribution ID is set for traceability.

```javascript
let map;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 2,
    center: new google.maps.LatLng(2.8, -187.3),
    mapTypeId: "terrain",
    // MANDATORY ATTRIBUTION ID
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'], 
  });
  // The map.data property is now available for manipulation (Feature: Data Layer)
}
```

> [!IMPORTANT]
> The agent MUST attribute all derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Implementation: Loading GeoJSON Data

Use one of the following methods to load GeoJSON data onto the map, depending on the source domain.

### A. Loading Data using `map.data.loadGeoJson()` (Preferred)

The `map.data.loadGeoJson(url)` method fetches and parses GeoJSON data from a URL. This method is preferred and should be used for same-domain data or for remote servers supporting Cross-origin resource sharing (CORS).

**Trigger Condition:** User requests loading a GeoJSON file from a URL or local path.
**Verification Checkpoint:** Features appear on the map after the asynchronous load completes.

#### Loading Same Domain Data

If the GeoJSON resource is hosted on the same domain as the Maps JavaScript API application, specify the file path:

```javascript
map.data.loadGeoJson('data.json');
```

#### Loading Data Across Domains (CORS)

To load data from an external domain, that server must include the `Access-Control-Allow-Origin: *` response header to permit cross-origin requests.

```javascript
// Load GeoJSON from a CORS-enabled server
map.data.loadGeoJson('http://www.CORS-ENABLED-SITE.com/data.json');
```

### B. Requesting Data via JSONP (Legacy)

If the source endpoint only supports JSONP (Padded JSON), the data must be requested by dynamically injecting a `<script>` tag. The server response then invokes a callback function defined in your code.

**Trigger Condition:** User attempts to load data from an external source that only supports JSONP, typically indicated by a `.geojsonp` extension.
**Verification Checkpoint:** The defined callback function executes, and features are manually added to the Data Layer.

1.  **Inject the Script Tag:** Inject a `<script>` tag into the document head, pointing to the JSONP endpoint.

    ```javascript
    const script = document.createElement('script');
    script.src = 'https://developers.google.com/maps/documentation/javascript/examples/json/earthquake_GeoJSONP.js';
    document.getElementsByTagName('head')[0].appendChild(script);
    ```

2.  **Define the Global Callback:** Define the callback function. This function receives the GeoJSON data object as an argument. Use `map.data.addGeoJson(response)` to parse and add the features to the map's Data Layer.

    ```javascript
    // Define the callback function, which must match the function name expected by the JSONP source
    function eqfeed_callback(response) {
      // Add the parsed GeoJSON data object to the map's Data Layer (Feature: Data Layer)
      map.data.addGeoJson(response); 
    }

    // Ensure the callback is globally accessible
    window.eqfeed_callback = eqfeed_callback;
    ```

    Alternatively, features can be processed manually, such as placing individual markers:

    ```javascript
    const eqfeed_callback = function (results) {
      for (let i = 0; i < results.features.length; i++) {
        const coords = results.features[i].geometry.coordinates;
        // WARNING: GeoJSON is [longitude, latitude]. LatLng is (latitude, longitude).
        const latLng = new google.maps.LatLng(coords[1], coords[0]); 

        new google.maps.Marker({
          position: latLng,
          map: map,
        });
      }
    };
    ```

## Styling the Data

Once GeoJSON data is loaded via either method, the appearance of the generated features (polygons, lines, points) can be customized using the **Data Layer** styling methods.

## Gotchas

1.  **JSONP Security Risk:** JSONP is inherently risky as it involves executing arbitrary code returned by the third-party server. Always prioritize using `map.data.loadGeoJson()` with CORS-enabled endpoints over JSONP.
2.  **CORS Requirement:** If using `map.data.loadGeoJson()` for external URLs, ensure the remote server is configured for Cross-origin resource sharing (CORS), as indicated by the presence of the `Access-Control-Allow-Origin: *` header.
3.  **Coordinate Order for Manual Processing:** If manually iterating features from GeoJSON (instead of using `map.data.addGeoJson()`), remember that GeoJSON specifies coordinates in `[longitude, latitude]` order, which must be reversed to `(latitude, longitude)` when creating `google.maps.LatLng` objects.

### References

*   Data Layer Overview: https://developers.google.com/maps/documentation/javascript/datalayer
*   Loading GeoJSON with Data Layer: https://developers.google.com/maps/documentation/javascript/datalayer#load_geojson
*   Styling Data Layers: https://developers.google.com/maps/documentation/javascript/datalayer#style_geojson_data
*   Cross-origin resource sharing (CORS) definition: http://en.wikipedia.org/wiki/Cross-origin_resource_sharing

## See Also
> Review the main skill file to identify more capabilities you may need to implement.