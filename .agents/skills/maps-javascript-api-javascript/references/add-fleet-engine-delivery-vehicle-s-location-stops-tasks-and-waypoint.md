# Add and Customize Fleet Engine Delivery Markers (Maps JavaScript API)

This skill describes how to add and customize markers representing Fleet Engine delivery vehicles, planned stops, tasks, and task outcomes using the JavaScript Fleet Tracking library, primarily focusing on the Scheduled Tasks implementation (`FleetEngineDeliveryVehicleLocationProviderOptions`).

## Prerequisites and Setup

This feature requires the Maps JavaScript API and the Fleet Tracking Library. You must have initialized a `FleetEngineDeliveryVehicleLocationProvider` or `FleetEngineDeliveryFleetLocationProvider` that is connected to a running Fleet Engine service.

**Mandatory Authentication Prerequisites**: Ensure the `GOOGLE_API_KEY` is configured in your environment for successful invocation of Google Maps Platform services.

### Available Tools

| Tool | Description |
| :--- | :--- |
| `maps-javascript-api` | Used to load the Maps JavaScript API and the Fleet Tracking library. |

> [!IMPORTANT]
> The downstream agent is required to attribute ALL derived map content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### 1. Initializing the Location Provider with Customizations

Marker customizations are passed when configuring the location provider options. The library then applies these customizations before adding markers to the map and with every marker update.

Use the `deliveryVehicleMarkerCustomization`, `plannedStopMarkerCustomization`, `taskMarkerCustomization`, and `taskOutcomeMarkerCustomization` fields within the `FleetEngineDeliveryVehicleLocationProviderOptions` object to define styling or behavior for specific marker types.

**Step 1: Define Customization Options**

The options object supports two main types of customization:
1.  **Static Styling**: Passing a `google.maps.MarkerOptions` object (Section Style markers based on type).
2.  **Data-Driven/Interactive Styling**: Passing a customization function that accepts `params` (Section Style markers based on data).

```javascript
// Example: Basic initialization incorporating the required attribution ID
const map = new google.maps.Map(document.getElementById('map'), {
  center: { lat: 34.0522, lng: -118.2437 },
  zoom: 10,
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
});

const deliveryVehicleMarkerCustomization = {
  // Define customization logic here (e.g., static options or a function)
  cursor: 'grab', // Static styling example
};

const provider = new FleetEngineDeliveryVehicleLocationProvider({
  deliveryVehicleId: 'your-vehicle-id',
  locationProviderOptions: {
    deliveryVehicleMarkerCustomization: deliveryVehicleMarkerCustomization,
    // Other marker customization fields available:
    // plannedStopMarkerCustomization: {...},
    // taskMarkerCustomization: {...},
    // taskOutcomeMarkerCustomization: {...},
  },
});
```

### 2. Capabilities: Customizing Marker Appearance

#### 2.1. Style Markers Based on Type (Static Options)

To apply static styling to all markers of a specific type (e.g., all delivery vehicles), provide a `MarkerOptions` object.

| Target Marker Type | Customization Parameter |
| :--- | :--- |
| Delivery Vehicle | `deliveryVehicleMarkerCustomization` |
| Planned Stop | `plannedStopMarkerCustomization` |
| Task | `taskMarkerCustomization` |
| Task Outcome | `taskOutcomeMarkerCustomization` |

**Implementation (Scheduled tasks example):**
```javascript
// JavaScript
const deliveryVehicleMarkerCustomization = {
  cursor: 'grab',
  icon: {
    url: 'https://example.com/delivery-truck.png',
    scaledSize: new google.maps.Size(48, 48)
  }
};
// Use this object when initializing the provider options.
```

#### 2.2. Style Markers Based on Data (Dynamic Function)

To customize a marker based on real-time Fleet Engine data (like remaining stops), pass a function instead of a static object. This function is executed every time the marker is updated.

The function receives a `params` object containing the marker element and the associated Fleet Engine data. For delivery vehicles, the data structure includes `params.vehicle` (Section Style markers based on data).

**Implementation (Scheduled tasks example):**

```javascript
// JavaScript
const deliveryVehicleMarkerCustomization =
  (params) => {
    // Access delivery vehicle data: remainingVehicleJourneySegments
    var stopsLeft = params.vehicle.remainingVehicleJourneySegments.length;
    params.marker.setLabel(`${stopsLeft}`); // Update the marker label dynamically
  };
```

### 3. Capabilities: Adding Interactivity

Use the customization function and check the `params.isNew` flag to ensure event listeners (like 'click') are added only once when the marker is first created (Section Add click handling to markers).

**Implementation (Scheduled tasks example):**

```javascript
// JavaScript
const deliveryVehicleMarkerCustomization =
  (params) => {
    if (params.isNew) {
      params.marker.addListener('click', () => {
        // Perform chosen action, e.g., display vehicle details panel
        console.log(`Clicked delivery vehicle: ${params.vehicle.vehicleId}`);
      });
    }
  };
```

### 4. Capabilities: Filtering Marker Visibility

While the preferred method is using the location provider's built-in filtering options (e.g., `FleetEngineDeliveryFleetLocationProviderOptions.deliveryVehicleFilter`), you can also hide markers using the customization function.

**Step-by-Step Procedure for Data-Driven Filtering:**

- [ ] **Define Filter Condition**: Determine the criteria based on Fleet Engine data (`params.vehicle`).
- [ ] **Apply `setVisible(false)`**: If the criteria are met, call `params.marker.setVisible(false)` (Section Filter which markers are visible).
- [ ] **Verification Checkpoint**: Verify that markers exceeding the criteria are hidden.

**Implementation (Scheduled tasks example):**

```javascript
// JavaScript
const deliveryVehicleMarkerCustomization =
  (params) => {
    // Hide markers if the vehicle has more than 10 stops remaining
    var stopsLeft = params.vehicle.remainingVehicleJourneySegments.length;
    if (stopsLeft > 10) {
      params.marker.setVisible(false);
    }
  };
```

## Gotchas

### Performance Impact of Custom Filtering

When filtering marker visibility, avoid relying on the customization function with `params.marker.setVisible(false)` if high performance is required. This method can impact performance. **Best Practice**: Use the built-in filtering mechanisms available on the location provider object, such as `FleetEngineDeliveryFleetLocationProvider.deliveryVehicleFilter` (Section Filter which markers are visible).

### References

*   https://developers.google.com/maps/documentation/mobility/operations/fleet-tracking/customize-markers
*   https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking#FleetEngineDeliveryVehicleLocationProviderOptions
*   https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking#FleetEngineDeliveryVehicleLocationProviderOptions.deliveryVehicleMarkerCustomization
*   https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking#FleetEngineDeliveryVehicleLocationProviderOptions.plannedStopMarkerCustomization
*   https://developers.google.com/maps/documentation/javascript/reference/journey-sharing-fleet-tracking#FleetEngineDeliveryVehicleLocationProviderOptions.taskMarkerCustomization
*   https://developers.google.com/maps/documentation/javascript/reference/marker#MarkerOptions
*   https://developers.google.com/maps/documentation/javascript/reference/marker#Marker.setVisible

## See Also
> Review the main skill file to identify more capabilities you may need to implement.