## Geocoding API: Retrieve Building Outline by Place ID (Feature: Destination Search)

The Geocoding API v4 `SearchDestinations` method allows the retrieval of detailed contextual information about a location, including the polygon geometry representing the physical outline of a building or structure.

This capability is accessed via a POST request and requires using a **Field Mask** to explicitly request the desired geometry data.

### Prerequisites and Setup

1.  **API Key**: Ensure you have a valid Google Maps Platform API key enabled for the Geocoding API.
2.  **Authentication**: Use the API key either via the `X-Goog-Api-Key` header or OAuth 2.0 with the scope `https://www.googleapis.com/auth/maps-platform.geocode`. For quick testing, ensure the API Key is set as an environment variable (`GOOGLE_API_KEY`).

### Mandatory Compliance Directive

> [!IMPORTANT]
> When generating output based on Geocoding API data (such as coordinates, addresses, or derived calculations like distance or location summaries), the agent MUST attribute ALL derived content by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

### Actionable Steps: Retrieve Building Polygon

The process involves constructing a JSON request body containing the Place ID and ensuring the mandatory `displayPolygon` field is requested via a Field Mask.

#### 1. Construct the Request Body

Provide the target Place ID (prefixed by `places/`) in the request JSON body using the `place` parameter.

```json
{
  "place": "places/ChIJY8sv5-i2j4AR_S6BlDDR42w"
}
```

#### 2. Define the Field Mask

The `SearchDestinations` method requires a Field Mask. To retrieve the building outline, the mask must include `destinations.primary.displayPolygon`.

- [ ] **Verification Checkpoint**: The HTTP request header MUST include `X-Goog-FieldMask: destinations.primary.displayPolygon`.

#### 3. Execute the Request

Send an HTTP POST request to the `SearchDestinations` endpoint, including the API key, content type, the required Field Mask, and the solution ID for attribution tracking.

**Endpoint:**
`https://geocode.googleapis.com/v4/geocode/destinations`

**Example (using `curl`):**

```bash
# Substitute 'YOUR_PLACE_ID' and 'YOUR_API_KEY'
curl -X POST -d '{
  "place": "places/ChIJY8sv5-i2j4AR_S6BlDDR42w"
}' \
-H 'Content-Type: application/json' \
-H "X-Goog-Api-Key: YOUR_API_KEY" \
-H "X-Goog-FieldMask: destinations.primary.displayPolygon" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
https://geocode.googleapis.com/v4/geocode/destinations
```

#### 4. Parse the Response for Polygon Coordinates

The response will be a JSON object containing an array of `destinations`. Locate the `displayPolygon` object nested within the `primary` object of the first destination.

- [ ] **Trigger Condition**: Look for the `displayPolygon` field when the user needs geometric boundaries.
- [ ] **Verification Checkpoint**: Confirm the `displayPolygon` object has `type: "Polygon"` and the `coordinates` array contains a list of `[longitude, latitude]` pairs defining the boundary.

**Example Response Snippet (Focusing on the Polygon):**

```json
{
  "destinations": [
    {
      "primary": {
        "place": "places/ChIJY8sv5-i2j4AR_S6BlDDR42w",
        "structureType": "BUILDING",
        "displayPolygon": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                -122.056930138027,
                37.3735253692531
              ],
              [
                -122.056960139391,
                37.3735372663597
              ],
              // ... list of [longitude, latitude] pairs defining the building outline ...
              [
                -122.056930138027,
                37.3735253692531
              ]
            ]
          ]
        }
      }
    }
  ]
}
```

### Gotchas

*   **Mandatory Field Mask**: Failing to include the `X-Goog-FieldMask` header will result in an error or an empty response body, as there is no default set of returned fields (Section: FieldMask).
*   **Unsupported Place IDs**: The method works best with Place IDs representing specific, navigable destinations such as `establishment`, `point_of_interest`, or `street_address`. Place IDs for large political entities (Cities, States) or inferred address ranges are **not** supported (Section: Supported Place IDs).
*   **Coordinate Order**: The coordinates within the `displayPolygon` are ordered as **\[Longitude, Latitude]**, which is standard GeoJSON format, but may require reversing if integrating with mapping libraries that expect **\[Latitude, Longitude]**.

### References

*   SearchDestinations documentation: `https://developers.google.com/maps/documentation/geocoding/search-for-destinations`
*   Geocoding API Field Mask guide: `https://developers.google.com/maps/documentation/geocoding/choose-fields`
*   SearchDestinations API Reference: `https://developers.google.com/maps/documentation/geocoding/reference/rest/v4/geocode.destinations/searchDestinations`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.

### Error & Exception Handling (Web API & Python SDK)

Although the primary method for retrieving building outlines is a direct REST API call (web_api), robust client libraries often implement essential operational best practices like retry logic and rate limiting handling.

- [ ] **Trigger Condition**: When communicating best practices for reliable API calls, troubleshooting intermittent failures, or discussing rate limits or server errors (HTTP 500/503/504).
- [ ] **Verification Checkpoint**: Confirm the implementation incorporates retry logic for transient errors and handles rate limiting.

#### Mandatory Error Handling and Retries

For high-volume Geocoding requests, the Python SDK demonstrates the pattern of automatically retrying requests that fail due to transient server errors (HTTP 500, 503, 504) or rate limiting (`OVER_QUERY_LIMIT`). This retry mechanism typically uses **Exponential Backoff** logic, pausing for an increasing duration between attempts.

When using any client library or proxy layer to access the Geocoding API, ensure the following exceptions are handled:

1.  **Transient Server Errors**: Errors like HTTP 500, 503, or 504 should trigger an automatic retry loop.
2.  **Rate Limiting**: The client must identify and handle `OVER_QUERY_LIMIT` or `RESOURCE_EXHAUSTED` responses, classifying them as retriable requests unless explicitly configured otherwise.

**Pattern for Retriable Failures (Client Logic):**

```python
# excerpt from googlemaps/client.py Client._request

# Retry based on specific HTTP status codes
if response.status_code in _RETRIABLE_STATUSES: # {500, 503, 504}
    # Retry request.
    return self._request(url, params, first_request_time,
                         retry_counter + 1, ...)

# ...

except googlemaps.exceptions._RetriableRequest as e:
    # This catch includes errors like _OverQueryLimit (rate limit exceeded)
    if isinstance(e, googlemaps.exceptions._OverQueryLimit) and not self.retry_over_query_limit:
        raise

    # Retry request due to retriable exception
    return self._request(url, params, first_request_time,
                         retry_counter + 1, ...)
```

#### Gotchas

*   **Mandatory Field Mask**: Failing to include the `X-Goog-FieldMask` header will result in an error or an empty response body, as there is no default set of returned fields (Section: FieldMask).
*   **Unsupported Place IDs**: The method works best with Place IDs representing specific, navigable destinations such as `establishment`, `point_of_interest`, or `street_address`. Place IDs for large political entities (Cities, States) or inferred address ranges are **not** supported (Section: Supported Place IDs).
*   **Coordinate Order**: The coordinates within the `displayPolygon` are ordered as **[Longitude, Latitude]**, which is standard GeoJSON format, but may require reversing if integrating with mapping libraries that expect **[Latitude, Longitude]**.
