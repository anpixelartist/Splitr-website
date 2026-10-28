# Splitr website

Landing page, AI connector (MCP) docs, developer docs, support and privacy pages for [Splitr](https://github.com/anpixelartist/Splitr).

Plain HTML, CSS and JavaScript. No build step.

```
index.html        landing: features, how it works, AI connector teaser, install, FAQ
connector.html    Splitr AI Connector (MCP server): connect, tools, security
developers.html   quick start, data model, permissions, self-hosting, MCP dev, contributing
support.html      help topics and contact (GitHub issues, private security reports)
privacy.html      privacy policy
404.html
assets/css/site.css, assets/js/site.js, assets/logo.svg
```

## Configure

Edit the `SPLITR` object at the top of `assets/js/site.js`:

- `appUrl`: the deployed app, `https://splitr-bills.web.app` (every "Open Splitr" button points here)
- `mcpUrl`: the connector endpoint, `https://splitr-mcp.splitr.workers.dev/mcp`
- `connectorLive`: `true` (live). Set to `false` to switch the badges and callouts back to "In development"

The HTML also carries these addresses as fallbacks for visitors without JavaScript, so update both if they change.
Connector facts (tools, setup, security) come from the Splitr repo's `mcp/README.md`; keep `connector.html` in step with it.

Also update the "Last updated" date in `privacy.html` whenever the policy changes.

## Preview

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```

## Deploy (free)

Live on Cloudflare (Workers static assets, free plan): https://www.splitr.workers.dev

`wrangler.jsonc` serves `dist/` with clean URLs and `404.html`; `_headers` caches `/assets` for a day. To redeploy:

```bash
rm -rf dist && mkdir dist && cp -r *.html assets _headers dist/
npx wrangler@4 deploy
```

Any other static host works too (Firebase Hosting, GitHub Pages, Netlify). For Firebase, in the same project as the app:

```bash
npx firebase-tools@15 hosting:sites:create splitr-site   # a second site next to the app
npx firebase-tools@15 target:apply hosting site splitr-site
# add "target": "site" to firebase.json's hosting block, then:
npx firebase-tools@15 deploy --only hosting:site
```
