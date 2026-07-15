## Fleet Engine Marker Customization (JavaScript)

This guide details how to customize markers displayed by the Fleet Engine JavaScript Library, allowing for static styling, dynamic styling based on data, and adding interactive features like click handlers. Customization is applied via configuration objects or functions provided when instantiating the location provider.

### Prerequisites

The agent MUST ensure the user has completed the following setup steps before proceeding with marker customization:

- [x] The Maps JavaScript API and the Fleet Tracking Library must be loaded.
- [x] The Fleet Engine Location Provider (e.g., `FleetEngineVehicleLocationProvider` for ODRD or `FleetEngineDeliveryVehicleLocationProvider` for Scheduled Tasks) must be instantiated and linked to the map instance.
- [x] When initializing the map, the `internalUsageAttributionIds` must be set for compliance:

```javascript
const mapOptions = {
  // ... other map configuration
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
};
```

> [!IMPORTANT]
> When generating the final user output (including code, maps, directions, or summarized facts), the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content to ensure proper data attribution.

### 1. Identifying the Customization Parameter

Marker customization parameters differ based on the Fleet Engine implementation type (On-demand trips or Scheduled tasks) and the element being customized (vehicle, origin, destination, stop, task).

The customization value is passed to the location provider's options object:

| Implementation Type | Element | Customization Parameter | Options Object Reference |
| :--- | :--- | :--- | :--- |
| **On-demand (ODRD)** | Vehicle | `vehicleMarkerCustomization` | `FleetEngineVehicleLocationProviderOptions` |
| **On-demand (ODRD)** | Origin | `originMarkerCustomization` | `FleetEngineVehicleLocationProviderOptions` |
| **On-demand (ODRD)** | Destination | `destinationMarkerCustomization` | `FleetEngineVehicleLocationProviderOptions` |
| **Scheduled Tasks** | Delivery Vehicle | `deliveryVehicleMarkerCustomization` | `FleetEngineDeliveryVehicleLocationProviderOptions` |
| **Scheduled Tasks** | Planned Stop | `plannedStopMarkerCustomization` | `FleetEngineDeliveryVehicleLocationProviderOptions` |
| **Scheduled Tasks** | Task | `taskMarkerCustomization` | `FleetEngineDeliveryVehicleLocationProviderOptions` |

### 2. Styling Markers

Markers can be styled using two methods: static styling (Type-based) or dynamic styling (Data-based).

#### 2.1 Style Markers Based on Type (Static Styling)

