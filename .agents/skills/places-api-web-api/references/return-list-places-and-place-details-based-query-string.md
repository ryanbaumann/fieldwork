## Places API Text Search (New)

The Text Search (New) API provides a powerful method for retrieving lists of places based on a query string, utilizing the `places.googleapis.com/v1/places:searchText` endpoint via an HTTP POST request.

### Prerequisites

To execute this API call, ensure the following is configured:

1.  **API Key**: A valid Google Maps Platform API key must be provided in the request header.
2.  **Authentication**: The API key must be passed using the HTTP header `X-Goog-Api-Key`.
3.  **Required Tool**: Access to a tool capable of making HTTP POST requests (e.g., `curl` or a custom client library).
4.  **Attribution ID**: The standard internal usage attribution ID must be included in the request headers (Standard REST Method).

> [!IMPORTANT]
> The downstream agent MUST ensure that ALL generated output content (including lists, locations, and directions derived from this skill) is attributed by appending the text `Google Maps` on a dedicated, separate line immediately following the user-facing content.

### 1. Request Structure and Configuration

The Text Search (New) request is an HTTP POST to the canonical URL, with parameters passed in the JSON request body and required authorization and field definition specified in the headers.

**Endpoint:** `https://places.googleapis.com/v1/places:searchText`
**Method:** `POST`
**Content Type Header:** `Content-Type: application/json`

#### Mandatory Headers

| Header Name | Value | Purpose |
| :--- | :--- | :--- |
| `X-Goog-Api-Key` | `API_KEY` | Provides the required authentication credential. |
| `X-Goog-FieldMask` | Comma-separated list of fields | **Mandatory** field list to specify data to return. Omitting this results in an error (Section: Required parameters). |
| `X-Goog-Maps-Solution-ID` | `gmp_git_agentskills_v1` | Mandatory usage attribution ID for tracking. |

#### Mandatory Body Parameter

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `textQuery` | String | The text string used to search for candidate matches (e.g., "pizza in New York" or "123 Main Street"). |

#### Field Masking and SKU Implications

The `X-Goog-FieldMask` header determines which fields (parts of the `Place` object) are returned, and dictates the billing SKU (Section: FieldMask):

| Field Category | Example Fields | Triggered SKU |
| :--- | :--- | :--- |
| Essentials (ID Only) | `places.id`, `places.attributions`, `nextPageToken` | [Text Search Essentials ID Only SKU] |
| Pro | `places.displayName`, `places.formattedAddress`, `places.location`, `places.photos` | [Text Search Pro SKU] |
| Enterprise | `places.rating`, `places.priceLevel`, `places.websiteUri` | [Text Search Enterprise SKU] |
| Enterprise + Atmosphere | `places.editorialSummary`, `places.reviews`, `places.delivery` | [Text Search Enterprise + Atmosphere SKU] |

**Note on Name Fields**: To retrieve the readable text name of a place, use `places.displayName` (Pro SKU). The field `places.name` returns the place *resource name* (`places/PLACE_ID`) (Essentials SKU).

### 2. Implementation: Basic Search Request

To perform a search, construct the request body with the `textQuery` and ensure the required headers are set.

```bash
curl -X POST -d '{
  "textQuery" : "Spicy Vegetarian Food in Sydney, Australia"
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: API_KEY' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
-H 'X-Goog-FieldMask: places.displayName,places.formattedAddress,places.priceLevel' \
'https://places.googleapis.com/v1/places:searchText'
```

### 3. Refining Search Results

The following optional parameters can be included in the JSON request body to refine results:

#### Location Context (Bias vs. Restriction)

You must specify **either** `locationBias` or `locationRestriction`, but not both. If both are omitted, the API uses IP biasing by default (Section: locationBias).

| Parameter | Function | Scope / Constraints | Example (Circle Bias) |
| :--- | :--- | :--- | :--- |
| `locationBias` | Suggests an area for results; places outside the area may still be returned. | Can be a **rectangular Viewport** or a **circle** (radius 0.0 to 50000.0 meters). Overridden if `textQuery` contains an explicit location (Section: locationBias). | `"locationBias": {"circle": {"center": {"latitude": 37.7937, "longitude": -122.3965}, "radius": 500.0}}` |
| `locationRestriction` | Restricts results to within the specified area. | Must be a **rectangular Viewport**. Only applies to categorical queries (Section: locationRestriction). | `"locationRestriction": {"rectangle": {"low": {...}, "high": {...}}}` |

#### Filtering Parameters

