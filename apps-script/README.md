# Apps Script backend placeholder

This folder reserves the location for the Google Apps Script backend source. The current frontend is not connected to an API yet.

Before adding a public Web App endpoint, implement and test:
- User authentication and role/warehouse authorization
- Unique code validation across GenericDrugs and BrandProducts
- Inventory quantities in base units
- Per-product, per-location reorder levels with units/boxes conversion
- Append-only stock movement and audit logs
- LockService around operations that must be atomic
- Input validation and idempotency keys

Never deploy an unauthenticated endpoint that can read or mutate controlled-drug inventory data.
