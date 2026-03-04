# Paddle Setup

Use this checklist before turning billing on in production.

## Products and prices

QuackNinja expects four separate monthly subscription prices in Paddle.

The simplest and safest setup is:

- one product per sellable plan
- one recurring monthly price under each product
- quantity kept at `1`

Do not model team seats with Paddle quantity. Seat limits are enforced in QuackNinja, not in Paddle.
Auto-renew is off by default in the product, so QuackNinja will schedule
non-renewing subscriptions to end at the close of the current paid term unless a
customer explicitly opts into renewal during checkout.

### Commercial plans to create

1. `Individual` at `$12/mo`
2. `Team 5` at `$39/mo`
3. `Team 10` at `$69/mo`
4. `Team Unlimited` at `$149/mo`

### How to create each recurring monthly item in Paddle

Repeat these steps four times, once for each plan above.

1. Open the Paddle dashboard.
2. Go to `Catalog`.
3. Click `New product`.
4. Enter the product name:
   - `Individual`
   - `Team 5`
   - `Team 10`
   - `Team Unlimited`
5. Keep this as a normal sellable product for subscriptions.
6. After the product is created, add a price to that product.
7. Choose a recurring price, not a one-time price.
8. Set the billing interval to `Monthly`.
9. Set the quantity so the customer buys a single subscription item:
   - keep quantity fixed at `1`
   - do not expose quantity selection to the customer
10. Enter the monthly amount for that plan:
   - `Individual`: `12 USD`
   - `Team 5`: `39 USD`
   - `Team 10`: `69 USD`
   - `Team Unlimited`: `149 USD`
11. Save the price.
12. Copy the generated Paddle price ID for that monthly price.
13. Put that price ID into the matching app environment variable:
   - `NEXT_PUBLIC_PADDLE_PRICE_ID_INDIVIDUAL_MONTHLY`
   - `NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_5_MONTHLY`
   - `NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_10_MONTHLY`
   - `NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_UNLIMITED_MONTHLY`

### Recommended naming convention

Use clear names in Paddle so debugging webhook payloads is easier.

- Product name: `Individual`
- Price description: `Monthly`

That gives you an easy-to-read catalog shape such as:

- `Individual` -> `Monthly`
- `Team 5` -> `Monthly`
- `Team 10` -> `Monthly`
- `Team Unlimited` -> `Monthly`

### Important product/price configuration notes

For each plan:

- Billing type: `Recurring`
- Interval: `Monthly`
- Currency: use the currency you plan to support first, typically `USD`
- Trial in Paddle: leave this `off`
- Quantity selector: `off` or fixed at `1`
- Tax handling: use Paddle defaults as merchant of record

QuackNinja already has an app-managed 7-day trial. Do not configure a separate Paddle trial for these plans or your entitlement logic will become inconsistent.
If a customer upgrades during the trial, QuackNinja keeps showing the trial in
the UI until it ends, but the paid subscription starts immediately after
checkout.

### What QuackNinja expects from the catalog

The application maps each plan to a single monthly Paddle price ID:

1. `individual` -> `NEXT_PUBLIC_PADDLE_PRICE_ID_INDIVIDUAL_MONTHLY`
2. `team_5` -> `NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_5_MONTHLY`
3. `team_10` -> `NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_10_MONTHLY`
4. `team_unlimited` -> `NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_UNLIMITED_MONTHLY`

If one of these env vars is missing, checkout for that plan will fail at runtime.

## Metadata

Set metadata on each sellable plan so the webhook can map Paddle data back to QuackNinja business logic.

You can put this metadata on the product, the price, or both. The safest option is to keep it on the specific monthly price you actually sell.

Create these key/value pairs exactly as shown.

### Individual

- `plan_code = individual`
- `seat_limit = 1`
- `entitlement_tier = pro`

### Team 5

- `plan_code = team_5`
- `seat_limit = 5`
- `entitlement_tier = pro`

### Team 10

- `plan_code = team_10`
- `seat_limit = 10`
- `entitlement_tier = pro`

### Team Unlimited

- `plan_code = team_unlimited`
- `seat_limit = unlimited`
- `entitlement_tier = pro`

### Why metadata matters

QuackNinja uses this metadata to determine:

- which commercial SKU was purchased
- how many seats should be allowed
- which entitlement tier the subscription grants

Do not rely only on product titles for this mapping. Titles are for humans; metadata is for billing logic.

## Webhook

Configure a webhook destination pointing to:

- Sandbox: `https://<sandbox-project-ref>.functions.supabase.co/paddle-webhook`
- Production: `https://<prod-project-ref>.functions.supabase.co/paddle-webhook`

Required events:

1. Subscription created
2. Subscription activated
3. Subscription updated
4. Subscription canceled
5. Subscription past due
6. Subscription paused
7. Subscription resumed

Optional:

1. Transaction completed
2. Transaction payment failed

Save the webhook signing secret as:

- `PADDLE_WEBHOOK_SECRET`

### Webhook setup details

1. In Paddle, open `Developer` or `Notifications` and create a new webhook destination.
2. Set the destination URL to your Supabase Edge Function:
   - Sandbox: `https://<sandbox-project-ref>.functions.supabase.co/paddle-webhook`
   - Production: `https://<prod-project-ref>.functions.supabase.co/paddle-webhook`
3. Subscribe to the events listed below.
4. Save the webhook destination.
5. Copy the webhook signing secret from Paddle.
6. Store that exact value in Supabase Edge Function secrets as `PADDLE_WEBHOOK_SECRET`.

