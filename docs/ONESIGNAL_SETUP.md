# OneSignal Push Notifications — Setup Guide

This document covers how OneSignal works, how to set it up for TurfIn, and the correct order of operations before writing any integration code.

---

## Mental Model: How OneSignal Works

```
Mobile App (device)                 OneSignal Servers              Your Backend / Admin Portal
────────────────────────────────────────────────────────────────────────────────────────────
App opens →
SDK initialises →                   Device registers,
                                    gets a Subscription ID ──────► Optionally store this ID
                                    (OneSignal handles this)        in your own DB

                                                                    Admin clicks "Send" →
                                                                    POST to OneSignal REST API
                                                                    with App ID + REST API Key

                                    OneSignal receives request →
                                    Delivers via FCM (Android)
                                    or APNs (iOS) →

                                    ◄── Notification lands on device
```

OneSignal is a wrapper over FCM (Google, for Android) and APNs (Apple, for iOS). You never manage device tokens yourself — the SDK handles registration, token refresh, and delivery. You just call their REST API to send.

---

## TurfIn Setup: Two OneSignal Apps

OneSignal uses the concept of "Apps" — one per mobile application. TurfIn needs two:

| OneSignal App | For | Used by |
|---|---|---|
| **TurfIn Client** | End-user booking app | Notifications page + App Management broadcast |
| **TurfIn Vendor** | Turf owner management app | App Management broadcast (vendor target) |

Each app gets its own `App ID` and `REST API Key`. This separation lets you send notifications to client users only, vendor owners only, or both — by choosing which App ID you target in the API call.

---

## What You Need Before Setting Up

OneSignal requires you to configure the underlying delivery services (FCM and APNs) first.

### Android — Firebase Cloud Messaging (FCM)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a project (or use your existing one if you already have one)
3. Go to Project Settings → Cloud Messaging
4. Get your **FCM Server Key** (Legacy) or create a **Service Account** for FCM v1
5. You will paste this into OneSignal during app setup

This is free and takes about 10 minutes.

### iOS — Apple Push Notification service (APNs)

You need an **Apple Developer account** ($99/year) to send push notifications to iOS devices.

Two options — use whichever you have available:

- **APNs Auth Key** (.p8 file) — Recommended. Get it from Apple Developer → Certificates, Identifiers & Profiles → Keys. One key works for all your apps.
- **APNs Certificate** (.p12 file) — Older method, expires annually.

> If you don't have an Apple Developer account yet, skip iOS for now and test on Android first. Everything still works — you just won't reach iOS users until iOS is configured.

---

## Recommended Order of Operations

### Step 1 — Create the OneSignal account and apps (~15 min)

1. Sign up at onesignal.com — the free tier has unlimited push notifications
2. Create a new App → name it "TurfIn Client" → select iOS + Android as platforms
3. Enter your FCM Server Key when prompted (from Firebase step above)
4. Enter your APNs Auth Key if you have it (skip if not ready)
5. Copy the **App ID** and **REST API Key** — save these somewhere safe (you'll need them for the mobile app and backend)
6. Repeat the entire process for "TurfIn Vendor"

At the end of this step you should have:

```
TurfIn Client
  App ID:       xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  REST API Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

TurfIn Vendor
  App ID:       xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  REST API Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 2 — Test with zero code

Before touching any code, use the OneSignal dashboard to understand how sending works:

1. Go to your OneSignal app → Messages → New Push
2. Explore the interface — you can set title, message, target audience, schedule, etc.
3. Use their **Postman collection** (available in OneSignal docs) or a simple `curl` to call the REST API directly:

```bash
curl --request POST \
  --url https://onesignal.com/api/v1/notifications \
  --header 'Authorization: Basic <YOUR_REST_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "app_id": "<YOUR_APP_ID>",
    "included_segments": ["All"],
    "headings": { "en": "Test from TurfIn" },
    "contents": { "en": "This is a test notification" }
  }'
```

Even with 0 subscribers this teaches you the API response format and confirms your keys work.

### Step 3 — Integrate into the mobile app

Install the SDK in your React Native / Expo mobile app:

**If using Expo (managed workflow):**
```bash
npx expo install onesignal-expo-plugin react-native-onesignal
```

Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "onesignal-expo-plugin",
        {
          "mode": "development"
        }
      ]
    ]
  }
}
```

**If using bare React Native:**
```bash
npm install react-native-onesignal
npx react-native link react-native-onesignal
```

Initialise OneSignal in your app entry point:
```typescript
// App.tsx (or index.tsx)
import OneSignal from "react-native-onesignal";

// Call this once, early in your app startup
OneSignal.setAppId("<YOUR_ONESIGNAL_APP_ID>");

// Optional: prompt iOS users for notification permission
OneSignal.promptForPushNotificationsWithUserResponse();
```

For the **Client app**, use the TurfIn Client App ID.
For the **Vendor app**, use the TurfIn Vendor App ID.

Run the app on a **real device**, then check the OneSignal dashboard under Audience → Subscriptions. You should see your device appear within a few seconds of opening the app.

### Step 4 — Send a test notification to your real device

From the OneSignal dashboard:
1. Messages → New Push
2. Audience: Send to Particular Segment → Test Subscribers (or pick your device by Subscription ID)
3. Write a title and message
4. Send it

When the notification lands on your phone, the pipeline is confirmed working end-to-end.

### Step 5 — Wire up the admin portal

