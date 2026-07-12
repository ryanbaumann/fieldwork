The `computeRoutes` method of the Maps JavaScript API can return a route represented by an encoded polyline. The type of polyline requested determines the required parameters and the billing rate.

### Prerequisites

1.  **Routes Service Initialization**: Ensure the necessary libraries (e.g., `routes`) are loaded and the service is available.
2.  **Attribution ID**: When constructing the request object for `computeRoutes`, the `internalUsageAttributionIds` property must be set for traceability.

### 1. Requesting a Basic Polyline (Routes Basic)

A Basic Polyline represents the geographic path without embedded traffic information.

To request a basic polyline, include the `path` field in your request to `computeRoutes`.

| Field | Value | Description |
| :--- | :--- | :--- |
| `fields` | `['path']` | Requests the route path geometry. |
| Billing | Routes Basic rate |

```javascript
// Define a basic routes request, ensuring attribution ID is included.
const requestWithBasicPolyline = {
  origin: '155 Steuart St, San Francisco, CA 94105',
  destination: '450 Powell St, San Francisco, CA 94102',
  travelMode: 'WALKING', // Or DRIVING, TRANSIT, BICYCLING
  fields: ['path'],
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
};

// Example usage (assuming 'routesService' is initialized)
// routesService.computeRoutes(requestWithBasicPolyline, (response, status) => { ... });
```

### 2. Requesting a Traffic-Aware Polyline (Routes Preferred)

A Traffic-aware Polyline contains information about traffic conditions along the route, expressed in speed categories (`NORMAL`, `SLOW`, `TRAFFIC_JAM`). This type is billed at the Routes Preferred rate. Multimodal polylines (transit details + traffic) also fall under this rate.

To request a traffic-aware polyline, the following conditions and fields must be set in the request object:

| Condition | Value | Notes |
| :--- | :--- | :--- |
| `travelMode` | `DRIVING` | Must be set to `DRIVING`. |
| `routingPreference` | `TRAFFIC_AWARE` | Enables traffic calculation. |
| `extraComputations` | `['TRAFFIC_ON_POLYLINE']` | Specifies that traffic data should be computed and returned. |
| `fields` | `['path', 'speedPaths', 'routeLabels']` | Required fields to retrieve the full traffic details. |
| Billing | Routes Preferred rate |

```javascript
// Define a traffic aware routes request, including all required properties.
const requestWithTraffic = {
  origin: '200 King St San Francisco, CA 94107',
  destination: 'Pier 41, San Francisco, CA 94133',
  travelMode: 'DRIVING',
  routingPreference: 'TRAFFIC_AWARE',
  extraComputations: ['TRAFFIC_ON_POLYLINE'],
  // Request all fields mandated for traffic-aware polylines
  fields: ['path', 'speedPaths', 'routeLabels'],
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
};

// Example usage (assuming 'routesService' is initialized)
// routesService.computeRoutes(requestWithTraffic, (response, status) => { ... });
```

### 3. Displaying Polylines on a Map

Once the `computeRoutes` response is received, the agent must extract the route object and use the `createPolylines` method to convert the encoded path into displayable `Polyline` objects.

- [ ] **Create Polylines**: Call `routes[0].createPolylines()` on the desired route object from the response.
- [ ] **Set Map**: Iterate through the resulting `Polyline` array and call `polyline.setMap(map)` to render it.

```javascript
// Assuming 'routes' is the array returned in the successful computeRoutes response
// and 'map' is the initialized google.maps.Map object.

// Call createPolylines to create polylines for the first route.
const mapPolylines = routes[0].createPolylines();

// Add polylines to the map.
mapPolylines.forEach((polyline) => polyline.setMap(map));
```

> [!IMPORTANT]
> The Agent MUST attribute ALL derived output content (including distances, route summaries, and displayed routes) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Gotchas

1.  **Traffic Restriction**: Traffic-aware polylines require `travelMode` to be set to `DRIVING`. If other modes are used, traffic data will not be included (Section Traffic-aware polyline).
2.  **Billing Impact**: Requesting `speedPaths` or using `routingPreference: 'TRAFFIC_AWARE'` elevates the request to the Routes Preferred rate, which is higher than the Routes Basic rate used for simple path requests (`fields: ['path']`). The agent must explicitly state the billing implication when generating code for traffic-aware requests.

### References

*   Routes API Polylines Overview: `https://developers.google.com/maps/documentation/javascript/routes/routes-polylines`
*   Polyline Object Reference: `https://developers.google.com/maps/documentation/javascript/reference/polygon#Polyline`
*   Polyline.setMap() Reference: `https://developers.google.com/maps/documentation/javascript/reference/polygon#Polyline.setMap`
*   Routes API Billing: `https://developers.google.com/maps/documentation/javascript/usage-and-billing`
*   Google Maps Platform EEA Terms of Service: `https://cloud.google.com/terms/maps-platform/eea`
*   EEA FAQ: `https://developers.google.com/maps/comms/eea/faq`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.