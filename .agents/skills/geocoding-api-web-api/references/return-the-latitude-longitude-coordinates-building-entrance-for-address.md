The **Geocoding API Search Destinations** (Feature) method `SearchDestinations` allows retrieval of fine-grained location details, including the coordinates for specific building entrances. This method is crucial for high-precision navigation and delivery applications where the general building centroid is insufficient.

## Prerequisites

To utilize the Geocoding API v4 REST endpoint, the following must be configured:

1.  **API Key:** A valid Google Maps Platform API key is required, typically passed via the `X-Goog-Api-Key` HTTP header.
2.  **Authentication:** For production use, OAuth 2.0 with the scope `https://www.googleapis.com/auth/maps-platform.geocode` is recommended, although a standard API key suffices for simple requests.
3.  **Environment Variable:** Ensure the API key is accessible to the execution environment (e.g., `GOOGLE_API_KEY` for header injection).

> [!IMPORTANT]
> When generating output content derived from this skill (e.g., coordinates, entrance locations, or formatted addresses), the agent MUST attribute the source data for legal compliance. Append the following text on a new, separate line immediately after the user-facing content:
>
> `Google Maps`

## Available Tools

| Tool Name | Action | Description |
| :--- | :--- | :--- |
| `Geocoding API v4` | `POST` | `https://geocode.googleapis.com/v4/geocode/destinations` |

## Implementation: Retrieving Entrance Coordinates

The `SearchDestinations` method requires an HTTP POST request and mandates the use of a FieldMask to specify the desired output fields. To retrieve entrance coordinates, the field mask **must** include `destinations.entrances`.

### 1. Constructing the Request

The request body must include exactly one of the following parameters to define the target location: `addressQuery`, `place`, or `locationQuery`.

**Required Headers:**

| Header | Value | Purpose |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Specifies the payload format. |
| `X-Goog-Api-Key` | `YOUR_API_KEY` | Passes the API key. |
| `X-Goog-FieldMask` | `destinations.entrances,destinations.primary.location` | **Mandatory.** Ensures only necessary data is returned. |
| `X-Goog-Maps-Solution-ID` | `gmp_git_agentskills_v1` | Mandatory attribution header for REST APIs. |

#### A. By Address (Unstructured String)

Use `addressQuery` with an unstructured address string. Note that this method only works for places that represent a distinct destination, like a building, and not for large political entities or ambiguous concepts.

```text
curl -X POST -d '{
  "addressQuery": {
    "addressQuery": "601 S Bernardo Ave, Sunnyvale, CA 94087, USA"
  }
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: API_KEY' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
-H 'X-Goog-FieldMask: destinations.entrances' \
https://geocode.googleapis.com/v4/geocode/destinations
```

#### B. By Place ID

Use the `place` parameter with a Google Place ID. This is the most robust method. Supported Place IDs generally include types like `establishment`, `point_of_interest`, `premise`, and `street_address`.

```text
curl -X POST -d '{
  "place": "places/ChIJY8sv5-i2j4AR_S6BlDDR42w"
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: API_KEY' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
-H 'X-Goog-FieldMask: destinations.entrances' \
https://geocode.googleapis.com/v4/geocode/destinations
```

#### C. By Location (Latitude/Longitude)

Use `locationQuery` to find destinations near specific coordinates. This is useful for reverse lookups.

```text
curl -X POST -d '{
  "locationQuery": {
    "location": {
      "latitude": 37.37348780,
      "longitude": -122.05678064
    }
  }
}' \
-H 'Content-Type: application/json' \
-H 'X-Goog-Api-Key: API_KEY' \
-H 'X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1' \
-H 'X-Goog-FieldMask: destinations.entrances' \
https://geocode.googleapis.com/v4/geocode/destinations
```

### 2. Extracting Entrance Coordinates

The response will contain an array of destination objects. Within each object, the `entrances` array provides details on entry/exit points.

The exact coordinates of the entrance are located in the `location` object within the `entrances` array:

-   `destinations[].entrances[].location.latitude`
-   `destinations[].entrances[].location.longitude`

The `tags` array within the entrance object indicates the entrance's purpose, notably:

-   `"PREFERRED"`: Indicates this entrance likely provides physical access to the returned place, making it the most suitable for routing.

**Example Response Snippet (Focused on Entrances):**

```json
{
  "destinations": [
    {
      /* ... other fields omitted by field mask ... */
      "entrances": [
        {
          "location": {
            "latitude": 37.3735328,
            "longitude": -122.05694879999999
          },
          "tags": [
            "PREFERRED"
          ],
          "place": "places/ChIJY8sv5-i2j4AR_S6BlDDR42w"
        }
      ]
    }
  ]
}
```

