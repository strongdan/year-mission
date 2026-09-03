# Finance integration

Year Mission treats financial data as **read-only telemetry**. It does not replace a budgeting application, does not ask for bank usernames/passwords, and does not initiate payments or transfers.

## Architecture

```text
Banks / credit cards ----> Plaid (preferred) ----+
Banks / credit cards ----> SimpleFIN -----------+
Banks / CSV / OFX -------> Actual Budget -------+----> normalized Year Mission finance hub ----> Supabase
Unsupported loans -------- manual balance -------+
```

Year Mission normalizes all sources into:

- accounts
- transactions
- liabilities

The existing `financial_snapshots` table remains the compact progress-level summary. Finance sync updates its cash-reserve and consumer-debt values so existing Money progress views continue to work.

---

# Plaid — preferred real banking integration

Plaid is the preferred first-party connection path because its current Trial plan can provide real Production data for a small personal deployment without per-Item billing, subject to Plaid eligibility and plan limits. Year Mission only requests data products needed for the Money domain.

## Data scope

Initial Link requests:

- Transactions
- optional Liabilities consent

After connection, Year Mission reads:

- account metadata
- balances
- incremental posted/pending transaction changes
- credit-card/student-loan/mortgage liability details when supported and consented

Year Mission does **not** request or implement payment initiation, bank transfers, Auth account/routing-number retrieval, or lending/credit application flows.

## Server configuration

Configure these server-side values:

```text
PLAID_CLIENT_ID
PLAID_SECRET
PLAID_ENVIRONMENT=sandbox|production
PLAID_REDIRECT_URI=https://<year-mission-host>/settings   # required for OAuth institutions
PLAID_WEBHOOK_URL=https://<year-mission-host>/api/...    # optional until webhook sync is added
INTEGRATION_SECRETS_KEY                                  # 32-byte base64 encryption root
SUPABASE_SERVICE_ROLE_KEY
```

Do not expose `PLAID_SECRET`, permanent Plaid access tokens, or `INTEGRATION_SECRETS_KEY` client-side.

Register the exact production/preview redirect URI in the Plaid Dashboard before testing OAuth institutions. During the Cloudflare migration, keep both the Vercel rollback URI and Cloudflare qualification URI registered until rollback is retired.

## Link flow

```text
Settings → Connect bank
  ↓
server creates short-lived link_token
  ↓
Plaid Link opens in browser/PWA
  ↓
user authenticates/consents at institution
  ↓
new connection: public_token returned once
  ↓
server exchanges public_token for access_token + item_id
  ↓
access_token encrypted server-side
  ↓
accounts + transactions + optional liabilities normalized into finance hub
```

For OAuth institutions, the short-lived Link session is stored in browser local storage only long enough to resume Plaid Link after redirect. The permanent access token never enters browser storage.

## Connection storage

`finance_connections` stores:

- Year Mission user id
- Plaid Item id
- encrypted permanent access token
- institution display name
- health/reconnect status
- Transactions sync cursor
- optional consent-expiration metadata
- last sync/error metadata

Row Level Security intentionally defines no normal user SELECT/INSERT/UPDATE policy for this table. Authenticated server actions use the Supabase service role and always scope reads/writes by the authenticated `user_id`. This keeps even the encrypted token ciphertext outside normal browser-accessible queries.

## Transaction sync

Year Mission uses Plaid's cursor-based `/transactions/sync` model rather than re-downloading a date window on every request.

Behavior:

- persist the last successful cursor per Plaid Item
- upsert added/modified transactions by stable Plaid transaction id
- delete transactions Plaid marks removed
- preserve Year Mission's sign convention: **negative = outflow, positive = inflow**
- restart a paginated sync once if Plaid reports `TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION`
- cap pagination to prevent unbounded requests
- mark the connection `reconnect_required` for recoverable Item authorization failures

## Reconnect / update mode

When a Plaid Item requires user action, Settings exposes **Reconnect** and launches Plaid Link in update mode using the existing encrypted access token. Update mode does not exchange a new permanent access token; after successful authorization Year Mission retries finance sync.

## Disconnect / deletion

Two separate controls intentionally exist:

1. **Disconnect** calls Plaid Item removal and deletes the stored connection/access token while keeping normalized historical finance data.
2. **Delete imported Plaid data** deletes Plaid-sourced accounts, transactions, and liabilities from Year Mission without touching the bank itself.

This distinction prevents a simple credential disconnect from unexpectedly destroying the user's historical Money data.

## Operational dependency

The repository implementation can be built/tested without live bank credentials. Real production linking still requires:

- a Plaid account eligible for the desired Production plan
- `PLAID_CLIENT_ID` and Production secret
- approved/registered redirect URIs
- the `0014_plaid_finance.sql` migration applied
- a real institution smoke test after deployment

Do not claim the production banking integration is activated until those provider-side steps and a real read-only sync are qualified.

---

# SimpleFIN — low-cost fallback

