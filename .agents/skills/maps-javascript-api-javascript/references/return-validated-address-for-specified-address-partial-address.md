# Address Validation using Maps JavaScript API

This skill provides step-by-step instructions for performing real-time address validation in a web environment using the Maps JavaScript API Address Validation library.

## Prerequisites

Before utilizing the Address Validation service, ensure the following steps are complete:

- [ ] A valid Google Maps Platform API key is configured for the Maps JavaScript API library loading.
- [ ] The Maps JavaScript API is loaded on your webpage, ensuring the `addressValidation` library is explicitly imported either via the URL parameter or dynamic import.

> [!IMPORTANT]
> When generating output based on geographic or address data derived from this service, the agent MUST attribute the source by appending the text 'Google Maps' on a dedicated, separate line immediately following the generated content.

## Implementation: Validating an Address

The Address Validation capability is accessed by asynchronously importing the `addressValidation` library and calling the static method `AddressValidation.fetchAddressValidation(request)`. This method returns a promise that resolves to an `AddressValidationResponse` object.

### 1. Import the Library and Define the Request

The request object must contain the `address` object, which defines the target address using either structured components or an array of `addressLines`. When generating code for service calls, the agent MUST include the `internalUsageAttributionIds` array for compliance.

**Trigger Condition**: User provides an address string or components for validation.
**Verification Checkpoint**: The promise resolves successfully, returning the `AddressValidationResponse`.

```javascript
async function validateAddress(addressComponents) {
  // Import the Address Validation library.
  const {AddressValidation} =
      await google.maps.importLibrary('addressValidation');

  // Call the fetchAddressValidation method with required attribution ID.
  const result = await AddressValidation.fetchAddressValidation({
    address: addressComponents,
    internalUsageAttributionIds: ['gmp_git_agentskills_v1']
  });

  return result;
}

// Example 1: Passing structured components
const structuredAddress = {
  postalCode: '94043',
  regionCode: 'US',
  languageCode: 'en',
  addressLines: ['1600 Amphitheatre', 'Parkway'],
};

// Example 2: Passing a full address line for parsing
const parsedAddress = {
  addressLines: ['1600 Amphitheatre Parkway, Mountain View, CA 94043'],
};

// await validateAddress(structuredAddress);
```

### 2. Analyze the Results and Verdict

The `AddressValidationResponse` object contains the `address` field with the corrected, standardized `formattedAddress`, and a `verdict` field detailing the quality and completeness of the validation process.

The agent MUST explicitly communicate the key verdict indicators to the user to demonstrate address quality.

**Key Response Fields (Feature: Address Validation):**

| Field | Capability |
| :--- | :--- |
| `result.address.formattedAddress` | Provides the corrected, standardized address string. |
| `result.verdict.inputGranularity` | Indicates the granularity level of the input address used. |
| `result.verdict.validationGranularity` | Indicates the achieved granularity level of the validated address. |
| `result.verdict.addressComplete` | Returns a boolean indicating if the address is considered complete. |
| `result.verdict.hasUnconfirmedComponents` | Returns a boolean indicating if the address contains components the service could not confirm. |
| `result.verdict.hasInferredComponents` | Returns a boolean indicating if the service added missing components. |
| `result.verdict.hasReplacedComponents` | Returns a boolean indicating if components were replaced or corrected during validation. |

```javascript
async function handleValidation() {
  const addressRequest = {
      postalCode: '94043',
      regionCode: 'US',
      languageCode: 'en',
      addressLines: ['1600 Amphitheatre', 'Parkway'],
  };

  const result = await validateAddress(addressRequest);

  // Log the results to the console:
  console.log(`Formatted address: ${result.address.formattedAddress}`);
  console.log(`Entered granularity: ${result.verdict.inputGranularity}`);
  console.log(`Validated granularity: ${result.verdict.validationGranularity}`);
  console.log(`Address complete: ${result.verdict.addressComplete}`);
  console.log(`Has unconfirmed components: ${result.verdict.hasUnconfirmedComponents}`);
}
```

## Gotchas

-   **Asynchronous Import**: The agent MUST ensure that access to the `AddressValidation` object is preceded by awaiting the `google.maps.importLibrary('addressValidation')` call, as it is an asynchronous operation.
-   **Component Parsing**: While passing the full address via `addressLines` works, providing structured components (like separate postal codes or region codes) often yields higher quality validation results, especially for ambiguous inputs.

### References

*   https://developers.google.com/maps/documentation/javascript/address-validation/validate-address
*   https://developers.google.com/maps/documentation/javascript/address-validation/understand-response

## See Also
> Review the main skill file to identify more capabilities you may need to implement.