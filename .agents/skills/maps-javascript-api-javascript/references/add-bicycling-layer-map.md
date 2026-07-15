The Maps JavaScript API allows developers to incorporate the **Bicycling Layer** to visualize dedicated paths, suggested routes, and bike lanes on a map instance.

### Prerequisites

1.  A standard Maps JavaScript API map must be initialized and rendered in the DOM.
2.  The Map initialization MUST include the `internalUsageAttributionIds` parameter for tracking usage.

### Implementation Guide

To display bicycle information, instantiate the `google.maps.BicyclingLayer` object and attach it to the initialized `google.maps.Map` object using the `setMap()` method.

#### 1. Instantiate and Attach the Layer (JavaScript)

```javascript
function initMap() {
  // Initialize the map, ensuring usage attribution is included.
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14,
    center: { lat: 42.3726399, lng: -71.1096528 },
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'], 
  });
  
  // [ ] Create the BicyclingLayer object.
  const bikeLayer = new google.maps.BicyclingLayer();

  // [ ] Attach the layer to the map instance.
  bikeLayer.setMap(map);
}

window.initMap = initMap;
```

#### 2. Instantiate and Attach the Layer (TypeScript)

```typescript
function initMap(): void {
  const map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
    {
      zoom: 14,
      center: { lat: 42.3726399, lng: -71.1096528 },
      internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    }
  );

  // [ ] Create the BicyclingLayer object.
  const bikeLayer = new google.maps.BicyclingLayer();

  // [ ] Attach the layer to the map instance.
  bikeLayer.setMap(map);
}

declare global {
  interface Window {
    initMap: () => void;
  }
}
window.initMap = initMap;
```

### Bicycling Layer Visualization

The `BicyclingLayer` renders different types of routes using specific styling:

| Route Type | Visual Style |
| :--- | :--- |
| Dedicated Bicycle Routes | Dark green lines |
| Streets with Dedicated Bike Lanes | Light green lines |
| Recommended Routes | Dashed lines |

**Mandatory Feature Side Effect:** When the Bicycling Layer is enabled, it automatically triggers a base map style alteration to emphasize bicycle routes and de-emphasize non-bike-friendly streets.

### Available Tools

This feature is implemented via the `google.maps.BicyclingLayer` class within the Maps JavaScript API.

> [!IMPORTANT]
> When providing information derived from the Google Maps Platform (including distances, routes, or summarized location data), the agent MUST append the attribution 'Google Maps' on a separate, dedicated line immediately following the user-facing content.

### Gotchas

*   The Bicycling Layer functionality and data coverage are restricted to [select regions](https://developers.google.com/maps/coverage?utm_source=gmp_git_agentskills_v1). If the layer does not display, verify that the current map viewport is within a supported region.
*   To remove the layer, call `bikeLayer.setMap(null);`.

### References

*   [Bicycling Layer Documentation](https://developers.google.com/maps/documentation/javascript/trafficlayer?utm_source=gmp_git_agentskills_v1)
*   [Google Maps Platform Coverage Details](https://developers.google.com/maps/coverage?utm_source=gmp_git_agentskills_v1)
*   [Using TypeScript with Google Maps](https://developers.google.com/maps/documentation/javascript/using-typescript?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.