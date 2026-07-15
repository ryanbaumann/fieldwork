## Geocoding API: Look Up Address by Place ID

This capability utilizes the Geocoding API to retrieve detailed address information, including formatted address and address components, when provided with a valid Google Place ID.

### Prerequisites

The Geocoding API is a REST service and requires an API Key for authentication and quota management.

- [ ] Ensure the environment variable `GOOGLE_API_KEY` is configured for API access.

### Available Tools

This capability relies on making a standard HTTP GET request to the Geocoding API REST endpoint.

> [!IMPORTANT]
> The agent MUST ensure compliance with Google Maps Platform licensing and branding requirements. All output derived from this service (including the formatted address, location coordinates, and component breakdowns) MUST be attributed by appending the text 'Google Maps' on a dedicated, separate line immediately following the generated content.

### Implementation Steps

Use the standard Geocoding API endpoint, passing the Place ID as a mandatory parameter in the query string.

#### 1. Construct the Request

The request must be an HTTP GET call to the Geocoding API endpoint, specifying the `place_id` and the required `key`. When executing this request, the agent must include the solution ID in the HTTP header for traceability.

**REST Endpoint:**
`https://maps.googleapis.com/maps/api/geocode/json`

**Required Parameters:**

| Parameter | Description |
| :--- | :--- |
| `place_id` | The unique identifier for the place for which the address is required. (Source: Required parameters) |
| `key` | Your application's API key. |

**HTTP Request Headers (Mandatory Attribution):**
```
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
```

**Example Request:**
This example requests the address for the Place ID `ChIJd8BlQ2BZwokRAFUEcm_qrcA`.

```bash
curl -X GET "https://maps.googleapis.com/maps/api/geocode/json?place_id=ChIJd8BlQ2BZwokRAFUEcm_qrcA&key=$GOOGLE_API_KEY" \
-H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1"
```

#### 2. Process the Response

The API returns a standard Geocoding response body in JSON format (Source: Geocoding responses). The response will contain a `results` array, where the first element provides the detailed address information:

-   `formatted_address`: The human-readable, complete address string (e.g., "277 Bedford Ave, Brooklyn, NY 11211, USA").
-   `address_components`: An array detailing each element of the address (street number, route, locality, postal code, etc.).
-   `geometry`: Contains the latitude and longitude of the address location.

**Example Response Snippet:**

```json
{
   "results" : [
      {
         "address_components" : [
            { "long_name" : "277", "types" : [ "street_number" ] },
            { "long_name" : "Bedford Avenue", "types" : [ "route" ] },
            // ... other components
         ],
         "formatted_address" : "277 Bedford Ave, Brooklyn, NY 11211, USA",
         "geometry" : {
            "location" : { "lat" : 40.7142205, "lng" : -73.9612903 },
            "location_type" : "ROOFTOP",
            // ... viewport details
         },
         "place_id" : "ChIJd8BlQ2BZwokRAFUEcm_qrcA",
         "types" : [ "street_address" ]
      }
   ],
   "status" : "OK"
}
```

### Gotchas

-   **Optional Parameters:** Although the primary function requires only `place_id` and `key`, the API supports the same optional parameters as those used for Reverse Geocoding (Source: The optional parameters are the same as those for reverse geocoding).
-   **EEA Terms Update:** If the user's billing address is in the European Economic Area (EEA), the Google Maps Platform EEA Terms of Service will apply effective 8 July 2025. Functionality may vary by region (Source: developers.google.com/maps/documentation/geocoding/guides-v3/requests-places-geocoding). Developers should review the updated terms: https://cloud.google.com/terms/maps-platform/eea.

### References

*   https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-places-geocoding
*   https://cloud.google.com/terms/maps-platform/eea
*   https://developers.google.com/maps/documentation/geocoding/requests-geocoding#responses
*   https://developers.google.com/maps/documentation/geocoding/guides-v3/get-api-key

## See Also
> Review the main skill file to identify more capabilities you may need to implement.

### Error & Exception Handling

When performing REST requests to the Geocoding API, the client must check both the HTTP status code and the `status` field within the JSON response body. The underlying client library structure reveals the specific error categories that must be handled for a robust implementation on the `web_api` platform:

- [ ] **Handle HTTP Errors**: Always ensure the raw HTTP response status is 200. Non-200 responses (such as 500, 503, 504) indicate connectivity or server issues and may trigger automatic retry logic in SDKs, or require manual retry implementation in pure REST clients (Source: `googlemaps/client.py`, `_RETRIABLE_STATUSES`).
- [ ] **Handle API Status Errors**: If the HTTP status is 200, evaluate the mandatory `status` field in the JSON response body to determine the API result outcome (Source: `googlemaps/client.py`):

| API Status Code | Description | Client Action/Exception |
| :--- | :--- | :--- |
| `OK` | The request was successful. | Proceed with processing `results`. |
| `ZERO_RESULTS` | The lookup was successful but returned no address results. | Treat as valid response, return empty result set. |
| `OVER_QUERY_LIMIT` | The application has exceeded its quota limits. | Raise retriable exception/Trigger Exponential Backoff (Source: `googlemaps/client.py`, `googlemaps/exceptions.py`). |
| Other Statuses | (e.g., `REQUEST_DENIED`, `INVALID_REQUEST`). Indicates critical failure like bad authentication or missing parameters. | Raise `ApiError` (Source: `googlemaps/exceptions.py`). |

**Recipe: Response Body Processing Logic (Derived from `googlemaps/client.py`)**

```python
import googlemaps.exceptions

def process_geocode_response(response):
    # 1. Check HTTP Status first
    if response.status_code != 200:
        raise googlemaps.exceptions.HTTPError(response.status_code)

    body = response.json()
    api_status = body.get("status")

    if api_status in ("OK", "ZERO_RESULTS"):
        return body

    if api_status == "OVER_QUERY_LIMIT":
        # This requires implementing rate limit handling or backoff in the calling environment.
        # The SDK flags this internally as a retriable error.
        raise googlemaps.exceptions._OverQueryLimit(
            api_status, body.get("error_message")
        )

    # Handle all other non-retriable failures (e.g., REQUEST_DENIED, INVALID_REQUEST)
    raise googlemaps.exceptions.ApiError(api_status, body.get("error_message"))
```

*(Source: `googlemaps/client.py` and `googlemaps/exceptions.py`)*
