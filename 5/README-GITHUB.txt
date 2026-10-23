CNIPMS — GitHub-only upload package

Upload the contents of this folder to the ROOT of the existing GitHub repository:
- index.html
- vercel.json
- api/auth.js
- api/catalog.js

This package keeps Google Sheets as the intended data store and calls the existing Google Apps Script endpoint through Vercel. It does NOT add a second database.

IMPORTANT LIMITATION:
The currently deployed Apps Script endpoint has only been verified for the drug-catalog API (doGet returns CNIPMS Drug Catalog API version 1.0). GitHub-only changes cannot add server-side inventory actions to an already deployed Apps Script. The inventory actions (listInventory, listMovements, listLocations, receiveStock, transferStock, adjustStock, setReorderLevel) will only work once those actions exist in the deployed Apps Script. This package does not claim inventory is connected when the backend rejects an action.

No secrets belong in GitHub. Existing Vercel environment variables must remain configured:
CNIPMS_ADMIN_PASSWORD
CNIPMS_SESSION_SECRET
CNIPMS_GAS_URL
CNIPMS_API_TOKEN

If GitHub is connected to Vercel, committing these files should trigger automatic deployment when that setting is enabled.
