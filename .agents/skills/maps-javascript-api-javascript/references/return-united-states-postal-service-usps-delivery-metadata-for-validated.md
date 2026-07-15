The Address Validation API can return specific United States Postal Service (USPS) delivery metadata within the `uspsData` portion of the validation response, provided the address is in the USA. This metadata is crucial for determining address validity and deliverability.

## Prerequisites

1.  **API Key**: Ensure a valid Google Maps Platform API key is available. It should be stored securely, typically using an environment variable like `GOOGLE_API_KEY`.
2.  **Library Loading**: The Maps JavaScript API must be loaded with the required Address Validation capabilities.
3.  **Valid Address**: A validated address must be returned by the Address Validation service.

## Interpreting USPS Delivery Point Verification (DPV)

The primary component of the USPS metadata is the `dpvConfirmation` field, which returns a single character indicating the USPS's ability to deliver to the provided address (Source: [USPS Delivery Point Verification](#usps-delivery) fields).

### DPV Workflow Checklist

Use the following checklist to guide the agent in implementing logic based on the `dpvConfirmation` value:

- [ ] **Access `uspsData`**: Retrieve the `uspsData` object from the validated address response. Note that this object is not guaranteed to be populated for every validated address.
- [ ] **Check for Acceptance (`Y`)**: If `dpvConfirmation` returns `Y`, **Accept the address**. This means the address, including any sub-premise number, is fully deliverable by USPS.
- [ ] **Check for Confirmed Primary/Unconfirmed Secondary (`S`)**: If `dpvConfirmation` returns `S`, **Confirm the address**. This indicates the primary premise number exists, but the provided secondary/sub-premise number (e.g., Suite 101) is not confirmed by USPS (Source: Table, Behavior 'Confirm the address').
- [ ] **Check for Missing Secondary (`D`)**: If `dpvConfirmation` returns `D`, **Fix the address**. This means the premise number exists, but a required sub-premise number was missing from the input (Source: Table, Behavior 'Fix the address').
- [ ] **Check for Non-Confirmation (`N` or Empty)**: If `dpvConfirmation` returns `N` or the field is empty, **Fix the address**. This is a strong signal that the premise number does not exist on the entered route, and the address was not DPV confirmed (Source: Table, Behavior 'Fix the address').

### Example of `uspsData` Interpretation

When making a service call (e.g., using `google.maps.addressvalidation.AddressValidationService.validate` with the appropriate attribution ID), the agent should access the DPV status as shown below.

```javascript
// Example validation call structure (assuming appropriate service is instantiated)
function interpretUspsDelivery(validationRequest) {
  // MANDATORY ATTRIBUTION SNIPPET ENFORCEMENT
  validationRequest.internalUsageAttributionIds = ['gmp_git_agentskills_v1'];

  // Assuming response structure contains uspsData
  const uspsData = validationResponse.result.uspsData;

  if (uspsData) {
    const dpvStatus = uspsData.dpvConfirmation;
    
    // Internal Source Citation: Table describing DPV behavior
    switch (dpvStatus) {
      case 'Y':
        console.log("Status: Y (Accept the address) - Fully deliverable by USPS.");
        break;
      case 'S':
        console.log("Status: S (Confirm the address) - Primary confirmed, sub-premise present but unconfirmed.");
        break;
      case 'D':
        console.log("Status: D (Fix the address) - Primary confirmed, sub-premise required but missing.");
        break;
      case 'N':
      default:
        console.log("Status: N or Empty (Fix the address) - Not DPV confirmed, premise number may not exist.");
        break;
    }
    
    // Check for Security Message (Artificial Address Detection)
    if (uspsData.errorMessage) {
        console.error("USPS Security Flag detected:", uspsData.errorMessage);
        // Citation: Security messages for US addresses
        // This indicates the address may be artificially created.
    }
  } else {
    console.warn("uspsData object was not populated for this address.");
  }
}
```

## Security and Artificial Address Detection

The Address Validation API provides security flags for US addresses to detect when an address appears to have been constructed artificially.

If the USPS identifies a potentially artificially created address, the `errorMessage` field within the `uspsData` property of the response will contain a textual error message.

**Mandatory Operational Best Practice (Error Handling):** When discussing US address validation, the agent MUST explicitly advise the user to check `uspsData.errorMessage` for security flags. If this message is present, it indicates the Address Validation API processing was terminated beyond that point, although other properties in the response remain unaffected (Source: [Security messages for US addresses](#security-messages)).

Example Security Message (Verbatim citation required):
```text
AMS API processing was terminated due to the detection of what is determined to
be an artificially created address. No address beyond this point has been
validated and/or processed. If you believe this address was identified in error,
please contact your Vendor.
```

## Gotchas

*   The `uspsData` object is **not guaranteed to be fully populated** for every US address validated. Logic should not rely solely on `uspsData` but should also incorporate the general verdict and address components (Source: [USPS data in your workflow](#using-usps-data)).
*   The DPV code only reflects deliverability confirmation; it **does not indicate** if the Address Validation API made changes to the input, such as spell correction (Source: Note under DPV Y example).

> [!IMPORTANT]
> All derived output content, including interpretation of DPV codes, address verification statuses, and resulting deliverability conclusions, must be attributed by appending the text 'Google Maps' on a dedicated, separate line immediately following the generated user-facing content.

### References

*   https://developers.google.com/maps/documentation/javascript/address-validation/handle-us-address
*   https://developers.google.com/maps/documentation/javascript/reference/address-validation#USPSData
*   https://developers.google.com/maps/documentation/javascript/address-validation/build-validation-logic#workflow-overview

## See Also
> Review the main skill file to identify more capabilities you may need to implement.