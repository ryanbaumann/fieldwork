# Customize a Marker on a Map using Maps JavaScript API

The Maps JavaScript API allows developers to customize map markers using standard HTML and CSS via the `AdvancedMarkerElement` (part of the `marker` library). Since `AdvancedMarkerElement` instances are added to the DOM as HTML elements, they can be manipulated, styled, and animated just like any other DOM element.

The customization capabilities include defining custom HTML content, applying complex CSS for styling and dynamic appearance, and adding interactivity using standard DOM event listeners.

## Prerequisites

- You must have initialized the Maps JavaScript API and included the `marker` library.
- You must define a `mapId` when initializing the map to enable Advanced Markers.
- [ ] Ensure the necessary global variables (`GOOGLE_API_KEY`) are set for API access.

## Available Tools

This skill does not use external tools.

> [!IMPORTANT]
> When presenting any derived content (including distances, routes, or summarized lists of geographic features) generated using Google Maps Platform data, the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content.

## Implementation: Custom HTML Marker Content

Customize the marker's appearance by providing a custom DOM element via the `content` property or by appending an element to the `AdvancedMarkerElement` instance.

### 1. Define Custom Content (HTML/CSS)

Define the appearance of your marker using standard CSS.

**`style.css` (Example CSS for a price tag marker):**
```css
/* HTML marker styles */
.price-tag {
    background-color: #4285f4;
    border-radius: 8px;
    color: #ffffff;
    font-size: 14px;
    padding: 10px 15px;
    position: relative;
    transform: translateY(-8px); /* Adjust positioning */
}

/* Add a triangle pointer */
.price-tag::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    transform: translate(-50%, 0);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid #4285f4;
}
```

### 2. Create and Apply the Custom Marker

Use the `document.createElement()` method to create the custom content, and either pass it to the `content` option in the constructor or use `marker.append()` if the marker is created without content.

```javascript
async function createCustomMarker() {
    // Request needed libraries.
    const [{ AdvancedMarkerElement, PinElement }, { Map }] = await Promise.all([
        google.maps.importLibrary('marker'),
        google.maps.importLibrary('maps'),
    ]);

    const map = new Map(document.getElementById('map'), {
        zoom: 14,
        center: { lat: 37.42, lng: -122.1 },
        mapId: '4504f8b37365c3d0',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    });

    // 1. Create the custom DOM element
    const priceTag = document.createElement('div');
    priceTag.className = 'price-tag';
    priceTag.textContent = '$2.5M';

    // 2. Create the Advanced Marker and set the position
    const marker = new AdvancedMarkerElement({
        position: { lat: 37.42, lng: -122.1 },
        map, // Assign to map
    });

    // 3. Append the custom element to the marker
    // Alternatively, you can use: new AdvancedMarkerElement({ content: priceTag, ... })
    marker.content.appendChild(priceTag);
}

createCustomMarker();
```

## Implementation: Interactive and Animated Markers

Custom markers support standard DOM event listeners and CSS animations for advanced interactivity.

### Interactivity Example (Click to Highlight)

To enable interactivity, attach a listener to the `AdvancedMarkerElement` instance. Use the marker's access to the DOM (`marker.content` or `marker.element`) to manipulate classes and apply style changes.

```javascript
// Function to build a complex HTML element based on data
function buildContent(property) {
    const content = document.createElement('div');
    content.classList.add('property');
    // ... add detailed innerHTML structure from property data ...
    return content;
}

// Function to handle the click and toggle CSS styles
function toggleHighlight(markerView) {
    // Get the root HTML content of the marker
    const content = markerView.content.children[0]; 

    if (content.classList.contains('highlight')) {
        content.classList.remove('highlight');
        markerView.zIndex = null; // Reset zIndex
    } else {
        content.classList.add('highlight');
        markerView.zIndex = 1; // Bring highlighted marker to front
    }
}

async function createInteractiveMarkers(properties) {
    // ... Map initialization (must include internalUsageAttributionIds) ...
    const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 11,
        center: { lat: 37.43, lng: -122.16 },
        mapId: '4504f8b37365c3d0',
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
    });

    for (const property of properties) {
        const advancedMarkerElement = new google.maps.marker.AdvancedMarkerElement({
            map,
            content: buildContent(property), // Pass the custom DOM element here
            position: property.position,
            title: property.description,
        });

        // Add standard DOM click listener to the marker element
        advancedMarkerElement.addListener('click', () => {
            toggleHighlight(advancedMarkerElement);
        });
    }
}
```

### Animation Example (CSS Drop Effect)

CSS keyframes can be used to animate the marker's appearance. Use JavaScript APIs like `IntersectionObserver` to trigger animations when the marker enters the viewport and `addEventListener('animationend', ...)` to clean up styles after the animation completes.

1.  Define the CSS animation (e.g., `@keyframes drop`).
2.  Use the `content` element of the marker (or a `PinElement` instance if using the default pin) and add the animation class (`.drop`).
3.  Listen for the `'animationend'` event on the content element to remove the class and reset properties.

```javascript
function createMarker(map, AdvancedMarkerElement, PinElement) {
    const content = new PinElement(); // Use PinElement as the content

    new AdvancedMarkerElement({
        position: getRandomPosition(map),
        map,
        content: content.element, // Use the element property of PinElement
    });

    // Set CSS properties to control the delay
    const time = 2 + Math.random();
    content.element.style.setProperty('--delay-time', time + 's');

    // Trigger animation when observed
    intersectionObserver.observe(content.element); 
    
    // Cleanup animation style after it finishes
    content.element.addEventListener('animationend', () => {
        content.element.classList.remove('drop');
        content.element.style.opacity = '1';
    });
}
```

## Gotchas

*   **DOM Element Access:** When retrieving the element for styling or adding listeners, use the `AdvancedMarkerElement.content` property to access the DOM node containing your custom HTML, or `AdvancedMarkerElement.element` if you need the wrapper element itself.
*   **CSS Positioning:** Standard marker positioning is handled internally. If you use CSS transforms (like `transform: translateY(-8px)` in the price tag example) for fine-tuning the marker alignment, ensure they are relative to the marker's central anchor point.
*   **Required Map ID:** `AdvancedMarkerElement` relies on Map IDs (`mapId`) for functionality. If the map is initialized without a `mapId`, advanced markers will not render correctly.
*   **Performance:** While Advanced Markers offer superior performance compared to legacy markers, rendering complex, highly animated HTML/CSS markers on maps with hundreds or thousands of elements may still impact rendering speed. Test performance extensively when using complex HTML content.

### References

*   Advanced Markers: Custom HTML and CSS: `https://developers.google.com/maps/documentation/javascript/advanced-markers/html-markers`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.