# CNIPMS Deployment Starter

This repository-ready folder contains the current English CNIPMS inventory UI prototype.

## Current status
- Static HTML/CSS/JavaScript interface.
- Demo inventory data is stored in browser memory in `index.html`.
- It is **not yet connected** to Google Sheets or Google Apps Script.
- Do not enter real patient, prescription, or controlled-drug transaction data into this prototype.

## Deploy frontend with GitHub + Vercel
1. Create a private GitHub repository named `cnipms`.
2. Upload `index.html`, this README, and the `apps-script` folder.
3. In Vercel, choose **Add New → Project**, import the `cnipms` repository, and deploy.
4. Framework preset: **Other**. Build command: leave empty. Output directory: `.` (or leave default if Vercel detects static HTML).
5. Every future push to the connected branch will trigger a deployment.

## Google Sheets + Apps Script integration (next phase)
1. Create a dedicated Google Spreadsheet named `CNIPMS_DB`.
2. Create an Apps Script project attached to that spreadsheet.
3. Implement server-side validation for manually entered Generic and Brand codes, stock movements, per-location reorder levels, and audit events.
4. Deploy Apps Script as a Web App only after authentication and access controls are designed.
5. Add the deployed endpoint as a Vercel environment variable (for example `CNIPMS_API_URL`) and update the frontend to call the backend.

## Important security requirements
- Do not put Google credentials, private keys, or secrets in frontend JavaScript or GitHub.
- Do not treat a hidden URL as authentication.
- Validate every request server-side; use locking for duplicate-code and stock concurrency checks.
- Preserve stock movements as an append-only ledger; do not allow silent edits/deletions of approved movements.
- Test with synthetic data before production use.
