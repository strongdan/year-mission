# Finance integration

Year Mission treats financial data as read-only telemetry. It does not replace a budgeting application and it never asks for bank usernames or passwords.

## Architecture

```text
Banks / credit cards ----> SimpleFIN -----------+
                                               |
Banks / CSV / OFX -------> Actual Budget ------+----> Year Mission finance import ----> Supabase
                                               |
Unsupported loans -------- manual balance ------+
```

Year Mission normalizes all sources into three concepts:

- accounts
- transactions
- liabilities

The existing `financial_snapshots` table remains the small progress-level summary. Finance sync updates its cash reserve and consumer-debt values so existing Money progress views continue to work.

## SimpleFIN

SimpleFIN is optional and low-cost; it is not free. It is useful for automatic bank/card balances and transactions when supported by the institution.

In Year Mission:

1. Open Settings → Finances.
2. Obtain a one-time SimpleFIN setup token from SimpleFIN Bridge.
3. Paste the setup token into Year Mission.
4. Choose **Connect SimpleFIN**.

The setup token is claimed only once. The resulting credential-bearing SimpleFIN access URL is encrypted with AES-256-GCM and stored in an HttpOnly secure cookie. The encryption root is the existing `INTEGRATION_SECRETS_KEY`, falling back to `GOOGLE_TOKEN_ENCRYPTION_KEY`.

The access URL is never rendered back to the browser and should never be logged.

This V1 secret storage is intentionally browser/user-session scoped. It supports manual **Sync now** from Settings. It does not provide unattended server cron sync; if unattended finance sync is added later, move the encrypted connection credential into a server-side per-user secret store.

## Actual Budget

Actual remains the better place for budgeting, reconciliation, categories, and imports from CSV/OFX/QFX. Year Mission only consumes normalized data.

Actual does not expose a general REST API. Its supported automation surfaces are its Node API and CLI. The included bridge script uses the stable Actual CLI and POSTs a normalized payload to Year Mission.

### Install Actual CLI

The Actual CLI requires Node.js 22+.

```bash
npm install --location=global @actual-app/cli
```

Configure the CLI with environment variables (recommended) or an Actual config file. Typical environment variables are:

```bash
ACTUAL_SERVER_URL=https://your-actual-server.example
ACTUAL_SYNC_ID=<budget-sync-id>
ACTUAL_SESSION_TOKEN=<session-token>
```

Do not commit Actual passwords or session tokens.

### Year Mission server configuration

Set these Vercel environment variable names:

```text
YEAR_MISSION_OWNER_USER_ID
YEAR_MISSION_FINANCE_SYNC_TOKEN
SUPABASE_SERVICE_ROLE_KEY
```

`YEAR_MISSION_FINANCE_SYNC_TOKEN` should be a random long secret, for example generated locally with:

```bash
openssl rand -hex 32
```

Never commit or log its value.

The server endpoint is:

```text
POST /api/finance/import
Authorization: Bearer <YEAR_MISSION_FINANCE_SYNC_TOKEN>
Content-Type: application/json
```

The endpoint validates the normalized payload with Zod, uses the service-role Supabase client, applies deterministic provider IDs for idempotency, and logs only source/count metadata.

### Run the Actual bridge

From the Year Mission repository:

```bash
YEAR_MISSION_FINANCE_SYNC_TOKEN='...' \
node scripts/sync-actual-finance.mjs
```

Optional environment variables:

```text
YEAR_MISSION_FINANCE_IMPORT_URL   defaults to https://year-mission.vercel.app/api/finance/import
ACTUAL_CLI_BIN                    defaults to actual
ACTUAL_FINANCE_LOOKBACK_DAYS      defaults to 95, clamped to 7–365
```

The bridge:

1. lists active Actual accounts;
2. reads current balances;
3. reads recent transactions;
4. converts Actual integer cents to dollars;
5. excludes split-parent transactions to avoid double counting;
6. sends normalized data to Year Mission.

Repeated syncs are safe because accounts and transactions are upserted by stable provider IDs.

## Unsupported/student loans

Perfect transaction-level loan sync is not required. For a servicer that is missing from SimpleFIN/Actual, use Settings → Finances → Student loans / unsupported accounts and update the balance periodically.

A useful loan record consists of:

- name/servicer
- current balance
- APR when known
- later: minimum payment and due date

Manual records use their own provider namespace and are not overwritten by SimpleFIN or Actual imports.

## Normalized JSON import

Settings also accepts a normalized JSON payload for one-off imports or another local tool:

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
  "liabilities": [
    {
      "providerLiabilityId": "loan-1",
      "name": "Student Loan",
      "liabilityType": "student_loan",
      "balance": 12000,
      "apr": 4.5,
      "currency": "USD"
    }
  ]
}
```

Transaction convention: negative amounts are outflows and positive amounts are inflows. This matches Actual and SimpleFIN.

## Data preservation and security invariants

- No bank username/password is stored by Year Mission.
- SimpleFIN's access credential is encrypted and HttpOnly.
- Actual credentials stay on the machine running Actual/its CLI.
- Finance import bearer tokens stay server-side/local environment only.
- All finance tables have user-scoped Row Level Security.
- Stable provider IDs make repeated imports idempotent.
- Manual liabilities are not overwritten by imports from another provider.
- Disconnecting SimpleFIN removes the connection credential but keeps imported history.
- No transaction payloads or credentials are written to application logs.

## Money UI

`/money` intentionally stays small. It shows:

- cash
- total debt
- credit-card debt
- student-loan debt
- other debt
- trailing 30-day outflow
- accounts and liabilities

It does not attempt to recreate Actual, Mint, Monarch, or a transaction-analysis dashboard.
