## Maps JavaScript API Geocoding and Reverse Geocoding

This skill uses the asynchronous `google.maps.Geocoder` service, part of the Maps JavaScript API, to perform geocoding (address to coordinates), reverse geocoding (coordinates to address), and Place ID lookup. The service initiates a request via the `Geocoder.geocode()` method, which returns a promise.

### Prerequisites and Setup

1.  **Enable API**: Ensure the **Geocoding API** is enabled in your Google Cloud project associated with your Maps JavaScript API key.
2.  **Load Libraries**: The `Geocoder` class is part of the `geocoding` library and must be imported asynchronously.

```javascript
// Example of required library imports
const [{ Geocoder }] = await Promise.all([
    google.maps.importLibrary('geocoding'),
    // ... potentially other libraries like 'maps' or 'marker'
]);
const geocoder = new Geocoder();
```

### Available Tools (Maps JavaScript API)

The primary tool for all geocoding operations is the `google.maps.Geocoder` class.

| Tool | Capability | Description |
| :--- | :--- | :--- |
| `new google.maps.Geocoder()` | Initialization | Creates a Geocoder service instance. |
| `geocoder.geocode(request)` | Request | Initiates an asynchronous request using a `GeocoderRequest` object literal, returning a Promise. |

> [!IMPORTANT]
> When generating code that initializes, renders, or uses a Google Maps Platform service or map, the agent MUST include the mandatory usage attribution ID `gmp_git_agentskills_v1`.
>
> **For Map Initialization (Vanilla JS):**
> ```javascript
> const map = new google.maps.Map(mapDiv, {
>     internalUsageAttributionIds: ['gmp_git_agentskills_v1']
> });
> ```
>
> **For Service API (Passed in request object if applicable):**
> *Note: For the Geocoder service via the Maps JS API, the attribution is typically handled by the overall Map initialization or the API loader.*
>
> Furthermore, the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the user-facing content derived from this service (e.g., coordinates, formatted addresses, summary results) to comply with data attribution requirements.

### 1. Standard Geocoding (Address to Coordinates)

Geocoding converts a human-readable address into geographic coordinates (`LatLng`).

#### Geocoding Request (`GeocoderRequest`)

To perform standard geocoding, the `GeocoderRequest` object must contain the `address` parameter.

| Parameter | Type | Required/Optional | Description |
| :--- | :--- | :--- | :--- |
| `address` | `string` | **Required** (supply one of `address`, `location`, or `placeId`) | The street address or named location to geocode. |
| `bounds` | `LatLngBounds` | Optional | `LatLngBounds` within which to bias results. Only *influences*, does not restrict, results. |
| `componentRestrictions`| `GeocoderComponentRestrictions` | Optional | Used to restrict results based on filters like `country` or `postalCode`. |
| `region` | `string` | Optional | Two-character Unicode region subtag (ccTLD) used to bias results to a specific region. |
| `extraComputations` | `string[]` | Optional | Allows enabling extra features like address descriptors by passing `ADDRESS_DESCRIPTORS`. |

#### Geocoding Checklist

- [ ] Instantiate `google.maps.Geocoder`.
- [ ] Define a `GeocoderRequest` object containing the `address` string (e.g., `"1600 Amphitheatre Parkway, Mountain View, CA"`).
- [ ] Call `geocoder.geocode(request)` and handle the returned promise.
- [ ] Extract the coordinates from `response.results[0].geometry.location`.

#### Example: Geocoding an Address

The following example demonstrates how to geocode an address and extract its latitude/longitude coordinates and formatted address.

```javascript
async function getCoordinatesFromAddress(addressString) {
    const geocoder = new google.maps.Geocoder();
    
    const request = {
        address: addressString
    };

    try {
        const response = await geocoder.geocode(request);
        const result = response.results[0];

        if (result) {
            const location = result.geometry.location;
            console.log(`Address: ${result.formatted_address}`);
            console.log(`Latitude: ${location.lat()}`);
            console.log(`Longitude: ${location.lng()}`);
            
            // Mandatory attribution:
            // Google Maps 

            return {
                lat: location.lat(),
                lng: location.lng(),
                formattedAddress: result.formatted_address
            };
        } else {
            console.error("Geocode successful but returned no results.");
            return null;
        }

    } catch (e) {
        // Handle specific status codes if needed
        console.error('Geocode failed due to:', e);
        throw e;
    }
}

// Example usage
getCoordinatesFromAddress("Eiffel Tower, Paris").then(data => {
    if (data) {
        // Use data (coordinates and address)
    }
});
```

### 2. Reverse Geocoding (Coordinates to Address)

