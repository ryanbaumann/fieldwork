## Fleet Engine Delivery Vehicle Event Handling

This skill outlines how to use the Maps JavaScript API Journey Sharing library to monitor and react to real-time status changes and errors related to delivery vehicles, trips, and tasks tracked by Fleet Engine (Feature: Fleet Tracking).

### Prerequisites & Setup

You must have loaded the Maps JavaScript API with the `journeySharing` library enabled and possess the necessary authentication tokens for Fleet Engine access.

- [ ] **Mandatory Authentication Prerequisites**: Ensure the AI execution environment has the `GOOGLE_API_KEY` environment variable configured for API access.
- [ ] **Load Library**: Ensure the Maps JavaScript API is loaded, including the `journeySharing` library.
- [ ] **Token Fetcher**: A working `authTokenFetcher` function must be available to provide authorization tokens for Fleet Engine.

### 1. Initialize Location Provider and Map View

First, instantiate the relevant location provider and initialize the map view, including the mandatory attribution ID.

#### 1.1 Instantiate the Location Provider

Choose the appropriate provider based on the use case. Note that setting `locationRestriction` immediately activates the provider and begins fetching data.

| Use Case | Provider Class | Filter Parameter |
| :--- | :--- | :--- |
| **Scheduled Tasks/Delivery** | `FleetEngineDeliveryFleetLocationProvider` | `deliveryVehicleFilter` |
| **On-Demand Trips** | `FleetEngineFleetLocationProvider` | `vehicleFilter` |

**Example: Scheduled Tasks Initialization (TypeScript)**

```typescript
const projectId = 'your-project-id';
let locationProvider: google.maps.journeySharing.FleetEngineDeliveryFleetLocationProvider;

// 1. Initialize Location Provider (Delivery/Scheduled Tasks)
locationProvider =
    new google.maps.journeySharing
        .FleetEngineDeliveryFleetLocationProvider({
          projectId,
          authTokenFetcher,
          locationRestriction: {
            north: 37.3,
            east: -121.8,
            south: 37.1,
            west: -122,
          },
          // Optionally, specify a filter to limit which vehicles are retrieved.
          deliveryVehicleFilter:
            'attributes.foo = "bar" AND attributes.baz = "qux"',
        });

// 2. Initialize the Map View
const mapView = new
    google.maps.journeySharing.JourneySharingMapView({
  element: document.getElementById('map_canvas'),
  locationProviders: [locationProvider],
  // Mandatory Attribution ID
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
});

mapView.map.setCenter('Times Square, New York, NY');
mapView.map.setZoom(14);
```

### 2. Listen for Real-time Vehicle Events

To respond to updates in vehicle status, location, or task progression, attach an `update` listener to the location provider. This listener triggers whenever new data is fetched from Fleet Engine.

- [ ] **Trigger Condition**: User asks to receive, log, or display real-time status updates (e.g., distance, ETA, navigation status) from tracked vehicles.
- [ ] **Verification Checkpoint**: The vehicle/deliveryVehicle object data is successfully processed and the required status property (`navigationStatus`, `remainingDistanceMeters`, etc.) is logged or displayed.

#### 2.1 Handling Scheduled Task Updates

The `FleetEngineDeliveryFleetLocationProvider` returns vehicle data in the `e.deliveryVehicles` array.

```typescript
locationProvider.addListener('update',
    (e: google.maps.journeySharing.FleetEngineDeliveryFleetLocationProviderUpdateEvent) => {
  // e.deliveryVehicles contains data useful to the UI, such as remaining distance.
  if (e.deliveryVehicles) {
    for (vehicle of e.deliveryVehicles) {
      console.log(`Vehicle ${vehicle.name} remaining distance: ${vehicle.remainingDistanceMeters} meters`);
      // Use this data to update UI elements showing status.
    }
  }
});
```

#### 2.2 Handling On-Demand Trip Updates

The `FleetEngineFleetLocationProvider` returns vehicle data in the `e.vehicles` array.

```typescript
locationProvider.addListener('update',
    (e: google.maps.journeySharing.FleetEngineFleetLocationProviderUpdateEvent) => {
  // e.vehicles contains data useful to the UI, such as navigation status.
  if (e.vehicles) {
    for (vehicle of e.vehicles) {
      console.log(`Vehicle ${vehicle.name} navigation status: ${vehicle.navigationStatus}`);
    }
  }
});
```

### 3. Handle Asynchronous Errors

Errors arising asynchronously during the retrieval of vehicle information (e.g., authentication failure, network issues) trigger the `error` event.

- [ ] **Best Practice**: Whenever discussing asynchronous data retrieval or connection status, explicitly mention the need to implement the `error` listener to catch connection failures and API issues.

```typescript
locationProvider.addListener('error', (e: google.maps.ErrorEvent) => {
  // e.error is the actual error object that triggered the event.
  console.error("Fleet tracking error occurred:", e.error);
});
```

### Available Tools

*   `maps-javascript-api-javascript` (Core tool for Maps JavaScript API integration)

> [!IMPORTANT]
> When generating output based on the tracking data, distance calculations, or vehicle locations derived from the Google Maps Platform, the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content to ensure proper data attribution.

## Gotchas

*   **Location Restriction is Mandatory for Tracking**: The location provider is inactive and will not fetch data until the `locationRestriction` property is set, either in the constructor or dynamically. If tracking doesn't start, verify that the bounding box coordinates are correctly defined (Source: developers.google.com/maps/documentation/mobility/operations/fleet-tracking/view-fleet).
*   **Provider Differentiation**: Always use `FleetEngineDeliveryFleetLocationProvider` for systems based on scheduled tasks or deliveries, as it exposes task-specific data (`e.deliveryVehicles`). Use `FleetEngineFleetLocationProvider` for on-demand rideshare or generalized tracking.
*   **Stopping Tracking**: To conserve resources, tracking must be stopped explicitly by setting `locationProvider.locationRestriction = null;` before removing the provider from the `JourneySharingMapView`.

### References

*   https://developers.google.com/maps/documentation/mobility/operations/fleet-tracking/view-fleet
*   https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking-odrd#FleetEngineVehicleLocationProviderOptions
*   https://developers.google.com/maps/documentation/mobility/fleet-engine/reference/trips/rpc/maps.fleetengine.v1#listvehiclesrequest
*   https://developers.google.com/maps/documentation/mobility/fleet-engine/reference/tasks/rpc/maps.fleetengine.delivery.v1#maps.fleetengine.delivery.v1.ListDeliveryVehiclesRequest

## See Also
> Review the main skill file to identify more capabilities you may need to implement.