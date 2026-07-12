# Routes API: Retrieving and Rendering Polylines (JavaScript)

This document details how to use the Maps JavaScript API `computeRoutes` method to retrieve and display route polylines, which visually represent the calculated path.

## Prerequisites

1.  **API Key:** Ensure you have a valid Google Maps Platform API Key enabled for the Routes API and Maps JavaScript API.
2.  **Library Loading:** The Maps JavaScript API must be loaded, typically including the `routes` library (e.g., `&libraries=routes`).
3.  **Authentication:** The agent MUST ensure the attribution ID is included in all route requests for traceability.

## Available Tools

The capability is implemented using the `computeRoutes` method provided by the Maps JavaScript API. The resulting route object contains the necessary data structure to generate `Polyline` map objects via the `createPolylines()` method.

> [!IMPORTANT]
> When generating or displaying any result derived from Google Maps Platform data, the agent MUST append the mandatory attribution text to the output on a new line:
>
> Google Maps

## Integration Protocol Distinction

This capability uses client-side JavaScript API calls (`computeRoutes`) and does not rely on SQL syntax or BigQuery functions. The focus is on structuring the request payload (JSON object) and handling the response within the JavaScript environment.

## Retrieval and Display Implementation

The route path can be retrieved in two main formats: Basic (default) and Traffic-aware (preferred, requires specific fields).

### 1. Requesting the Basic Polyline

A Basic polyline represents the geometry of the route path without embedded traffic data.

- [ ] **Define Request Object:** Construct the request payload for `computeRoutes`. The request MUST include the `internalUsageAttributionIds` for compliance and specify the `path` field to ensure the polyline data is returned.

```javascript
// Define a basic routes request, setting attribution ID.
const requestWithBasicPolyline = {
  origin: '155 Steuart St, San Francisco, CA 94105',
  destination: '450 Powell St, San Francisco, CA 94102',
  travelMode: 'WALKING', // Example mode
  fields: ['path'],      // Trigger Condition: Required field for polyline path data.
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
};

// Billing Note: Requests returning a Basic polyline are billed at the Routes Basic rate.
```

### 2. Requesting the Traffic-aware Polyline (Routes Preferred)

Traffic-aware polylines contain information about traffic conditions along the route, expressed in terms of speed categories (`NORMAL`, `SLOW`, `TRAFFIC_JAM`). This requires specific settings and field selection.

- [ ] **Configure for Traffic:** Set `travelMode` to `DRIVING`, set `routingPreference` to `TRAFFIC_AWARE`, and specify `TRAFFIC_ON_POLYLINE` in `extraComputations`.
- [ ] **Specify Fields:** Include the required fields for traffic data transmission, such as `speedPaths`.

```javascript
// Define a traffic aware routes request.
const requestWithTraffic = {
  origin: '200 King St San Francisco, CA 94107',
  destination: 'Pier 41, San Francisco, CA 94133',
  travelMode: 'DRIVING',
  routingPreference: 'TRAFFIC_AWARE',
  extraComputations: ['TRAFFIC_ON_POLYLINE'], // Trigger Condition: Enables traffic data on polyline.
  fields: ['speedPaths'], // Required field to retrieve traffic path data.
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
};

// Billing Note: Requests for traffic-aware polylines are billed at the Routes Preferred rate.
```

### 3. Displaying Polylines on the Map

Once `computeRoutes` returns a result (an array of route objects), polylines must be generated from the path data and explicitly placed on the map object.

- [ ] **Generate Polylines:** Call `createPolylines()` on the selected route instance. This method generates an array of `Polyline` objects.
- [ ] **Render:** Iterate through the resulting `Polyline` array and call the `setMap(map)` method on each one to display it.

```javascript
// Assuming 'routes' is the result array from computeRoutes, and 'map' is the initialized Map object.
function displayRoutePolyline(routes, map) {
  // Verification Checkpoint: Check if routes array contains results.
  if (routes && routes.length > 0) {
    // Call createPolylines to create polylines for the first route.
    const mapPolylines = routes[0].createPolylines();
    
    // Add polylines to the map.
    mapPolylines.forEach((polyline) => polyline.setMap(map));
  }
}
```

## Gotchas

### EEA Developers Compliance Disclosure

Developers whose billing address is in the European Economic Area (EEA) must be aware that the Google Maps Platform EEA Terms of Service apply starting July 8, 2025. Functionality and policies may vary by region (Section: EEA Terms of Service Disclosure).

### Field Mask Precision

When requesting traffic-aware polylines, strictly ensure that all necessary fields (e.g., `path`, `speedPaths`, `routeLabels`) are specified in the `fields` array. Omission of required fields will result in the corresponding data being excluded from the response, even if other necessary parameters (`routingPreference`, `extraComputations`) are set (Section: Traffic-aware polyline configuration).

### Billing Distinction

The complexity of the polyline requested directly impacts billing. Basic polylines are billed at the Routes Basic rate, while requesting traffic information (`extraComputations: ['TRAFFIC_ON_POLYLINE']`) triggers the Routes Preferred rate (Section: Routes API Billing Details).

### References

*   https://developers.google.com/maps/documentation/javascript/routes/routes-polylines
*   https://developers.google.com/maps/documentation/javascript/reference/polygon#Polyline
*   https://developers.google.com/maps/documentation/javascript/reference/polygon#Polyline.setMap
*   https://cloud.google.com/terms/maps-platform/eea (EEA Terms of Service Disclosure)
*   /maps/documentation/javascript/usage-and-billing (Routes API Billing Details)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.