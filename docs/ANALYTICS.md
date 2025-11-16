### Web Analytics Configuration

Enable one provider by setting environment variables (prefix with `REACT_APP_` for CRA).

- **Provider selection**: `REACT_APP_ANALYTICS_PROVIDER` must be one of: `vercel`, `plausible`, `ga4`.

#### Vercel Web Analytics
- `REACT_APP_ANALYTICS_PROVIDER=vercel`
- `REACT_APP_VERCEL_ANALYTICS_TOKEN=YOUR_VERCEL_WEB_ANALYTICS_TOKEN`

Notes:
- Token is provided in the Vercel project Web Analytics settings.

#### Plausible
- `REACT_APP_ANALYTICS_PROVIDER=plausible`
- `REACT_APP_PLAUSIBLE_DOMAIN=example.com` (your tracked domain)

#### Google Analytics 4 (gtag)
- `REACT_APP_ANALYTICS_PROVIDER=ga4`
- `REACT_APP_GA4_MEASUREMENT_ID=G-XXXXXXXXXX`

Deployment
- Rebuild and redeploy after changing env vars.
- In Vercel, set these under Project Settings → Environment Variables.


