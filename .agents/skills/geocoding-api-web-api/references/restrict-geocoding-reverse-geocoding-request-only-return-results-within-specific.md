# Geocoding and Reverse Geocoding Restriction and Biasing (Web API)

This capability focuses on refining Geocoding API searches to prioritize or strictly limit results to a defined geographical area, such as a country, region, or postal code boundary.

## Prerequisites

To use the Geocoding API, you need a Google Maps Platform API key. This key must be included in every request via the required `key` parameter.

```bash
# Example environment variable setup (required for tool execution):
export GOOGLE_API_KEY="YOUR_API_KEY"
```

## Available Tool
| Tool Name | Endpoint | Description |
| :--- | :--- | :--- |
| Geocoding API | `https://maps.googleapis.com/maps/api/geocode/json?parameters` | Performs geocoding (address to coordinates) and incorporates filters and biases. |

> [!IMPORTANT]
> The agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## 1. Strictly Restricting Results (Component Filtering)

Use the `components` optional parameter to enforce restrictions based on certain address elements, fully limiting the returned results. The `components` parameter accepts a pipe-separated (`|`) list of `component:value` pairs.

### 1.1 Components that Fully Restrict Results

The following component types fully restrict the geocoder's output, meaning no results outside this defined area will be returned:

| Component | Value Format | Description |
| :--- | :--- | :--- |
| `country` | Country name or two-letter ISO 3166-1 country code (recommended). | Restricts results to the specified country. |
| `postal_code` | Specific postal code or postal code prefix. | Restricts results to the specified postal area. |

### 1.2 Implementation Checklist

- [ ] Determine the target component (`country` or `postal_code`) and its exact value (e.g., `country:GB` for United Kingdom).
- [ ] Construct the request, including the required `address` or a full set of `components` that define the address (e.g., `locality:santa+cruz`).
- [ ] Separate multiple component filters using the pipe character (`|`). Note that filters are evaluated as an `AND` operation.
- [ ] Include the solution ID header (`X-Goog-Maps-Solution-ID`) for standard REST calls.

### 1.3 Example: Restricting by Country

Retrieve the geocode for "High St, Hastings" but only results found within the United Kingdom (`GB`).

```text
https://maps.googleapis.com/maps/api/geocode/json?address=high+st+hasting&components=country:GB&key=YOUR_API_KEY
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
```

### 1.4 Example: Restricting by Multiple Components (Country and Locality)

Retrieve the locality "Santa Cruz" only if it is located in Spain (`ES`). If the `address` parameter is not used, the `components` filter is mandatory.

```text
https://maps.googleapis.com/maps/api/geocode/json?components=locality:santa+cruz|country:ES&key=YOUR_API_KEY
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
```

## 2. Biasing Results (Soft Influence)

Use `region` or `bounds` parameters when you want to influence the geocoder to return results relevant to a specific area first, without strictly excluding all results outside that area.

### 2.1 Region Biasing

The `region` parameter influences the geocoder to favor results within a specified domain.

| Parameter | Value Format | Description |
| :--- | :--- | :--- |
| `region` | A two-character ccTLD (country code top-level domain). | Biases results toward a specific country/region. This can also affect results based on applicable law. |

**Example: Biasing for Spain**

Geocoding the ambiguous query "Toledo" using the `region=es` parameter biases the result to Toledo, Spain, rather than Toledo, Ohio, USA (which is the default bias).

```text
https://maps.googleapis.com/maps/api/geocode/json?address=Toledo&region=es&key=YOUR_API_KEY
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
```

### 2.2 Viewport Biasing

The `bounds` parameter biases results to locations within a defined latitude/longitude bounding box.

| Parameter | Value Format | Description |
| :--- | :--- | :--- |
| `bounds` | `southwest_lat,southwest_lng|northeast_lat,northeast_lng` | Biases results toward a specific rectangular viewport. |

**Example: Biasing for the Northeastern U.S.**

Geocoding the ambiguous query "Washington" using bounds around the Northeastern U.S. (e.g., `36.47,-84.72|43.39,-65.90`) biases the result toward Washington, D.C.

```text
https://maps.googleapis.com/maps/api/geocode/json?address=Washington&bounds=36.47,-84.72%7C43.39,-65.90&key=YOUR_API_KEY
X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1
```

## Gotchas

1.  **Restriction vs. Biasing:** The `components` filter (specifically `country` and `postal_code`) *fully restricts* results. `region` and `bounds` only *influence* results, meaning locations outside the specified area may still be returned if they are deemed more relevant.
2.  **Conflicting Filters:** Do not repeat the same component filter (`country`, `postal_code`, `route`) in a single request, or the API will return `INVALID_REQUEST`.
3.  **Source Duplication:** Do not specify the same address element in both the `address` parameter and the `components` filter. Doing so may result in `ZERO_RESULTS`.
4.  **ccTLD vs. ISO Codes:** While `region` uses the two-character ccTLD, the `components:country` filter works best when using the two-letter ISO 3166-1 country code (e.g., `GB` for the United Kingdom, which has the ccTLD `uk`).

### References

*   [Component filtering](https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-geocoding?utm_source=gmp_git_agentskills_v1#component-filtering)
*   [Region biasing](https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-geocoding?utm_source=gmp_git_agentskills_v1#RegionCodes)
*   [Viewport Biasing](https://developers.google.com/maps/documentation/geocoding/guides-v3/requests-geocoding?utm_source=gmp_git_agentskills_v1#Viewports)
*   [List of ISO 3166 country codes](https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes?utm_source=gmp_git_agentskills_v1)
*   [Geocoding API Request](https://maps.googleapis.com/maps/api/geocode/outputFormat?parameters)

## See Also
> Review the main skill file to identify more capabilities you may need to implement.

### Error & Exception Handling

Robust handling of restriction and biasing parameters requires managing both client-side input types and server-side responses, especially those detailed in the "Gotchas" section of the capability guide.

#### 1. Client-Side Input Validation

When specifying complex parameters like `components` (for restriction) or `bounds` (for biasing), the Python client validates the input type. If an incorrect type is provided (e.g., passing a list instead of a dictionary for components), a `TypeError` is raised before the HTTP request is made.

```python
from googlemaps import convert

# Example of client-side validation for components:

# Valid usage:
components_filter = {"country": "US", "postal_code": "94043"}
# Result: 'country:US|postal_code:94043'

# Invalid usage (raises TypeError):
try:
    convert.components("country:US")
except TypeError as e:
    print(f"Client-side error: {e}")
# Expected output when TypeError occurs:
# Expected a dict for components, but got str
```

#### 2. Server-Side API Status Errors

Server errors related to parameter conflicts (Gotcha #2: `INVALID_REQUEST`) or other API failures are returned as `ApiError` exceptions by the client, containing the status code and any explanatory message.

Responses resulting in `ZERO_RESULTS` (Gotcha #3: often caused by overly restrictive or duplicate parameters, e.g., specifying an address element in both `address` and `components`) are explicitly returned by the client as valid, empty responses without raising an exception.

```python
from googlemaps.exceptions import ApiError, _OverQueryLimit

# Core client logic demonstrating API status mapping:

# Inside client._get_body(response):
# ...
api_status = body["status"]

if api_status == "OK" or api_status == "ZERO_RESULTS":
    # Returns successfully, handle empty results in calling code
    return body

if api_status == "OVER_QUERY_LIMIT":
    raise _OverQueryLimit(api_status, body.get("error_message"))

# Other failures, including INVALID_REQUEST from conflicting filters:
raise ApiError(api_status, body.get("error_message"))
```
