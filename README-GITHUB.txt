CNIPMS GitHub upload bundle

Upload/replace these files at the ROOT of your existing GitHub repository:
- index.html
- vercel.json
- api/auth.js
- api/catalog.js

Do not upload apps-script/Code.gs from this bundle. This package is specifically for GitHub/Vercel files and does not require replacing your existing Google Apps Script code.

If your GitHub repository is connected to Vercel, pushing/committing these files normally triggers a deployment automatically. No manual Vercel redeploy is needed unless automatic deployments are disabled or the build fails.

Existing Vercel environment variables must already be configured for sign-in and the Google Apps Script proxy to work. Do not put secrets in GitHub.
