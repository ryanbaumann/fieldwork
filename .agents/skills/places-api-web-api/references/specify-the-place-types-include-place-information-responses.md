## Specifying Place Types for Filtering (Places API New)

This capability documents how to restrict results returned by various Places API (New) requests by specifying one or more mandatory or excluded **Place Types**. Place types act as a filter in the request, ensuring the response only includes places that match the specified categories.

### Prerequisites

1.  **Authentication:** A valid Google Maps Platform API Key must be available. Set the API key as a global environment variable:
    ```bash
    export GOOGLE_API_KEY="YOUR_API_KEY"
    ```
2.  The request must be one of the Places API (New) methods supporting type filtering: Nearby Search (New), Text Search (New), or Autocomplete (New).

> [!IMPORTANT]
> To comply with Google Maps Platform data attribution requirements, the final response MUST include the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content derived from this service.

### 1. Overview of Place Type Categories

Place types are categorized into three tables, which dictate where and how they can be used in a request:

| Table | Usage in Request | Applicable Requests | Description |
| :--- | :--- | :--- | :--- |
| **Table A** | Used in all filtering parameters: `includedTypes`, `excludedTypes`, `includedPrimaryTypes`, `excludedPrimaryTypes`, and `includedType`. | Nearby Search (New), Text Search (New), Autocomplete (New) | Comprehensive list of categories (e.g., `restaurant`, `school`, `gas_station`). (Table A) |
| **Table B** | Only supported for use with `includedPrimaryTypes`. | Autocomplete (New) only | Additional types primarily related to geographical entities (`establishment`, `point_of_interest`). (Table B) |
| **Table C** | Used as an `includedPrimaryTypes` value collection. | Autocomplete (New) only | Broad collections (`(regions)`, `(cities)`) that filter for a set of related types. **Constraint**: Cannot be specified with any other type values. (Table C) |

### 2. Filtering by Place Type in Requests

The specific parameter used for type filtering depends on the API method:

#### 2.1. Nearby Search (New)

Nearby Search (New) supports the most granular filtering, allowing filtering by both general types (`types`) and specific primary types (`primaryTypes`).

| Parameter | Function | Scope | Example Value |
| :--- | :--- | :--- | :--- |
| `includedTypes` | Include results that match any of the provided **Table A** types. | General types | `["restaurant", "cafe"]` |
| `excludedTypes` | Exclude results that match any of the provided **Table A** types. | General types | `["parking", "atm"]` |
| `includedPrimaryTypes` | Include results where the primary type matches any of the provided **Table A** types. | Primary type only | `["hotel"]` |
| `excludedPrimaryTypes` | Exclude results where the primary type matches any of the provided **Table A** types. | Primary type only | `["gas_station"]` |

**Example: Nearby Search (New) Request Structure (REST)**
The agent MUST include the `X-Goog-Maps-Solution-ID` header for compliance.

```http
POST /v1/places:searchNearby HTTP/1.1
Host: places.googleapis.com
X-Goog-Api-Key: YOUR_API_KEY
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
Content-Type: application/json

{
  "includedTypes": ["food", "bar"],
  "excludedPrimaryTypes": ["cafe"],
  "locationRestriction": {
    "circle": {
      "center": {"latitude": 34.0522, "longitude": -118.2437},
      "radius": 500.0
    }
  },
  "maxResultCount": 10
}
```

#### 2.2. Text Search (New)

Text Search (New) supports filtering by a single type using `includedType`.

| Parameter | Function | Scope | Example Value |
| :--- | :--- | :--- | :--- |
| `includedType` | Restricts results to places matching this single **Table A** type. | General type | `"tourist_attraction"` |

**Example: Text Search (New) Request Structure (REST)**

```http
POST /v1/places:searchText HTTP/1.1
Host: places.googleapis.com
X-Goog-Api-Key: YOUR_API_KEY
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
Content-Type: application/json

{
  "textQuery": "best italian food in Rome",
  "includedType": "italian_restaurant",
  "maxResultCount": 5
}
```

#### 2.3. Autocomplete (New)

Autocomplete (New) uses `includedPrimaryTypes` to filter predictions based on the place's primary type.

| Parameter | Function | Scope | Example Value |
| :--- | :--- | :--- | :--- |
| `includedPrimaryTypes` | Filters predictions by primary type. Values can be from **Table A**, **Table B**, or a **Table C** collection. | Primary type or collection | `["airport"]` or `["(cities)"]` |

**Example: Autocomplete (New) Request Structure (REST)**

```http
POST /v1/places:autocomplete HTTP/1.1
Host: places.googleapis.com
X-Goog-Api-Key: YOUR_API_KEY
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
Content-Type: application/json

{
  "input": "San F",
  "includedPrimaryTypes": ["(cities)"],
  "locationBias": {
    "circle": {
      "center": {"latitude": 37.7749, "longitude": -122.4194},
      "radius": 20000.0
    }
  }
}
```

### 3. Checklist for Using Place Type Filtering

- [ ] Determine the required filter categories using the canonical names listed under Table A or Table B.
- [ ] Identify the appropriate request method (Nearby Search, Text Search, or Autocomplete).
- [ ] Select the correct parameter (`includedTypes`, `excludedTypes`, `includedPrimaryTypes`, `excludedPrimaryTypes`, or `includedType`) based on the API method and desired filtering effect.
- [ ] **Verification Checkpoint:** If using an Autocomplete (New) request and specifying a Table C collection (e.g., `(regions)` or `(cities)`), verify that this is the only type value provided in the request, as collections cannot be combined with other specific types (Table C).

### ## Gotchas

*   **Type Table Restrictions:** Values from Table B may NOT be used in Nearby Search (New) or Text Search (New) requests for filtering; they are primarily restricted to responses and Autocomplete (New) requests (`includedPrimaryTypes`) (Table B).
*   **Table C Exclusivity:** Type collections from Table C (`(regions)`, `(cities)`) are highly restrictive. If used in an Autocomplete (New) request, they must be the *only* value specified for `includedPrimaryTypes` (Table C).
*   **Primary Type Distinction:** Filtering by `includedPrimaryTypes` or `excludedPrimaryTypes` is more restrictive than filtering by `includedTypes` or `excludedTypes`, as it only checks the single, most relevant type assigned to the place (Introduction).

### References

*   [Place types](https://developers.google.com/maps/documentation/places/web-service/place-types?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.