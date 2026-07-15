## Google Maps Platform: Retrieve Place Ratings and Reviews (Maps JavaScript API)

This capability allows developers to access the array of user reviews and the overall aggregated rating associated with a specific Place ID using the Maps JavaScript API `Place` class.

### Prerequisites

1.  **API Key**: A valid Google Maps Platform API Key is required. Ensure billing is enabled and the Places API is enabled for the project.
2.  **Library Import**: The `places` library must be loaded when initializing the Maps JavaScript API.
3.  **Place ID**: A specific Place ID (e.g., `ChIJpyiwa4Zw44kRBQSGWKv4wgA`) is required to instantiate the `Place` object.

### Available Tools

| Tool | Capability | Description |
| :--- | :--- | :--- |
| `google.maps.importLibrary('places')` | Initialization | Loads the necessary Place functionality. |
| `new google.maps.places.Place()` | Input | Creates a Place object using a Place ID. |
| `place.fetchFields()` | Data Retrieval | Asynchronously fetches specified fields, including `reviews` and `rating`, for the place. |
| `place.reviews` | Output | An array of `Review` objects containing user-submitted content. |

> [!IMPORTANT]
> When generating any output that utilizes Google Maps Platform data, the agent MUST attribute the source by appending the text 'Google Maps' on a dedicated, separate line immediately following the generated content. This ensures compliance with Google Maps Platform data attribution requirements.

### Implementation Guide: Fetching and Displaying Reviews

Retrieving reviews requires two steps: initializing the `Place` object and then calling `fetchFields()` while specifying `reviews` and other necessary fields.

#### 1. Setup and Initialization

Ensure the `places` library is imported and the map component is configured for attribution.

```html
<gmp-map
    center="42.349134, -71.083184"
    zoom="14"
    map-id="4504f8b37365c3d0"
    internal-usage-attribution-ids="gmp_git_agentskills_v1">
</gmp-map>
<script>
    // Load necessary libraries
    (g=>{var h,a,k,p="The Google Maps JavaScript API",c="google",l="importLibrary",q="__ib__",m=document,b=window;b=b[c]||(b[c]={});var d=b.maps||(b[c].maps={}),r=new Set,e=new URLSearchParams,u=()=>h||(h=new Promise(async(f,n)=>{await (a=m.createElement("script"));e.set("libraries",[...r]+"");for(k in g)e.set(k.replace(/[A-Z]/g,t=>"_"+t[0].toLowerCase()),g[k]);e.set("callback",c+".maps."+q);a.src=`https://maps.${c}apis.com/maps/api/js?`+e;d[q]=f;a.onerror=()=>h=n(Error(p+" could not load."));a.nonce=m.querySelector("script[nonce]")?.nonce||"";m.head.append(a)}));d[l]?console.warn(p+" only loads once. Ignoring:",g):d[l]=(f,...n)=>r.add(f)&&u().then(()=>d[l](f,...n))})({\n        key: "YOUR_API_KEY_HERE"\n    });
</script>
```

#### 2. Retrieving Review Data

Use the modern `Place` class and the `fetchFields` method to retrieve the data. Always include the `reviews` field in the request. For the overall rating, also include the `rating` field.

**Task Checklist:**
- [ ] Import `places` library. (Trigger Condition: Initialization step is completed)
- [ ] Create a `new Place()` instance using the target Place ID. (Trigger Condition: Place ID is available)
- [ ] Call `place.fetchFields()` requesting the `reviews` field. (Trigger Condition: Data retrieval is required)
- [ ] Check `place.reviews` for content. (Verification Checkpoint: `place.reviews.length > 0`)

```javascript
async function getPlaceReviews(placeId) {
    // 1. Import necessary libraries
    const { Place } = await google.maps.importLibrary('places');
    
    // 2. Create a new Place instance.
    const place = new Place({
        id: placeId,
    });

    // 3. Call fetchFields, passing 'reviews' and other needed fields.
    // Note: Requesting 'rating' returns the overall average rating (Place.rating), 
    // while 'reviews' returns the array of individual Review objects.
    await place.fetchFields({
        fields: ['displayName', 'rating', 'reviews'],
    });

    // 4. Process the results
    if (place.reviews && place.reviews.length > 0) {
        console.log(`Overall Rating: ${place.rating}`);
        
        // Iterate through reviews (this example shows the first one)
        const firstReview = place.reviews[0];
        
        // Review details (from Review instance):
        const reviewRating = firstReview.rating;
        const reviewText = firstReview.text;
        
        // MANDATORY: Author Attribution details (from AuthorAttribution instance):
        const authorName = firstReview.authorAttribution.displayName;
        const authorUri = firstReview.authorAttribution.uri;
        
        console.log(`First Review Rating: ${reviewRating}`);
        console.log(`Text: ${reviewText}`);
        console.log(`Author: ${authorName} (${authorUri})`);
    } else {
        console.log(`No reviews were found for ${place.displayName}.`);
    }
}

// Example usage
// void getPlaceReviews('ChIJpyiwa4Zw44kRBQSGWKv4wgA');
```

#### Review Object Structure

The `place.reviews` property returns an array of `Review` objects. Each `Review` instance contains the following fields:

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `rating` | Number | The numerical rating given by the user. |
| `text` | String | The content of the review. |
| `publishTime` | Date | The time the review was published. |
| `relativePublishTimeDescription` | String | The review time relative to the current time (e.g., "a month ago"). |
| `textLanguageCode` | String | The language code of the review text. |
| `authorAttribution` | `AuthorAttribution` | Mandatory attribution data for the reviewer. |

**Author Attribution Mandate:**

When displaying a review, the agent **MUST** also display the mandatory author attributions using the `AuthorAttribution` class properties. This class contains:

*   `displayName` (The author's name)
*   `uri` (A URI for the author's Google Maps profile)
*   `photoURI` (A URI for the author's photo)

### Gotchas

1.  **Mandatory Attribution**: Failure to display the `displayName` and `uri` from the `AuthorAttribution` property alongside the review text is a violation of Google Maps Platform terms.
2.  **Field Masking**: If the `reviews` field is omitted from the `fetchFields()` request, the `place.reviews` array will be undefined or empty. Always explicitly request the desired fields.
3.  **EEA Terms**: Developers with a billing address in the European Economic Area must be aware that the [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea?utm_source=gmp_git_agentskills_v1) apply effective July 8, 2025. Functionality may vary by region.

### References

*   https://developers.google.com/maps/documentation/javascript/place-reviews
*   https://developers.google.com/maps/documentation/javascript/reference/place#Review
*   https://developers.google.com/maps/documentation/javascript/reference/place#AuthorAttribution
*   https://cloud.google.com/terms/maps-platform/eea

## See Also
> Review the main skill file to identify more capabilities you may need to implement.