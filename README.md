# CNIPMS deployment package

## Included
- `index.html`: English UI with sign-in, live Generic Drugs and Brand Products lists, add forms, automatic generic-name lookup by Generic Code, and API connection status. Inventory is clearly marked as not connected until stock endpoints are implemented.
- `api/auth.js`: single-admin password sign-in with an HttpOnly, Secure, SameSite=Strict, signed 8-hour session cookie.
- `api/cnips.js`: authenticated Vercel proxy to Google Apps Script.
- `vercel.json`: security headers.

## Vercel Environment Variables
Set these in Vercel Project Settings → Environment Variables (Production and Preview as appropriate):
- `CNIPMS_GAS_URL`: deployed Apps Script URL ending in `/exec`.
- `CNIPMS_API_TOKEN`: exactly the secret in Apps Script → Project Settings → Script Properties → `CNIPMS_API_TOKEN`.
- `CNIPMS_ADMIN_PASSWORD`: strong unique administrator password.
- `CNIPMS_SESSION_SECRET`: long random secret (at least 32 random bytes).

Do not commit actual secrets. After setting variables, redeploy.

## Apps Script requirements
The Apps Script project must contain `doPost` actions `listGenerics`, `getGeneric`, `addGeneric`, `addBrand`, and `listBrands`, and use the same `CNIPMS_API_TOKEN` Script Property. Redeploy Apps Script after code changes and select the latest deployment version.

## Important limitations
This is an integration milestone, not production-ready controlled-drug software. The current sign-in is one shared administrator account, not individual staff identity or role-based access. The Apps Script audit implementation must record the actual actor if per-user accountability is required. Inventory balances, lots, receipts, transfers, dispensing, reorder persistence and stock movement endpoints are not implemented in this package. Do not use it for real controlled-drug transactions until individual identity, role permissions, stronger authentication, rate limiting, robust audit controls, concurrency/integrity tests, backup/restore, and independent security review are completed.
