CNIPMS — Reference Design Build

This package rebuilds the frontend to closely follow the provided reference screenshot: dark green pharmacy header and sidebar, five KPI cards, tabbed drug catalog, searchable generic list, generic details, related brand products, quick actions, inventory, stock transfers, expiry management and reorder alerts.

Data source: Google Sheets only, via Google Apps Script Web App.
No login screen is included by request. This means access is not restricted by an application login; do not expose publicly because this system handles controlled-drug inventory.

Files:
- index.html — complete responsive UI
- api/catalog.js — Vercel API proxy
- config/google-apps-script.js — public Apps Script URL (no secret here)
- apps-script/Code.gs — Apps Script API
- vercel.json — Vercel configuration

Deploy:
1. Upload the contents to the ROOT of the existing GitHub repo and commit.
2. Set CNIPMS_API_TOKEN in Vercel Environment Variables.
3. In Apps Script Script Properties set CNIPMS_API_TOKEN to the same value and CNIPMS_SPREADSHEET_ID to the existing spreadsheet ID.
4. Review apps-script/Code.gs, then update the existing Apps Script Web App deployment to a new version once.
5. Test with non-controlled sample data. Existing sheets with different headers need a backup and schema review first.

The interface only displays counts and rows returned by the API; it does not fabricate inventory data. The API/backend has not been tested against the live spreadsheet. Dispensing and user/role permissions are not implemented in this no-login version.
