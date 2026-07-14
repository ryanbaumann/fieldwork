## Address Validation: Extracting the Validated Address

This guide details how to parse the Address Validation API response in the Maps JavaScript API to extract the normalized, validated, and formatted address suitable for display or storage. The validated address information is encapsulated within the top-level `address` property of the validation result object.

### Prerequisites

1.  A valid Google Maps Platform API key is required.
2.  The Maps JavaScript API must be loaded with the `addressvalidation` library enabled.
    ```html
    <script async src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=addressvalidation"></script>
    ```

### Implementation Guide

Use the `google.maps.AddressValidationService` to request validation, and then access the `address` property within the successful response to retrieve the validated data.

#### 1. Prepare the Request Object
When making a service request using the Maps JavaScript API, ensure the mandatory internal usage attribution ID is included in the request object.

```javascript
const addressRequest = {
  // Required input address fields (e.g., address, regionCode)
  address: "1600 Amphitheatre Pkwy, Mountain View, CA",
  // Mandatory attribution ID for solution tracking
  internalUsageAttributionIds: ['gmp_git_agentskills_v1']
};
```

#### 2. Execute Validation and Extract Address Data

The `address` property provides two key outcomes: the **formatted address** (a single string suitable for display) and detailed **address components** (structured parts of the address).

- [ ] **Trigger Condition**: User submits an address for validation and requests the resulting output address.
- [ ] **Verification Checkpoint**: The `status` is `"OK"` and `response.result.address` is successfully parsed.

```javascript
function processValidatedAddress(addressRequest) {
  const service = new google.maps.AddressValidationService();

  service.validate(addressRequest, (response, status) => {
    if (status === "OK") {
      const result = response.result;

      // 1. Retrieve the validated address object
      // (Internal Source Citation: Address)
      const validatedAddress = result.address; 

      // 2. Extract the user-facing formatted address string
      const formattedAddressString = validatedAddress.formattedAddress;
      console.log("Validated Formatted Address:", formattedAddressString);

      // 3. Extract the detailed component list for programmatic review
      // (Internal Source Citation: addressComponent)
      const addressComponents = validatedAddress.addressComponents;
      
      // Example of outputting component confirmation status
      addressComponents.forEach(component => {
        console.log(`Component: ${component.longText}, Type: ${component.componentType}, Confirmation Level: ${component.confirmationLevel}`);
      });
    
      // 4. Check the verdict granularity for delivery confidence
      // (Internal Source Citation: Verdict)
      const validationGranularity = result.verdict.validationGranularity;
      console.log("Validation Granularity:", validationGranularity);

    } else {
      console.error(`Address validation failed with status: ${status}`);
    }
  });
}
```

### Output Response Template

The `address` object within the JSON response structure provides the finalized and formatted address string, along with detailed component information and associated confidence levels.

```json
{
  "address": {
    "formattedAddress": "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA",
    "addressComponents": [
      {
        "componentType": "street_number",
        "confirmationLevel": "CONFIRMED",
        "longText": "1600",
        "shortText": "1600"
      },
      // ... detailed components
    ],
    // ... other address fields
  },
  "verdict": {
    // ... granularity and quality fields
  },
  // ... other top-level properties
}
```

## Gotchas

-   **Relying on Component Confirmation Level**: When integrating, do not build core business logic that strictly relies on the specific `confirmationLevel` provided for individual `addressComponent` objects (Section `addressComponent`). The primary focus for address quality should be evaluating the holistic `verdict` object, specifically checking the `validationGranularity` (e.g., `PREMISE` or `SUB_PREMISE`) and `addressComplete` fields, as this is the intended guidance for long-term integration stability.

### References

*   Address Validation API - Understand the Response: https://developers.google.com/maps/documentation/javascript/address-validation/understand-response
*   Address Validation API Reference: https://developers.google.com/maps/documentation/javascript/reference/address-validation#Address
*   Address Validation API Reference: https://developers.google.com/maps/documentation/javascript/reference/address-validation#AddressComponent
*   Address Validation API Reference: https://developers.google.com/maps/documentation/javascript/reference/address-validation#Verdict

## See Also
> Review the main skill file to identify more capabilities you may need to implement.