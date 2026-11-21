# SignalGrid B2B Intelligence — MCP Server & Open Sample Datasets

Production-grade **Model Context Protocol (MCP)** connector configuration and 50-row sample datasets for **B2B SaaS Churn Intelligence** (Xero App Store, QuickBooks App Store) and **U.S. Customs / FDA Port Detention Leads**.

- **Apify Store Publisher:** [https://apify.com/signalgridhq](https://apify.com/signalgridhq)
- **Engineering Benchmarks:** [https://dev.to/signalgridhq](https://dev.to/signalgridhq)

---

## Live Pure-HTTP Extractors (~100MB RAM, Pay-Per-Event)

| Tool / Actor | Target Ecosystem | Sample CSV (50 Rows) | Live Apify Store Extractor |
| :--- | :--- | :--- | :--- |
| **Xero App Store B2B Leads & Churn** | `apps.xero.com` (570+ apps) | [`samples/xero-apps-sample-50.csv`](./samples/xero-apps-sample-50.csv) | [signalgridhq/xero-app-marketplace-scraper](https://apify.com/signalgridhq/xero-app-marketplace-scraper) |
| **QuickBooks App Store B2B Leads & Churn** | `apps.intuit.com` (6,400+ apps) | [`samples/quickbooks-apps-sample-50.csv`](./samples/quickbooks-apps-sample-50.csv) | [signalgridhq/quickbooks-app-marketplace-scraper](https://apify.com/signalgridhq/quickbooks-app-marketplace-scraper) |
| **US FDA Import Refusal & Port Detention Leads** | `accessdata.fda.gov` (OASIS IRR) | [`samples/fda-import-refusals-sample-50.csv`](./samples/fda-import-refusals-sample-50.csv) | [signalgridhq/fda-import-refusal-leads](https://apify.com/signalgridhq/fda-import-refusal-leads) |

---

## Connect to Claude Desktop, Cursor & Windsurf via MCP

Add the remote streamable HTTP MCP endpoint to `.mcp.json` or `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "signalgrid-b2b": {
      "type": "http",
      "url": "https://mcp.apify.com/?tools=signalgridhq/xero-app-marketplace-scraper,signalgridhq/quickbooks-app-marketplace-scraper,signalgridhq/fda-import-refusal-leads",
      "headers": {
        "Authorization": "Bearer YOUR_APIFY_API_TOKEN"
      }
    }
  }
}
```

## License

MIT