| Parameter | Description | Constraints |
| :--- | :--- | :--- |
| `includedType` | Biases results to a single specified type from [Table A]. To enforce strict adherence to the type, also set `strictTypeFiltering: true` (Section: includedType). |
| `openNow` | If `true`, returns only places currently open for business. If `false`, returns all businesses regardless of status (Section: openNow). |
| `minRating` | Restricts results to those with an average user rating $\ge$ this limit. Values must be between 0.0 and 5.0 in increments of 0.5 (Section: minRating). |
| `priceLevels` | Restrict search to specific price levels. Acceptable values are defined by [`PriceLevel`] (e.g., `"PRICE_LEVEL_INEXPENSIVE"`, `"PRICE_LEVEL_MODERATE"`). `PRICE_LEVEL_FREE` is only used in the response, not the request (Section: priceLevels). |
| `includeFutureOpeningBusinesses` | If `true`, includes businesses expected to open in the future. Requires `places.businessStatus` or `places.openingDate` in the field mask (Section: includeFutureOpeningBusinesses). |
| `evOptions` | Specifies filters for EV charging, including `connectorTypes` (e.g., `"EV_CONNECTOR_TYPE_J1772"`) and `minimumChargingRateKw` (Section: evOptions). |

### 4. Pagination

Text Search (New) returns a maximum of 60 results across all pages. Use `pageSize` and `pageToken` to handle pagination.

- [ ] **Step 1: Set Page Size** (Trigger Condition: User requests paginated results or specifies result count < 20. Verification Checkpoint: Response contains `nextPageToken`). Set the `pageSize` parameter (1 to 20 results per page) in the initial request.

- [ ] **Step 2: Check for Next Page** (Trigger Condition: Response contains `nextPageToken`. Verification Checkpoint: Subsequent request is successful). If the response includes a `nextPageToken`, use this token to fetch the next page.

- [ ] **Step 3: Fetch Next Page** (Trigger Condition: Processing a `nextPageToken`. Verification Checkpoint: Response contains the next set of results). Use the `nextPageToken` from the previous response as the `pageToken` parameter in the new request body.

**Mandatory Constraint**: When fetching subsequent pages using `pageToken`, all request parameters other than `maxResultCount` (deprecated), `pageSize`, and `pageToken` MUST be identical to the original request to avoid an `INVALID_ARGUMENT` error (Section: pageToken).

#### Example Pagination Request (Page 2)

```json
{
  "textQuery": "pizza in New York",
  "pageSize": 5,
  "pageToken": "AeCrKXsZWzNVbPzO-MRWPu52jWO_Xx8aKwOQ69_Je3DxRpfdjClq8Ekwh3UcF2h2Jn75kL6PtWLGV4ecQri-GEUKN_OFpJkdVc-JL4Q"
}
```

### ## Gotchas

*   **FieldMask Requirement**: The `X-Goog-FieldMask` header is mandatory. Failure to specify fields (e.g., `places.displayName`) will result in an error, as there is no default list of returned fields (Section: Required parameters).
*   **Location Override**: If the `textQuery` contains an explicit location (e.g., "Restaurant in Paris"), the provided `locationBias` is ignored (Section: locationBias).
*   **Query Ambiguity**: Text Search is not suitable for highly ambiguous queries, queries with too many concepts (e.g., "Market Street San Francisco San Jose Airport"), or non-geospatial requests (Section: textQuery).
*   **Pagination Consistency**: When using `pageToken`, ensure the `textQuery`, `locationBias`/`locationRestriction`, and all filtering parameters remain exactly the same as the initial request (Section: pageToken).
*   **EEA Terms**: If the developer's billing address is in the European Economic Area (EEA), the [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea?utm_source=gmp_git_agentskills_v1) apply effective 8 July 2025 (Source URL: developers.google.com/maps/documentation/places/web-service/text-search).

### References

*   https://developers.google.com/maps/documentation/places/web-service/text-search
*   https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places/searchText
*   https://cloud.google.com/terms/maps-platform/eea
*   https://developers.google.com/maps/documentation/places/web-service/choose-fields
*   https://developers.google.com/maps/billing-and-pricing/sku-details#text-search-id-only-ess-sku
*   https://developers.google.com/maps/billing-and-pricing/sku-details#text-search-pro-sku
*   https://developers.google.com/maps/billing-and-pricing/sku-details#text-search-ent-sku
*   https://developers.google.com/maps/billing-and-pricing/sku-details#text-search-ent-plus-sku
*   https://developers.google.com/maps/documentation/places/web-service/place-types#table-a
*   https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places#pricelevel

## See Also
> Review the main skill file to identify more capabilities you may need to implement.