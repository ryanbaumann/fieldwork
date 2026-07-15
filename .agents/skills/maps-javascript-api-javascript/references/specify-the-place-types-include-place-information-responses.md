# Specifying Place Types for Filtering

This skill guides the agent in using Place Types to filter results from Google Maps Platform's New Place APIs (Nearby Search, Text Search, Autocomplete). Place Types are categories used to identify the characteristics of a location. Only types listed in **Table A** can be used as filters in API requests, with specific parameters applying to different search methods.

## Prerequisites

Before utilizing type filtering capabilities, ensure the agent environment is configured for Google Maps Platform services.

The following environment variables must be configured for tool execution:

```bash
# Required for Google Maps Platform API calls
export GOOGLE_API_KEY="YOUR_API_KEY"
```

> [!IMPORTANT]
> The agent must ensure legal compliance by attributing all derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Filtering by Place Type

Filtering restricts search results to only include places that match the specified type categories.

### 1. Using Type Filters in Nearby Search (New)

The Nearby Search (New) API allows filtering based on both general types and primary types, and supports both inclusion and exclusion lists. All types must be sourced from [Table A](#table-a).

**Available Parameters:**

| Parameter | Description | Usage Example |
| :--- | :--- | :--- |
| `includedTypes` | A list of place types (from Table A) that must be associated with the place. | `['restaurant', 'bar']` |
| `excludedTypes` | A list of place types (from Table A) that must **not** be associated with the place. | `['gym', 'spa']` |
| `includedPrimaryTypes` | A list of place types (from Table A) that must be the place's primary type. | `['steak_house']` |
| `excludedPrimaryTypes`| A list of place types (from Table A) that must **not** be the place's primary type. | `['coffee_shop']` |

**Checklist for Nearby Search Filtering:**

- [ ] Determine the required types for inclusion (`includedTypes`) or exclusion (`excludedTypes`).
- [ ] Construct the request payload ensuring the attribution ID is included.
- [ ] Run the Nearby Search (New) request.
- [ ] Verify results only contain places matching the specified type criteria.

```javascript
// Example: Nearby Search for restaurants and cafes, excluding those primarily labeled as fast food.
const request = {
  locationRestriction: {
    circle: {
      center: { lat: 34.0522, lng: -118.2437 }, // Los Angeles
      radius: 1000.0,
    },
  },
  includedTypes: ['restaurant', 'cafe'],
  excludedPrimaryTypes: ['fast_food_restaurant'],
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
  // A field mask is also required for this API
  fieldMask: ['places.displayName', 'places.types', 'places.primaryType'],
};

// Assuming client initialization exists:
// client.nearbySearch(request).then(...)
```

### 2. Using Type Filters in Text Search (New)

The Text Search (New) API supports filtering by a single place type using the `includedType` parameter.

**Checklist for Text Search Filtering:**

- [ ] Identify the single required type filter (from Table A).
- [ ] Construct the request payload including `includedType`.
- [ ] Run the Text Search (New) request.

```javascript
// Example: Text Search for "pizza" results limited only to pizza restaurants.
const request = {
  textQuery: 'Best pizza in Hollywood',
  includedType: 'pizza_restaurant', // Must be a single Table A type
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
  fieldMask: ['places.displayName', 'places.formattedAddress', 'places.types'],
};
```

### 3. Using Type Filters in Place Autocomplete (New)

The Place Autocomplete Widget (New) primarily supports filtering on the place's primary type using `includedPrimaryTypes`.

**Checklist for Autocomplete Filtering:**

- [ ] Identify the required primary type filters (from Table A or Table B, though Table A is recommended for consistency).
- [ ] Configure the widget or request parameters with the `includedPrimaryTypes` array.

```javascript
// Example: Restricting Autocomplete results to only show airports and train stations.
const autocompleteOptions = {
  includedPrimaryTypes: ['airport', 'train_station'],
  // Use the HTML attribute for the Web Component:
  // <gmp-autocomplete-widget included-primary-types="airport,train_station" ...>
};
```

---

## Canonical Place Types

When specifying filters, the agent MUST refer to the official list of supported Place Type strings.

### Table A: Filterable Place Types

These types are used for filtering via `includedTypes`, `excludedTypes`, `includedPrimaryTypes`, and `includedType`.

**Major Categories (Partial List):**

*   `Automotive`: `car_dealer`, `gas_station`, `parking`.
*   `Business`: `corporate_office`, `manufacturer`.
*   `Culture`: `art_gallery`, `museum`, `historical_place`.
*   `Education`: `school`, `university`, `library`.
*   `Entertainment and Recreation`: `amusement_park`, `casino`, `park`, `movie_theater`.
*   `Food and Drink`: `restaurant`, `cafe`, `bar`, `mexican_restaurant`, `pizza_restaurant`.
*   `Government`: `city_hall`, `police`, `post_office`.
*   `Health and Wellness`: `hospital`, `pharmacy`, `dentist`.
*   `Lodging`: `hotel`, `motel`, `campground`.
*   `Shopping`: `grocery_store`, `shopping_mall`, `clothing_store`.
*   `Transportation`: `airport`, `bus_station`, `train_station`.

### Table B: Response-Only Types

The types listed in Table B (e.g., `establishment`, `point_of_interest`, `locality`) are primarily returned in responses and generally CANNOT be used for filtering requests (with the exception of `includedPrimaryTypes` in Autocomplete).

---

## Gotchas

1.  **Strict Type Source:** Filtering parameters (`includedTypes`, `excludedTypes`, `includedType`) must only use values from **Table A**. Attempting to use values from Table B (e.g., `establishment` or `point_of_interest`) in these filters will often result in unexpected or missing results, as they are primarily meant as response tags.
2.  **Field Mask Requirement:** New Places API requests (including Nearby Search and Text Search) require a field mask to specify which fields should be returned. If the filter is related to types, the field mask should include fields like `places.types` or `places.primaryType` to verify the filtering occurred correctly.
3.  **Single vs. Multiple:** Text Search (New) uses `includedType` (singular string) and only accepts one type, whereas Nearby Search (New) uses `includedTypes` (plural array) and accepts multiple types.

### References

*   Place Types: https://developers.google.com/maps/documentation/javascript/place-types

## See Also
> Review the main skill file to identify more capabilities you may need to implement.