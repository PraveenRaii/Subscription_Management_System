import { Request, Response, Router } from 'express';

export const swaggerRouter = Router();

const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Billflow 2.0 API',
    version: '2.0.0',
    description: 'Enterprise AI-Powered SaaS Subscription, Automated Billing & Revenue Intelligence API',
    contact: {
      name: 'Billflow Platform Engineering',
      email: 'api@billflow.io',
    },
  },
  servers: [
    {
      url: 'http://localhost:5001/api',
      description: 'Local Development Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Step 1: Register new user with 6-digit email OTP',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Aarav Patel' },
                  email: { type: 'string', example: 'aarav@acmecorp.com' },
                  password: { type: 'string', example: 'Password@123' },
                  companyName: { type: 'string', example: 'Acme Cloud Labs' },
                  phone: { type: 'string', example: '+91 98765 43210' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'OTP dispatched to email. Verification pending.' },
        },
      },
    },
    '/auth/verify-otp': {
      post: {
        summary: 'Step 2: Verify 6-digit OTP and activate account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otp'],
                properties: {
                  email: { type: 'string', example: 'aarav@acmecorp.com' },
                  otp: { type: 'string', example: '492815' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Account verified successfully. Returns JWT and user session.' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User and Admin authentication',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@subflow.io' },
                  password: { type: 'string', example: 'Password@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully. Returns JWT token and user profile.' },
        },
      },
    },
    '/subscriptions': {
      get: {
        summary: 'List subscriptions (scoped by tenant and role)',
        security: [{ BearerAuth: [] }],
        tags: ['Subscriptions'],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Array of subscription objects.' },
        },
      },
      post: {
        summary: 'Create a new subscription with trial or activation',
        security: [{ BearerAuth: [] }],
        tags: ['Subscriptions'],
        responses: {
          201: { description: 'Subscription created.' },
        },
      },
    },
    '/subscriptions/{id}/change-plan': {
      post: {
        summary: 'Upgrade or downgrade subscription with mathematical proration',
        security: [{ BearerAuth: [] }],
        tags: ['Subscriptions'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['newPlanId'],
                properties: {
                  newPlanId: { type: 'string' },
                  applyImmediately: { type: 'boolean', default: true },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Plan updated with proration invoice or credit balance applied.' },
        },
      },
    },
    '/subscriptions/{id}/preview-proration': {
      post: {
        summary: 'Calculate proration credit/charge before applying plan change',
        security: [{ BearerAuth: [] }],
        tags: ['Subscriptions'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Proration breakdown showing unused credit and net charge.' },
        },
      },
    },
    '/subscriptions/{id}/timeline': {
      get: {
        summary: 'Get subscription activity audit timeline',
        security: [{ BearerAuth: [] }],
        tags: ['Subscriptions'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Full chronological event timeline for the subscription.' },
        },
      },
    },
    '/invoices': {
      get: {
        summary: 'List invoices with GST tax calculation',
        security: [{ BearerAuth: [] }],
        tags: ['Invoices'],
        responses: {
          200: { description: 'Invoices list with CGST/SGST/IGST breakdown.' },
        },
      },
    },
    '/invoices/{id}/pdf': {
      get: {
        summary: 'Download itemized GST tax invoice as PDF',
        security: [{ BearerAuth: [] }],
        tags: ['Invoices'],
        responses: {
          200: { description: 'Binary PDF file buffer.' },
        },
      },
    },
    '/payments/create-order': {
      post: {
        summary: 'Create Razorpay Test Order',
        security: [{ BearerAuth: [] }],
        tags: ['Payments'],
        responses: {
          200: { description: 'Razorpay order ID, key, and transaction record.' },
        },
      },
    },
    '/payments/verify': {
      post: {
        summary: 'Verify Razorpay HMAC signature and settle invoice',
        security: [{ BearerAuth: [] }],
        tags: ['Payments'],
        responses: {
          200: { description: 'Payment marked success, invoice marked paid.' },
        },
      },
    },
    '/credit-notes': {
      get: {
        summary: 'List issued credit notes and refund records',
        security: [{ BearerAuth: [] }],
        tags: ['Credit Notes'],
        responses: {
          200: { description: 'Credit notes array.' },
        },
      },
      post: {
        summary: 'Issue credit note or refund adjustment',
        security: [{ BearerAuth: [] }],
        tags: ['Credit Notes'],
        responses: {
          201: { description: 'Credit note created and invoice adjusted.' },
        },
      },
    },
    '/analytics/dashboard': {
      get: {
        summary: 'Get SaaS metrics: MRR, ARR, Churn, LTV, Aging Report, Top Customers',
        security: [{ BearerAuth: [] }],
        tags: ['Analytics'],
        responses: {
          200: { description: 'Dashboard analytics payload.' },
        },
      },
    },
    '/ai/chat': {
      post: {
        summary: 'AI Business Intelligence Assistant chat (OpenAI / Gemini)',
        security: [{ BearerAuth: [] }],
        tags: ['AI Intelligence'],
        responses: {
          200: { description: 'AI conversational analysis and guidance.' },
        },
      },
    },
    '/billing/run-cycle': {
      post: {
        summary: 'Manually trigger recurring billing engine (Dunning, renewals, trial conversion)',
        security: [{ BearerAuth: [] }],
        tags: ['Billing Engine'],
        responses: {
          200: { description: 'Cycle executed with summary of processed subscriptions.' },
        },
      },
    },
  },
};

