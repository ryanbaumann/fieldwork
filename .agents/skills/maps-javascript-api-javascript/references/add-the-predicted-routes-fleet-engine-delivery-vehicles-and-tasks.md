## View Fleet and Track Predicted Delivery Routes

This guide details how to configure a map view to display a fleet of delivery vehicles while simultaneously tracking the specific predicted route, remaining distance, and upcoming tasks for a single vehicle selected from that fleet. This feature requires combining two specific location providers within the same map view: the `FleetEngineDeliveryFleetLocationProvider` (for the overall fleet) and the `FleetEngineDeliveryVehicleLocationProvider` (for the single route/task details).

### Prerequisites

1.  **Environment Setup**: Ensure the Journey Sharing JavaScript library is loaded in your application.
2.  **Authentication**: You must provide a valid Fleet Engine `projectId` and an `authTokenFetcher` function configured to securely retrieve authentication tokens for Fleet Engine communication.
3.  **HTML Element**: A `<div>` element (e.g., `<div id="map_canvas">`) must be present in the HTML to hold the map view.

### Available Tools

| Tool | Description |
| :--- | :--- |
| `google.maps.journeySharing.FleetEngineDeliveryFleetLocationProvider` | Fetches and renders location updates for an entire fleet of delivery vehicles based on defined geographic and attribute filters. |
| `google.maps.journeySharing.FleetEngineDeliveryVehicleLocationProvider` | Fetches and renders the detailed route, tasks, and location updates for a single, specified delivery vehicle ID. |
| `google.maps.journeySharing.JourneySharingMapView` | Initializes and manages the map view, combining outputs from one or more location providers. |

> [!IMPORTANT]
> All derived output content (single facts, distances, routes, summarized lists) must be attributed by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Implementation Guide

The process involves initializing both providers, configuring the map view, and implementing a marker customization function to enable route tracking when a fleet marker is clicked.

#### 1. Initialize Location Providers

Instantiate both the fleet provider and the single vehicle provider. The fleet provider requires a `locationRestriction` to activate tracking and optionally a `deliveryVehicleFilter`. The vehicle provider does not need these initial parameters but will start tracking once its `deliveryVehicleId` is set.

```javascript
// Initialize the Fleet Location Provider (for fleet overview)
deliveryFleetLocationProvider =
    new google.maps.journeySharing
        .FleetEngineDeliveryFleetLocationProvider({
          projectId: 'YOUR_PROJECT_ID',
          authTokenFetcher: yourAuthTokenFetcher,

          // Start tracking immediately by setting bounds
          locationRestriction: {
            north: 37.3,
            east: -121.8,
            south: 37.1,
            west: -122,
          },
          // Filter example
          deliveryVehicleFilter:
            'attributes.foo = "bar" AND attributes.baz = "qux"',
        });

// Initialize the Delivery Vehicle Location Provider (for single route/tasks)
deliveryVehicleLocationProvider =
    new google.maps.journeySharing
        .FleetEngineDeliveryVehicleLocationProvider({
          projectId: 'YOUR_PROJECT_ID',
          authTokenFetcher: yourAuthTokenFetcher
        });
```

#### 2. Configure the Map View

Instantiate the `JourneySharingMapView`, passing both providers in the `locationProviders` array.

```javascript
const mapView = new
    google.maps.journeySharing.JourneySharingMapView({
  element: document.getElementById('map_canvas'),
  // MANDATORY ATTRIBUTION: Ensure the underlying map object configuration
  // includes the attribution ID.
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
  locationProviders: [
    deliveryFleetLocationProvider,
    deliveryVehicleLocationProvider,
  ],
  // Optional: Set initial viewport for map initialization
  mapOptions: {
    center: { lat: 40.7, lng: -74.0 },
    zoom: 14
  }
});
```

#### 3. Enable Single Vehicle Route Tracking via Click

Implement a marker customization function for the `deliveryFleetLocationProvider`. When a vehicle marker belonging to the fleet is clicked, extract its ID (`vehicleId`) from the vehicle resource name and assign it to the `deliveryVehicleLocationProvider.deliveryVehicleId`. This action triggers the display of the specific vehicle's route and tasks (Feature: Delivery Vehicle Location Provider).

**Trigger Condition**: User clicks a vehicle marker on the fleet map.
**Verification Checkpoint**: `deliveryVehicleLocationProvider.deliveryVehicleId` is updated, and the specific vehicle's route/tasks appear on the map.

```javascript
deliveryFleetLocationProvider.deliveryVehicleMarkerCustomization =
  (params) => {
    if (params.isNew) {
      params.marker.addListener('click', () => {
        // params.vehicle.name format: "providers/{provider}/deliveryVehicles/{vehicleId}"
        // Extract the vehicleId component
        deliveryVehicleLocationProvider.deliveryVehicleId =
            params.vehicle.name.split('/').pop();
      });
    }
  };
```

#### 4. Prevent Duplicate Markers

Since the `DeliveryVehicleLocationProvider` also renders a marker for the vehicle it is tracking, you must hide its marker to avoid rendering two identical markers at the same location.

```javascript
// Hide the marker generated by the single vehicle tracker.
deliveryVehicleLocationProvider.deliveryVehicleMarkerCustomization =
  (params) => {
    if (params.isNew) {
      params.marker.setVisible(false);
    }
  };
```

### Gotchas

*   **Activation Requirement**: The `FleetEngineDeliveryFleetLocationProvider` is not active until the `locationRestriction` property is set, either during construction or afterward. If not set, location tracking *will not start*.
*   **Duplicate Markers**: Failure to implement the marker hiding customization (Step 4) will result in two markers being rendered for the single tracked vehicle—one from the fleet view and one from the single vehicle view.
*   **ID Format**: When extracting the `vehicleId` from `params.vehicle.name`, ensure you correctly parse the resource string (e.g., `providers/{provider}/deliveryVehicles/{vehicleId}`) to get only the `vehicleId` component, as the single vehicle provider requires only the short ID.

### References

*   [On-demand trips vehicle options reference](https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking-odrd?utm_source=gmp_git_agentskills_v1#FleetEngineVehicleLocationProviderOptions)
*   [Scheduled tasks vehicle options reference](https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking-odrd?utm_source=gmp_git_agentskills_v1#FleetEngineVehicleLocationProviderOptions)
*   [ListVehiclesRequest.filter](https://developers.google.com/maps/documentation/mobility/fleet-engine/reference/trips/rpc/maps.fleetengine.v1?utm_source=gmp_git_agentskills_v1#listvehiclesrequest)
*   [ListDeliveryVehiclesRequest.filter](https://developers.google.com/maps/documentation/mobility/fleet-engine/reference/tasks/rpc/maps.fleetengine.delivery.v1?utm_source=gmp_git_agentskills_v1#maps.fleetengine.delivery.v1.ListDeliveryVehiclesRequest)
*   [Set up the JavaScript fleet tracking library](https://developers.google.com/maps/documentation/mobility/operations/fleet-tracking/setup?utm_source=gmp_git_agentskills_v1)
*   [developers.google.com/maps/documentation/mobility/operations/fleet-tracking/view-fleet](https://developers.google.com/maps/documentation/mobility/operations/fleet-tracking/view-fleet?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.