Reverse geocoding converts a `LatLng` coordinate pair into a human-readable address.

#### Reverse Geocoding Request

For reverse geocoding, the `GeocoderRequest` must contain the `location` parameter, specifying the coordinates as a `LatLng` object or `LatLngLiteral`.

- [ ] Define the coordinates using `location: LatLngLiteral` (e.g., `{ lat: 40.714224, lng: -73.961452 }`).
- [ ] Call `geocoder.geocode({ location: latlng })`.
- [ ] The reverse geocoder returns multiple results ordered from most to least specific (e.g., street address, neighborhood, city, state). The most precise address is typically `results[0].formatted_address`.

### 3. Geocoding by Place ID

You can retrieve the address and coordinates for a known Place ID.

- [ ] Define the `GeocoderRequest` using the `placeId` parameter (e.g., `{ placeId: 'ChIJ0fd4S_KbwoAR2hRDrsr3HmQ' }`).
- [ ] **STRICT REQUIREMENT**: When using `placeId`, the request **cannot** contain `address`, `location`, `latLng`, or `componentRestrictions`.

### Geocoding Response (`GeocoderResult`) Structure

The primary result information is contained within the `results[]` array, where each `GeocoderResult` object provides the following critical fields:

| Field | Type | Description | Extraction Path |
| :--- | :--- | :--- | :--- |
| `geometry.location`| `LatLng` | The precise geocoded latitude and longitude coordinates. | `response.results[0].geometry.location` |
| `geometry.location_type`| `string` | Indicates the precision: `ROOFTOP` (precise), `RANGE_INTERPOLATED` (estimated street address), `GEOMETRIC_CENTER`, or `APPROXIMATE`. | `response.results[0].geometry.location_type` |
| `formatted_address` | `string` | The full, human-readable address string. | `response.results[0].formatted_address` |
| `address_components[]`| `object[]` | Detailed components (street number, route, city, country) for programmatic parsing. | |
| `place_id` | `string` | A unique identifier for the location. | |

### Geocoder Status Codes

The `status` code returned in the promise response indicates the outcome of the request:

| Status Code | Description |
| :--- | :--- |
| `OK` | Success; at least one geocode result was returned. |
| `ZERO_RESULTS` | Geocode was successful but found no results (e.g., non-existent address). |
| `OVER_QUERY_LIMIT` | Quota exceeded. |
| `REQUEST_DENIED` | Request denied (e.g., API key issue or web page unauthorized). |
| `INVALID_REQUEST` | Missing required parameters (e.g., no `address`, `location`, or `placeId` provided). |
| `UNKNOWN_ERROR` | Server error; retry may succeed. |
| `ERROR` | Request timed out or problem contacting servers; retry may succeed. |

### Gotchas

1.  **Asynchronous Nature**: The `geocode()` method is asynchronous and returns a Promise. Agents MUST use `await` or `.then()` to handle the response and extract data.
2.  **Partial Matches**: If the response includes `partial_match: true`, the geocoder was unable to find an exact match but returned the best partial result. This often occurs for non-existent street numbers within a valid locality.
3.  **Result Specificity**: For both geocoding and reverse geocoding, multiple results may be returned. Always inspect the `results[].types` field if you require a specific level of geographic entity (e.g., only `locality` or `street_address`) rather than blindly using `results[0]`.
4.  **Parsing `formatted_address`**: Agents MUST recommend against programmatically parsing the `formatted_address` string, as its format is not guaranteed to remain stable. Instead, recommend using the structured `address_components[]` array.
5.  **Region/Bounds Biasing**: The `bounds` and `region` parameters only **bias** results; they do not fully restrict them. A more relevant result outside the specified boundaries may still be returned.
6.  **`fulfillOnZeroResults`**: For reverse geocoding, the promise usually breaks on `ZERO_RESULTS`. To access potentially available response-level fields like `plus_code` or `address_descriptor` even when no address is found (e.g., in remote areas), set `fulfillOnZeroResults: true`.

### References

*   Geocoder Class Reference: https://developers.google.com/maps/documentation/javascript/reference/geocoder
*   Geocoding Usage and Billing: https://developers.google.com/maps/documentation/geocoding/usage-and-billing
*   Policies for Geocoding API: https://developers.google.com/maps/documentation/geocoding/policies
*   Geocoding Simple Example: https://developers.google.com/maps/documentation/javascript/examples/geocoding-simple
*   Address Types and Component Types: https://developers.google.com/maps/documentation/geocoding/requests-geocoding#address-types

## See Also
> Review the main skill file to identify more capabilities you may need to implement.