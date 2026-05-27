# Facebook Messenger Setup

## Prerequisites

- A Facebook Page for AlyNaf (you already have this — `alynafukbd`)
- A Facebook Developer account linked to the same personal profile
- Your app hosted at a public HTTPS URL (or use ngrok for local testing)

## Steps

### 1. Create a Facebook App

1. Go to [developers.facebook.com](https://developers.facebook.com) → **My Apps** → **Create App**
2. Choose **Business** type
3. Fill in app name (`AlyNaf Messenger`) and contact email
4. Under **Add Products**, find **Messenger** and click **Set Up**

### 2. Connect Your Page

1. In the Messenger settings, scroll to **Access Tokens**
2. Click **Add or Remove Pages** → select your AlyNaf page
3. Click **Generate Token** → copy it — this is your `FB_PAGE_ACCESS_TOKEN`
4. For production, exchange for a long-lived token:
   ```
   GET https://graph.facebook.com/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id=APP_ID
     &client_secret=APP_SECRET
     &fb_exchange_token=SHORT_LIVED_TOKEN
   ```

### 3. Get Your Page ID

```bash
curl "https://graph.facebook.com/me?fields=id,name&access_token=PAGE_ACCESS_TOKEN"
```

Copy the `id` field — this is `FB_PAGE_ID`.

### 4. Configure Webhooks

1. In the Messenger settings, scroll to **Webhooks** → **Add Callback URL**
2. Callback URL: `https://YOUR_DOMAIN/api/fb/webhook`
3. Verify Token: set a secret string and copy it to `FB_VERIFY_TOKEN` in your `.env`
4. Click **Verify and Save**
5. Under **Webhook Fields**, subscribe to:
   - `messages`
   - `messaging_postbacks` (optional)
6. Click **Save**

### 5. Add to .env

```env
FB_PAGE_ID=123456789012345
FB_PAGE_ACCESS_TOKEN=EAABs...long_token...
FB_APP_SECRET=your_app_secret_from_app_settings
FB_VERIFY_TOKEN=alynaf-webhook   # or whatever string you chose
```

Restart the dev server: `npm run dev`

### 6. Test Locally with ngrok

```bash
npx ngrok http 3000
# Copy the https URL and use it as the webhook callback
```

### 7. App Review (Production)

To receive messages from users who are not Admins/Testers of your app, you must submit for **App Review** and request:
- `pages_messaging` permission

This review process takes 1–5 business days. Until approved, only page admins and users you add as **Testers** in App Roles can send test messages.

## What Works Without Facebook

All admin UI features work without Facebook credentials:

- **Orders tab** — full order management
- **Inbox tab** — load mock data with the "Load Mock Data" button
- **Convert to Order** — works from mock conversations
- **Reply** — stored locally as draft (not sent to Facebook)

Set `NODE_ENV=development` (default for `npm run dev`) to see the **Load Mock Data** button.
