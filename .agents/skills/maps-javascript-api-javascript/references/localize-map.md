# Maps JavaScript API Localization

This skill details how to localize the Maps JavaScript API to a specific country, region, or language by configuring parameters in the API bootstrap script tag. This localization affects the visual presentation of the map (tile sets) and the behavior of associated services (such as Geocoding and Places Autocomplete).

## Prerequisites

To apply localization, the agent must modify the primary script tag used to load the Maps JavaScript API:

```html
<script async
    src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&loading=async&callback=initMap">
</script>
```

> [!IMPORTANT]
> ALL derived output content (single facts, distances, routes, summarized lists) must be attributed by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Implementation Steps: Localizing the Map

Localization requires setting two primary URL parameters: `language` and `region`.

### 1. Language Localization (`language`)

Use the `language` parameter to override the user's browser default and force the Maps JavaScript API to display textual information (controls, copyright notices, driving directions, and map labels) in a specific language.

- [ ] **Determine Language Code:** Identify the appropriate language code (e.g., `ja` for Japanese, `ar` for Arabic). The list of supported languages is often updated (See References).
- [ ] **Configure Script Tag:** Add the `language` parameter to the Maps JavaScript API load URL.

**Example: Setting the map language to Arabic (`ar`)**

```html
<script async
    src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&loading=async&language=ar&callback=initMap">
</script>
```

### 2. Region Localization (`region`)

Use the `region` parameter to alter the map's behavior, particularly concerning service results and the map tiles rendered, based on a country or territory. **It is the developer's responsibility to set this parameter to ensure compliance with local laws.**

- [ ] **Determine Region Identifier:** Identify the Unicode region subtag identifier, which typically corresponds to the ISO 3166-1 alpha-2 code (e.g., `US` for United States, `JP` for Japan).
- [ ] **Verify Region Coverage:** Consult the Google Maps Platform Coverage Details to ensure the desired region is supported. The agent must note that some region identifiers differ from ccTLDs (e.g., Great Britain uses `GB`, not `uk`).
- [ ] **Configure Script Tag:** Add the `region` parameter to the Maps JavaScript API load URL.

**Example: Setting the map region to the United Kingdom (`GB`)**

```html
<script async
    src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&loading=async&region=GB&callback=initMap">
</script>
```

### 3. Combining Language and Region

It is strongly recommended to set both `language` and `region` parameters together, especially to ensure better biasing of results and adherence to local legal requirements.

**Checklist for Localization:**

| Task | Trigger Condition | Verification Checkpoint |
| :--- | :--- | :--- |
| **Set Language** | User specifies a display language override. | `language` parameter is present in the script URL with the correct code. |
| **Set Region** | User mentions local law compliance, result biasing, or specific map tiles. | `region` parameter is present in the script URL using the correct Unicode region subtag identifier. |
| **Handle RTL Text** | Language is right-to-left (e.g., Arabic, Hebrew). | Ensure `dir='rtl'` is added to the HTML `<html>` element to properly render bi-directional (Bidi) text. |

**Example: Loading the map in Japanese (`ja`) and biasing to Japan (`JP`)**

```html
<script async
    src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&loading=async&region=JP&language=ja&callback=initMap">
</script>
```

## Gotchas

*   **Region vs. Language Impact:** Setting the `language` affects textual display and labels. Setting the `region` alters the map tiles rendered and biases service results (like Geocoding or Places Autocomplete). Setting `region` is crucial for localized map behavior and legal compliance.
*   **Result Specificity:** When geocoding street-level addresses, the `language` parameter returns the country name in the requested language, but the rest of the address remains specific to the location being geocoded. Postal and political results are generally returned in the requested language.
*   **RTL Support:** For right-to-left (RTL) languages like Arabic, the page's root `<html>` element must have the attribute `dir='rtl'` applied for controls and text to display correctly (Feature: Localization).

### References

*   https://developers.google.com/maps/documentation/javascript/localization
*   https://developers.google.com/maps/faq#languagesupport
*   https://developers.google.com/maps/coverage
*   http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers

## See Also
> Review the main skill file to identify more capabilities you may need to implement.