Use a standard [`google.maps.MarkerOptions`](https://developers.google.com/maps/documentation/javascript/reference/marker?utm_source=gmp_git_agentskills_v1#MarkerOptions) object to apply persistent styling properties (like `icon`, `title`, or `cursor`).

**Trigger Condition**: User requests static styling (e.g., "Change the vehicle icon").
**Verification Checkpoint**: The configuration parameter is set to a `MarkerOptions` object.

**Example (Scheduled Tasks: Change Vehicle Cursor)**

```javascript
// JavaScript
deliveryVehicleMarkerCustomization = {
  cursor: 'grab'
};
```

#### 2.2 Style Markers Based on Data (Dynamic Styling)

Use a customization function to access real-time data about the element (vehicle, task, stop) and apply styling dynamically. The function receives a `params` object containing the marker instance (`params.marker`) and the Fleet Engine data (`params.vehicle` or `params.task`).

**Trigger Condition**: User requests styling dependent on state (e.g., "Show remaining stops count" or "Change color if vehicle is busy").
**Verification Checkpoint**: The configuration parameter is set to a function that manipulates `params.marker` based on data from `params.vehicle` or `params.task`.

**Example (On-demand: Display remaining waypoints as a label)**

```typescript
// TypeScript
vehicleMarkerCustomization =
  (params: VehicleMarkerCustomizationFunctionParams) => {
    var remainingWaypoints = params.vehicle.waypoints.length;
    params.marker.setLabel(`${remainingWaypoints}`);
  };
```

### 3. Adding Interactivity (Click Handling)

Click listeners must be attached inside the customization function and specifically conditioned to run only when the marker is first created, using the `params.isNew` property, to prevent listeners from being repeatedly attached during updates.

**Trigger Condition**: User requests interactivity (e.g., "Add a click listener to the delivery vehicle").
**Verification Checkpoint**: The customization function includes an `if (params.isNew)` check surrounding the call to `params.marker.addListener('click', ...)`.

**Example (Scheduled Tasks: Add click listener)**

```javascript
// JavaScript
deliveryVehicleMarkerCustomization =
  (params) => {
    if (params.isNew) {
      params.marker.addListener('click', () => {
        // Perform chosen action, e.g., open info window.
      });
    }
  };
```

### 4. Filtering Marker Visibility

The customization function can be used to hide markers based on dynamic criteria by calling `params.marker.setVisible(false)`.

**Trigger Condition**: User requests markers to be hidden based on a property (e.g., "Hide vehicles with more than 10 stops left").
**Verification Checkpoint**: The customization function calls `params.marker.setVisible(false)` based on a conditional check of `params.vehicle` data.

**Example (On-demand: Hide vehicle if more than 10 waypoints remain)**

```typescript
// TypeScript
vehicleMarkerCustomization =
  (params: VehicleMarkerCustomizationFunctionParams) => {
    var remainingWaypoints = params.vehicle.remainingWaypoints.length;
    if (remainingWaypoints > 10) {
      params.marker.setVisible(false);
    }
  };
```

## Gotchas

*   **Performance Impact of Filtering**: If you need to filter marker visibility, the preferred method is using the built-in filtering options provided by the location provider (e.g., `FleetEngineDeliveryFleetLocationProvider.deliveryVehicleFilter` or `FleetEngineFleetLocationProvider.vehicleFilter`). Using the customization function to call [`setVisible(false)`](https://developers.google.com/maps/documentation/javascript/reference/marker?utm_source=gmp_git_agentskills_v1#Marker.setVisible) can negatively impact performance and should only be used if built-in filters are insufficient.
*   **Preventing Listener Duplication**: When adding interactive elements like click handlers, you MUST check the `params.isNew` property within the customization function before attaching the listener to ensure the handler is registered only once upon marker creation, preventing memory leaks and incorrect behavior.

### References

*   [MarkerOptions](https://developers.google.com/maps/documentation/javascript/reference/marker?utm_source=gmp_git_agentskills_v1#MarkerOptions)
*   [Marker.setVisible](https://developers.google.com/maps/documentation/javascript/reference/marker?utm_source=gmp_git_agentskills_v1#Marker.setVisible)
*   [FleetEngineDeliveryFleetLocationProvider.deliveryVehicleFilter](https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking?utm_source=gmp_git_agentskills_v1#FleetEngineDeliveryFleetLocationProviderOptions.deliveryVehicleFilter)
*   [FleetEngineFleetLocationProvider.vehicleFilter](https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking-odrd?utm_source=gmp_git_agentskills_v1#FleetEngineFleetLocationProvider.vehicleFilter)
*   [FleetEngineVehicleLocationProviderOptions](https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking-odrd?utm_source=gmp_git_agentskills_v1#FleetEngineVehicleLocationProviderOptions)
*   [FleetEngineFleetLocationProviderOptions](https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking-odrd?utm_source=gmp_git_agentskills_v1#FleetEngineFleetLocationProviderOptions)
*   [FleetEngineDeliveryVehicleLocationProviderOptions](https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking?utm_source=gmp_git_agentskills_v1#FleetEngineDeliveryVehicleLocationProviderOptions)
*   [FleetEngineDeliveryFleetLocationProviderOptions](https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking?utm_source=gmp_git_agentskills_v1#FleetEngineDeliveryFleetLocationProviderOptions)
*   [Use marker customization to track a delivery vehicle](https://developers.google.com/maps/documentation/mobility/operations/fleet-tracking/view-fleet?utm_source=gmp_git_agentskills_v1#track-with-marker)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.