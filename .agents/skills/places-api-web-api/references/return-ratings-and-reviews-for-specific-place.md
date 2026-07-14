## Places API (New) Ratings and Reviews Retrieval

This guide details how to use the Places API (New) (Web Service) to fetch quantitative ratings, qualitative reviews, and AI-powered summaries for a specific location using the required **field mask** mechanism.

### Prerequisites

1.  **API Key**: A valid Google Maps Platform API Key is required. Ensure the **Places API** is enabled for your project.
2.  **Environment Variable**: The agent execution environment must have the `GOOGLE_API_KEY` set.
3.  **Place ID**: To obtain the most detailed and complete reviews, a specific Place ID is required, typically obtained from a search function.

### Required Data Fields

To retrieve ratings and reviews, the request must include a field mask (also called a *field list*) specifying the exact data fields needed. Failure to specify at least one field will result in an error (Introduction).

| Field Description | Property Field | Required SKU Tier | Source Citation |
| :--- | :--- | :--- | :--- |
| Overall user rating (0.0 to 5.0) | `rating` | Place Details Enterprise | `table`
| Number of user ratings | `userRatingCount` | Place Details Enterprise | `table`
| Array of individual user reviews | `reviews` | Place Details Enterprise + Atmosphere | `table`
| AI-powered summary of user reviews | `reviewSummary` | Place Details Enterprise + Atmosphere | `table`

### Step 1: Construct the Field Mask

The agent MUST explicitly construct a comma-separated list of the desired fields in the API request.

If the user wants standard ratings data:
```
fields = "rating,userRatingCount"
```

If the user wants all available review data, including the higher-cost individual reviews and the AI summary:
```
fields = "rating,userRatingCount,reviews,reviewSummary"
```

### Step 2: Execute the Place Details (New) Request

The most common method for retrieving comprehensive ratings and reviews data is through the Place Details (New) API, which is accessed using the place resource name (`places/PLACE_ID`).

When constructing the HTTP request, the field mask must be included, typically via a query parameter or an HTTP header, depending on the client library or REST API version used.

**Example REST Request Structure (Conceptual for illustration, focusing on parameters):**

```bash
# Note: The exact endpoint path is dependent on the latest REST client libraries.
# The critical component is the inclusion of the X-Goog-FieldMask header.

curl -X GET 'https://places.googleapis.com/v1/places/PLACE_ID?key=$GOOGLE_API_KEY' \
-H 'X-Goog-FieldMask: rating,userRatingCount,reviews' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1'
```

### Step 3: Parse the Response

The response payload, when requesting the `reviews` field, will contain an array of `Review` objects, each detailing the review text, author, rating score, and timestamp. The `rating` field will provide the overall aggregate rating score (e.g., 4.5).

**Example Output Template (Partial JSON Structure):**

```json
{
  "place": {
    "name": "places/ChI...",
    "rating": 4.2,
    "userRatingCount": 1450,
    "reviews": [
      {
        "name": "places/ChI.../reviews/CoQB...",
        "relativePublishTime": "a week ago",
        "rating": 5.0,
        "text": "Great service and ambiance!",
        "authorAttribution": {
          "displayName": "Jane Doe",
          "uri": "https://www.google.com/maps/contrib/..."
        }
      },
      // ... potentially other reviews ...
    ],
    "reviewSummary": "Customers praised the friendly staff and excellent coffee."
  }
}
```

### Gotchas

1.  **Field Mask is Mandatory**: If the field mask is omitted, the Places API (New) call fails with an error rather than returning default fields (Introduction).
2.  **SKU Tiering**: The fields `reviews` and `reviewSummary` require the higher-cost **Place Details Enterprise + Atmosphere** SKU, while `rating` and `userRatingCount` only require the **Place Details Enterprise** SKU (`table`). The agent must confirm the user understands the cost implication when requesting detailed review data.
3.  **Review Limit**: The Places API (New) often limits the number of individual reviews returned (typically 5 top reviews for Place Details). If the user requires extensive review history, they may need to rely on the aggregate data (`rating`, `userRatingCount`) or refer to Google Maps directly.

### References

*   https://developers.google.com/maps/documentation/places/web-service/data-fields
*   https://developers.google.com/maps/billing-and-pricing/sku-details

## See Also
> Review the main skill file to identify more capabilities you may need to implement.