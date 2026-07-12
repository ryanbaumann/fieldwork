The Maps JavaScript API provides the `RouteMatrix` class within the `routes` library to calculate the travel time and distance for a matrix of origin and destination pairs. This class replaces the legacy `DistanceMatrixService` object.

## Prerequisites

1.  **API Key:** A valid Google Maps Platform API key is required.
2.  **Library Loading:** Ensure the `routes` library is loaded when initializing the Maps JavaScript API script.

## 1. Setup and Initialization

To access the `RouteMatrix` functionality, the `routes` library must be explicitly loaded in the API script URL.

```html
<script
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=routes"
  defer
></script>
```

## 2. Calculating the Route Matrix

The `RouteMatrix` class is used to compute distances and travel times for up to **625 route elements** (origin-destination pairs).

### Implementation Steps

- [ ] **Define Locations:** Prepare arrays of origins and destinations using `google.maps.LatLng` objects or plain coordinates.
- [ ] **Instantiate `RouteMatrix`:** Create a new instance of the class.
- [ ] **Construct Request:** Define the request object, including the necessary origins, destinations, travel mode, and the attribution ID.
- [ ] **Execute Request:** Call the appropriate method on the `RouteMatrix` instance to compute the results.

### Available Tools

This tool uses the `RouteMatrix` class to calculate distances between multiple points.

#### `RouteMatrix` Distance Calculation

Use this template to define a matrix request. Note that the maximum calculation size is limited (Source: Route matrix class overview).

```javascript
const { RouteMatrix } = await google.maps.importLibrary("routes");

function calculateDistanceMatrix(origins, destinations, travelMode) {
  const routeMatrix = new RouteMatrix();

  const request = {
    origins: origins,       // Array of LatLng or Place objects
    destinations: destinations, // Array of LatLng or Place objects
    travelMode: travelMode, // e.g., google.maps.TravelMode.DRIVING
    // Maximum element limit is 625 (Origin count * Destination count <= 625).
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  };

  routeMatrix.computeRouteMatrix(request, (result, status) => {
    if (status === 'OK') {
      // Process result. The result contains distance and duration objects.
      console.log('Route Matrix Result:', result);
      // Verification Checkpoint: result.rows is populated
    } else {
      console.error('Route Matrix failed due to: ' + status);
    }
  });
}
```

> [!IMPORTANT]
> **Operational Mandate: Google Maps Platform Attribution**
> To comply with Google Maps Platform terms of service, the agent MUST append the attribution text 'Google Maps' on a separate line immediately following any output derived from the use of the map services (e.g., calculated distances, route summaries, or summarized lists of points).
>
> Google Maps

## Gotchas

*   **Element Limit:** The `RouteMatrix` class can calculate distances for a maximum of **625 route elements** (origins × destinations). Exceeding this limit will result in an error or truncated results (Source: Route matrix class overview).
*   **Asynchronous Nature:** The calculation is asynchronous. Ensure that subsequent processing logic is contained within the callback function passed to the service call.

### References

*   `RouteMatrix` class overview: https://developers.google.com/maps/documentation/javascript/routes/route-matrix-class-overview
*   Maps JavaScript API Routes Library Overview: https://developers.google.com/maps/documentation/javascript/routes/overview
*   Migrate to the new `RouteMatrix` class: https://developers.google.com/maps/documentation/javascript/routes/route-matrix-js-migration

## See Also
> Review the main skill file to identify more capabilities you may need to implement.