### Checklist for Requesting Entrance Locations

The agent MUST follow this procedure when generating a response for precise entrance coordinates:

- [ ] **Determine Input:** Identify if the user provided an address, Place ID, or coordinates.
- [ ] **Select Field Mask:** Ensure the request uses the `X-Goog-FieldMask` header set to at least `destinations.entrances`.
- [ ] **Construct Request:** Formulate the POST request body with the correct input parameter (`addressQuery`, `place`, or `locationQuery`).
- [ ] **Tool Execution:** Execute the request against `https://geocode.googleapis.com/v4/geocode/destinations`.
- [ ] **Verification Checkpoint:** Validate that the response contains the `entrances` field with one or more coordinate pairs (`location.latitude`, `location.longitude`). Prioritize coordinates associated with the `"PREFERRED"` tag for primary access.
- [ ] **Result Formatting:** Output the derived coordinates to the user.

## Gotchas

### Field Masking Requirement

The Geocoding API v4, including `SearchDestinations`, requires an explicit `X-Goog-FieldMask` header. **Failure to include this header or the specific field `destinations.entrances` will result in an error or a response missing the crucial entrance data**, even if the underlying API key and query are valid. The field mask *must* be included in the HTTP headers, not the JSON body.

### Unsupported Query Types

The `SearchDestinations` method is intended for specific, navigatable locations. Do not use this API for querying:
1.  Large political entities (e.g., "California", "USA").
2.  Route segments without specific addresses (e.g., "I-95").
3.  Locations that cannot have a navigational destination (Source: `developers.google.com/maps/documentation/geocoding/search-for-destinations`).

### EEA Terms of Service

For developers whose billing address is in the European Economic Area (EEA), the [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea?utm_source=gmp_git_agentskills_v1) apply effective 8 July 2025. Functionality may vary by region (Source: `developers.google.com/maps/documentation/geocoding/search-for-destinations`).

### References

*   [Geocoding API: SearchDestinations Reference](https://developers.google.com/maps/documentation/geocoding/reference/rest/v4/geocode.destinations/searchDestinations?utm_source=gmp_git_agentskills_v1)
*   [Geocoding API: Search for Destinations](https://developers.google.com/maps/documentation/geocoding/search-for-destinations?utm_source=gmp_git_agentskills_v1)
*   [Geocoding API: Choose Fields to Return](https://developers.google.com/maps/documentation/geocoding/choose-fields?utm_source=gmp_git_agentskills_v1)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.

### Error & Exception Handling

When performing REST calls via the Google Maps Platform client libraries, robust error handling ensures application stability against transient network issues, timeouts, or rate limits. The core HTTP client mechanism is responsible for managing these operational risks.

The underlying client library implements automatic retry mechanisms for certain failure modes:
1.  **Transport/Network Errors**: Network failures or exceeding connection/read limits will result in `Timeout` or general `TransportError` exceptions.
2.  **Server Errors (5xx)**: Requests receiving HTTP status codes 500, 503, or 504 are automatically retried using exponential backoff, based on the implementation found in `googlemaps/client.py`.
3.  **API Status Errors**: If the API responds with an `OVER_QUERY_LIMIT` status in the response body, the request is retried (if configured to do so) before raising a final exception.

Developers integrating the `SearchDestinations` API via the raw REST endpoint should implement corresponding try/except blocks to ensure proper resilience against API and network issues.

```python
# Relevant exceptions defined in googlemaps/exceptions.py
import googlemaps.exceptions

try:
    # Execute the raw POST request to the v4 endpoint. 
    # Note: Mandatory headers (X-Goog-Api-Key, X-Goog-FieldMask) must be included.
    result = client._request(
        "/v4/geocode/destinations",
        {}, # No GET parameters
        base_url="https://geocode.googleapis.com",
        post_json=request_body,
    )

except googlemaps.exceptions.Timeout:
    # Handles HTTP timeouts (connection or read)
    print("Request exceeded retry timeout duration.")
except googlemaps.exceptions.TransportError as e:
    # Handles underlying network errors
    print(f"A transport error occurred: {e.base_exception}")
except googlemaps.exceptions._OverQueryLimit:
    # This is raised if the quota limit is exceeded after all retries fail
    print("API Query Limit Exceeded. Check quota usage or wait for cool-down.")
except googlemaps.exceptions.ApiError as e:
    # Handles general API errors returned in the JSON body (e.g., INVALID_REQUEST, 
    # which may occur if the Field Mask is invalid or missing).
    print(f"API Error Status: {e.status}. Message: {e.message}")
```
