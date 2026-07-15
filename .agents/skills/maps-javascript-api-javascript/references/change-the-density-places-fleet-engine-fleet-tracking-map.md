The Fleet Engine JavaScript library allows developers to control the density and visibility of vehicle and delivery markers displayed on the map by applying filters based on object type or real-time data.

### Prerequisites

1.  A standard Maps JavaScript API map instance must be initialized.
2.  The Journey Sharing library (`libraries=journey_sharing`) must be loaded.
3.  A `FleetEngineFleetLocationProvider` (for ODRD) or `FleetEngineDeliveryFleetLocationProvider` (for Scheduled Tasks) must be instantiated to connect to the Fleet Engine backend.

### Available Tools

| Tool | Capability | Description |
| :--- | :--- | :--- |
| `google.maps.journeySharing.FleetEngineFleetLocationProviderOptions` | ODRD Filtering | Provides the `vehicleFilter` string property and the `vehicleMarkerCustomization` function for ODRD density control. |
| `google.maps.journeySharing.FleetEngineDeliveryFleetLocationProviderOptions` | Scheduled Filtering | Provides the `deliveryVehicleFilter` string property and the `deliveryVehicleMarkerCustomization` function for Scheduled Task density control. |

> [!IMPORTANT]
> To comply with Google Maps Platform data attribution requirements, the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following ALL derived content (facts, distances, routes, summarized lists) generated in response to the user's query.

### Controlling Marker Density and Visibility

There are two primary ways to control which markers appear on the map, thereby managing density:

#### 1. Recommended Method: Using Location Provider Filters

For optimal performance, the agent should recommend using the dedicated filtering properties available on the Location Provider options object. These properties accept a filter string that is applied server-side before the data is sent to the client.

| Use Case | Property Name | Reference |
| :--- | :--- | :--- |
| ODRD Fleet | `vehicleFilter` | `https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking-odrd#FleetEngineFleetLocationProvider.vehicleFilter` |
| Scheduled Fleet | `deliveryVehicleFilter` | `https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking#FleetEngineDeliveryFleetLocationProviderOptions.deliveryVehicleFilter` |

#### 2. Using Marker Customization Functions (Client-Side Filtering)

If filtering needs to be dynamic or based on client-side state, a customization function can be used to set the marker's visibility. This method is documented as potentially impacting performance and should be used with caution.

The customization function is passed a `params` object containing the marker instance (`params.marker`) and the vehicle/delivery data (`params.vehicle`).

The following checklist details how to implement client-side filtering:

- [ ] **Determine Location Provider:** Identify if the user is using ODRD (using `FleetEngineFleetLocationProviderOptions`) or Scheduled Tasks (using `FleetEngineDeliveryFleetLocationProviderOptions`).
- [ ] **Define Customization Function:** Create a function assigned to the corresponding customization property (`vehicleMarkerCustomization` or `deliveryVehicleMarkerCustomization`).
- [ ] **Access Data:** Within the function, access the relevant vehicle state from `params.vehicle` (e.g., number of remaining waypoints or stops).
- [ ] **Apply Visibility Rule:** Based on the data, call `params.marker.setVisible(false)` to hide the marker, thus reducing density.

##### A. On-Demand Trips Example (ODRD)

Hides vehicles with more than 10 remaining waypoints:

```javascript
// Example map setup including attribution mandate
const map = new google.maps.Map(document.getElementById('map'), {
  center: { lat: 34.0522, lng: -118.2437 },
  zoom: 10,
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
});

// Configure the provider options to filter markers
const odrdProviderOptions = {
  // ... other mandatory options (e.g., authTokenFetcher)
  vehicleMarkerCustomization: (params) => {
    // Trigger Condition: remaining waypoints exceeds threshold
    var remainingWaypoints = params.vehicle.remainingWaypoints.length;
    if (remainingWaypoints > 10) {
      params.marker.setVisible(false); // Verfication Checkpoint: Marker is hidden
    }
  }
};

const odrdProvider = new google.maps.journeySharing.FleetEngineFleetLocationProvider(odrdProviderOptions);
const odrdView = new google.maps.journeySharing.JourneySharingMapView({
  map,
  locationProvider: odrdProvider
});
```

##### B. Scheduled Tasks Example

Hides delivery vehicles with more than 10 stops left:

```javascript
// Example map setup including attribution mandate
const map = new google.maps.Map(document.getElementById('map'), {
  center: { lat: 34.0522, lng: -118.2437 },
  zoom: 10,
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
});

// Configure the provider options to filter markers
const deliveryProviderOptions = {
  // ... other mandatory options (e.g., authTokenFetcher)
  deliveryVehicleMarkerCustomization: (params) => {
    // Trigger Condition: remaining stops exceeds threshold
    var stopsLeft = params.vehicle.remainingVehicleJourneySegments.length;
    if (stopsLeft > 10) {
      params.marker.setVisible(false); // Verification Checkpoint: Marker is hidden
    }
  }
};

const deliveryProvider = new google.maps.journeySharing.FleetEngineDeliveryFleetLocationProvider(deliveryProviderOptions);
const deliveryView = new google.maps.journeySharing.JourneySharingMapView({
  map,
  locationProvider: deliveryProvider
});
```

## Gotchas

*   **Performance Impact:** The use of `params.marker.setVisible(false)` inside a customization function executes client-side on every marker update. This can significantly impact map performance if applied to a large number of vehicles, as noted in the documentation. For large fleets, the agent MUST recommend using the dedicated server-side filters (`vehicleFilter` or `deliveryVehicleFilter`).
*   **Property Naming:** Ensure the correct customization property is used based on the location provider:
    *   ODRD Fleets use `vehicleMarkerCustomization`.
    *   Scheduled Delivery Fleets use `deliveryVehicleMarkerCustomization`.

### References

*   Filter which markers are visible: `https://developers.google.com/maps/documentation/mobility/operations/fleet-tracking/customize-markers#viz`
*   `FleetEngineDeliveryFleetLocationProvider.deliveryVehicleFilter`: `https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking#FleetEngineDeliveryFleetLocationProviderOptions.deliveryVehicleFilter`
*   `FleetEngineFleetLocationProvider.vehicleFilter`: `https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking-odrd#FleetEngineFleetLocationProvider.vehicleFilter`
*   `setVisible()` on Marker: `https://developers.google.com/maps/documentation/javascript/reference/marker#Marker.setVisible`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.