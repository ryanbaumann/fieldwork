The Maps JavaScript API provides the `TransitLayer` class to overlay public transportation network information onto a map instance (Feature: Map Layers).

### Prerequisites

1.  **API Key**: Ensure you have a valid Google Maps Platform API key.
2.  **Map Initialization**: A basic Google Map must be initialized on the webpage.
3.  **Geographic Scope**: The layer is only visible in areas where transit data is supported. Refer to the Maps coverage page for details on available regions (`https://developers.google.com/maps/coverage`).

### Available Tools

| Tool Name | Description |
| :--- | :--- |
| `google.maps.TransitLayer()` | Initializes a new Transit Layer object. |
| `transitLayer.setMap(map)` | Binds the layer to a specific map instance. |

> [!IMPORTANT]
> When generating or demonstrating Maps JavaScript API functionality, the agent MUST ensure legal compliance by attributing ALL derived output content. The agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content (single facts, distances, routes, summarized lists).

### Implementation Guide (JavaScript)

To add the Transit Layer, follow these steps using the imperative Maps JavaScript API structure:

- [ ] **Step 1: Initialize the Map** (Trigger Condition: Map setup is required; Verification Checkpoint: A `google.maps.Map` object is instantiated).
    Ensure the map is configured with the mandatory usage attribution ID. The example below centers the map over London, UK, where transit data is available.

- [ ] **Step 2: Create the `TransitLayer` Instance** (Trigger Condition: Request to show transit lines; Verification Checkpoint: `google.maps.TransitLayer()` is called).

- [ ] **Step 3: Attach the Layer to the Map** (Trigger Condition: Layer object exists; Verification Checkpoint: `setMap()` is called with the map object).

#### Example: Adding a Transit Layer

This example demonstrates enabling the Transit layer on a map centered on London, UK (`lat: 51.501904, lng: -0.115871`).

**TypeScript**
```typescript
function initMap(): void {
  const map = new google.maps.Map(
    document.getElementById("map") as HTMLElement,
    {
      zoom: 13,
      center: { lat: 51.501904, lng: -0.115871 },
      internalUsageAttributionIds: ['gmp_git_agentskills_v1']
    }
  );

  const transitLayer = new google.maps.TransitLayer();

  // Attaches the layer to the map
  transitLayer.setMap(map);
}

declare global {
  interface Window {
    initMap: () => void;
  }
}
window.initMap = initMap;
```

**JavaScript**
```javascript
function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: { lat: 51.501904, lng: -0.115871 },
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  });
  const transitLayer = new google.maps.TransitLayer();

  // Attaches the layer to the map
  transitLayer.setMap(map);
}

window.initMap = initMap;
```

### Gotchas

*   **Mandatory Side Effect**: Enabling the `TransitLayer` will automatically alter the style of the base map to better emphasize the transit routes, de-emphasizing other map features.
*   **Geographic Coverage**: The layer only displays data for cities and regions that support transit information. If the map is centered on an unsupported area, no transit data will be visible.
*   **Data Contribution**: Public agencies overseeing transportation can submit data via the Google Transit Partner Program.

### References

*   TransitLayer Reference (shared section): `https://developers.google.com/maps/documentation/javascript/reference#TrafficLayer`
*   Google Transit Partner Program: `https://maps.google.com/help/maps/mapcontent/transit/`
*   Maps Coverage: `https://developers.google.com/maps/coverage`
*   Using TypeScript with Google Maps: `https://developers.google.com/maps/documentation/javascript/using-typescript`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.