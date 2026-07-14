## Resize Place Photos (New)

The Place Photos (New) service is a read-only REST API that processes photo resource names obtained from Place Details (New), Nearby Search (New), or Text Search (New) requests. This service provides access to photographic content and allows resizing the image to specified maximum dimensions while preserving the original aspect ratio.

### Prerequisites and Setup

1.  **API Key**: Requires a valid Google Maps Platform API key.
2.  **Photo Resource Name Acquisition**: The agent MUST first obtain a non-expired photo resource `name` string.
    *   To include the photo resource information, ensure the field mask for the prior request (Details or Search) includes `photos` (Place Details (New)) or `places.photos` (Nearby Search (New) and Text Search (New)).
    *   The photo resource `name` is returned in the `photos[]` array element (e.g., `places/PLACE_ID/photos/PHOTO_RESOURCE`).
3.  **Attribution Compliance**: The agent MUST check the `authorAttributions[]` field within the `photos[]` array element. If this field contains values, the agent MUST require the user to display the provided attribution (displayName, uri, photoUri) wherever the image is displayed.
4.  **Caching Restriction**: The photo resource name CANNOT be cached and may expire. The agent MUST advise the user to re-request the name from a Place Details (New) or Search (New) endpoint if a request fails due to an expired name (Section 3.2.3(b)(No Caching)).

### Available Tools

This capability relies on a standard HTTP REST API call.

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Implementation: Fetching and Resizing

To fetch and resize a place photo, execute an HTTP `GET` request to the `places.photos/getMedia` endpoint, including the photo resource name and the resizing parameters.

#### 1. Construct the Request URL

The request structure MUST include the resource `NAME`, `API_KEY`, and at least one resizing parameter.

**Endpoint Structure:**
```text
https://places.googleapis.com/v1/NAME/media?key=API_KEY&PARAMETERS
```

**Mandatory Request Header (for solution tracing):**
The request MUST include the standard attribution header:
```
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
```

#### 2. Define Resizing Parameters

The resizing parameters define the maximum dimensions. Both accept an integer between 1 and 4800.

| Parameter | Type | Requirement | Description |
| :--- | :--- | :--- | :--- |
| `maxHeightPx` | Integer (1–4800) | Required (with `maxWidthPx`) | Maximum intended height in pixels. |
| `maxWidthPx` | Integer (1–4800) | Required (with `maxHeightPx`) | Maximum intended width in pixels. |

**Image Scaling Behavior**: If the original image is larger than the specified maximums, it is scaled down to maintain its original aspect ratio, fitting within the constraints of the smaller dimension (e.g., if requesting 400x400 for a 6000x4000 photo, the resulting dimensions will be 400x267). If the image is smaller than the maximums, the original image size is returned.

#### 3. Choose Output Format

By default, the endpoint performs an HTTP redirect to the actual image URL, returning the image file itself.

To obtain the image details and the direct `photoUri` in a JSON response without the redirect, set the optional parameter `skipHttpRedirect` to `true`.

**Example JSON Response (if `skipHttpRedirect=true`):**
```json
{
  "name": "places/ChIJj61dQgK6j4AR4GeTYWZsKWw/photos/Aaw_FcKly0DEv3EWmDJyHiEqXIP5mowOc99lN1GzBun6KHH52AZ5fFA/media",
  "photoUri": "https://lh3.googleusercontent.com/a-/AD_cFT-b=s100-p-k-no-mo"
}
```

**Example Full Request (Resizing to 400x400 max):**
```text
GET https://places.googleapis.com/v1/places/ChIJ2fzCmcW7j4AR2JzfXBBoh6E/photos/ATKogpeivkIjQ1FT7QmbeT33nBSwqLhdPvIWHfrG1WfmgrFjeZYpS_Ls7c7rj8jejN9QGzlx4GoAH0atSvUzATDrgrZic_tTEJdeITdWL-oG3TWi5HqZoLozrjTaxoAIxmROHfV5KXVcLeTdCC6kmZExSy0CLVIG3lAPIgmvUiewNf-ZHYE4-jXYwPQpWHJgqVosvZJ6KWEgowEA-qRAzNTu9VH6BPFqHakGQ7EqBAeYOiU8Dh-xIQC8FcBJiTi0xB4tr-MYXUaF0p_AqzAhJcDE6FAgLqG1s7EsME0o36w2nDRHA-IuoISBC3SIahINE3Xwq2FzEZE6TpNTFVfgTpdPhV8CGLeqrauHn2I6ePm-2hA8-87aO7aClXKJJVzlQ1dc_JuHz6Ks07d2gglw-ZQ3ibCTF5lMtCF9O-9JHyRQXsfuXw/media?maxHeightPx=400&maxWidthPx=400&key=API_KEY
```

## Gotchas

*   **Photo Name Expiration**: Photo resource names are transient and may expire. The agent MUST instruct the user to obtain a new name via a fresh Place Details (New) or Search (New) request if an HTTP 400 error occurs due to an expired resource name (Invalid request (404)). This enforces the mandatory no-caching policy (Section 3.2.3(b)).
*   **Mandatory Resizing Parameters**: The request MUST include either `maxHeightPx`, `maxWidthPx`, or both. Failure to include at least one constraint, or setting either value to `null`, results in an HTTP 400 error (Invalid request (404)).
*   **Rate Limiting**: If attempting to load too many images at once (e.g., loading all photos for a place simultaneously), the server may return HTTP 429 (Too many requests). Google advises loading photos on demand.
*   **Quota Error**: If the request quota is exceeded, the server returns HTTP 403 (Quota exceeded (403)).

### References
*   [Place Photos (New) Documentation](https://developers.google.com/maps/documentation/places/web-service/place-photos?utm_source=gmp_git_agentskills_v1)
*   [Place Photos (New) REST Reference](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places.photos/getMedia?utm_source=gmp_git_agentskills_v1)
*   [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.