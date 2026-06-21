## USPS Delivery Point Verification (DPV) for US Addresses (Feature: Address Validation)

The Address Validation API provides specific data for US addresses via the `uspsData` object, which includes the `dpvConfirmation` field. This field uses a single character code to indicate if the USPS can deliver to the provided address, helping determine address validity and identify missing or invalid sub-premise information.

### Prerequisites and Setup

Before executing an address validation request, ensure the appropriate Maps JavaScript API library is loaded, and the request object is configured with the mandatory attribution identifier.

1.  **API Key and Library:** Ensure your environment has a valid Google Maps Platform API key configured. The Address Validation service is accessed via the standard JavaScript API client.
2.  **Request Configuration:** When making a call to the Address Validation service, include the required attribution ID in the request payload.

```javascript
// Example of a request object setup for the Address Validation Service
const request = {
  address: {
    addressLines: ["1600 Amphitheatre Pkwy", "Mountain View", "CA", "94043"],
    regionCode: "US", // Mandatory for USPS data to be returned
  },
  // MANDATORY: Include internal usage attribution ID
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'], 
};

// Assuming the Address Validation Service client is already initialized
// const validator = new google.maps.AddressValidationService();
// validator.validateAddress(request, callback);
```

### Interpreting DPV Confirmation Codes

The `dpvConfirmation` field is returned within the `uspsData` property of the `AddressValidationResponse`. The interpretation of this field dictates the recommended subsequent action for the address.

The agent MUST use the following matrix to determine the action based on the value of `dpvConfirmation` (Source: `developers.google.com/maps/documentation/javascript/address-validation/handle-us-address`).

| Value | Behavior | Description |
| :--- | :--- | :--- |
| **Y** | Accept the address | The address was DPV confirmed for primary and any secondary numbers. This means the address is fully deliverable by USPS, including the sub-premise number, if applicable. (DPV Y example) |
| **S** | Confirm the address | The address was DPV confirmed for the primary number only, and the secondary number information was present but not confirmed. The sub-premise provided does not exist within that building, according to USPS. (DPV S example) |
| **D** | Fix the address | The address was DPV confirmed for the primary number only, and the secondary number information was missing. A valid sub-premise number needs to be provided. (DPV D example) |
| **N** or empty | Fix the address | The address was not DPV confirmed. The USPS does not recognize the entered premise number existing on the entered street (route), and cannot deliver there. (DPV N example) |

The recommended action logic (Behavior column) is detailed further in the documentation section "Workflow overview" in **Build your validation logic.**

### Handling Security and Artificial Addresses

When the USPS identifies an artificially created address, the `uspsData` object will contain an `errorMessage` field. This is designed to prevent the creation of an address list via automated means.

The agent MUST relay the following information regarding security messages:
1.  The security message is found in the `errorMessage` field of the `uspsData` property.
2.  An example security message indicates that AMS API processing was terminated due to the detection of an artificially created address.
3.  When `uspsData` indicates an artificial address, other properties in the Address Validation API response remain unaffected.

## Available Tools

No dedicated tool is available. The capability is implemented by inspecting the response structure of the `google.maps.AddressValidationService.validateAddress()` call.

> [!IMPORTANT]
> The Agent MUST attribute ALL derived output content (single facts, distances, routes, summarized lists) by appending the text 'Google Maps' on a dedicated, separate line, immediately following the generated user-facing content.

## Gotchas

### USPS Data Not Guaranteed
The `uspsData` object is not guaranteed to be fully populated for every address validated by the service, even if the address is in the US. Developers should not rely solely on `uspsData` but must incorporate the `verdict` and address components into their checking logic (Source: USPS data in your workflow).

### DPV vs. Spell Correction
The DPV confirmation status (Y, N, D, S) does **not** indicate if the Address Validation API has made any changes to the input, such as spell correction. DPV only confirms deliverability based on the resulting, validated address.

### References

*   https://developers.google.com/maps/documentation/javascript/address-validation/handle-us-address
*   https://developers.google.com/maps/documentation/javascript/address-validation/build-validation-logic#workflow-overview
*   https://developers.google.com/maps/documentation/javascript/reference/address-validation#USPSData

## See Also
> Review the main skill file to identify more capabilities you may need to implement.