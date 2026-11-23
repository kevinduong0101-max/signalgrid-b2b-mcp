#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    GetPromptRequestSchema,
    ListPromptsRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const SERVER_NAME = 'signalgrid-b2b-mcp';
const SERVER_VERSION = '1.0.0';
const APIFY_BASE_URL = 'https://api.apify.com/v2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SAMPLES_DIR = path.resolve(__dirname, '..', 'samples');

interface SampleCatalogEntry {
    key: 'xero' | 'quickbooks' | 'quickbooks-proadvisor' | 'zoho' | 'netsuite' | 'fda';
    uri: string;
    name: string;
    filename: string;
    description: string;
}

const SAMPLE_CATALOG: readonly SampleCatalogEntry[] = [
    {
        key: 'xero',
        uri: 'signalgrid://samples/xero-apps-50',
        name: 'Xero App Store B2B Leads & Churn Sample (50 rows)',
        filename: 'xero-apps-sample-50.csv',
        description:
            '50 verified Xero App Store B2B SaaS vendor records with star distributions, partner URLs, and 1-3 star churn signals.',
    },
    {
        key: 'quickbooks',
        uri: 'signalgrid://samples/quickbooks-apps-50',
        name: 'QuickBooks App Store B2B Vendor Contacts & Churn Sample (50 rows)',
        filename: 'quickbooks-apps-sample-50.csv',
        description:
            '50 verified QuickBooks App Store vendor records with supportEmail, supportPhone, pricing plans, Intuit AQI badges, and churn signals.',
    },
    {
        key: 'quickbooks-proadvisor',
        uri: 'signalgrid://samples/quickbooks-proadvisor-50',
        name: 'QuickBooks ProAdvisor CPA & Bookkeeper Directory Sample (50 rows)',
        filename: 'quickbooks-proadvisor-sample-50.csv',
        description:
            '50 verified QuickBooks ProAdvisor CPA and bookkeeping firm records with websites, LinkedIn profiles, bio-extracted emails/phones, certifications, and client reviews.',
    },
    {
        key: 'zoho',
        uri: 'signalgrid://samples/zoho-apps-50',
        name: 'Zoho Marketplace B2B Vendor Leads, Street Addresses & Churn Sample (50 rows)',
        filename: 'zoho-apps-sample-50.csv',
        description:
            '50 verified Zoho Marketplace B2B SaaS vendor records with supportEmail, companyEmail, phone, full office street address, and churn signals.',
    },
    {
        key: 'netsuite',
        uri: 'signalgrid://samples/netsuite-apps-50',
        name: 'NetSuite SuiteApp ERP Directory Leads & Tech Stack Sample (50 rows)',
        filename: 'netsuite-apps-sample-50.csv',
        description:
            '50 verified Oracle NetSuite SuiteApp ERP vendor records with Built-for-NetSuite badges, SuiteScript/SuiteTalk integration stack, verticals, and churn metrics.',
    },
    {
        key: 'fda',
        uri: 'signalgrid://samples/fda-import-refusals-50',
        name: 'US FDA OASIS Port Detention & Import Refusals Sample (50 rows)',
        filename: 'fda-import-refusals-sample-50.csv',
        description:
            '50 official US FDA OASIS detained shipment records with manufacturer FEI, street address, private-lab gap flag, and FD&C Act violation charges.',
    },
];

