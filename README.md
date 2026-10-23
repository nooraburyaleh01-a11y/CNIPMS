# CNIPMS all-in-one starter bundle

## Important
This is a development starter, not approved for live controlled-drug operations. Do not use it for real dispensing until independent security review, authenticated individual user roles, approvals, immutable audit controls, backup/recovery, and full inventory movement tests are completed.

## Repository layout
- `index.html`: English UI for Generic Drugs, Brand Products, Inventory, and movement listing.
- `api/auth.js`: password login with signed HttpOnly session cookie.
- `api/catalog.js`: server-side proxy to Apps Script.
- `apps-script/Code.gs`: Apps Script API (paste into the Apps Script editor).
- `vercel.json`: baseline security headers.

## Vercel environment variables (Production)
- `CNIPMS_ADMIN_PASSWORD`: strong unique admin password.
- `CNIPMS_SESSION_SECRET`: random secret (at least 32 random bytes).
- `CNIPMS_GAS_URL`: deployed Apps Script URL ending in `/exec`.
- `CNIPMS_API_TOKEN`: same secret value stored in Apps Script Script Properties.

Never prefix these with `NEXT_PUBLIC_` and never commit secrets to GitHub. After changing environment variables, redeploy Vercel.

## Apps Script setup
1. Open the Google Sheet and Extensions > Apps Script.
2. Replace the Apps Script code with `apps-script/Code.gs`.
3. In Project Settings > Script Properties add:
   - `CNIPMS_API_TOKEN` = the exact same random secret as Vercel.
   - `CNIPMS_SPREADSHEET_ID` = the spreadsheet ID, if the script is not bound to the target sheet.
4. Deploy > Manage deployments > Edit deployment, select New version, Deploy. Keep the `/exec` URL.
5. Ensure sheets and exact header names exist. This API expects the database schema previously created in this project.

## Vercel setup
Upload the contents of this folder to the repository root (backup the existing repo first). Configure environment variables, then deploy.

## Current limitations
- The starter uses one administrator password; it is not per-user authentication.
- Inventory is read-only in this UI. Movement creation is deliberately not exposed until staff identity, roles, and approval workflows are implemented.
- Inventory sheet stores reorder thresholds, not authoritative stock balances.
- This bundle includes API endpoints for catalog and inventory reads. It is not a production controlled-substance system.
- The Apps Script API token is a shared bearer secret; for real deployment, place the endpoint behind a stronger authentication design and restrict access.
