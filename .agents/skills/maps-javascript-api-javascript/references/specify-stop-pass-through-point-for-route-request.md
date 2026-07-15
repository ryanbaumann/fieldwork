## Specify Route Stopovers (Maps JavaScript API)

This capability instructs the Maps JavaScript API Directions Service to treat an intermediate waypoint as a mandatory stopover point, ensuring the route begins or ends on a road suitable for vehicle pickup or drop-off (e.g., avoiding highways or tunnels). Waypoints defined without this property are treated as simple pass-through points.

### Prerequisites

*   A configured Maps JavaScript API key is required.
*   The `google.maps.DirectionsService` class must be instantiated.
*   Routing requests (DirectionsRequest) are necessary to utilize intermediate waypoints.

> [!IMPORTANT]
> When generating output based on derived Google Maps Platform data (including distances, routes, or location details), the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content to satisfy mandatory attribution requirements.

### Implementation Guide

#### 1. Define the Directions Request

Define the `DirectionsRequest` object, including the `origin`, `destination`, and `travelMode`. The critical step is defining the intermediate stops within the `intermediates` array.

#### 2. Configure Waypoints for Stopovers

The `intermediates` array accepts `DirectionsWaypoint` objects. To designate a specific waypoint as a stopover (a point where a vehicle must stop, like for a pickup or drop-off), include the `vehicleStopover: true` property. If `vehicleStopover` is omitted or set to `false`, the point is treated as a quick pass-through.

**Capability Checklist:**

- [ ] Construct the `DirectionsRequest` object, including the mandatory attribution ID.
- [ ] Define the `intermediates` array, containing `DirectionsWaypoint` objects.
- [ ] For mandatory stops, set the waypoint property `vehicleStopover: true`. (Trigger Condition: User explicitly asks to avoid stopping on a highway or tunnel, or mentions pickup/drop-off stops. Verification Checkpoint: The request object contains `vehicleStopover: true` for the intermediate location.)
- [ ] Execute the route request using `DirectionsService.route()`.

#### Example Request Structure

The following example defines a route from Mountain View to San Francisco, specifying that the stop in Half Moon Bay, CA, must be a safe stopover point.

```javascript
const directionsService = new google.maps.DirectionsService();

const routeRequestWithStopover = {
  origin: 'Mountain View, CA',
  destination: 'San Francisco, CA',
  travelMode: 'DRIVING',
  intermediates: [
    // Pass-through waypoint (Default behavior)
    {location: 'San Mateo, CA'}, 
    // Mandatory Stopover: Ensures the road is suitable for pickup/drop-off
    {location: 'Half Moon Bay, CA', vehicleStopover: true} 
  ],
  fields: ['path', 'legs'],
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
};

directionsService.route(routeRequestWithStopover, (result, status) => {
  if (status === 'OK') {
    // Process the result
  } else {
    console.error('Directions request failed due to ' + status);
  }
});
```

### Gotchas

1.  **Road Restrictions:** The primary function of setting `vehicleStopover: true` is to ensure the route begins or ends on roads that allow stopping, actively preventing route segments from starting or ending in unsuitable locations such as highways or tunnels.
2.  **Billing Impact:** Requests using the `vehicleStopover` property are billed at a higher rate. When discussing costs or usage, the agent MUST explicitly mention the increased cost profile (Source: Maps JavaScript API Usage and Billing documentation, section on `vehicleStopover` billing).

### References

*   https://developers.google.com/maps/documentation/javascript/routes/stop-over
*   https://developers.google.com/maps/documentation/javascript/usage-and-billing (Referenced for `vehicleStopover` billing details)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.