SimpleFIN remains supported as a simple bank/card fallback. It is low-cost rather than free.

In Year Mission:

1. Open Settings → Finances.
2. Obtain a one-time SimpleFIN setup token from SimpleFIN Bridge.
3. Paste the setup token into Year Mission.
4. Choose **Connect SimpleFIN**.

The setup token is claimed only once. The resulting credential-bearing SimpleFIN access URL is encrypted with AES-256-GCM and stored in an HttpOnly secure cookie. The encryption root is `INTEGRATION_SECRETS_KEY`, falling back to `GOOGLE_TOKEN_ENCRYPTION_KEY` for existing deployments.

The access URL is never rendered back to the browser and must never be logged.

This storage is intentionally browser/session scoped and supports manual **Sync now**. If unattended finance sync is added, move SimpleFIN credentials into the same durable server-side per-user secret model used for Plaid.

---

# Actual Budget

Actual remains the better place for budgeting, reconciliation, categories, and imports from CSV/OFX/QFX. Year Mission only consumes normalized data.

Actual does not expose a general REST API. Its supported automation surfaces are its Node API and CLI. The included bridge script uses the Actual CLI and POSTs a normalized payload to Year Mission.

## Install Actual CLI

The Actual CLI requires Node.js 22+.

```bash
npm install --location=global @actual-app/cli
```

Typical environment variables:

```text
ACTUAL_SERVER_URL=https://your-actual-server.example
ACTUAL_SYNC_ID=<budget-sync-id>
ACTUAL_SESSION_TOKEN=<session-token>
```

Do not commit Actual passwords or session tokens.

## Year Mission import endpoint

Set server-side:

```text
YEAR_MISSION_OWNER_USER_ID
YEAR_MISSION_FINANCE_SYNC_TOKEN
SUPABASE_SERVICE_ROLE_KEY
```

Generate a long import secret, for example:

```bash
openssl rand -hex 32
```

Endpoint:

```text
POST /api/finance/import
Authorization: Bearer <YEAR_MISSION_FINANCE_SYNC_TOKEN>
Content-Type: application/json
```

The endpoint validates with Zod, uses service-role Supabase access, applies stable provider IDs for idempotency, and logs only source/count metadata.

Run from the Year Mission repository:

```bash
YEAR_MISSION_FINANCE_SYNC_TOKEN='...' \
YEAR_MISSION_FINANCE_IMPORT_URL='https://<year-mission-host>/api/finance/import' \
node scripts/sync-actual-finance.mjs
```

Optional:

```text
ACTUAL_CLI_BIN               defaults to actual
ACTUAL_FINANCE_LOOKBACK_DAYS defaults to 95, clamped to 7–365
```

Repeated syncs are safe because accounts and transactions are upserted by stable provider IDs.

---

# Unsupported/student loans

Perfect transaction-level loan sync is not required. If a servicer is unavailable through Plaid/SimpleFIN/Actual, use Settings → Finances → unsupported liabilities and update the balance periodically.

Useful fields:

- name/servicer
- current balance
- APR when known
- minimum payment/due date when available

Manual records use their own provider namespace and are not overwritten by another finance provider.

---

# Normalized import contract

Example:

```json
{
  "provider": "actual",
  "generatedAt": "2026-08-25T12:00:00.000Z",
  "accounts": [
    {
      "providerAccountId": "checking-1",
      "name": "Checking",
      "institutionName": "Example Bank",
      "accountType": "checking",
      "balance": 2500,
      "availableBalance": 2400,
      "currency": "USD",
      "active": true
    }
  ],
  "transactions": [
    {
      "providerTransactionId": "tx-1",
      "providerAccountId": "checking-1",
      "postedDate": "2026-08-24",
      "amount": -42.50,
      "payee": "Groceries",
      "category": "Food",
      "pending": false,
      "metadata": {}
    }
  ],
  "liabilities": []
}
```

Transaction convention: negative amounts are outflows and positive amounts are inflows.

---

# Security and data-preservation invariants

- Year Mission never stores bank usernames/passwords.
- Plaid permanent access tokens are AES-256-GCM encrypted and service-role-only.
- SimpleFIN's credential-bearing access URL is encrypted and HttpOnly.
- Actual credentials stay on the machine running Actual/its CLI.
- Finance import bearer tokens stay server-side/local environment only.
- Finance data tables are user-scoped with RLS.
- Stable provider IDs make repeat imports/syncs idempotent.
- Manual liabilities are not overwritten by another provider.
- Disconnecting a provider does not silently delete historical imported data.
- No transaction payloads or credentials are written to application logs.
- AI may summarize normalized finance data but is not authoritative ledger logic and cannot move money.

# Money UI

`/money` intentionally stays small. It shows:

- cash
- total debt
- credit-card debt
- student-loan debt
- other debt
- trailing 30-day outflow
- accounts and liabilities

It does not attempt to recreate Actual, Monarch, or a full transaction-analysis dashboard.
