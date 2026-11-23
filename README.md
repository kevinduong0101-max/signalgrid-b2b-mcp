# B2B Leads, QuickBooks CPA Directory, SaaS Churn & FDA Customs MCP (`signalgrid-b2b-mcp`)

Extract **100,000+ QuickBooks ProAdvisor CPAs**, **B2B SaaS vendor emails & 1–3★ churn reviews** (**Xero**, **QuickBooks**, **Zoho**, **NetSuite**), and **US FDA OASIS port detentions** directly inside **Claude Desktop**, **Cursor**, **Windsurf**, and **Cline** — plus **6 bundled 50-row CSV sample datasets** that work offline with **zero API key required** (powered by [`signalgridhq`](https://apify.com/signalgridhq)).

<a href="https://glama.ai/mcp/servers/@kevinduong0101-max/signalgrid-b2b-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@kevinduong0101-max/signalgrid-b2b-mcp/badge" alt="signalgrid-b2b-mcp MCP server" />
</a>

---

## Ready-to-Send B2B Outbound Kits (100% DNS MX-Verified Emails + Custom Hooks)

Need clean UTF-8 CSVs today for **Instantly**, **Smartlead**, **Clay**, **Apollo**, or **Excel** without configuring MCP or API tokens? Every single row in our primary V2 CSVs is **verified against live DNS `MX` mail servers (`0%` blank email rows)**, tagged with `Google Workspace` vs `Microsoft 365`, and pre-populated with a data-backed opening line:

| Outbound Kit | What's Inside (100% MX-Verified, 0% Blank Emails) | Free Preview | Instant ZIP Download |
| :--- | :--- | :---: | :---: |
| **Free 125-Row Sample Pack (`$0`)** | `75` US CPA & tax firms + `50` B2B SaaS churn targets (`100%` MX-verified emails, inbox tags & custom first-line hooks) | [Download `$0` ZIP](https://signalgridhq.gumroad.com/l/free-b2b-cpa-saas-sample-csv) | [**Get Free Sample ($0)**](https://signalgridhq.gumroad.com/l/free-b2b-cpa-saas-sample-csv) |
| **1,390+ US CPA & Accounting Firms Outbound Kit** | `1,392` US QuickBooks ProAdvisor firms (`100%` MX-verified emails, `644` named decision-makers, `Google` vs `M365` tags, custom icebreakers + `283` bonus phone/LI firms & 3 scripts) | [`samples/us_cpa_firms_free_sample_100.csv`](./samples/us_cpa_firms_free_sample_100.csv) | [**Download Full Kit ($29)**](https://signalgridhq.gumroad.com/l/us-cpa-accounting-firms-csv) |
| **1,140+ B2B SaaS Vendors & 1–3★ Churn Targets Kit** | `1,143` commercial SaaS companies across QuickBooks, Xero, Zoho & NetSuite (`100%` MX-verified emails, `147` active 1–3★ churn hot-sheet targets, custom pitch hooks & 3 agency scripts) | [`samples/b2b_saas_vendors_free_sample_100.csv`](./samples/b2b_saas_vendors_free_sample_100.csv) | [**Download Full Kit ($29)**](https://signalgridhq.gumroad.com/l/b2b-saas-vendors-direct-contacts-csv) |

---

## Features & Included MCP Primitives

### Tools (`tools/list` — 7 Tools)
1. **`extract_xero_b2b_leads_and_churn`** — Extracts 570+ Xero App Store B2B vendor leads, partner websites, 1–5 star histograms, and 1–3 star churning user reviews via [`signalgridhq/xero-app-marketplace-scraper`](https://apify.com/signalgridhq/xero-app-marketplace-scraper).
2. **`extract_quickbooks_b2b_leads_and_churn`** — Extracts 660+ US / 6,400+ global QuickBooks App Store vendor contacts (`supportEmail`, `supportPhone`, partner website), pricing tiers, Intuit AQI quality badges, and 1–3 star churn reviews via [`signalgridhq/quickbooks-app-marketplace-scraper`](https://apify.com/signalgridhq/quickbooks-app-marketplace-scraper).
3. **`extract_zoho_b2b_leads_and_churn`** — Extracts 2,500+ Zoho Marketplace B2B SaaS vendor leads, direct `supportEmail` / `companyEmail`, phone numbers, verified partner street addresses, and 1–3 star churn reviews across Zoho CRM, Books, Desk & Inventory via [`signalgridhq/zoho-marketplace-scraper`](https://apify.com/signalgridhq/zoho-marketplace-scraper).
4. **`extract_netsuite_b2b_leads_and_churn`** — Extracts 720+ Oracle NetSuite SuiteApp ERP B2B vendor leads, Built-for-NetSuite verification badges, `SuiteScript 2.x` / `SuiteTalk REST` integration stacks, verticals, and 1–3 star ERP implementation churn reviews via [`signalgridhq/netsuite-suiteapp-directory-scraper`](https://apify.com/signalgridhq/netsuite-suiteapp-directory-scraper).
5. **`extract_fda_port_refusal_leads`** — Extracts official US FDA OASIS port detention & import refusal shipments with foreign manufacturer FEI, street address, private-lab gap flag, and FD&C Act violation charges via [`signalgridhq/fda-import-refusal-leads`](https://apify.com/signalgridhq/fda-import-refusal-leads).
6. **`extract_quickbooks_proadvisor_leads`** — Extracts 100,000+ Intuit QuickBooks ProAdvisor CPAs, Enrolled Agents, and bookkeeping firms across US, CA, UK, AU & IN with firm websites, LinkedIn profiles, bio-extracted emails/phones, certifications, and client review ratings via [`signalgridhq/quickbooks-proadvisor-scraper`](https://apify.com/signalgridhq/quickbooks-proadvisor-scraper).
7. **`preview_sample_b2b_dataset`** — Reads up to 50 verified sample records (`xero`, `quickbooks`, `quickbooks-proadvisor`, `zoho`, `netsuite`, or `fda`) locally from `samples/*.csv` **offline with zero API key required**.

### Resources (`resources/list` — 6 Bundled 50-Row Sample Datasets)
- `signalgrid://samples/xero-apps-50` → [`samples/xero-apps-sample-50.csv`](./samples/xero-apps-sample-50.csv)
- `signalgrid://samples/quickbooks-apps-50` → [`samples/quickbooks-apps-sample-50.csv`](./samples/quickbooks-apps-sample-50.csv)
- `signalgrid://samples/quickbooks-proadvisor-50` → [`samples/quickbooks-proadvisor-sample-50.csv`](./samples/quickbooks-proadvisor-sample-50.csv)
- `signalgrid://samples/zoho-apps-50` → [`samples/zoho-apps-sample-50.csv`](./samples/zoho-apps-sample-50.csv)
- `signalgrid://samples/netsuite-apps-50` → [`samples/netsuite-apps-sample-50.csv`](./samples/netsuite-apps-sample-50.csv)
- `signalgrid://samples/fda-import-refusals-50` → [`samples/fda-import-refusals-sample-50.csv`](./samples/fda-import-refusals-sample-50.csv)

### Prompts (`prompts/list`)
- `find-competitor-churn-leads` — Cross-marketplace Xero vs QuickBooks 1–3 star churn comparison workflow.
- `triage-fda-detained-shipments` — Foreign exporter compliance outreach workflow filtering shipments without private lab analysis.

---

## Quickstart: Self-Hosted `stdio` Server (Node.js or Docker)

### Option A: Build & Run from Source (Node.js >= 20)

```bash
git clone https://github.com/kevinduong0101-max/signalgrid-b2b-mcp.git
cd signalgrid-b2b-mcp
npm install
npm run build
```

Add to `claude_desktop_config.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "signalgrid-b2b": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/signalgrid-b2b-mcp/dist/index.js"],
      "env": {
        "APIFY_API_TOKEN": "YOUR_APIFY_API_TOKEN"
      }
    }
  }
}
```

### Option B: Run via Docker

```bash
docker build -t signalgrid-b2b-mcp .
```

```json
{
  "mcpServers": {
    "signalgrid-b2b": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "APIFY_API_TOKEN", "signalgrid-b2b-mcp"],
      "env": {
        "APIFY_API_TOKEN": "YOUR_APIFY_API_TOKEN"
      }
    }
  }
}
```

### Option C: Zero-Install Remote Streamable HTTP Connector

```json
{
  "mcpServers": {
    "signalgrid-b2b-remote": {
      "type": "http",
      "url": "https://mcp.apify.com/?tools=signalgridhq/xero-app-marketplace-scraper,signalgridhq/quickbooks-app-marketplace-scraper,signalgridhq/zoho-marketplace-scraper,signalgridhq/netsuite-suiteapp-directory-scraper,signalgridhq/fda-import-refusal-leads",
      "headers": {
        "Authorization": "Bearer YOUR_APIFY_API_TOKEN"
      }
    }
  }
}
```

---

## Environment Variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `APIFY_API_TOKEN` | Optional for startup / sample preview; Required for live extraction | Your Apify API token ([free `$5/month` starter credit](https://console.apify.com/settings/integrations)). Server boots, lists tools/resources/prompts, and serves `preview_sample_b2b_dataset` without a token. |

---

## License

MIT — see [LICENSE](./LICENSE).