// Serve JSON spec
swaggerRouter.get('/spec.json', (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

// Serve interactive Orange-branded SaaS API Explorer
swaggerRouter.get('/', (_req: Request, res: Response) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Billflow 2.0 - API Documentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #0c0e14;
      color: #f1f5f9;
      line-height: 1.6;
    }
    header {
      background: #12151e;
      border-bottom: 1px solid #1e2433;
      padding: 1.25rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .brand-logo {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      color: white;
      font-size: 1.2rem;
      box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);
    }
    .brand-text h1 {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .brand-text span {
      font-size: 0.75rem;
      color: #94a3b8;
      display: block;
    }
    .header-links a {
      color: #f97316;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 600;
      background: rgba(249, 115, 22, 0.1);
      padding: 0.4rem 0.85rem;
      border-radius: 8px;
      border: 1px solid rgba(249, 115, 22, 0.25);
      transition: all 0.2s;
    }
    .header-links a:hover {
      background: rgba(249, 115, 22, 0.2);
    }
    .container {
      max-width: 1200px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }
    .hero {
      background: linear-gradient(180deg, rgba(249, 115, 22, 0.08) 0%, rgba(18, 21, 30, 0) 100%);
      border: 1px solid #1e2433;
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
    }
    .hero h2 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #ffffff;
    }
    .hero p {
      color: #94a3b8;
      font-size: 0.95rem;
      max-width: 800px;
    }
    .badge-bar {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.25rem;
      flex-wrap: wrap;
    }
    .badge {
      background: #181d28;
      border: 1px solid #283042;
      border-radius: 6px;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    .badge.orange {
      background: rgba(249, 115, 22, 0.15);
      border-color: rgba(249, 115, 22, 0.4);
      color: #fb923c;
    }
    .endpoint-card {
      background: #12151e;
      border: 1px solid #1e2433;
      border-radius: 12px;
      margin-bottom: 1rem;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .endpoint-card:hover {
      border-color: #2e374d;
    }
    .endpoint-header {
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
    }
    .method {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 0.75rem;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .method.post { background: rgba(249, 115, 22, 0.2); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.4); }
    .method.get { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
    .method.put { background: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.4); }
    .method.delete { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4); }
    .path {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      font-weight: 600;
      color: #f8fafc;
      flex: 1;
    }
    .summary {
      font-size: 0.85rem;
      color: #94a3b8;
    }
    .tag-badge {
      font-size: 0.7rem;
      background: #181d28;
      color: #94a3b8;
      border: 1px solid #283042;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
    }
    .endpoint-body {
      background: #0d1017;
      border-top: 1px solid #1a202c;
      padding: 1.25rem;
      font-size: 0.85rem;
    }
    pre {
      background: #090a0f;
      border: 1px solid #1e2433;
      border-radius: 8px;
      padding: 1rem;
      color: #e2e8f0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      overflow-x: auto;
      margin-top: 0.5rem;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">B</div>
      <div class="brand-text">
        <h1>Billflow 2.0 API Docs</h1>
        <span>SaaS Billing, Proration & AI Revenue Engine</span>
      </div>
    </div>
    <div class="header-links">
      <a href="/api/docs/spec.json" target="_blank">View OpenAPI 3.0 JSON</a>
    </div>
  </header>

  <div class="container">
    <div class="hero">
      <h2>Interactive REST API Documentation</h2>
      <p>Explore all production endpoints for Billflow 2.0. Includes 2-Step OTP Authentication, Mathematical Proration, Razorpay Gateway, GST Tax Billing, Dunning Retries, and AI Intelligence.</p>
      <div class="badge-bar">
        <span class="badge orange">OpenAPI 3.0</span>
        <span class="badge">Base URL: /api</span>
        <span class="badge">JWT Bearer Auth</span>
        <span class="badge">Indian GST (CGST/SGST/IGST)</span>
        <span class="badge">Razorpay Test Mode</span>
      </div>
    </div>

    <div id="endpoints-list">
      <!-- Generated Cards -->
      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method post">POST</span>
          <span class="path">/auth/register</span>
          <span class="summary">Step 1: Register new user with 6-digit email OTP</span>
          <span class="tag-badge">Authentication</span>
        </div>
        <div class="endpoint-body">
          <strong>Request Payload (JSON):</strong>
          <pre>{
  "name": "Aarav Patel",
  "email": "aarav@acmecorp.com",
  "password": "Password@123",
  "companyName": "Acme Cloud Labs",
  "phone": "+91 98765 43210"
}</pre>
        </div>
      </div>

      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method post">POST</span>
          <span class="path">/auth/verify-otp</span>
          <span class="summary">Step 2: Verify 6-digit OTP & activate customer account</span>
          <span class="tag-badge">Authentication</span>
        </div>
        <div class="endpoint-body">
          <strong>Request Payload (JSON):</strong>
          <pre>{
  "email": "aarav@acmecorp.com",
  "otp": "492815"
}</pre>
        </div>
      </div>

      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method post">POST</span>
          <span class="path">/auth/login</span>
          <span class="summary">Sign in with email and password</span>
          <span class="tag-badge">Authentication</span>
        </div>
        <div class="endpoint-body">
          <strong>Request Payload (JSON):</strong>
          <pre>{
  "email": "admin@subflow.io",
  "password": "Password@123"
}</pre>
        </div>
      </div>

      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method get">GET</span>
          <span class="path">/analytics/dashboard</span>
          <span class="summary">Get SaaS metrics: MRR, ARR, Churn, Aging Report, Top Customers</span>
          <span class="tag-badge">Analytics</span>
        </div>
        <div class="endpoint-body">
          <strong>Query Parameters:</strong> currency=INR | USD | EUR, period=12m<br>
          <strong>Response Payload:</strong> MRR, ARR, LTV, Churn Rate, Aging Buckets (0-30, 31-60, 60+ days), Top Customers.
        </div>
      </div>

      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method post">POST</span>
          <span class="path">/subscriptions/:id/preview-proration</span>
          <span class="summary">Calculate proration credit/charge before applying plan change</span>
          <span class="tag-badge">Subscriptions</span>
        </div>
        <div class="endpoint-body">
          <strong>Request Payload:</strong> { "newPlanId": "plan_67890" }<br>
          <strong>Output:</strong> Unused period credit, new plan charge, and net adjustment amount.
        </div>
      </div>

      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method post">POST</span>
          <span class="path">/subscriptions/:id/change-plan</span>
          <span class="summary">Apply plan upgrade or downgrade with mathematical proration</span>
          <span class="tag-badge">Subscriptions</span>
        </div>
      </div>

      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method get">GET</span>
          <span class="path">/subscriptions/:id/timeline</span>
          <span class="summary">Get full chronological event timeline for the subscription</span>
          <span class="tag-badge">Subscriptions</span>
        </div>
      </div>

      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method get">GET</span>
          <span class="path">/invoices/:id/pdf</span>
          <span class="summary">Download itemized GST tax invoice as binary PDF</span>
          <span class="tag-badge">Invoices</span>
        </div>
      </div>

      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method post">POST</span>
          <span class="path">/credit-notes</span>
          <span class="summary">Issue credit note or refund adjustment for an invoice</span>
          <span class="tag-badge">Credit Notes</span>
        </div>
      </div>

      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method post">POST</span>
          <span class="path">/payments/create-order</span>
          <span class="summary">Create Razorpay test order with HMAC verification key</span>
          <span class="tag-badge">Payments</span>
        </div>
      </div>

      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method post">POST</span>
          <span class="path">/ai/chat</span>
          <span class="summary">AI Business Intelligence Copilot chat (OpenAI GPT-4o-mini / Gemini)</span>
          <span class="tag-badge">AI Intelligence</span>
        </div>
      </div>

      <div class="endpoint-card">
        <div class="endpoint-header">
          <span class="method post">POST</span>
          <span class="path">/billing/run-cycle</span>
          <span class="summary">Trigger recurring billing cycle: Dunning retries, trial expirations & renewal invoices</span>
          <span class="tag-badge">Billing Engine</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});
