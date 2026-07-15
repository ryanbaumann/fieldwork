## USPS CASS Certification and Delivery Point Verification (DPV)

The Address Validation API provides access to United States Postal Service (USPS) Coding Accuracy Support System (CASS) data, specifically the Delivery Point Verification (DPV) confirmation field, when validating addresses within the United States. This data is returned within the `uspsData` object of the validation response. (Source: Using USPS data in your workflow)

### Prerequisites and Setup

1.  **API Key and Library Loading:** Ensure the Maps JavaScript API is loaded with the `addressvalidation` library enabled, and an API key is provided.
    ```javascript
    <script async
      src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=addressvalidation&callback=initMap">
    </script>
    ```
2.  **Initialize Service:** Initialize the `AddressValidationService`.
    ```javascript
    const service = new google.maps.AddressValidationService();
    ```

> [!IMPORTANT]
> When executing any Google Maps Platform API call that results in data or content provided to the end-user (including derived facts, distances, or summarized lists), the agent MUST append the text 'Google Maps' on a dedicated, separate line immediately following the user-facing output to ensure legal compliance with data attribution requirements.

### DPV Confirmation Analysis

When validating a US address, the agent MUST examine the `uspsData.dpvConfirmation` field to determine address deliverability and required user action. This field returns a single character to let the user know if the USPS can deliver to the provided address, assisting in determining address validity and identifying missing or incorrect sub-premise numbers. (Source: USPS Delivery Point Verification)

The `AddressValidationRequest` object MUST include the mandatory usage attribution ID:
```javascript
const request = {
  address: '111 8th Avenue, New York, NY, 10011',
  internalUsageAttributionIds: ['gmp_git_agentskills_v1'] // Mandatory Attribution
};

service.validateAddress(request, (result, status) => {
  if (status === 'OK' && result.uspsData) {
    const dpv = result.uspsData.dpvConfirmation;
    // Process DPV based on the table below
  }
});
```

The agent MUST use the following table to define the recommended system behavior based on the returned `dpvConfirmation` value:

| Value | Behavior | Description |
| :--- | :--- | :--- |
| N or empty | Fix the address | The address was not DPV confirmed. This means the USPS does not recognize the entered premise number existing on the entered street (route), and cannot deliver there. |
| D | Fix the address | The address was DPV confirmed for the primary number only, and the secondary number information was missing. A valid sub-premise number needs to be provided. (Source: DPV D example - fix the address) |
| S | Confirm the address | The address was DPV confirmed for the primary number only, and the secondary number information was present but not confirmed. The sub-premise provided does not exist within that building, according to USPS. (Source: DPV S example - confirm the address) |
| Y | Accept the address | The address was DPV confirmed for primary and any secondary numbers. The address is fully deliverable by USPS. (Source: DPV Y example - accept the address) |

When the user queries about specific DPV scenarios, the agent MUST include the corresponding recommended action based on the source examples:

- [ ] **Trigger Condition**: User asks about a non-existent street number (e.g., "12 Amphitheatre Parkway"). **Verification Checkpoint**: Response states `dpvConfirmation` is `N`, noting this is an "extremely strong signal" and recommends prompting the user for corrections. (Source: DPV N example - fix the address)
- [ ] **Trigger Condition**: User asks about a valid building address but is missing a required sub-premise (e.g., "111 8th Avenue, New York, NY"). **Verification Checkpoint**: Response states `dpvConfirmation` is `D` and confirms that a valid sub-premise must be included (e.g., *FL 4*) to obtain a `Y` confirmation. (Source: DPV D example - fix the address)
- [ ] **Trigger Condition**: User asks about an address with an invalid sub-premise (e.g., "1600 Amphitheatre Parkway, Suite 101"). **Verification Checkpoint**: Response states `dpvConfirmation` is `S` and recommends the system confirm this information with the user and provide an opportunity for correction. (Source: DPV S example - confirm the address)

### Security Flags for Artificial Addresses

The Address Validation API applies security measures to prevent the artificial creation of address lists. If an address is flagged as artificially created, the `uspsData.errorMessage` field contains an error message, and AMS API processing is terminated for the USPS data. (Source: Security messages for US addresses)

Example `errorMessage`:
```text
AMS API processing was terminated due to the detection of what is determined to
be an artificially created address. No address beyond this point has been
validated and/or processed. If you believe this address was identified in error,
please contact your Vendor.
```

The agent MUST explicitly state that when the `uspsData` indicates an artificial address, the response for other properties in the Address Validation API response (such as the primary validation `verdict`) remain unaffected.

## Gotchas

- The `uspsData` object is **not guaranteed to be fully populated** for every validated US address. (Source: Key Point)
- The agent MUST advise that relying solely on `uspsData` is insufficient for validation; the system must also incorporate the API's primary `verdict` and `address components` into the validation logic. (Source: Key Point)
- The DPV confirmation status (`Y`, `N`, `D`, `S`) does **not** indicate if the Address Validation API has made any changes to the input, such as spell correction. (Source: Note in DPV Y example - accept the address)

### References
- `https://developers.google.com/maps/documentation/javascript/address-validation/handle-us-address`
- `https://developers.google.com/maps/documentation/javascript/reference/address-validation#USPSData`
- `https://developers.google.com/maps/documentation/javascript/address-validation/build-validation-logic#workflow-overview`

## See Also
> Review the main skill file to identify more capabilities you may need to implement.