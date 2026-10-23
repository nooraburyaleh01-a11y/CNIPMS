CNIPMS INVENTORY ACTIVATION PACKAGE

What is included:
- index.html: adds Receive Stock, Transfer Stock, and Set Reorder Level forms to the existing starter UI.
- api/catalog.js: Vercel proxy for catalog and inventory actions, using the URL in config/google-apps-script.js or CNIPMS_GAS_URL.
- config/google-apps-script.js: current Web App URL (not secret).
- apps-script/Code.gs: Google Sheets backend implementation for stock receipts, lot/batch/expiry tracking, transfers, adjustments, balances, reorder levels, and audit log.
- vercel.json and api/auth.js: existing app files.

IMPORTANT: GitHub alone cannot change the code running inside the already-deployed Google Apps Script. To activate backend inventory operations, deploy the included Code.gs to Apps Script once as a new version. This is a one-time backend update, not a recurring step for every GitHub change.

Before deployment:
1. Back up the existing Google Sheet and Apps Script project.
2. In Apps Script, replace the project code with apps-script/Code.gs.
3. In Project Settings > Script Properties, set:
   CNIPMS_API_TOKEN = the same existing token value as Vercel's CNIPMS_API_TOKEN
   CNIPMS_SPREADSHEET_ID = the ID between /spreadsheets/d/ and /edit in your existing Google Sheets URL
4. Deploy > Manage deployments > Edit the existing Web App deployment > select New version > Deploy. Keep the same /exec URL.
5. Upload the ZIP contents (except apps-script/Code.gs if you prefer) to the root of GitHub and Commit changes. If Vercel automatic deployment is enabled, it deploys automatically.

Existing expected Vercel environment variables:
CNIPMS_ADMIN_PASSWORD
CNIPMS_SESSION_SECRET
CNIPMS_GAS_URL (optional because URL is in config file)
CNIPMS_API_TOKEN

Data model:
- Stock quantities are stored as individual units.
- Receipts require batch number and expiry date.
- Transfers require a lot ID and check available quantity for that lot/location.
- Inventory balances are computed from posted StockMovements.
- Reorder level is stored in units per brand product and location.
- No Firebase or Supabase is used.

CAUTION:
This is a functional starter for development and must be tested with non-production data before handling controlled medicines. Review access controls, approvals, backups, reconciliation, and audit policy before real hospital use. Do not commit secrets to GitHub.
