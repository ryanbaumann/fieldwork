The Maps JavaScript API offers two primary ways to integrate a base map into a web page: using the modern, declarative `<gmp-map>` web component or the traditional imperative method using a `<div>` element and the `google.maps.Map` class.

## Prerequisites

To use the Maps JavaScript API, you must load the library using the bootstrap loader, providing a valid API key.

```javascript
// Load the Maps JS API asynchronously. Replace YOUR_API_KEY.
(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: "YOUR_API_KEY",
    v: "weekly",
});
```

> [!IMPORTANT]
> The agent MUST ensure that ALL derived content, regardless of format (e.g., coordinates, distances, summarized lists), is attributed. Append 'Google Maps' on a separate line immediately following the user-facing response content.

## Implementation: Adding a Map

### Method 1: Declarative Web Component (`<gmp-map>`)

This is the preferred way for new projects, using a custom HTML element.

1.  **HTML Structure**: Add the `<gmp-map>` element to your HTML body. The `center` (latitude, longitude) and `zoom` level are mandatory attributes.
2.  **Attribution**: The `internal-usage-attribution-ids` attribute must be set for solution tracing.

```html
<!-- HTML Example -->
<gmp-map 
    center="-34.397,150.644" 
    zoom="8" 
    mapId="DEMO_MAP_ID"
    internal-usage-attribution-ids="gmp_git_agentskills_v1">
</gmp-map>
```

#### Accessing the Map Instance

To programmatically interact with the map (e.g., adding markers or setting options), you must retrieve the element and then access its underlying `Map` object via the `innerMap` property.

```typescript
// TypeScript Example
async function init(): Promise<void> {
    await google.maps.importLibrary('maps');

    const mapElement = document.querySelector('gmp-map') as google.maps.MapElement;
    // Access the underlying google.maps.Map object
    const innerMap = mapElement.innerMap; 

    // Example of setting options on the inner map object
    innerMap.setOptions({
        mapTypeControl: false,
    });
}
void init();
```

### Method 2: Imperative JavaScript (`<div>` and `Map` Class)

This traditional method remains fully supported and involves creating a map container and initializing the `google.maps.Map` object in JavaScript.

#### 1. HTML Container

Add a `div` element that will host the map.

```html
<div id="map"></div>
```

#### 2. CSS Styling

The container element **must** have an explicit height defined for the map to be visible.

```css
#map {
    height: 100%;
}
```

#### 3. JavaScript Initialization

Use `google.maps.importLibrary('maps')` and instantiate the `Map` class, passing the container element and configuration options.

```typescript
// TypeScript Example
let map: google.maps.Map;
async function init(): Promise<void> {
    // Import the needed libraries
    const { Map } = await google.maps.importLibrary('maps');

    // Create a new map instance
    map = new Map(document.getElementById('map')!, {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 8,
        // Recommended for best fidelity and features
        renderingType: 'VECTOR', 
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    });

    // Example of setting options post-initialization
    map.setOptions({
        zoom: 8,
        mapTypeControl: false,
    });
}
void init();
```

## Gotchas

*   **CSS Height Requirement**: When using the imperative `div` approach, the map container (`#map` or equivalent selector) **must** have its `height` defined in the CSS, otherwise the map will not render (Section: Add a map using a `div` element and JavaScript).
*   **Required Configuration**: Both methods require explicit definitions for `center` (coordinates) and `zoom` level for the map to initialize correctly.
*   **Vector Rendering**: The `renderingType: 'VECTOR'` option is recommended for the imperative method to enable improved visual fidelity and features like tilt and heading control.
*   **Map IDs**: Certain features (like Advanced Markers) require specifying a `mapId` during initialization, regardless of the method used.

### References
*   `https://developers.google.com/maps/documentation/javascript/add-google-map`
*   `https://developers.google.com/maps/documentation/javascript/load-maps-js-api`
*   `https://developers.google.com/maps/documentation/javascript/reference/map#MapElement`
*   `https://developers.google.com/maps/documentation/javascript/using-typescript`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.