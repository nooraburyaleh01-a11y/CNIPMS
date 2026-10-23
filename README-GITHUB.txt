CNIPMS Rebuilt — No Sign-In UI

This build removes the password/login screen as requested. Google Sheets remains the only data store; Vercel only proxies API requests to the Google Apps Script Web App.

Files to upload to the ROOT of your GitHub repository:
- index.html
- api/catalog.js
- config/google-apps-script.js
- apps-script/Code.gs
- vercel.json

Before use:
1. Keep CNIPMS_API_TOKEN as a Vercel Environment Variable (do not commit it).
2. Set the same CNIPMS_API_TOKEN in Apps Script Script Properties, and CNIPMS_SPREADSHEET_ID to the existing spreadsheet ID.
3. The Apps Script code included in this package must be saved and deployed as a new Web App version once for its actions to be available.
4. Test in a copy of the sheet with non-controlled sample items before real inventory use.

Security note: No UI login means anyone who can access the deployed site may be able to read/write through its API. Use restricted site access/network controls if needed; do not use this publicly for controlled-drug inventory without proper access control and audit validation.
