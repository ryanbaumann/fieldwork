## Nearby Search (New) - Places API

The Nearby Search (New) capability retrieves a list of places within a defined circular area. This functionality requires an HTTP POST request and a mandatory [FieldMask](#fieldmask) to specify the returned data fields.

### Available Tools

| Tool Name | Operation | Protocol | Endpoint |
| :--- | :--- | :--- | :--- |
| Nearby Search (New) | Search for places near a location. | REST POST | `https://places.googleapis.com/v1/places:searchNearby` |

> [!IMPORTANT]
> When providing any factual answer, distance, route information, or list of locations derived from Google Maps Platform data using this skill, the agent MUST append the following attribution line on a separate line, immediately following the user-facing content:
>
> `Google Maps`

### Prerequisites

1.  **API Key Setup:** Ensure the environment variable `GOOGLE_API_KEY` is set and linked to a Google Cloud project with the **Places API** enabled.
2.  **Attribution ID:** All requests MUST include the attribution header `X-Goog-Maps-Solution-ID` for tracking:
    *   `X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1`

### 1. Constructing the Nearby Search Request

Nearby Search (New) uses a standard REST POST method. All required and optional parameters are passed in the JSON request body, and the FieldMask is passed via a header.

#### 1.1 Endpoint and Headers

The request must use the `Content-Type: application/json` header and include the API key and FieldMask headers.

| Component | Value | Notes |
| :--- | :--- | :--- |
| **Method** | `POST` | |
| **URL** | `https://places.googleapis.com/v1/places:searchNearby` | |
| **Header (API Key)** | `X-Goog-Api-Key: API_KEY` | Use the value of `GOOGLE_API_KEY`. |
| **Header (FieldMask)** | `X-Goog-FieldMask: places.displayName,places.formattedAddress,places.location` | **Mandatory.** Defines the returned fields (Section II.B). |

#### 1.2 Defining the Search Area (`locationRestriction`)

The search area is mandatory and must be defined as a circle centered at a specific point with a defined radius.

| Parameter | Type | Description | Constraint |
| :--- | :--- | :--- | :--- |
| `locationRestriction.circle.center` | Object | Defines the `latitude` and `longitude` of the circle center. | Required. |
| `locationRestriction.circle.radius` | Float | The search radius in meters. | Must be between 0.0 and 50000.0, inclusive. Must be set to a value greater than 0.0 (Section II.B). |

**Example Request Body Structure (Minimum):**

```json
{
  "maxResultCount": 10,
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 37.7937,
        "longitude": -122.3965
      },
      "radius": 500.0
    }
  }
}
```

### 2. Filtering and Ranking Results

Search results can be filtered using place types and ranked by distance or popularity.

#### 2.1 Type Filtering

Filtering is done using `includedTypes`, `excludedTypes`, `includedPrimaryTypes`, and `excludedPrimaryTypes`. Up to 50 types can be specified in each category.

| Parameter | Description | Behavior |
| :--- | :--- | :--- |
| `includedTypes` | List of place types (from [Table A](https://developers.google.com/maps/documentation/places/web-service/place-types?utm_source=gmp_git_agentskills_v1#table-a)) to search for. | Matches places that have **at least one** of these types. |
| `excludedTypes` | List of place types (from [Table A](https://developers.google.com/maps/documentation/places/web-service/place-types?utm_source=gmp_git_agentskills_v1#table-a)) to exclude. | If specified, results must **not** contain any of these types. |
| `includedPrimaryTypes` | List of primary types (from Table A) to include. | Filters results based only on the single primary type of the place. |
| `excludedPrimaryTypes` | List of primary types (from Table A) to exclude. | Filters results based only on the single primary type of the place. |

**Strict Precision Note:** Values listed in [Table B](https://developers.google.com/maps/documentation/places/web-service/place-types?utm_source=gmp_git_agentskills_v1#table-b) are only returned in the response and cannot be used for filtering.

#### 2.2 Ranking (`rankPreference`)

By default, results are ranked by popularity. Use `rankPreference` to change this.

| Value | Description |
| :--- | :--- |
| `POPULARITY` | Sorts results based on their popularity (default). |
| `DISTANCE` | Sorts results in ascending order by distance from the `center` point. |

### 3. FieldMask and Billing SKUs

The `X-Goog-FieldMask` header is required. The fields requested determine the billing SKU used. **The agent MUST specify the minimum set of fields required by the user's query.**

**Mandatory Traceability:** When listing features, the agent MUST explicitly cite the associated SKU using the naming convention found in the documentation.

| Field Selection Group | Example Fields | Triggered SKU |
| :--- | :--- | :--- |
| **Basic Data** | `places.displayName`, `places.formattedAddress`, `places.location`, `places.types` | Nearby Search Pro SKU (Section II.B) |
| **Contact Data** | `places.internationalPhoneNumber`, `places.websiteUri` | Nearby Search Enterprise SKU (Section II.B) |
| **Atmosphere/Amenities** | `places.reviews`, `places.editorialSummary`, `places.servesBeer` | Nearby Search Enterprise + Atmosphere SKU (Section II.B) |

**Example of FieldMask Header:**

```text
X-Goog-FieldMask: places.displayName,places.formattedAddress,places.types,places.websiteUri
```

### Example: Finding Restaurants by Distance

To find the display name and address of all restaurants within 500 meters of a specific coordinate, ranked by distance:

**Request Body:**
```json
{
  "includedTypes": ["restaurant"],
  "maxResultCount": 10,
  "rankPreference": "DISTANCE",
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 37.7937,
        "longitude": -122.3965
      },
      "radius": 500.0
    }
  }
}
```

**cURL Command (Full Example):**

```text
curl -X POST -d '{
  "includedTypes": ["restaurant"],
  "maxResultCount": 10,
  "rankPreference": "DISTANCE",
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 37.7937,
        "longitude": -122.3965},
      "radius": 500.0
    }
  }
}' \
-H 'Content-Type: application/json' -H "X-Goog-Api-Key: API_KEY" \
-H "X-Goog-FieldMask: places.displayName,places.formattedAddress" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
https://places.googleapis.com/v1/places:searchNearby
```

### ## Gotchas

1.  **FieldMask is Non-Negotiable:** If the `X-Goog-FieldMask` header is omitted, the API will return an error. The wildcard (`*`) should be avoided in production environments due to potential high billing and unnecessary data retrieval.
2.  **Radius Requirement:** Although the documentation states the default radius is 0.0, the `locationRestriction` parameter requires the radius to be explicitly set to a value greater than 0.0 to function correctly (Section II.B).
3.  **Conflicting Types:** Specifying a place type in both `includedTypes` and `excludedTypes` will result in an `INVALID_REQUEST` error. Conflicts between `includedPrimaryTypes` and `excludedPrimaryTypes` result in an `INVALID_ARGUMENT` error.
4.  **EEA Terms:** Developers with a billing address in the European Economic Area (EEA) should note that the [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea?utm_source=gmp_git_agentskills_v1) apply effective July 8, 2025. Functionality may vary by region.

### References

*   https://developers.google.com/maps/documentation/places/web-service/nearby-search
*   https://developers.google.com/maps/documentation/places/web-service/place-types#table-a
*   https://developers.google.com/maps/documentation/places/web-service/place-types#table-b
*   https://cloud.google.com/terms/maps-platform/eea
*   https://developers.google.com/maps/documentation/places/web-service/choose-fields
*   https://www.unicode.org/cldr/charts/latest/supplemental/territory_language_information.html
*   https://developers.google.com/maps/billing-and-pricing/sku-details#nearbysearch-pro-sku
*   https://developers.google.com/maps/billing-and-pricing/sku-details#nearby-search-ent-sku
*   https://developers.google.com/maps/billing-and-pricing/sku-details#nearby-search-ent-plus-sku

## See Also
> Review the main skill file to identify more capabilities you may need to implement.