Once Step 4 works, come back and replace the `setTimeout` mocks in:
- `app/dashboard/notifications/page.tsx` — for marketing/engagement notifications to clients
- `app/dashboard/app-management/page.tsx` — for update broadcast notifications

Both will call your backend, which then calls the OneSignal REST API.

---

## Segments and Tags (How to Target Specific Users)

OneSignal lets you group users using **Tags** (key-value pairs you set on a user) and **Segments** (groups built from tag rules).

### Setting a tag in the mobile app

Call this after the user logs in:

```typescript
// After login — Client app
OneSignal.sendTags({
  role: "client",
  city: "Mumbai",
  sport: "Football",
  userId: user.id,
});

// After login — Vendor app
OneSignal.sendTags({
  role: "vendor",
  vendorId: vendor.id,
  city: vendor.city,
});
```

### Using tags in the REST API call (from your backend)

```typescript
// Send only to Mumbai users
{
  "app_id": "<CLIENT_APP_ID>",
  "filters": [
    { "field": "tag", "key": "city", "relation": "=", "value": "Mumbai" }
  ],
  "headings": { "en": "New turf in Mumbai!" },
  "contents": { "en": "Arena Hub just launched in your city." }
}

// Send only to Football players
{
  "app_id": "<CLIENT_APP_ID>",
  "filters": [
    { "field": "tag", "key": "sport", "relation": "=", "value": "Football" }
  ],
  ...
}
```

This directly maps to the audience targeting options already in the Notifications page UI (By City, By Sport, Active Users, etc.).

---

## Backend Integration

The REST API Key must never go in the frontend. Always proxy through your own backend.

```typescript
// backend: POST /admin/send-notification
const ONESIGNAL_CLIENT_APP_ID  = process.env.ONESIGNAL_CLIENT_APP_ID;
const ONESIGNAL_VENDOR_APP_ID  = process.env.ONESIGNAL_VENDOR_APP_ID;
const ONESIGNAL_CLIENT_API_KEY = process.env.ONESIGNAL_CLIENT_API_KEY;
const ONESIGNAL_VENDOR_API_KEY = process.env.ONESIGNAL_VENDOR_API_KEY;

export async function sendNotification(params: {
  title: string;
  message: string;
  target: "client" | "vendor" | "both";
  filters?: object[];
}) {
  const apps =
    params.target === "both"
      ? [
          { appId: ONESIGNAL_CLIENT_APP_ID, apiKey: ONESIGNAL_CLIENT_API_KEY },
          { appId: ONESIGNAL_VENDOR_APP_ID, apiKey: ONESIGNAL_VENDOR_API_KEY },
        ]
      : params.target === "client"
        ? [{ appId: ONESIGNAL_CLIENT_APP_ID, apiKey: ONESIGNAL_CLIENT_API_KEY }]
        : [{ appId: ONESIGNAL_VENDOR_APP_ID, apiKey: ONESIGNAL_VENDOR_API_KEY }];

  const results = await Promise.all(
    apps.map(({ appId, apiKey }) =>
      fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_id: appId,
          included_segments: params.filters ? undefined : ["All"],
          filters: params.filters,
          headings: { en: params.title },
          contents: { en: params.message },
        }),
      }).then(r => r.json()),
    ),
  );

  return results;
}
```

Store all four values in your `.env` file — never commit them to git.

---

## Testing Caveats

| Scenario | Works? | Notes |
|---|---|---|
| Android emulator | Yes | Requires Google Play Services (most emulators have this) |
| iOS simulator | No | APNs doesn't work on simulators — need a real iPhone |
| Expo Go | Partial | Uses Expo's own push infrastructure, not your OneSignal config. Test with a dev build instead. |
| Expo dev build (`eas build --profile development`) | Yes | Accurate representation of production behaviour |
| Physical Android device | Yes | Best for testing |
| Physical iPhone | Yes | Best for testing iOS |

---

## Summary Checklist

### Before writing any code
- [ ] Create Firebase project, enable Cloud Messaging, copy FCM Server Key
- [ ] Create OneSignal account
- [ ] Create "TurfIn Client" OneSignal app, configure FCM + APNs, save App ID and REST API Key
- [ ] Create "TurfIn Vendor" OneSignal app, same steps, save App ID and REST API Key
- [ ] Test the REST API with curl/Postman to confirm keys work

### Mobile app
- [ ] Install `react-native-onesignal` (or `onesignal-expo-plugin` for Expo)
- [ ] Initialise with correct App ID per app (Client uses Client App ID, Vendor uses Vendor App ID)
- [ ] Call `sendTags` after user login with `role`, `city`, and any other targeting fields
- [ ] Test on a real device — confirm device appears in OneSignal dashboard
- [ ] Test receiving a notification sent from the dashboard

### Backend
- [ ] Store all four env vars: `ONESIGNAL_CLIENT_APP_ID`, `ONESIGNAL_CLIENT_API_KEY`, `ONESIGNAL_VENDOR_APP_ID`, `ONESIGNAL_VENDOR_API_KEY`
- [ ] Create `POST /admin/send-notification` endpoint
- [ ] Never expose REST API keys to the frontend

### Admin portal (after backend is ready)
- [ ] Replace `setTimeout` in `app/dashboard/notifications/page.tsx` with real API call
- [ ] Replace `setTimeout` in `app/dashboard/app-management/page.tsx` broadcast handler with real API call
