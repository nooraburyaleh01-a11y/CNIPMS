CNIPMS — Reference Design / No Vercel Environment Variables

This build uses the public Google Apps Script Web App URL stored in config/google-apps-script.js.
No Vercel environment variables and no API token are used.

Files:
- index.html: reference-style responsive UI
- api/catalog.js: public proxy to Google Apps Script
- config/google-apps-script.js: Web App URL
- apps-script/Code.gs: Apps Script backend without API-token check
- vercel.json: Vercel configuration

GitHub/Vercel:
1. Upload contents to the ROOT of the existing GitHub repo and commit. Vercel should auto-deploy if connected.
2. Vercel Environment Variables are not required by this build.
3. Apps Script: if the current deployed Code.gs still checks CNIPMS_API_TOKEN, this GitHub-only upload will not remove that check. To use this no-token version, replace Apps Script code with apps-script/Code.gs and deploy a new version of the existing Web App. If your script is bound to the spreadsheet, it can use the active spreadsheet. Otherwise configure CNIPMS_SPREADSHEET_ID in Apps Script Script Properties (not a Vercel environment variable).
4. Keep the Web App URL in config/google-apps-script.js aligned with the current deployment URL.

SECURITY WARNING:
No login and no token means the Web App can be publicly read/written if its deployment allows anonymous access. Anyone who finds the URL/site may read or alter controlled-drug inventory. This configuration is suitable only for isolated testing with fake data, not live hospital/narcotic records. Do not use for real controlled-drug transactions without an access-control layer.
