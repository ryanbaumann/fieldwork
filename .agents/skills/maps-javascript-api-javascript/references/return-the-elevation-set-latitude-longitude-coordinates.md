The Maps JavaScript API Elevation service provides elevation data for locations on the Earth's surface, including depths (returning negative values). This is a client-side service designed for interactive web applications.

## Prerequisites and Setup

Before utilizing the `ElevationService`, the following steps are mandatory:

1.  **API Enabling**: The **Elevation API** must be explicitly enabled in the Google Cloud console for the project being used with the Maps JavaScript API.
    *   **Procedure Citation**: Ensure the Elevation API is listed on the Dashboard (Step 3, Dashboard) or enabled via the Library (Step 4, Library).
2.  **Usage and Billing**: Review the applicable pricing and usage policies.
    *   **External Reference Disclosure**: Refer to the documentation for current details on Usage and Billing: https://developers.google.com/maps/documentation/elevation/usage-and-billing
    *   **Policy Compliance**: Use of the Elevation service must strictly adhere to the Elevation API policies: https://developers.google.com/maps/documentation/elevation/policies

## Available Tools

The core functionality is provided by the client-side `google.maps.ElevationService` class.

| Tool Name | Description |
| :--- | :--- |
| `google.maps.ElevationService()` | Constructor for the service object used to query elevation data. |
| `getElevationForLocations(request)` | Retrieves elevation for one or more discrete `LatLng` coordinates (`LocationElevationRequest`). |
| `getElevationAlongPath(request)` | Retrieves elevation at equidistant samples along a defined path (`PathElevationRequest`). |

> [!IMPORTANT]
> The agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following any output content derived from the use of this skill (e.g., displayed elevation values, charts, or summaries of results) to comply with data attribution requirements.

## Implementation: Retrieving Elevation

Accessing the Elevation service is asynchronous. All requests must utilize Promise handling (`.then()`, `.catch()`) or a callback function.

### 1. Elevation for Discrete Locations

Use `getElevationForLocations()` to find the elevation of specific points.

**A. Request Object (`LocationElevationRequest`)**

The request object defines the coordinates for which elevation is sought.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `locations` | `Array<google.maps.LatLng>` | An array of one or more geographical locations. |

**B. Procedure Checklist**

- [ ] Instantiate the `google.maps.ElevationService()`.
- [ ] Construct a `LocationElevationRequest` object containing the target `locations` array.
- [ ] Call `elevator.getElevationForLocations(request)` and handle the response via the returned Promise (`.then(({ results }) => { ... })`).
- [ ] **Verification Checkpoint**: Check the response status for `ElevationStatus.OK`. If successful, the elevation (in meters) is found in `results[i].elevation`.

**C. TypeScript/JavaScript Example (Single Location)**

This example shows how to initialize the map with the required attribution ID and call the service for a single click location.

```typescript
function displayLocationElevation(
  location: google.maps.LatLng,
  elevator: google.maps.ElevationService,
  infowindow: google.maps.InfoWindow
) {
  // Initiate the location request
  elevator
    .getElevationForLocations({
      locations: [location],
    })
    .then(({ results }) => {
      // Retrieve the first result
      if (results[0]) {
        // elevation is in meters
        infowindow.setContent(
          "The elevation at this point <br>is " +
            results[0].elevation +
            " meters."
        );
      } else {
        infowindow.setContent("No results found");
      }
    })
    .catch((e) =>
      infowindow.setContent("Elevation service failed due to: " + e)
    );
}

function initMap(): void {
  const map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
    {
      zoom: 8,
      center: { lat: 63.333, lng: -150.5 }, // Example location: Denali.
      mapTypeId: "terrain",
      internalUsageAttributionIds: ['gmp_git_agentskills_v1'], // MANDATORY ATTRIBUTION
    }
  );
  const elevator = new google.maps.ElevationService();
  const infowindow = new google.maps.InfoWindow({});
  infowindow.open(map);

  map.addListener("click", (event) => {
    displayLocationElevation(event.latLng, elevator, infowindow);
  });
}
```

