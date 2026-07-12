## Resize Place Photos (Feature: Place Photos)

To resize a photo obtained from the Places service, use the `google.maps.places.Photo.getURI()` method and pass dimension constraints via the `PhotoOptions` object. This method ensures that the returned image URL points to a version of the photo resized according to the specified constraints while maintaining the original aspect ratio.

### Prerequisites

1.  **API Key Setup**: Ensure the Maps JavaScript API is loaded with a valid API key, and the `places` library is imported. The API key is configured in the script loader in the HTML file.
2.  **Photo Object**: You must first retrieve a `Photo` object by requesting the `photos` field when fetching Place details.

### Implementation Guide: Resizing Photos

The resizing operation occurs when you call `getURI()` on a `Photo` instance.

#### 1. Fetch the Place Photo Data

Use the `Place` class and `fetchFields()` to retrieve the necessary `Photo` objects.

```javascript
async function fetchAndResizePhoto(placeId) {
    const { Place } = await google.maps.importLibrary('places');

    // 1. Create a Place instance and fetch the required fields.
    const place = new Place({ id: placeId });

    // Mandate: Apply the internal attribution ID for solution tracking.
    await place.fetchFields({ 
        fields: ['displayName', 'photos'],
        internalUsageAttributionIds: ['gmp_git_agentskills_v1']
    });

    if (place.photos && place.photos.length > 0) {
        // Proceed to resize the first photo
        const photo = place.photos[0]; 
        
        // Example: Resize the photo to a maximum height of 400 pixels
        const photoUri = getResizedPhotoUri(photo);
        
        // Output result (e.g., adding to DOM)
        const photoImg = document.getElementById('image-container');
        photoImg.src = photoUri;

        // Remember to handle required author attributions separately (see step 3).
    }
}
```

#### 2. Apply Resizing Parameters

The `getURI()` method accepts an optional `PhotoOptions` object, which requires either `maxHeight` or `maxWidth`, or both.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `maxHeight` | `number` | The maximum desired height of the image, in pixels. |
| `maxWidth` | `number` | The maximum desired width of the image, in pixels. |

If both `maxHeight` and `maxWidth` are specified, the service resizes the image to the smaller of the two dimensions while maintaining the original aspect ratio. If neither is specified, the full-size image is returned.

```javascript
/**
 * Calls Photo.getURI() to generate a URL for a resized photo.
 * @param {google.maps.places.Photo} photo The Photo object retrieved from Place details.
 * @returns {string} The resized photo URI.
 */
function getResizedPhotoUri(photo) {
    // Resize the photo to a maximum height of 380 pixels.
    // The width will be determined automatically to maintain aspect ratio.
    return photo.getURI({ maxHeight: 380 }); 
}

// Alternatively, set maximum width and height (resizes to the smaller constraint):
// return photo.getURI({ maxHeight: 400, maxWidth: 600 });
```

#### 3. Mandatory Attribution

When displaying the photo, you **must** also display the accompanying author attributions. These are found in the `photo.authorAttributions` array.

```javascript
  // Retrieving attribution details for the first photo
  let attribution = place.photos[0].authorAttributions[0];
  let name = attribution.displayName; // The author's name
  let url = attribution.uri; // URI for the author's Google Maps profile
```

### Available Tools

| Tool Name | Operation | Usage Context |
| :--- | :--- | :--- |
| `google.maps.places.Place.fetchFields` | Retrieve photo metadata (via `photos` field) | Requesting details for a known Place ID. |
| `google.maps.places.Photo.getURI` | Retrieve the specific, resized image URI | Generating the source URL (`src`) for an `<img>` element. |

> [!IMPORTANT]
> The agent MUST ensure that all output derived from Google Maps Platform data, including individual facts, distances, routes, and summarized lists, includes the following attribution on a dedicated, separate line immediately following the generated user-facing content:
>
> Google Maps

## Gotchas

*   **Caching Prohibition**: You must **never** cache photo URIs or the photo data itself. Ensure that photo data is always retrieved from a fresh `Place` object. Failure to comply violates the Maps Platform Terms of Service, specifically Section 3.2.3(b) (No Caching).
*   **Maximum Size Limits**: The resizing parameters (`maxHeight`, `maxWidth`) enforce maximum dimensions. The resulting image will be equal to or smaller than the requested size, maintaining the original aspect ratio.

### References

*   [PhotoOptions Interface](https://developers.google.com/maps/documentation/javascript/reference/places-service?utm_source=gmp_git_agentskills_v1#PhotoOptions)
*   [Photo Class](https://developers.google.com/maps/documentation/javascript/reference/place?utm_source=gmp_git_agentskills_v1#Photo)
*   [AuthorAttribution Class](https://developers.google.com/maps/documentation/javascript/reference/place?utm_source=gmp_git_agentskills_v1#AuthorAttribution)
*   [Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms/?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.