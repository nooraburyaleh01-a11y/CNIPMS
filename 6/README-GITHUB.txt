CNIPMS — Inventory URL Configuration Package

Upload the contents of this folder to the ROOT of the existing GitHub repository, replacing matching files.

The Google Apps Script Web App URL is stored in:
config/google-apps-script.js

The API server reads that URL from the config file, while allowing the existing Vercel CNIPMS_GAS_URL environment variable to override it. This means the URL is now maintained in a GitHub file, as requested.

SECURITY:
- Do not put CNIPMS_API_TOKEN, admin password, or session secret in GitHub.
- Keep CNIPMS_API_TOKEN and the existing authentication secrets in Vercel environment variables.
- Google Apps Script URL is not itself a secret.

IMPORTANT:
Adding the URL only configures where requests go. Inventory functions such as stock receipt, transfers, batch/expiry and reorder levels still require the deployed Apps Script to implement those actions and matching Google Sheets tabs. The currently verified endpoint response only confirms the catalog service, not the full inventory API. The frontend must not treat inventory as operational until those backend actions return valid results.

No manual redeploy is needed if GitHub is connected to Vercel and automatic deployments are enabled. Committing to GitHub should trigger deployment under that setup.