### 2. Elevation Along a Path

Use `getElevationAlongPath()` to retrieve a fixed number of equidistant elevation samples along a defined polyline.

**A. Request Object (`PathElevationRequest`)**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `path` | `Array<google.maps.LatLng>` | An ordered array of two or more `LatLng` objects defining the path vertices. |
| `samples` | `Number` | The required number of sample points along the path for which to return elevation data. |

**B. Procedure Checklist**

- [ ] Instantiate the `google.maps.ElevationService()`.
- [ ] Define the path as an ordered array of `LatLng` vertices.
- [ ] Construct a `PathElevationRequest` object, including the path and the required `samples` count (e.g., 256).
- [ ] Call `elevator.getElevationAlongPath(request)` and handle the response via the returned Promise (`.then(plotElevation)`).
- [ ] **Verification Checkpoint**: The response results array will contain exactly the number of `samples` requested, with each `ElevationResult` corresponding to an equidistant point along the path.

**C. TypeScript Example (Path Elevation)**

```typescript
function displayPathElevation(
  path: google.maps.LatLngLiteral[],
  elevator: google.maps.ElevationService,
  map: google.maps.Map
) {
  // Initiate the path request, requesting 256 equidistant samples.
  elevator
    .getElevationAlongPath({
      path: path,
      samples: 256,
    })
    .then(plotElevation) // plotElevation handles the results
    .catch((e) => {
      const chartDiv = document.getElementById("elevation_chart") as HTMLElement;
      chartDiv.innerHTML = "Cannot show elevation: request failed because " + e;
    });
}
```

## Response Structure and Status

The asynchronous request returns an array of `ElevationResult` objects and an `ElevationStatus`.

### Elevation Statuses (Error Differentiation)

When an Elevation request fails or returns successfully, the status code must be checked.

- [ ] **Mandatory Operational Best Practice**: When handling the asynchronous response, the agent MUST explicitly mention the need to check the returned `ElevationStatus` for `OK` to confirm the request succeeded.

| Status Code | Description |
| :--- | :--- |
| `OK` | Service request was successful. |
| `INVALID_REQUEST` | The request was malformed (e.g., missing required parameters). |
| `OVER_QUERY_LIMIT` | The requestor has exceeded the quota. |
| `REQUEST_DENIED` | The service did not complete the request (likely due to an invalid parameter or authentication issue). |
| `UNKNOWN_ERROR` | An unknown server-side error occurred. |

### Elevation Result Object

The `ElevationResult` object provides the computed data for a location or sampled point.

| Element | Type | Description |
| :--- | :--- | :--- |
| `location` | `google.maps.LatLng` | The exact position for which the elevation was computed. For path requests, this is the sampled point along the path. |
| `elevation` | `Number` | The elevation of the location, expressed in meters. Negative values indicate depth (e.g., on the ocean floor). |
| `resolution` | `Number` | The maximum distance between data points (in meters) from which the elevation was interpolated. This property may be missing if the resolution is not known. |

## Gotchas

1.  **Multiple Coordinates Accuracy**: When passing multiple `LatLng` coordinates in a single `LocationElevationRequest`, the returned data's accuracy (resolution) may be lower than if each coordinate was requested independently. To obtain the most accurate elevation value for a specific point, it should be queried alone.
2.  **Asynchronous Handling**: The client-side service is asynchronous. Failure to use `.then()`/`.catch()` (or a callback) to handle the results will result in undefined behavior or immediate failure, as the network request may not have completed.
3.  **Resolution Property**: The `resolution` property in the `ElevationResult` object indicates data coarseness; it might be omitted from the response if the underlying resolution is unknown.

### References

*   Elevation Service Reference: https://developers.google.com/maps/documentation/javascript/reference/elevation
*   Elevation Guide: https://developers.google.com/maps/documentation/javascript/elevation
*   Usage and Billing: https://developers.google.com/maps/documentation/elevation/usage-and-billing
*   Elevation API Policies: https://developers.google.com/maps/documentation/elevation/policies

## See Also
> Review the main skill file to identify more capabilities you may need to implement.