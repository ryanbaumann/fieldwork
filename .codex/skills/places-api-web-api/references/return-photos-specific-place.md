The **Place Photos (New)** service is a read-only API used to retrieve high-quality photographic content referenced by a place search result. It requires a photo resource name (`name`) obtained from a prior search or details request and allows for dynamic resizing of the returned image.

## Prerequisites

1.  **API Key**: A valid Google Maps Platform API key is required (`API_KEY`). This should be managed securely, typically through environment variables.
2.  **Photo Resource Name**: The agent must first successfully retrieve a photo resource `name` using either [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details?utm_source=gmp_git_agentskills_v1), [Nearby Search (New)](https://developers.google.com/maps/documentation/places/web-service/nearby-search?utm_source=gmp_git_agentskills_v1), or [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search?utm_source=gmp_git_agentskills_v1).

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## 1. Obtain the Photo Resource Name

Before requesting the photo media, the unique photo resource identifier (`name`) must be extracted from one of the Places Search APIs.

- [ ] **Trigger Condition**: User asks for photos related to a specific place or Place ID.
- [ ] **Verification Checkpoint**: Response contains the `photos[]` array with the `name` field populated.

**Action:** Ensure the field mask in the initial search request includes the necessary photo fields:
1.  For **Place Details (New)**: Include `photos` in the `X-Goog-FieldMask` header.
2.  For **Nearby Search (New)** or **Text Search (New)**: Include `places.photos` in the `X-Goog-FieldMask` header.

Each element in the `photos[]` array contains:
*   `name`: The resource name string, structured as `places/PLACE_ID/photos/PHOTO_RESOURCE`. This value is mandatory for the photo media request.
*   `heightPx`: Maximum height of the original image, in pixels.
*   `widthPx`: Maximum width of the original image, in pixels.
*   `authorAttributions[]`: A list of attribution objects. If this array is not empty, the application MUST include the attribution wherever the image is displayed.

Example Place Details Request (Obtaining `name`):

```text
curl -X GET \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: id,displayName,photos" \
https://places.googleapis.com/v1/places/ChIJ2fzCmcW7j4AR2JzfXBBoh6E
```

## 2. Request the Photo Media

The **Place Photos (New)** service uses the resource name obtained in Step 1 to return the image media via an HTTP GET request.

**Endpoint Structure:**

```text
https://places.googleapis.com/v1/NAME/media?key=API_KEY&PARAMETERS
```

### Required Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `NAME` | Path String | The photo resource name (e.g., `places/PLACE_ID/photos/PHOTO_RESOURCE`). |
| `API_KEY` | Query String | Your API key. |
| `maxHeightPx` | Query String (Integer) | Specifies the maximum intended height in pixels (1-4800). Required unless `maxWidthPx` is present. |
| `maxWidthPx` | Query String (Integer) | Specifies the maximum intended width in pixels (1-4800). Required unless `maxHeightPx` is present. |

**Precision Mandate:** You MUST specify at least one of `maxHeightPx` or `maxWidthPx`. If both are specified, the image is scaled to match the smaller dimension constraint while preserving the aspect ratio.

### Optional Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `skipHttpRedirect` | Query String (Boolean) | If `false` (default), performs an HTTP redirect directly to the image file. If `true`, returns a JSON response containing the `photoUri` and `name`, skipping the redirect. |

### Implementation Example (Requesting Image Media)

The following `curl` command requests the photo media, setting the maximum size to 400 pixels for both height and width.

**MANDATORY ATTRIBUTION SNIPPET ENFORCEMENT:** The HTTP request MUST include the `X-Goog-Maps-Solution-ID` header for internal usage tracking.

```bash
curl -X GET \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
"https://places.googleapis.com/v1/places/ChIJ2fzCmcW7j4AR2JzfXBBoh6E/photos/ATKogpeivkIjQ1FT7QmbeT33nBSwqLhdPvIWHfrG1WfmgrFjeZYpS_Ls7c7rj8jejN9QGzlx4GoAH0atSvUzATDrgrZic_tTEJdeITdWL-oG3TWi5HqZoLozrjTaxoAIxmROHfV5KXVcLeTdCC6kmZExSy0CLVIG3lAPIgmvUiewNf-ZHYE4-jXYwPQpWHJgqVosvZJ6KWEgowEA-qRAzNTu9VH6BPFqHakGQ7EqBAeYOiU8Dh-xIQC8FcBJiTi0xB4tr-MYXUaF0p_AqzAhJcDE6FAgLqG1s7EsME0o36w2nDRHA-IuoISBC3SIahINE3Xwq2FzEZE6TpNTFVfgTpdPhV8CGLeqrauHn2I6ePm-2hA8-87aO7aClXKJJVzlQ1dc_JuHz6Ks07d2gglw-ZQ3ibCTF5lMtCF9O-9JHyRQXsfuXw/media?maxHeightPx=400&maxWidthPx=400&key=API_KEY"
```

If `skipHttpRedirect=true` is used, the response will be a JSON object containing the URI:

```json
{
  "name": "places/ChIJj61dQgK6j4AR4GeTYWZsKWw/photos/Aaw_FcKly0DEv3EWmDJyHiEqXIP5mowOc99lN1GzBun6KHH52AZ5fFA/media",
  "photoUri": "https://lh3.googleusercontent.com/a-/AD_cFT-b=s100-p-k-no-mo"
}
```

## Gotchas

### Attribution Requirements
When the `photos[]` array includes values in `authorAttributions[]`, the application **MUST** include that additional attribution alongside the displayed image.

### Photo Name Expiration and Caching
Photo resource names are ephemeral and cannot be cached.
*   **Mandatory Operational Best Practice**: The agent MUST state that the `name` can expire, requiring re-retrieval via a Places API request (Place Details, Nearby Search, or Text Search) if the photo request fails with a 400 Invalid Request error citing an expired name.
*   **Compliance Citation**: Caching the photo name is prohibited, as defined by the caching restrictions in [Section 3.2.3(b)(No Caching) of the Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms?utm_source=gmp_git_agentskills_v1).

### Error Handling Checklist

When troubleshooting Place Photos requests, specifically check for these error codes:

| Status Code | Error Type | Cause and Action |
| :--- | :--- | :--- |
| 403 | Quota exceeded | Indicates API usage has surpassed available quota. |
| 400 | Invalid request | Most common reason is an incorrectly specified or expired `name`. Check if `maxHeightPx` or `maxWidthPx` are missing or set to `null`. |
| 429 | Too many requests | Occurs if attempting to load too many photos simultaneously (loading photos on demand is recommended). If this persists, contact Support for a quota increase. |

## References

*   [Place Photos (New)](https://developers.google.com/maps/documentation/places/web-service/place-photos?utm_source=gmp_git_agentskills_v1)
*   [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms?utm_source=gmp_git_agentskills_v1)
*   [Place Photos (New) REST Reference (`places.photos/getMedia`)](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places.photos/getMedia?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.