function parseCsvPreview(csvText: string, limit: number): Record<string, string>[] {
    const lines = csvText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    if (lines.length < 2) return [];

    const parseRow = (row: string): string[] => {
        const cells: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < row.length; i++) {
            const ch = row[i];
            if (ch === '"') {
                if (inQuotes && row[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                cells.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
        cells.push(current);
        return cells;
    };

    const headers = parseRow(lines[0]);
    const records: Record<string, string>[] = [];
    const maxRows = Math.min(lines.length - 1, Math.max(1, Math.min(limit, 50)));

    for (let idx = 1; idx <= maxRows; idx++) {
        const values = parseRow(lines[idx]);
        const record: Record<string, string> = {};
        for (let c = 0; c < headers.length; c++) {
            record[headers[c]] = values[c] ?? '';
        }
        records.push(record);
    }
    return records;
}

async function runApifyActor(actorSlug: string, input: Record<string, unknown>): Promise<unknown> {
    const token = process.env.APIFY_API_TOKEN?.trim();
    if (!token) {
        throw new Error(
            'Missing APIFY_API_TOKEN environment variable. Set APIFY_API_TOKEN (free $5/month Apify starter tier supported at https://console.apify.com/settings/integrations) to run live extractions, or call preview_sample_b2b_dataset to inspect bundled 50-row B2B datasets offline.',
        );
    }

    const endpoint = `${APIFY_BASE_URL}/acts/signalgridhq~${actorSlug}/run-sync-get-dataset-items?format=json&clean=true`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(
            `Apify Actor signalgridhq/${actorSlug} returned HTTP ${response.status}: ${detail.slice(0, 400)}`,
        );
    }

    return response.json();
}

function clampMaxItems(raw: unknown, fallback = 15): number {
    const parsed = typeof raw === 'number' ? Math.trunc(raw) : fallback;
    if (!Number.isFinite(parsed) || parsed < 1) return fallback;
    return Math.min(parsed, 200);
}

export function createSignalGridMcpServer(): Server {
    const server = new Server(
        {
            name: SERVER_NAME,
            version: SERVER_VERSION,
        },
        {
            capabilities: {
                tools: {},
                resources: {},
                prompts: {},
            },
        },
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
            {
                name: 'extract_xero_b2b_leads_and_churn',
                description:
                    'Extract live B2B SaaS vendor leads, partner websites, 1-5 star histograms, and 1-3 star dissatisfied user churn reviews from the Xero App Store via pure-HTTP extraction (signalgridhq/xero-app-marketplace-scraper).',
                annotations: {
                    title: 'Extract Xero App Store B2B Leads & Churn Reviews',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
                inputSchema: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        mode: {
                            type: 'string',
                            enum: ['apps', 'churn_reviews', 'apps_with_churn'],
                            default: 'apps_with_churn',
                            description:
                                "Extraction mode: 'apps' for vendor metadata only, 'churn_reviews' for 1-3 star churn reviews only, or 'apps_with_churn' for combined vendor leads + recent churn signals.",
                        },
                        region: {
                            type: 'string',
                            enum: ['us', 'uk', 'au', 'nz', 'ca', 'sg', 'za'],
                            default: 'us',
                            description: 'Regional Xero App Store storefront.',
                        },
                        appSlugs: {
                            type: 'array',
                            items: { type: 'string' },
                            description:
                                "Optional exact Xero app slugs to inspect (e.g. ['dext', 'gusto', 'approvalmax', 'a2x']).",
                        },
                        categorySlugs: {
                            type: 'array',
                            items: { type: 'string' },
                            description:
                                "Optional Xero functional category slugs (e.g. ['bills-expenses', 'payroll-hr', 'inventory', 'payments']).",
                        },
                        ratingsFilter: {
                            type: 'array',
                            items: { type: 'integer', minimum: 1, maximum: 5 },
                            default: [1, 2, 3],
                            description: 'Star ratings (1-5) to target when fetching churn reviews.',
                        },
                        maxReviewsPerApp: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 50,
                            default: 6,
                            description: 'Maximum filtered reviews per app.',
                        },
                        maxItems: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 200,
                            default: 15,
                            description: 'Maximum dataset items to return in this MCP call (1-200).',
                        },
                    },
                },
            },
            {
                name: 'extract_quickbooks_b2b_leads_and_churn',
                description:
                    'Extract live B2B vendor contacts (supportEmail, supportPhone, vendor website), pricing tiers, Intuit AQI quality badges, and 1-3 star churn reviews from the QuickBooks App Store (signalgridhq/quickbooks-app-marketplace-scraper).',
                annotations: {
                    title: 'Extract QuickBooks App Store Vendor Contacts & Churn Reviews',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
                inputSchema: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        mode: {
                            type: 'string',
                            enum: ['apps', 'churn_reviews', 'apps_with_churn'],
                            default: 'apps_with_churn',
                            description:
                                "Extraction mode: 'apps' for vendor contacts & pricing, 'churn_reviews' for 1-3 star reviews, or 'apps_with_churn' for both.",
                        },
                        locale: {
                            type: 'string',
                            enum: ['en-us', 'en-gb', 'en-ca', 'en-au', 'fr-ca'],
                            default: 'en-us',
                            description: 'Regional QuickBooks App Store locale.',
                        },
                        appShortNames: {
                            type: 'array',
                            items: { type: 'string' },
                            description:
                                "Optional exact QuickBooks app shortNames (e.g. ['billcom', 'dext_enhanced_version', 'ramp', 'method_crm']).",
                        },
                        categories: {
                            type: 'array',
                            items: { type: 'string' },
                            description:
                                "Optional QuickBooks categories (e.g. ['Track Expenses', 'Send Invoices', 'Sync Data', 'Track Inventory']).",
                        },
                        searchQuery: {
                            type: 'string',
                            description: "Optional keyword filter (e.g. 'payroll', 'accounts payable', 'shopify').",
                        },
                        ratingsFilter: {
                            type: 'array',
                            items: { type: 'integer', minimum: 1, maximum: 5 },
                            default: [1, 2, 3],
                            description: 'Star ratings (1-5) to fetch via Intuit Review GraphQL.',
                        },
                        maxReviewsPerApp: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 50,
                            default: 6,
                            description: 'Maximum filtered reviews per app.',
                        },
                        maxItems: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 200,
                            default: 15,
                            description: 'Maximum dataset items to return in this MCP call (1-200).',
                        },
                    },
                },
            },
            {
                name: 'extract_fda_port_refusal_leads',
                description:
                    'Extract official US FDA OASIS port detention and import refusal records including foreign manufacturer FEI, full street address, private-lab analysis gap flag, and FD&C Act violation charges (signalgridhq/fda-import-refusal-leads).',
                annotations: {
                    title: 'Extract US FDA Port Detention & Import Refusal B2B Leads',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
                inputSchema: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        year: {
                            type: 'integer',
                            minimum: 2001,
                            maximum: 2030,
                            default: 2026,
                            description: '4-digit year of FDA OASIS Import Refusal Reports.',
                        },
                        month: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 12,
                            default: 10,
                            description: 'Numeric month (1-12) of FDA OASIS Import Refusal Reports.',
                        },
                        countryCodes: {
                            type: 'array',
                            items: { type: 'string' },
                            default: ['VN', 'IN', 'MX'],
                            description:
                                "2-letter ISO exporter country codes (e.g. ['VN', 'CN', 'IN', 'MX', 'IT', 'KR', 'TH']).",
                        },
                        onlyMissingPrivateLab: {
                            type: 'boolean',
                            default: false,
                            description:
                                'When true, filters strictly to detained shipments missing private laboratory sample analysis (highest-intent compliance & lab testing leads).',
                        },
                        maxItems: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 200,
                            default: 15,
                            description: 'Maximum dataset items to return in this MCP call (1-200).',
                        },
                    },
                },
            },
            {
                name: 'extract_zoho_b2b_leads_and_churn',
                description:
                    'Extract live Zoho Marketplace B2B SaaS vendor leads, direct support & company emails, phone numbers, verified partner street addresses, pricing models, and 1-3 star churn reviews across Zoho CRM, Books, Desk & Inventory (signalgridhq/zoho-marketplace-scraper).',
                annotations: {
                    title: 'Extract Zoho Marketplace B2B Vendor Leads & Churn Reviews',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
                inputSchema: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        mode: {
                            type: 'string',
                            enum: ['apps', 'churn_reviews', 'apps_with_churn'],
                            default: 'apps_with_churn',
                            description:
                                "Extraction mode: 'apps' for vendor contacts & street addresses, 'churn_reviews' for 1-3 star reviews, or 'apps_with_churn' for both.",
                        },
                        products: {
                            type: 'array',
                            items: { type: 'string' },
                            default: ['books', 'crm'],
                            description:
                                "Zoho product marketplaces to crawl (e.g. ['books', 'crm', 'desk', 'inventory', 'billing', 'recruit']).",
                        },
                        searchQuery: {
                            type: 'string',
                            description: "Optional keyword filter (e.g. 'stripe', 'whatsapp', 'shopify').",
                        },
                        maxItems: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 200,
                            default: 15,
                            description: 'Maximum dataset items to return in this MCP call (1-200).',
                        },
                    },
                },
            },
            {
                name: 'extract_netsuite_b2b_leads_and_churn',
                description:
                    'Extract live Oracle NetSuite SuiteApp ERP B2B vendor leads, Built-for-NetSuite badges, SuiteScript/SuiteTalk integration stacks, supported countries & verticals, star histograms, and 1-3 star implementation churn reviews (signalgridhq/netsuite-suiteapp-directory-scraper).',
                annotations: {
                    title: 'Extract NetSuite SuiteApp ERP Vendor Leads & Churn Reviews',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
                inputSchema: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        mode: {
                            type: 'string',
                            enum: ['apps', 'churn_reviews', 'apps_with_churn'],
                            default: 'apps_with_churn',
                            description:
                                "Extraction mode: 'apps' for ERP vendor directory & stack metadata, 'churn_reviews' for 1-3 star reviews, or 'apps_with_churn' for both.",
                        },
                        searchQuery: {
                            type: 'string',
                            description: "Optional keyword filter (e.g. 'edi', 'wms', 'avalara', 'payments').",
                        },
                        categoryFilter: {
                            type: 'string',
                            description: "Optional SuiteApp category (e.g. 'Featured', 'Latest', 'Staff-Pick').",
                        },
                        appSlugs: {
                            type: 'array',
                            items: { type: 'string' },
                            description:
                                "Optional exact SuiteApp urlComponents (e.g. ['ShipBob', 'Versapay-for-NetSuite-SuitePayments']).",
                        },
                        maxItems: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 200,
                            default: 15,
                            description: 'Maximum dataset items to return in this MCP call (1-200).',
                        },
                    },
                },
            },
            {
                name: 'extract_quickbooks_proadvisor_leads',
                description:
                    'Extract 100,000+ Intuit QuickBooks ProAdvisor CPAs, Enrolled Agents, and B2B bookkeeping firms across US, CA, UK, AU & IN—complete with firm websites, LinkedIn profiles, bio-extracted emails/phones, certifications, and client review ratings (signalgridhq/quickbooks-proadvisor-scraper).',
                annotations: {
                    title: 'Extract QuickBooks ProAdvisor CPA & Bookkeeper Leads',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: true,
                },
                inputSchema: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        region: {
                            type: 'string',
                            enum: ['US', 'CA', 'GB', 'AU', 'IN'],
                            default: 'US',
                            description: 'QuickBooks ProAdvisor directory region.',
                        },
                        locations: {
                            type: 'array',
                            items: { type: 'string' },
                            description:
                                "Cities or ZIP/postal codes to query (e.g. ['New York, NY', 'Austin, TX', '94105']).",
                        },
                        radiusMiles: {
                            type: 'integer',
                            minimum: 5,
                            maximum: 200,
                            default: 50,
                            description: 'Search radius in miles around each location.',
                        },
                        onlyCpaOrEa: {
                            type: 'boolean',
                            default: false,
                            description: 'Keep only CPAs or Enrolled Agents (EAs).',
                        },
                        minReviews: {
                            type: 'integer',
                            minimum: 0,
                            maximum: 1000,
                            default: 0,
                            description: 'Minimum number of verified client reviews.',
                        },
                        maxItems: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 200,
                            default: 15,
                            description: 'Maximum dataset items to return in this MCP call (1-200).',
                        },
                    },
                },
            },
            {
                name: 'preview_sample_b2b_dataset',
                description:
                    'Read verified offline sample rows (up to 50 records) from the bundled Xero App Store, QuickBooks App Store, QuickBooks ProAdvisor CPA Directory, Zoho Marketplace, NetSuite SuiteApp ERP, or US FDA Import Refusal datasets with zero API key required.',
                annotations: {
                    title: 'Preview Offline B2B Sample Dataset (No API Key Needed)',
                    readOnlyHint: true,
                    destructiveHint: false,
                    idempotentHint: true,
                    openWorldHint: false,
                },
                inputSchema: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['dataset'],
                    properties: {
                        dataset: {
                            type: 'string',
                            enum: ['xero', 'quickbooks', 'quickbooks-proadvisor', 'zoho', 'netsuite', 'fda'],
                            description:
                                "Which bundled B2B dataset to preview: 'xero', 'quickbooks', 'quickbooks-proadvisor', 'zoho', 'netsuite', or 'fda'.",
                        },
                        limit: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 50,
                            default: 10,
                            description: 'Number of sample records to return (1-50).',
                        },
                    },
                },
            },
        ],
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: rawArgs } = request.params;
        const args = (rawArgs ?? {}) as Record<string, unknown>;

        try {
            if (name === 'preview_sample_b2b_dataset') {
                const datasetKey = String(args.dataset ?? 'xero') as SampleCatalogEntry['key'];
                const entry = SAMPLE_CATALOG.find((item) => item.key === datasetKey);
                if (!entry) {
                    return {
                        isError: true,
                        content: [
                            {
                                type: 'text',
                                text: `Invalid dataset "${datasetKey}". Expected one of: xero, quickbooks, fda.`,
                            },
                        ],
                    };
                }
                const csvPath = path.join(SAMPLES_DIR, entry.filename);
                const csvText = await readFile(csvPath, 'utf8');
                const limit = typeof args.limit === 'number' ? args.limit : 10;
                const rows = parseCsvPreview(csvText, limit);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    dataset: entry.key,
                                    sourceFile: `samples/${entry.filename}`,
                                    returnedRows: rows.length,
                                    rows,
                                },
                                null,
                                2,
                            ),
                        },
                    ],
                };
            }

            if (name === 'extract_xero_b2b_leads_and_churn') {
                const payload: Record<string, unknown> = {
                    mode: typeof args.mode === 'string' ? args.mode : 'apps_with_churn',
                    region: typeof args.region === 'string' ? args.region : 'us',
                    ratingsFilter: Array.isArray(args.ratingsFilter) ? args.ratingsFilter : [1, 2, 3],
                    maxReviewsPerApp: typeof args.maxReviewsPerApp === 'number' ? args.maxReviewsPerApp : 6,
                    maxItems: clampMaxItems(args.maxItems, 15),
                };
                if (Array.isArray(args.appSlugs) && args.appSlugs.length > 0) {
                    payload.appSlugs = args.appSlugs;
                }
                if (Array.isArray(args.categorySlugs) && args.categorySlugs.length > 0) {
                    payload.categorySlugs = args.categorySlugs;
                }
                const items = await runApifyActor('xero-app-marketplace-scraper', payload);
                return {
                    content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
                };
            }

            if (name === 'extract_quickbooks_b2b_leads_and_churn') {
                const payload: Record<string, unknown> = {
                    mode: typeof args.mode === 'string' ? args.mode : 'apps_with_churn',
                    locale: typeof args.locale === 'string' ? args.locale : 'en-us',
                    ratingsFilter: Array.isArray(args.ratingsFilter) ? args.ratingsFilter : [1, 2, 3],
                    maxReviewsPerApp: typeof args.maxReviewsPerApp === 'number' ? args.maxReviewsPerApp : 6,
                    maxItems: clampMaxItems(args.maxItems, 15),
                };
                if (Array.isArray(args.appShortNames) && args.appShortNames.length > 0) {
                    payload.appShortNames = args.appShortNames;
                }
                if (Array.isArray(args.categories) && args.categories.length > 0) {
                    payload.categories = args.categories;
                }
                if (typeof args.searchQuery === 'string' && args.searchQuery.trim().length > 0) {
                    payload.searchQuery = args.searchQuery.trim();
                }
                const items = await runApifyActor('quickbooks-app-marketplace-scraper', payload);
                return {
                    content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
                };
            }

            if (name === 'extract_zoho_b2b_leads_and_churn') {
                const payload: Record<string, unknown> = {
                    mode: typeof args.mode === 'string' ? args.mode : 'apps_with_churn',
                    products: Array.isArray(args.products) ? args.products : ['books', 'crm'],
                    maxItems: clampMaxItems(args.maxItems, 15),
                };
                if (typeof args.searchQuery === 'string' && args.searchQuery.trim().length > 0) {
                    payload.searchQuery = args.searchQuery.trim();
                }
                const items = await runApifyActor('zoho-marketplace-scraper', payload);
                return {
                    content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
                };
            }

            if (name === 'extract_netsuite_b2b_leads_and_churn') {
                const payload: Record<string, unknown> = {
                    mode: typeof args.mode === 'string' ? args.mode : 'apps_with_churn',
                    maxItems: clampMaxItems(args.maxItems, 15),
                };
                if (typeof args.searchQuery === 'string' && args.searchQuery.trim().length > 0) {
                    payload.searchQuery = args.searchQuery.trim();
                }
                if (typeof args.categoryFilter === 'string' && args.categoryFilter.trim().length > 0) {
                    payload.categoryFilter = args.categoryFilter.trim();
                }
                if (Array.isArray(args.appSlugs) && args.appSlugs.length > 0) {
                    payload.appSlugs = args.appSlugs;
                }
                const items = await runApifyActor('netsuite-suiteapp-directory-scraper', payload);
                return {
                    content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
                };
            }

            if (name === 'extract_quickbooks_proadvisor_leads') {
                const payload: Record<string, unknown> = {
                    region: typeof args.region === 'string' ? args.region : 'US',
                    radiusMiles: typeof args.radiusMiles === 'number' ? args.radiusMiles : 50,
                    onlyCpaOrEa: Boolean(args.onlyCpaOrEa),
                    minReviews: typeof args.minReviews === 'number' ? args.minReviews : 0,
                    maxItems: clampMaxItems(args.maxItems, 15),
                };
                if (Array.isArray(args.locations) && args.locations.length > 0) {
                    payload.locations = args.locations;
                }
                const items = await runApifyActor('quickbooks-proadvisor-scraper', payload);
                return {
                    content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
                };
            }

            if (name === 'extract_fda_port_refusal_leads') {
                const payload: Record<string, unknown> = {
                    year: typeof args.year === 'number' ? args.year : 2026,
                    month: typeof args.month === 'number' ? args.month : 10,
                    countryCodes: Array.isArray(args.countryCodes) ? args.countryCodes : ['VN', 'IN', 'MX'],
                    onlyMissingPrivateLab: Boolean(args.onlyMissingPrivateLab),
                    maxItems: clampMaxItems(args.maxItems, 15),
                };
                const items = await runApifyActor('fda-import-refusal-leads', payload);
                return {
                    content: [{ type: 'text', text: JSON.stringify(items, null, 2) }],
                };
            }

            return {
                isError: true,
                content: [{ type: 'text', text: `Unknown tool: ${name}` }],
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                isError: true,
                content: [{ type: 'text', text: message }],
            };
        }
    });

    server.setRequestHandler(ListResourcesRequestSchema, async () => ({
        resources: SAMPLE_CATALOG.map((entry) => ({
            uri: entry.uri,
            name: entry.name,
            description: entry.description,
            mimeType: 'text/csv',
        })),
    }));

    server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const { uri } = request.params;
        const entry = SAMPLE_CATALOG.find((item) => item.uri === uri);
        if (!entry) {
            throw new Error(`Unknown resource URI: ${uri}`);
        }
        const csvPath = path.join(SAMPLES_DIR, entry.filename);
        const text = await readFile(csvPath, 'utf8');
        return {
            contents: [
                {
                    uri: entry.uri,
                    mimeType: 'text/csv',
                    text,
                },
            ],
        };
    });

    server.setRequestHandler(ListPromptsRequestSchema, async () => ({
        prompts: [
            {
                name: 'find-competitor-churn-leads',
                description:
                    'Analyze 1-3 star Xero and QuickBooks App Store reviews to surface high-intent SaaS migration & churn opportunities.',
                arguments: [
                    {
                        name: 'category',
                        description: 'Target accounting software category (e.g. bills-expenses, payroll-hr, inventory)',
                        required: false,
                    },
                ],
            },
            {
                name: 'triage-fda-detained-shipments',
                description:
                    'Identify foreign exporters with recent US FDA OASIS port detentions that lack private laboratory sample analysis.',
                arguments: [
                    {
                        name: 'countryCode',
                        description: '2-letter ISO exporter country code (e.g. VN, IN, MX, CN)',
                        required: false,
                    },
                ],
            },
        ],
    }));

    server.setRequestHandler(GetPromptRequestSchema, async (request) => {
        const { name, arguments: promptArgs } = request.params;
        if (name === 'find-competitor-churn-leads') {
            const category = promptArgs?.category || 'bills-expenses';
            return {
                description: 'Cross-marketplace SaaS churn intelligence workflow',
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Use extract_xero_b2b_leads_and_churn (categorySlugs: ["${category}"], mode: "apps_with_churn", maxItems: 15) and extract_quickbooks_b2b_leads_and_churn (searchQuery: "${category}", mode: "apps_with_churn", maxItems: 15) to compare 1-3 star churn complaints, pricing friction, and support emails across both ecosystems.`,
                        },
                    },
                ],
            };
        }

        if (name === 'triage-fda-detained-shipments') {
            const country = promptArgs?.countryCode || 'VN';
            return {
                description: 'US FDA OASIS port detention compliance outreach triage',
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: `Use extract_fda_port_refusal_leads with countryCodes: ["${country}"] and onlyMissingPrivateLab: true (maxItems: 20) to list manufacturers whose detained US shipments lack private laboratory testing, grouped by FD&C Act violation charge.`,
                        },
                    },
                ],
            };
        }

        throw new Error(`Unknown prompt: ${name}`);
    });

    return server;
}

async function main(): Promise<void> {
    const server = createSignalGridMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

const isDirectExecution =
    process.argv[1] !== undefined && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectExecution) {
    main().catch((error) => {
        console.error('[signalgrid-b2b-mcp] Fatal startup error:', error);
        process.exit(1);
    });
}
