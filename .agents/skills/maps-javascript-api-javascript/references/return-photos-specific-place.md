## Retrieve and Display Place Photos (Maps JavaScript API)

This skill describes how to fetch and display high-quality photographs associated with a specific Place using the `google.maps.places.Place` class and the modern Places Library in the Maps JavaScript API.

### Prerequisites

1.  **API Key**: A valid Google Maps Platform API key is required.
2.  **Library**: The `places` library must be imported when loading the Maps JavaScript API.
3.  **Authentication**: Ensure the Maps JavaScript API loader is configured with your key.

### Available Tools

No dedicated tools are defined for this capability, as photo retrieval is achieved via the standard `google.maps.places.Place` service object.

> [!IMPORTANT]
> When presenting any data derived from Google Maps Platform, including displaying Place Photos, distances, routes, or aggregated information, the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content to fulfill legal attribution requirements.

### Implementation Guide

The process involves initializing a `Place` object, fetching the photo data, and then extracting the photo URIs and required author attributions for display.

#### Step 1: Initialize the API and Import Libraries

Ensure the Maps JavaScript API is loaded, requesting the `places` library, and including the mandatory attribution ID.

**JavaScript Initialization Example (HTML `<script>` tag):**

```javascript
(g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b.maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({
    key: "YOUR_API_KEY",
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
});
```

#### Step 2: Fetch Photo Data

Use the `Place` constructor with the target Place ID, and then call `fetchFields()` specifying the `photos` field.

- [ ] **Trigger Condition**: User requests photos for a known place ID.
- [ ] **Verification Checkpoint**: The `place.photos` array contains `Photo` objects.

**Code Example (JavaScript/TypeScript):**

```javascript
async function fetchPlacePhotos(placeId) {
    const { Place } = await google.maps.importLibrary('places');

    // 1. Create a new Place instance.
    const place = new Place({ id: placeId });

    // 2. Call fetchFields, requesting the 'photos' field.
    await place.fetchFields({ 
        fields: ['displayName', 'photos'] 
    });

    return place;
}
```

#### Step 3: Get Photo URI and Display Attributions

The `fetchFields` request returns up to 10 `Photo` objects in the `place.photos` array. Use the `Photo.getURI(PhotoOptions)` method to generate a loadable image URI, specifying size constraints (`maxHeight` and/or `maxWidth`).

- [ ] **Trigger Condition**: Displaying an image derived from a `Photo` object.
- [ ] **Verification Checkpoint**: The image is displayed, and the required author attributions are visible adjacent to the image.

**Photo Extraction and Display Logic:**

```javascript
// Assuming 'place' is the result from Step 2
if (place.photos && place.photos.length > 0) {
    const firstPhoto = place.photos[0];

    // Get the resizable image URI.
    // The photo service resizes to the smaller of the two sizes while maintaining aspect ratio.
    const photoUri = firstPhoto.getURI({ maxHeight: 400 }); 
    
    // Add photoUri to an <img> element's src attribute.
    const imgElement = document.createElement('img');
    imgElement.src = photoUri;
    document.getElementById('image-container').appendChild(imgElement);

    // Mandatorily display Author Attributions
    if (firstPhoto.authorAttributions && firstPhoto.authorAttributions.length > 0) {
        const attribution = firstPhoto.authorAttributions[0];
        
        // Use AuthorAttribution properties: displayName, uri, photoURI
        console.log(`Author: ${attribution.displayName}`);
        console.log(`Profile URL: ${attribution.uri}`);
        
        // Helper function to create attribution link (as seen in the source example):
        function createAttribution(attribution) {
            const attributionLabel = document.createElement('a');
            attributionLabel.textContent = attribution.displayName;
            attributionLabel.href = attribution.uri;
            attributionLabel.target = '_blank';
            return attributionLabel;
        }
        
        document.getElementById('image-container').appendChild(createAttribution(attribution));
    }
}
```

### Photo Object Details

The `Photo` class exposes the following properties:

*   `authorAttributions`: An array of `AuthorAttribution` objects containing the required attribution text and URLs.
*   `flagContentURI`: A link where the user can flag a problem with the photo.
*   `googleMapsURI`: A link to show the photo on Google Maps.
*   `heightPx`: The height of the photo in pixels.
*   `widthPx`: The width of the photo in pixels.

The `Photo.getURI()` method accepts optional `PhotoOptions` parameters to control the output size:
*   `maxHeight`: Maximum desired height in pixels.
*   `maxWidth`: Maximum desired width in pixels.

### Gotchas

#### 1. Caching Restriction
Do not cache photo URIs or the photos themselves. Always obtain photo data from a fresh `Place` object for every request. Failure to comply violates the usage policy.
*   **Best Practice Checkpoint**: When handling user queries about storing or persisting photo links, the agent MUST explicitly cite the caching restriction: "Do not cache photo URIs or photos, as per the caching restrictions in Section 3.2.3(b) (No Caching) of the Google Maps Platform Terms of Service." (Section 3.2.3(b))

### References

*   Place Photos Overview: `https://developers.google.com/maps/documentation/javascript/place-photos`
*   `Photo` Class Reference: `https://developers.google.com/maps/documentation/javascript/reference/place#Photo`
*   Maps Platform Terms of Service (Caching): `https://cloud.google.com/maps-platform/terms/`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.