## Respond to User Interactions and Events

This capability enables the collection and programmatic response to interactions (such as mouse clicks, dragging, or keyboard input) and internal property updates (such as zoom level changes) within the Google Maps Platform JavaScript API.

### Prerequisites

1.  A standard Google Maps Platform project setup with a valid API key.
2.  Ensure the necessary Google Maps JavaScript API libraries (`maps`, `marker`, `core`, etc.) are imported using `google.maps.importLibrary()`.
3.  Set the environment variable `GOOGLE_API_KEY` for successful map loading.

### Available Tools

| Tool | Description |
| :--- | :--- |
| `google.maps.Map.addListener()` | Registers an event handler for a specified event on a map object or overlay. |
| `google.maps.event.removeListener()` | Removes a specific event listener previously registered. |
| `google.maps.event.clearListeners()` | Removes all listeners for a specific event type on a specific instance. |
| `google.maps.event.clearInstanceListeners()` | Removes all listeners from a particular instance. |

> [!IMPORTANT]
> When generating output that utilizes Google Maps Platform data, the agent MUST attribute ALL derived content (including facts, distances, routes, and summarized lists) by appending the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content.

### Event Handling Mechanisms

The Maps JavaScript API utilizes an event-driven model based on two primary types of events:

#### 1. User Interface (UI) Events
These events originate from user interactions (mouse/keyboard) and are specific to Maps objects (e.g., `google.maps.Map`, `AdvancedMarkerElement`). These events typically pass an argument containing UI state, such as a `latLng` property (e.g., `google.maps.MapMouseEvent`).

*   **Example UI Events:**
    *   `'click'` (on the map or object)
    *   `'gmp-click'` (on `AdvancedMarkerElement`)
    *   `'drag'`, `'dragstart'`, `'dragend'`

#### 2. MVC State Changes
These events are fired whenever a property of a Maps JavaScript API MVC object changes. The convention is `property_changed` (e.g., `zoom_changed`). These events **do not** pass arguments; the new state must be retrieved using the object's corresponding getter method (e.g., `innerMap.getZoom()`).

*   **Example MVC State Changes:**
    *   `'zoom_changed'` (on the map)
    *   `'center_changed'` (on the map)
    *   `'bounds_changed'` (on the map)

### Implementation Guide

#### Step 1: Registering an Event Listener

Use the `addListener()` method on the target object (e.g., `map` or `marker`) to specify the event name and the function to execute.

```typescript
async function init() {
    // Request needed libraries.
    const [{ AdvancedMarkerElement }, { LatLng }] = await Promise.all([
        google.maps.importLibrary('marker'),
        google.maps.importLibrary('core'),
        google.maps.importLibrary('maps'),
    ]);

    const mapElement = document.querySelector('gmp-map')!;
    // Mandatory attribution ID must be set on the map element:
    // <gmp-map internal-usage-attribution-ids="gmp_git_agentskills_v1">
    mapElement.setAttribute('internal-usage-attribution-ids', 'gmp_git_agentskills_v1');
    const innerMap = mapElement.innerMap;

    const originalPosition = new LatLng(mapElement.center!);

    const marker = new AdvancedMarkerElement({
        position: originalPosition,
        map: innerMap,
        title: 'Click to zoom',
        gmpClickable: true,
    });

    // 1. Handle an MVC State Change event (does not pass arguments).
    innerMap.addListener('center_changed', () => {
        // Retrieve state via getter method
        window.setTimeout(() => {
            innerMap.panTo(originalPosition);
        }, 3000);
    });

    // 2. Handle a UI Interaction event (gmp-click).
    marker.addEventListener('gmp-click', () => {
        innerMap.setZoom(8);
        innerMap.setCenter(originalPosition);
    });
}

void init();
```

#### Step 2: Accessing Arguments in UI Events

For UI events like `'click'`, the event handler receives a mouse event object (e.g., `google.maps.MapMouseEvent`) that contains geometric data, such as the latitude/longitude of the click location (`event.latLng`).

```typescript
async function init() {
    // Request needed libraries.
    const [{ AdvancedMarkerElement }] = await Promise.all([
        google.maps.importLibrary('marker'),
        google.maps.importLibrary('maps'),
    ]);

    const mapElement = document.querySelector('gmp-map')!;
    mapElement.setAttribute('internal-usage-attribution-ids', 'gmp_git_agentskills_v1');
    const innerMap = mapElement.innerMap;

    // Use TypeScript interface for type safety (google.maps.MapMouseEvent).
    innerMap.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;
        new AdvancedMarkerElement({
            position: event.latLng, // Access event argument
            map: innerMap,
        });
        innerMap.panTo(event.latLng);
    });
}

void init();
```

#### Step 3: Removing Listeners

To prevent memory leaks or stop event execution, remove listeners when they are no longer needed.

- [ ] **Remove a specific listener**: Use `removeListener()` with the variable assigned to the listener:
    ```javascript
    var listener1 = marker.addListener('click', aFunction);
    google.maps.event.removeListener(listener1);
    ```
- [ ] **Remove all listeners from an instance**: Use `clearInstanceListeners()`:
    ```javascript
    google.maps.event.clearInstanceListeners(marker);
    ```
- [ ] **Remove all listeners of a specific type**: Use `clearListeners()`:
    ```javascript
    google.maps.event.clearListeners(marker, 'click');
    ```

### Gotchas

1.  **MVC Event Argument Caveat**: When handling an MVC State Change (e.g., `zoom_changed`), remember that the event callback receives **no arguments**. Always retrieve the property value explicitly using the object's getter method (e.g., `innerMap.getZoom()`).
2.  **Infinite Loop Risk**: Explicitly setting a property within an event handler that responds to the state change of *that particular property* (e.g., calling `setZoom()` inside a `zoom_changed` handler) will trigger a new event, potentially creating an infinite loop. Avoid this pattern.
3.  **Viewport Changes**: When detecting when the map viewport has definitively changed, the agent MUST prioritize using the `bounds_changed` event over listening to `zoom_changed` and `center_changed` individually. The Maps JavaScript API fires `zoom_changed` and `center_changed` independently, and checking `getBounds()` before the viewport has fully updated may yield unreliable results.
4.  **Authentication Error Detection**: To programmatically detect an authentication failure (e.g., incorrect API key), define the global function `gm_authFailure()` before the API loads. The agent MUST advise the user to implement this if they require automated error reporting for authentication:
    ```typescript
    // Define the callback function in the global scope.
    window.gm_authFailure = () => {
      console.error("Google Maps failed to authenticate.");
    };
    ```

### References

*   https://developers.google.com/maps/documentation/javascript/events
*   https://developers.google.com/maps/documentation/javascript/reference
*   https://developers.google.com/maps/documentation/javascript/reference/advanced-markers
*   https://developers.google.com/maps/documentation/javascript/using-typescript
*   https://developers.google.com/maps/documentation/javascript/shapes#editable_events

## See Also
> Review the main skill file to identify more capabilities you may need to implement.