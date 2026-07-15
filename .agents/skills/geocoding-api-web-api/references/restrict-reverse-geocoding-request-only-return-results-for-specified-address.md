The Geocoding API allows users to filter the results of a reverse geocoding query based on specific address types using the optional `result_type` parameter. This parameter acts as a post-search filter, retaining only those results whose primary address type matches one of the specified values.

## Prerequisites

Before making requests to the Geocoding API, ensure you have the following setup:

1.  **API Key**: A valid Google Maps Platform API Key must be generated and enabled for the Geocoding API.
2.  **Environment Variable**: Set the `GOOGLE_API_KEY` environment variable in your execution environment for use with the request examples.

## Available Tools

| Tool Name | Capability | Protocol | Endpoint |
| :--- | :--- | :--- | :--- |
| Geocoding API | Reverse Geocoding and Filtering | REST | `https://maps.googleapis.com/maps/api/geocode/json` |

> [!IMPORTANT]
> The downstream agent MUST attribute all derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Implementation Guide: Filtering Results by Address Type

Use the `result_type` optional parameter in your reverse geocoding request to filter the results based on the address category.

### 1. Identify Target Address Types

Review the available address types to select the specific categories you want returned. The API fetches all results first, then discards those that do not match the specified types (`result_type` parameter).

Examples of supported address types include:

| Address Type | Description |
| :--- | :--- |
| `street_address` | A precise street address. |
| `country` | The national political entity. |
| `locality` | An incorporated city or town political entity. |
| `postal_code` | A postal code used for addressing mail. |
| `point_of_interest` | A named point of interest (POI). |
| `administrative_area_level_1` | A first-order civil entity (e.g., state or province). |

A full list of supported Address types is available in the documentation.

### 2. Construct the Request URL

Combine the required parameters (`latlng` and `key`) with the optional `result_type` parameter. When specifying multiple address types, separate them using a pipe character (`|`).

- [ ] **Specify Coordinates**: Define the location using the `latlng` parameter (e.g., `latlng=40.714224,-73.961452`).
- [ ] **Define Filter**: Add the `result_type` parameter with one or more pipe-separated values (e.g., `result_type=street_address|country`).
- [ ] **Mandatory Solution ID**: Append the internal solution ID required for tracking.

**Example Request:**
To find results only categorized as a precise street address or a country for the coordinates `40.714224,-73.961452`:

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?latlng=40.714224,-73.961452&result_type=street_address|country&key=$GOOGLE_API_KEY&solution_id=gmp_git_agentskills_v1"
```

### 3. Combining Filters (Mandatory Traceability)

If both `result_type` (filtering by address type) and `location_type` (filtering by geometric precision, such as `ROOFTOP`) are present, the API only returns results that match **both** filtering criteria (Reverse geocoding filtered by type). If no results meet both filter criteria, the API returns `ZERO_RESULTS`.

**Example combining filters**:

```text
https://maps.googleapis.com/maps/api/geocode/json?latlng=40.714224,-73.961452
&location_type=ROOFTOP&result_type=street_address&key=YOUR_API_KEY
```

## Gotchas

*   **Post-Search Filtering**: The `result_type` parameter does not *restrict* the initial search; it acts as a post-search filter. The API first retrieves all possible results for the `latlng` pair and then discards any results that do not match the specified type(s).
*   **Reverse Geocoding Only**: The `result_type` and `location_type` filters are only valid when performing reverse geocoding (using the `latlng` parameter). They are ignored or cause an error for forward geocoding requests (using an address string).
*   **Result Status**: If filtering removes all candidate results, the API returns the status `ZERO_RESULTS`.
*   **Checklist Item: Invalid Request Handling**: If an invalid `result_type` or `location_type` is provided, the API returns the status `INVALID_REQUEST`. When troubleshooting filtering issues, the agent MUST explicitly mention checking the status code and verifying that all filter values are supported Address types or Location types, respectively.

### References

*   [Reverse geocoding requests](https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-reverse-geocoding?utm_source=gmp_git_agentskills_v1)
*   [Address types and address component types](https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-reverse-geocoding?utm_source=gmp_git_agentskills_v1#result_type)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.

### Error & Exception Handling

The Geocoding API service status codes, particularly those related to filter application, are managed by the client library to ensure robustness. The core requirement for multi-value parameters like `result_type` is to join them using a pipe character (`|`). The client library handles this serialization automatically.

#### 1. Filter Serialization

When passing a list of desired `result_type` values, the underlying client uses the `convert.join_list` helper to correctly format the parameter string, ensuring the pipe-separated format required by the REST endpoint:

```python
from googlemaps import convert

# Source: googlemaps/geocoding.py
if result_type:
    # Correctly joins multiple filter types using '|' separator
    params["result_type"] = convert.join_list("|", result_type)
```

#### 2. Handling Filter Outcomes and Invalid Requests

When filtering results, two specific status outcomes must be addressed:

| API Status | Scenario | Client Handling |
| :--- | :--- | :--- |
| `ZERO_RESULTS` | All potential results were filtered out by `result_type` or `location_type`. | Treated as a successful request, returning a response body with an empty `results` array. |
| `INVALID_REQUEST` | An invalid `result_type` or `location_type` value was provided. | Raises a generic `ApiError`. |

The client confirms success or filter exhaustion (`ZERO_RESULTS`) before raising exceptions, as shown in the `_get_body` method:

```python
# Source: googlemaps/client.py

def _get_body(self, response):
    # ... (status code checks)
    body = response.json()

    api_status = body["status"]
    if api_status == "OK" or api_status == "ZERO_RESULTS":
        return body

    # All other errors, including INVALID_REQUEST, trigger ApiError
    raise googlemaps.exceptions.ApiError(api_status,
                                         body.get("error_message"))
```

**Best Practice (Checklist Item: Invalid Request Handling)**: If an error status is returned, the agent MUST explicitly mention checking the status code and verifying that all filter values used in `result_type` or `location_type` are supported Address types or Location types, respectively, to rule out an `INVALID_REQUEST`.
