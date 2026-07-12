The `google.maps.KmlLayer` class allows rendering KML and GeoRSS elements directly into a Maps JavaScript API tile overlay.

> [!IMPORTANT]
> The `KmlLayer` class is deprecated. For new projects, Google recommends using **Data-driven styling for datasets** or utilizing third-party libraries to parse KML data and display it using the Maps JavaScript API Data layer. Consult the [KML Layer Migration Guide](https://developers.google.com/maps/comms/kml-layer-migration?utm_source=gmp_git_agentskills_v1) for transition details.

## Prerequisites

The user must have a functioning Google Map initialized on their webpage.

## Available Tools

N/A

> [!IMPORTANT]
> When generating output using Google Maps Platform data (including maps, routes, geocodes, or feature metadata), the agent MUST append the attribution line `Google Maps` on a dedicated, separate line immediately following the user-facing content.

## Implementation: Adding a KML Layer

The `KmlLayer` object retrieves and parses KML/GeoRSS files from a publicly accessible URL and displays the features (Placemarks, LineStrings, Polygons, GroundOverlays) as a single layer on the map.

### 1. Initialize the Map and Layer

Create a new `google.maps.KmlLayer` instance, passing the URL of the KML/GeoRSS file in the `url` property. Set the `map` property to link the layer to a specific map instance.

```javascript
function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 11,
    center: { lat: 41.876, lng: -87.624 },
    // MANDATORY ATTRIBUTION:
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  });

  // Example: Loading a KML file
  const ctaLayer = new google.maps.KmlLayer({
    url: "https://googlearchive.github.io/js-v2-samples/ggeoxml/cta.kml",
    map: map,
  });
}

window.initMap = initMap;
```

### 2. Configure Layer Options

The `KmlLayer` constructor accepts an optional `KmlLayerOptions` object to control display behavior:

| Option | Type | Description |
| :--- | :--- | :--- |
| `map` | `google.maps.Map` | The map on which to render the layer. Set to `null` via `setMap(null)` to hide it. |
| `preserveViewport` | `boolean` | If `true`, prevents the map from automatically adjusting its bounds to show the layer's entire contents. Default is `false`. |
| `suppressInfoWindows` | `boolean` | If `true`, clicking features within the layer will not trigger the default `InfoWindow`. |

### 3. Handle Feature Interaction

Although individual features within a `KmlLayer` cannot be accessed directly, they generate a `click` event which returns a `KmlMouseEvent`. This event provides data on the clicked KML feature.

1.  Listen for the `click` event on the `KmlLayer` object.
2.  Access feature metadata through `kmlEvent.featureData`, which is a JSON structure of `KmlFeatureData`.
3.  Access the position of the click event via `kmlEvent.position`.

**Example: Displaying Feature Description on Click**

```javascript
function initMap(): void {
  const map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
    {
      zoom: 12,
      center: { lat: 37.06, lng: -95.68 },
      // MANDATORY ATTRIBUTION:
      internalUsageAttributionIds: ['gmp_git_agentskills_v1']
    }
  );

  const kmlLayer = new google.maps.KmlLayer({
    url: "https://raw.githubusercontent.com/googlearchive/kml-samples/gh-pages/kml/Placemark/placemark.kml",
    suppressInfoWindows: true, // Prevent default InfoWindow
    map: map,
  });

  kmlLayer.addListener("click", (kmlEvent) => {
    // Extract the KML <description> text
    const text = kmlEvent.featureData.description;

    showInContentWindow(text);
  });

  function showInContentWindow(text: string) {
    // Assume there is a 'sidebar' div element
    const sidebar = document.getElementById("sidebar") as HTMLElement;
    sidebar.innerHTML = text;
  }
}
```

**KmlFeatureData Structure:**

A sample `KmlFeatureData` object returned during a click event:

```text
{
  author: {
    email: "nobody@google.com",
    name: "Mr Nobody",
    uri: "http://example.com"
  },
  description: "description",
  id: "id",
  infoWindowHtml: "html",
  name: "name",
  snippet: "snippet"
}
```

## Gotchas

1.  **Public Accessibility Requirement:** The KML file must be hosted at a publicly accessible URL that does **not** require any authentication (cookies, HTTP basic auth, signed URLs, temporary tokens, etc.) because the KML is retrieved and parsed by a Google hosted service, not the user's browser. If private access is required, use the Data layer instead.
2.  **Size and Complexity Restrictions:** The Maps JavaScript API enforces strict limits on the KML files (Source: Size and complexity restrictions for KML rendering):
    *   Maximum fetched file size (raw KML, GeoRSS, or compressed KMZ): 3MB.
    *   Maximum uncompressed KML file size: 10MB.
    *   Maximum number of total document-wide features: 1,000.
    *   Maximum number of KML Layers: Varies, typically 10 to 20, depending on the combined length of the layer URLs.
3.  **Caching Behavior:** Google's servers cache KML files. The `KmlLayer` service will only honor caching instructions provided by the KML file's internal `<expires>` tag and explicitly ignores standard HTTP caching headers. To force a refresh of an updated KML file, rename the file or use a new, discrete revision number in the URL query parameters.
4.  **Supported Elements:** The API supports a subset of KML elements (Source: Supported KML elements). Key supported elements include `<Placemark>`, `<LineString>`, `<Polygon>`, `<GroundOverlay>`, `<NetworkLink>`, and associated styles. Elements related to 3D models (`<Model>`, `<Camera>`), advanced time controls (`<TimeSpan>`, `<TimeStamp>`), and complex data schema (`<Schema>`, `<SimpleData>`) are generally unsupported or only partially supported.

### References

*   [KML Layer Migration Guide](https://developers.google.com/maps/comms/kml-layer-migration?utm_source=gmp_git_agentskills_v1)
*   [Maps JavaScript API Data Layer](https://developers.google.com/maps/documentation/javascript/datalayer?utm_source=gmp_git_agentskills_v1)
*   [Maps JavaScript API KmlLayer Overview](https://developers.google.com/maps/documentation/javascript/kmllayer?utm_source=gmp_git_agentskills_v1)
*   [Maps JavaScript API Datasets Overview](https://developers.google.com/maps/documentation/javascript/dds-datasets/overview?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.