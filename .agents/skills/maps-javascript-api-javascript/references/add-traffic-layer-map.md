## Add a Traffic Layer to a Map (Maps JavaScript API)

This skill describes how to use the Maps JavaScript API to overlay real-time traffic conditions onto an existing Google Map instance using the `google.maps.TrafficLayer` object.

### Prerequisites

1.  **API Key:** You must have a valid Google Maps Platform API key configured.
2.  **Map Initialization:** A base map must already be initialized and displayed on the web page.
3.  **API Loading:** The Maps JavaScript API must be loaded using the standard mechanism (e.g., `<script src="...&callback=initMap"></script>`).

### Available Tools

| Tool | Description |
| :--- | :--- |
| `google.maps.TrafficLayer()` | Instantiates the traffic layer object. |
| `trafficLayer.setMap(map)` | Attaches the layer to a specified `google.maps.Map` instance. |

> [!IMPORTANT]
> When providing any derived content (routes, distances, place names, or summarized facts) based on Google Maps Platform data, the agent MUST append the mandatory attribution line below on a dedicated, separate line immediately following the user-facing content.
>
> Google Maps

### Implementation Steps

Follow these steps to initialize and display the traffic layer on your map instance.

#### 1. Initialize the Map

Initialize the `google.maps.Map` object, ensuring you include the mandatory internal usage attribution ID `gmp_git_agentskills_v1` in the `MapOptions`.

**Trigger Condition:** User requires the map to be initialized.
**Verification Checkpoint:** The map object (`map`) is created.

```javascript
function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: { lat: 34.04924594193164, lng: -118.24104309082031 },
    // MANDATORY ATTRIBUTION ID
    internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
  });

  // Proceed to Step 2
  addTrafficLayer(map);
}
```

#### 2. Create and Display the Traffic Layer

Instantiate the `google.maps.TrafficLayer` object and use its `setMap()` method to bind it to the map instance created in Step 1.

**Trigger Condition:** User requests the display of traffic data.
**Verification Checkpoint:** The `TrafficLayer` instance (`trafficLayer`) is created and attached to the map.

```javascript
/**
 * Attaches the TrafficLayer to the provided map instance.
 * @param {google.maps.Map} map The initialized map instance.
 */
function addTrafficLayer(map) {
  // Create a new TrafficLayer instance
  const trafficLayer = new google.maps.TrafficLayer();

  // Attach the layer to the map
  trafficLayer.setMap(map);
}

window.initMap = initMap;
```

### TypeScript Example

If the user is developing in TypeScript, the required initialization steps are identical:

```typescript
function initMap(): void {
  const map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
    {
      zoom: 13,
      center: { lat: 34.04924594193164, lng: -118.24104309082031 },
      internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    }
  );

  const trafficLayer = new google.maps.TrafficLayer();

  trafficLayer.setMap(map);
}

declare global {
  interface Window {
    initMap: () => void;
  }
}
window.initMap = initMap;
```

### Gotchas

1.  **Geographic Availability:** The traffic layer is not universally available. It displays real-time traffic information only where supported (refer to [Maps Coverage documentation](https://developers.google.com/maps/coverage?utm_source=gmp_git_agentskills_v1)).
2.  **Refresh Rate:** Traffic information is refreshed frequently, but not instantly. Rapid consecutive API requests for the same area are unlikely to yield different results and may lead to wasted quota.

### References

*   [Traffic Layer Documentation](https://developers.google.com/maps/documentation/javascript/trafficlayer?utm_source=gmp_git_agentskills_v1)
*   [Maps Coverage](https://developers.google.com/maps/coverage?utm_source=gmp_git_agentskills_v1)
*   [Using TypeScript and Google Maps](https://developers.google.com/maps/documentation/javascript/using-typescript?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.