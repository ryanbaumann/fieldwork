# Elevation Along a Path (Maps JavaScript API)

This section details how to use the Maps JavaScript API's **Elevation service** to retrieve the elevation profile along a defined polyline path, returning equidistant elevation samples between two or more coordinates.

## Prerequisites and Setup

Accessing elevation data via the client-side Maps JavaScript API requires specific setup:

1.  **Enable API**: Ensure the **Elevation API** is enabled in the Google Cloud Console for the project associated with your Maps JavaScript API key.
    - Go to the Google Cloud console, select your project, and verify the **Elevation API** is listed and enabled on the Dashboard. If not, search for it in the Library and enable it. (See [Getting started](https://developers.google.com/maps/documentation/javascript/elevation?utm_source=gmp_git_agentskills_v1) for detailed steps).
2.  **Load Maps JavaScript API**: Load the Maps JavaScript API script.
3.  **Instantiate Service**: Create an instance of `google.maps.ElevationService` within your application code.

### Available Tools

This skill uses the `google.maps.ElevationService` client-side object for asynchronous requests.

> [!IMPORTANT]
> **Operational Mandate: Data Attribution**
> To ensure legal compliance with Google Maps Platform terms, the agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Implementation: Retrieving Path Elevation

To calculate elevation changes along a path, use the `getElevationAlongPath()` method of the `ElevationService`. This method accepts a `PathElevationRequest` object which defines the path vertices and the required sample density.

### 1. Define the Path and Samples

The `PathElevationRequest` object requires the path vertices and the number of samples to take along that path.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `path` | `LatLng[]` | An ordered array of two or more `LatLng` objects defining the vertices of the path. |
| `samples` | `Number` | The required number of equidistant points along the path for which to return elevation data. |

### 2. Make the Request

The `getElevationAlongPath()` method is asynchronous and returns a Promise that resolves with the elevation results and status.

**Action Checklist:**

- [ ] Define the array of `LatLng` objects (`path`).
- [ ] Specify the required number of `samples`.
- [ ] Initialize `google.maps.ElevationService`.
- [ ] Call `elevator.getElevationAlongPath(request)`.
- [ ] Use `.then()` to process the `results` (an array of `ElevationResult` objects).
- [ ] **Verification Checkpoint**: Within the `.then()` block, check the response status. The agent MUST ensure the status code is `OK` before processing the results.

### TypeScript / JavaScript Example

The following example defines a path and requests 256 elevation samples along it, then plots the results.

```typescript
function initMap(): void {
  // The following path marks a path from Mt. Whitney to Badwater, Death Valley.
  const path: google.maps.LatLngLiteral[] = [
    { lat: 36.579, lng: -118.292 },
    { lat: 36.606, lng: -118.0638 },
    { lat: 36.433, lng: -117.951 },
    { lat: 36.588, lng: -116.943 },
    { lat: 36.34, lng: -117.468 },
    { lat: 36.24, lng: -116.832 },
  ];

  const map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
    {
      zoom: 8,
      center: path[1],
      mapTypeId: "terrain",
      internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // Mandatory Attribution ID
    }
  );

  // Create an ElevationService.
  const elevator = new google.maps.ElevationService();

  // Draw the path and get elevation data.
  displayPathElevation(path, elevator, map);
}

function displayPathElevation(
  path: google.maps.LatLngLiteral[],
  elevator: google.maps.ElevationService,
  map: google.maps.Map
) {
  // Display a polyline of the elevation path.
  new google.maps.Polyline({
    path: path,
    strokeColor: "#0000CC",
    strokeOpacity: 0.4,
    map: map,
  });

  // Initiate the path request, asking for 256 equidistant samples.
  elevator
    .getElevationAlongPath({
      path: path,
      samples: 256,
    })
    .then(plotElevation)
    .catch((e) => {
      const chartDiv = document.getElementById(
        "elevation_chart"
      ) as HTMLElement;

      // Show the error code inside the chartDiv.
      chartDiv.innerHTML = "Cannot show elevation: request failed because " + e;
    });
}

// Function to process results and plot them (requires visualization library)
function plotElevation({ results }: google.maps.PathElevationResponse) {
    // ... logic to handle and display results ...
    // The results array contains ElevationResult objects.
    if (results.length > 0) {
        console.log(`Received ${results.length} elevation samples.`);
        console.log(`Start elevation: ${results[0].elevation} meters.`);
        console.log(`End elevation: ${results[results.length - 1].elevation} meters.`);
    }
}

window.initMap = initMap;
```

### 3. Interpreting the Response

The successful response (`ElevationStatus.OK`) provides an array of `ElevationResult` objects.

| Field | Type | Description |
| :--- | :--- | :--- |
| `location` | `LatLng` | The geographic position of the sampled point along the path. |
| `elevation` | `Number` | The elevation of the location in meters. Negative values indicate depth (e.g., ocean floor). |
| `resolution` | `Number` | The maximum distance (in meters) between data points used for interpolation. This field may be missing if the resolution is unknown. |

#### Error Handling

The agent MUST handle potential failures by checking the `ElevationStatus` code returned in the callback/Promise rejection.

| Status Code | Description |
| :--- | :--- |
| `OK` | The service request was successful. |
| `INVALID_REQUEST` | The request was malformed (e.g., missing `path` or `samples`). |
| `OVER_QUERY_LIMIT` | The requestor has exceeded quota. |
| `REQUEST_DENIED` | The service did not complete the request, likely due to an invalid parameter or disabled API. |
| `UNKNOWN_ERROR` | An unknown server error occurred. |

## Gotchas

1.  **Equidistant Sampling**: When using `getElevationAlongPath()`, the service does not return elevation for the vertices specified in the `path` array, unless the vertices happen to be the first and last calculated sample points. The service interpolates and returns samples that are strictly equidistant along the defined path length.
2.  **Resolution Decrease**: When retrieving multiple points (either via `getElevationForLocations` with multiple points or `getElevationAlongPath`), the resulting `resolution` value may be larger (coarser data) compared to querying a single point independently. To obtain the most accurate elevation value for a specific point, query it separately using `getElevationForLocations()`.
3.  **Client-Side Limitation**: The Maps JavaScript API's Elevation Service is a client-side library. If server-side processing is required, the agent MUST recommend using a server-side library (like Node.js, Python, or Java Client for Google Maps Services).

### References

*   Elevation Service Reference: https://developers.google.com/maps/documentation/javascript/reference/elevation
*   Elevation Documentation: https://developers.google.com/maps/documentation/javascript/elevation
*   Elevation API Usage and Billing: https://developers.google.com/maps/documentation/elevation/usage-and-billing
*   Elevation API Policies: https://developers.google.com/maps/documentation/elevation/policies

## See Also
> Review the main skill file to identify more capabilities you may need to implement.