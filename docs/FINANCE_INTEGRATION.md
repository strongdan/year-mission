# Finance integration

Year Mission treats financial data as **read-only telemetry**. It does not replace a budgeting application, ask for bank usernames/passwords, or initiate payments/transfers.

## Architecture

```text
Banks / cards -----------> Plaid (preferred) ----+
Banks / cards -----------> SimpleFIN ------------+
Banks / CSV / OFX -------> Actual Budget --------+----> normalized finance hub ----> Supabase
Unsupported liabilities -> manual/import --------+
```

All sources normalize into accounts, transactions, and liabilities. The existing `financial_snapshots` table remains the compact Money-domain summary.

## Plaid — preferred direct bank connection

Year Mission defaults Plaid to **Sandbox**. Production must be explicitly selected with `PLAID_ENVIRONMENT=production`.

The app requests only:

- Transactions
- optional Liabilities consent

It does **not** request Auth routing/account numbers, payment initiation, Transfer, lending, or any money-movement product.

### Server configuration

```text
PLAID_CLIENT_ID
PLAID_SECRET
PLAID_ENVIRONMENT=sandbox|production
PLAID_REDIRECT_URI=https://year-mission.dangaston.workers.dev/settings
PLAID_WEBHOOK_URL=...                 # optional until webhook-driven sync is enabled
INTEGRATION_SECRETS_KEY               # 32-byte base64 encryption root
SUPABASE_SERVICE_ROLE_KEY
```

Never expose `PLAID_SECRET`, permanent Plaid access tokens, or `INTEGRATION_SECRETS_KEY` client-side.

### Link and storage flow

1. Settings asks the server for a short-lived Link token.
2. Plaid Link runs in the browser/PWA.
3. A new connection yields a temporary public token.
4. The server exchanges it for a permanent access token + Item ID.
5. The access token is AES-256-GCM encrypted and stored in `finance_connections`.
6. Accounts, transaction deltas, and supported liabilities are normalized into the existing finance tables.

For OAuth institutions, the temporary Link session is stored in local storage only long enough to resume Link after redirect. The permanent access token never enters browser storage.

`finance_connections` has RLS enabled and deliberately exposes no normal user SELECT/INSERT/UPDATE policy. Authenticated server actions use the service-role client and scope every operation by the authenticated `user_id`.

### Transaction sync

Year Mission uses Plaid's cursor-based `/transactions/sync` model:

- persist the last successful cursor per Item
- upsert added/modified transactions by stable Plaid transaction ID
- delete IDs Plaid marks removed
- request up to 500 records per page
- restart once from the original cursor on `TRANSACTIONS_SYNC_MUTATION_DURING_PAGINATION`
- cap pagination at 20 pages
- convert Plaid's positive spending amounts to Year Mission's negative-outflow convention

### Reconnect

Recoverable Item errors such as `ITEM_LOGIN_REQUIRED` or revoked permission mark the connection `reconnect_required`. Settings launches Plaid Link update mode using the encrypted access token, then retries sync after authorization succeeds.

### Disconnect vs delete

These controls are intentionally separate:

- **Disconnect** revokes the Plaid Item and deletes the stored access token while retaining imported history.
- **Delete imported Plaid data** removes Plaid-sourced accounts, transactions, and liabilities from Year Mission without affecting the bank.

### Activation gates

Repository implementation is not the same as live banking activation. Before calling Plaid production-ready:

1. Apply `0013_journal.sql` then `0014_plaid_finance.sql` to the target Supabase project.
2. Configure Plaid Sandbox credentials first.
3. Register the exact Cloudflare settings redirect URI with Plaid.
4. Configure the Cloudflare Worker variables/secrets.
5. Test Sandbox Link → exchange → sync → reconnect → disconnect and data deletion.
6. For real data, use an eligible Plaid Production/Trial account and perform an institution smoke test.

Keep `PLAID_ENVIRONMENT=sandbox` until those gates pass.

## SimpleFIN

SimpleFIN remains an optional low-cost fallback. A one-time setup token is claimed server-side; the credential-bearing access URL is encrypted with AES-256-GCM in an HttpOnly secure cookie. It is never rendered back to the browser or logged.

## Actual Budget

Actual remains the better place for budgeting, reconciliation, categories, and CSV/OFX/QFX imports. Year Mission consumes only normalized data through the existing import bridge.

Current canonical import endpoint:

```text
POST https://year-mission.dangaston.workers.dev/api/finance/import
Authorization: Bearer <YEAR_MISSION_FINANCE_SYNC_TOKEN>
```

Server-side configuration:

```text
YEAR_MISSION_OWNER_USER_ID
YEAR_MISSION_FINANCE_SYNC_TOKEN
SUPABASE_SERVICE_ROLE_KEY
```

Use `YEAR_MISSION_FINANCE_IMPORT_URL` to override the destination explicitly when running the bridge.

## Manual / normalized import

Unsupported liabilities can be entered manually. Settings also accepts normalized JSON for other local/import tools. Provider namespaces are isolated, so Plaid sync does not overwrite SimpleFIN, Actual, or manual records.

Transaction convention is always **negative = outflow, positive = inflow**.

## Security invariants

- Year Mission never stores bank usernames/passwords.
- Plaid permanent access tokens are encrypted and service-role-only.
- SimpleFIN's access credential is encrypted and HttpOnly.
- Actual credentials remain on the machine running Actual/its CLI.
- Finance import bearer tokens remain server-side/local only.
- Finance data tables are user-scoped with RLS.
- Stable provider IDs make repeated imports/syncs idempotent.
- Disconnecting a provider does not silently delete historical imported data.
- No transaction payloads or credentials are written to application logs.
- AI can summarize normalized finance telemetry but cannot move money.
