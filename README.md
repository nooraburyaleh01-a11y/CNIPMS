# CNIPMS deployment starter

This package contains the English UI prototype and a Vercel serverless proxy to the Apps Script API.

## Deploy to GitHub/Vercel
1. Back up the current GitHub repository.
2. Upload the contents of this folder to the repository root (not the containing folder).
3. In Vercel, add these Environment Variables for Production and Preview as appropriate:
   - `CNIPMS_GAS_URL`: the deployed Apps Script `/exec` URL.
   - `CNIPMS_API_TOKEN`: exactly the token stored in Apps Script > Project Settings > Script Properties.
   - `CNIPMS_OPERATOR_KEY`: a long random temporary key for integration testing.
4. Redeploy after setting variables.

## API test
POST `/api/cnips` with header `x-cnips-operator-key: <CNIPMS_OPERATOR_KEY>` and JSON body, e.g.:

```json
{"action":"listGenerics","data":{}}
```

Supported actions: `listGenerics`, `getGeneric`, `addGeneric`, `addBrand`, `listBrands`.

## Critical security limitation
The shared operator key is only a temporary integration gate. Do not put it in frontend code or distribute it. The current UI does not implement a proper sign-in flow, and this proxy does not provide individual user identity or role-based authorization. Do not use this setup for real controlled-drug inventory until proper authentication, role checks, per-user audit identity, request validation, rate limiting, and independent review are implemented. Apps Script's `doGet` health check is public if the deployment allows anonymous access; do not expose sensitive data from `doGet`.

The current `index.html` is a UI prototype and is not yet wired to call `/api/cnips`; the API route is ready for integration testing from a trusted server-side or controlled test client.
