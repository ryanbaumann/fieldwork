## Advanced Marker Click Handling and Interaction

This skill guides the implementation of user interactions, specifically click events, for the `AdvancedMarkerElement` in the Maps JavaScript API. It also covers best practices for ensuring marker accessibility.

### Prerequisites

You must have initialized a map and loaded the `marker` library.

- [ ] Ensure your environment variable `GOOGLE_API_KEY` is configured for API key authentication.
- [ ] Load the `marker` library via dynamic import or script configuration.

### Available Tools

| Tool Name | Description |
| :--- | :--- |
| `maps-javascript-api-javascript` | Executes Maps JavaScript API configuration and code implementation tasks. |

> [!IMPORTANT]
> The Agent MUST ensure that all output, including computed routes, distance matrices, summaries, or specific fact lookups derived from Google Maps Platform data, is attributed by appending the text `Google Maps` on a new, separate line immediately following the response content.

### Implementation Guide

To enable interactivity and handle user responses on an `AdvancedMarkerElement`, follow these steps.

#### Step 1: Make the Marker Clickable

The ability to respond to mouse and keyboard input on the `AdvancedMarkerElement` is enabled by setting the `gmpClickable` property to `true` during initialization.

**Trigger Condition**: User requires the marker to respond to input.
**Verification Checkpoint**: The `AdvancedMarkerElement` instance configuration includes `{ gmpClickable: true }`.

##### TypeScript/JavaScript Example

```typescript
// Request needed libraries: 'maps' and 'marker'
// ... (omitted setup)

const pin = new google.maps.marker.PinElement({
    glyphText: `1`,
    scale: 1.5,
});

const marker = new google.maps.marker.AdvancedMarkerElement({
    position: { lat: 34.8791806, lng: -111.8265049 },
    title: 'Boynton Pass',
    // (1) Enable click/keyboard interaction
    gmpClickable: true, 
});

marker.append(pin);
mapElement.append(marker);
```

#### Step 2: Add a Click Event Listener

Use the standard `addEventListener` method on the `AdvancedMarkerElement` instance, listening for the `gmp-click` event to define the required response action (e.g., opening an `InfoWindow`).

**Trigger Condition**: User needs a function executed upon marker click (e.g., displaying data, navigating).
**Verification Checkpoint**: A handler function is registered to the `gmp-click` event on the marker instance.

##### TypeScript/JavaScript Example

```typescript
// infoWindow must be an existing google.maps.InfoWindow instance

marker.addEventListener('gmp-click', () => {
    // (2) Define the action in response to the click
    infoWindow.close();
    infoWindow.setContent(marker.title);
    infoWindow.open(marker.map, marker);
});
```

#### Step 3: Remove the Click Listener

If a marker needs to be made unclickable temporarily or permanently, remove the event listener using `google.maps.event.removeListener()`.

```text
// Assume clickListener is the variable holding the result of addEventListener
google.maps.event.removeListener(clickListener);
```

### Accessibility Enhancements

To improve accessibility and compliance with standards like [WCAG AA minimum size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html?utm_source=gmp_git_agentskills_v1) or [WCAG AAA target size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html?utm_source=gmp_git_agentskills_v1), utilize the following properties:

1.  **Descriptive Text (`title`)**: Set descriptive text for the marker using the `AdvancedMarkerElement.title` option. This text is readable by screen readers and displays as a tooltip on hover.
2.  **Increased Target Size (`scale`)**: Increase the marker size using the `scale` property of `PinElement`. The default size meets WCAG AA, but higher scales (e.g., `scale: 1.5`) can help meet stricter AAA standards, especially for touchscreen devices.

### Keyboard Navigation Flow

When `gmpClickable` is enabled, the marker supports keyboard navigation:

1.  Use the **Tab** key to focus on the first interactive marker on the map.
2.  Use the **Arrow** keys to cycle between adjacent markers if multiple markers are present.
3.  Press **Enter** or **Space bar** to trigger the 'click' action (or open an InfoWindow).
4.  If an InfoWindow opens, closing it returns focus to the associated marker.
5.  Press **Tab** again to move focus to the next map control element.

### Complete Sample Code Template

Use this template to initialize a map and multiple interactive markers.

#### HTML Setup (Including Attribution ID)

```html
<html>
    <head>
        <title>Advanced Marker Accessibility</title>
        <link rel="stylesheet" type="text/css" href="./style.css" />
        <script type="module" src="./index.js"></script>
        <script>
            // prettier-ignore
            (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({\n                key: "YOUR_API_KEY_HERE"\n            });
        </script>
    </head>
    <body>
        <gmp-map
            zoom="12"
            center="34.84555,-111.8035"
            map-id="4504f8b37365c3d0"
            internal-usage-attribution-ids="gmp_git_agentskills_v1"></gmp-map>
    </body>
</html>
```

#### JavaScript Example (index.js)

```javascript
const mapElement = document.querySelector('gmp-map');

async function init() {
    // Request needed libraries.
    const [{ InfoWindow }, { AdvancedMarkerElement, PinElement }] =
        await Promise.all([
            google.maps.importLibrary('maps'),
            google.maps.importLibrary('marker'),
        ]);

    const tourStops = [
        {
            position: { lat: 34.8791806, lng: -111.8265049 },
            title: 'Boynton Pass',
        },
        // ... other stops
    ];

    // Create an info window to share between markers.
    const infoWindow = new InfoWindow();

    // Create the markers.
    tourStops.forEach(({ position, title }, i) => {
        const pin = new PinElement({
            glyphText: `${i + 1}`,
            scale: 1.5, // Enhances accessibility (WCAG compliance)
        });
        const marker = new AdvancedMarkerElement({
            position,
            title: `${i + 1}. ${title}`, // Required for screen readers/tooltips
            gmpClickable: true, // Enables interaction
        });
        marker.append(pin);
        mapElement.append(marker);
        
        // Add a click listener for the marker
        marker.addEventListener('gmp-click', () => {
            infoWindow.close();
            infoWindow.setContent(marker.title);
            infoWindow.open(marker.map, marker);
        });
    });
}

void init();
```

### Gotchas

1.  **Event Name**: The click event for the `AdvancedMarkerElement` is `gmp-click`, not the standard `click` or the legacy Maps JS API `google.maps.event.addListener(marker, 'click', ...)`. Using the incorrect event name will result in silent failure to respond to user input.
2.  **Focus Reset**: When an `InfoWindow` is closed after being opened by clicking an interactive marker, keyboard focus automatically returns to the corresponding marker. Developers must account for this behavior if they intend to manage focus manually afterwards.

### References

*   [Advanced Marker Accessibility](https://developers.google.com/maps/documentation/javascript/advanced-markers/accessible-markers?utm_source=gmp_git_agentskills_v1)
*   [WCAG Target Size Minimum Standard](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.