The Edge Function verifies the signature. If the secret is wrong, webhook calls will be rejected and subscriptions will not sync.

## App env vars

Set these for the Next.js app:

- `PADDLE_API_KEY`
- `PADDLE_ENV=sandbox|production`
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
- `NEXT_PUBLIC_PADDLE_PRICE_ID_INDIVIDUAL_MONTHLY`
- `NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_5_MONTHLY`
- `NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_10_MONTHLY`
- `NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_UNLIMITED_MONTHLY`
- `NEXT_PUBLIC_APP_URL`

For the current QuackNinja checkout flow, the browser uses Paddle.js with:

- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
- `NEXT_PUBLIC_PADDLE_PRICE_ID_*`

QuackNinja also prepares checkout server-side, so `PADDLE_API_KEY` is required in
the Next.js app for transaction creation.

Set these in Supabase Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `PADDLE_API_KEY`
- `PADDLE_PRICE_ID_INDIVIDUAL_MONTHLY`
- `PADDLE_PRICE_ID_TEAM_5_MONTHLY`
- `PADDLE_PRICE_ID_TEAM_10_MONTHLY`
- `PADDLE_PRICE_ID_TEAM_UNLIMITED_MONTHLY`

Optional:

- `PADDLE_ENV`
- `PADDLE_ALLOWED_PRICE_IDS`

### Example local `.env` mapping

```bash
PADDLE_ENV=sandbox
PADDLE_API_KEY=your_paddle_api_key
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxx_client_token
NEXT_PUBLIC_PADDLE_PRICE_ID_INDIVIDUAL_MONTHLY=pri_xxx_individual
NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_5_MONTHLY=pri_xxx_team5
NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_10_MONTHLY=pri_xxx_team10
NEXT_PUBLIC_PADDLE_PRICE_ID_TEAM_UNLIMITED_MONTHLY=pri_xxx_teamunlimited
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use the real Paddle price IDs from the monthly recurring prices you created. Do not use product IDs in these variables.
The `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` is the client-side Paddle token used by Paddle.js checkout.

## Return URLs

The app creates checkout sessions with:

- Success: `/app/settings?billing=success`
- Cancel: `/pricing?billing=canceled`

Keep these on your allowed domain list in Paddle.

### How checkout works with these URLs

When a user clicks a paid plan in QuackNinja:

1. The app opens an in-product checkout options modal.
2. The user confirms whether auto-renew should be on (default off).
3. The app calls the server to create a Paddle transaction.
4. The server attaches:
   - `custom_data.user_id`
   - `custom_data.plan_code`
   - `custom_data.auto_renew`
   - `custom_data.trial_ends_at`
5. The browser opens Paddle.js using the returned transaction id.
6. Paddle redirects the customer back to:
   - success: `/app/settings?billing=success`
   - cancel: `/pricing?billing=canceled`

The success redirect does not grant paid access by itself. Access is granted only after the Paddle webhook updates QuackNinja's subscription records.

## Sandbox first, then production

Do not start with production.

### Sandbox checklist

1. Create all four products.
2. Create one recurring monthly price under each product.
3. Add metadata to each monthly price.
4. Add the sandbox webhook destination.
5. Store the sandbox webhook secret in Supabase.
6. Set `PADDLE_ENV=sandbox`.
7. Fill the four `NEXT_PUBLIC_PADDLE_PRICE_ID_*` env vars with sandbox price IDs.
8. Add the sandbox `PADDLE_API_KEY` to both:
   - your Next.js app env
   - Supabase Edge Function secrets
9. Test purchases for `Individual` and `Team 5`.

### Production checklist

1. Duplicate the same four products in Paddle production.
2. Recreate the same monthly prices.
3. Reapply the same metadata.
4. Add the production webhook destination.
5. Replace the webhook secret in the production Supabase project.
6. Replace the four `NEXT_PUBLIC_PADDLE_PRICE_ID_*` env vars with production price IDs.
7. Set `PADDLE_ENV=production`.
8. Add the production `PADDLE_API_KEY` to both:
   - your Next.js app env
   - Supabase Edge Function secrets
9. Run a real low-risk transaction and confirm the webhook sync.

## Subscription behavior reference

### Individual

- One paid user
- Full Pro limits
- Auto-renew off by default unless the customer enables it in checkout

### Team 5

- One owner plus up to four additional members
- Every assigned member gets paid access
- Auto-renew off by default

### Team 10

- One owner plus up to nine additional members
- Auto-renew off by default

### Team Unlimited

- One owner plus unlimited additional members
- Auto-renew off by default

### Trial to paid transition

- The free trial remains visible in the product until it ends
- If a customer upgrades during the trial, the paid subscription starts
  immediately after checkout
- The billing UI should make that distinction explicit so customers are not
  promised delayed billing

## Validation checklist

1. Complete a sandbox `Individual` purchase
2. Confirm `subscriptions.plan_code=individual`
3. Confirm the owner gets `profiles.plan=pro`
4. Complete a sandbox `Team 5` purchase
5. Add members until the seat cap is reached
6. Cancel the subscription
7. Confirm owner and members are downgraded when the subscription becomes inactive

## Common mistakes to avoid

1. Creating one-time prices instead of recurring monthly prices
2. Using Paddle quantity to represent seat count
3. Enabling a Paddle trial on top of the app-managed trial
4. Putting product IDs into `NEXT_PUBLIC_PADDLE_PRICE_ID_*` env vars
5. Forgetting to copy the webhook signing secret into Supabase
6. Testing production before webhook syncing is verified in sandbox
