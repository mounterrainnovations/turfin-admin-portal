# App Management — Developer Guide

This document explains every feature on the **App Management** page of the TurfIn admin portal, what each one does under the hood, and exactly what you need to implement in the mobile apps (Client and Vendor) to make it all work.

---

## Overview

The App Management page gives you control over three things:

| Feature | What it does |
|---|---|
| **Version Control** | Set the minimum app version users must run; block older versions |
| **OTA Deploy** | Push JavaScript bundle updates to users instantly (no app store wait) |
| **Broadcast Notification** | Send a push notification to tell users an update is available |

---

## 1. Version Control & Force Update

### What it is

Each app (Client and Vendor) has two version numbers that matter:

- **Live Version** — The version currently published on the App Store / Play Store.
- **Minimum Required Version** — The oldest version you will allow to run. Anything older gets blocked.

### How Force Update works (end-to-end)

```
Admin Portal                 Your Backend API              Mobile App (on launch)
─────────────────────────────────────────────────────────────────────────────────
Admin sets min version  ──►  PUT /app-config                On app open:
"2.1.0" and saves            { minVersion: "2.1.0",         1. GET /app-config
                               forceUpdate: true }          2. Compare device version
                                                               vs minVersion
                                                            3. If device < minVersion
                                                               AND forceUpdate is true:
                                                               Show "Update Required"
                                                               modal — block all nav
```

### What to build in the mobile app

In your React Native app (both Client and Vendor), add this check in the root component or app startup hook:

```typescript
// hooks/useForceUpdateCheck.ts
import { useEffect } from "react";
import { Linking, Alert } from "react-native";
import DeviceInfo from "react-native-device-info";    // or expo-device

const APP_CONFIG_URL = "https://your-api.com/app-config";
const APP_STORE_URL  = "https://apps.apple.com/app/id<YOUR_ID>";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=<YOUR_PACKAGE>";

function semverLessThan(a: string, b: string): boolean {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return true;
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return false;
  }
  return false;
}

export function useForceUpdateCheck() {
  useEffect(() => {
    async function check() {
      const res = await fetch(APP_CONFIG_URL);
      const config = await res.json();
      // config = { minVersion: "2.1.0", forceUpdate: true }

      if (!config.forceUpdate) return;

      const currentVersion = DeviceInfo.getVersion(); // e.g. "2.0.5"
      if (semverLessThan(currentVersion, config.minVersion)) {
        Alert.alert(
          "Update Required",
          "A critical update is available. Please update to continue using TurfIn.",
          [{ text: "Update Now", onPress: () => Linking.openURL(Platform.OS === "ios" ? APP_STORE_URL : PLAY_STORE_URL) }],
          { cancelable: false }  // prevents dismissal
        );
      }
    }
    check();
  }, []);
}
```

### What to build in the backend

Create an endpoint that the admin portal calls when the admin saves:

```
GET  /app-config          → returns { clientMinVersion, vendorMinVersion, clientForceUpdate, vendorForceUpdate }
PUT  /app-config          → updates the config (called by admin portal)
```

Store this in a simple database table or even a JSON config in your database. The mobile app fetches it on every launch.

---

## 2. OTA (Over-The-Air) Updates

### What OTA means

OTA updates let you push a new JavaScript bundle to users' phones **without going through the App Store or Play Store review process**. The app downloads the new JS bundle silently in the background and loads it on the next launch.

**What OTA CAN update:**
- Bug fixes in your React Native / Expo code
- UI changes, text, colours, logic
- New screens added in JavaScript

**What OTA CANNOT update:**
- New native modules (e.g. adding a new camera library)
- Changes to `app.json` / `AndroidManifest.xml` / `Info.plist`
- New iOS permissions
- Any native Swift / Kotlin / Java code

If you touch any of those, you need a full store release.

### Recommended tool: Expo EAS Update

If your mobile apps are built with Expo (the most common React Native setup), use **Expo EAS Update**.

**Setup (one-time):**

```bash
# In your mobile app project
npm install expo-updates
npx eas update:configure
```

Add to `app.json`:
```json
{
  "expo": {
    "updates": {
      "url": "https://u.expo.dev/<YOUR_PROJECT_ID>"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

**To push an OTA update from the CLI:**
```bash
eas update --channel production --message "Fix booking crash on Android"
```

**To trigger it from the admin portal (what the Push OTA button would call):**

The admin portal UI is currently a front-end prototype. To make the button actually deploy, you need to call the EAS API from your backend:

```typescript
// backend: POST /admin/ota-deploy
import fetch from "node-fetch";

export async function pushOtaUpdate(params: {
  channel: "production" | "staging" | "preview";
  target: "client" | "vendor" | "both";
  versionLabel: string;
  releaseNotes: string;
}) {
  const EAS_TOKEN = process.env.EXPO_ACCESS_TOKEN;

  // Trigger EAS Update via API (or call `eas update` in a subprocess)
  const res = await fetch("https://api.expo.dev/v2/updates/publish", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${EAS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // EAS API params — see https://docs.expo.dev/eas-update/api/
      channel: params.channel,
      message: params.releaseNotes,
    }),
  });
  return res.json();
}
```

### Alternative: Microsoft CodePush (App Center)

If you're not using Expo, use **CodePush** from Microsoft App Center. The concept is the same — you push a bundle and users get it on next app launch.

```bash
npm install --save-dev appcenter-cli
appcenter codepush release-react -a <owner>/<app> -d Production
```

### How the mobile app handles OTA updates

With Expo, add this to your root component so updates load automatically:

```typescript
// App.tsx
import * as Updates from "expo-updates";
import { useEffect } from "react";

export default function App() {
  useEffect(() => {
    async function checkForUpdate() {
      if (__DEV__) return; // skip in development
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync(); // restart with new bundle
      }
    }
    checkForUpdate();
  }, []);

  // ... rest of app
}
```

---

## 3. Broadcast Update Notification

### What it does

This sends a **push notification** to all users (Client app users and/or Vendor owners) telling them a new version is available. Users tap the notification and are taken to the App Store / Play Store to update.

This is different from OTA — OTA updates the app silently. This notification just tells users to manually update.

### Technology: Firebase Cloud Messaging (FCM)

FCM is the standard cross-platform push notification service (supports both iOS and Android).

### Setup (mobile app side)

**Step 1 — Install in your React Native / Expo app:**
```bash
# Expo
npx expo install expo-notifications expo-device expo-constants

# Bare React Native
npm install @react-native-firebase/app @react-native-firebase/messaging
```

**Step 2 — Register for a push token on app startup:**
```typescript
// utils/registerPushToken.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";

export async function registerPushToken(userId: string) {
  if (!Device.isDevice) return; // won't work in simulator

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: "<YOUR_EXPO_PROJECT_ID>",
  });

  // Save the token to your backend, associated with this user
  await fetch("https://your-api.com/users/push-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, token: token.data }),
  });
}
```

Call `registerPushToken(user.id)` after the user logs in.

### Setup (backend side)

Install the Firebase Admin SDK:
```bash
npm install firebase-admin
```

Create a service account key from Firebase Console → Project Settings → Service Accounts → Generate new private key. Save it as `firebase-service-account.json`.

```typescript
// backend: POST /admin/broadcast-notification
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require("./firebase-service-account.json")
    ),
  });
}

export async function broadcastUpdateNotification(params: {
  title: string;
  message: string;
  target: "client" | "vendor" | "both";
}) {
  // Fetch all push tokens from your database for the target audience
  const tokens = await db.pushTokens.findMany({
    where: {
      appType: params.target === "both"
        ? { in: ["client", "vendor"] }
        : params.target,
    },
    select: { token: true },
  });

  const tokenList = tokens.map(t => t.token);
  if (tokenList.length === 0) return;

  // FCM supports up to 500 tokens per request
  const chunks = [];
  for (let i = 0; i < tokenList.length; i += 500) {
    chunks.push(tokenList.slice(i, i + 500));
  }

  for (const chunk of chunks) {
    await admin.messaging().sendEachForMulticast({
      tokens: chunk,
      notification: {
        title: params.title,
        body: params.message,
      },
      data: {
        type: "app_update",  // mobile app can use this to deep-link to store
      },
    });
  }
}
```

### Connecting the admin portal button to the backend

The admin portal's "Broadcast Now" button currently simulates the action with a `setTimeout`. When you have a backend, replace that with a real API call:

```typescript
// In app/dashboard/app-management/page.tsx
// Replace the handleBroadcast function's setTimeout with:

async function handleBroadcast() {
  if (!notifTitle) return;
  setSending(true);
  try {
    await fetch("/api/admin/broadcast-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: notifTitle,
        message: notifMessage,
        target: notifTarget,
      }),
    });
    setSent(true);
    // ... add to history
  } finally {
    setSending(false);
    setTimeout(() => setSent(false), 3000);
  }
}
```

Similarly for the OTA deploy button — call your `/api/admin/ota-deploy` endpoint.

---

## Summary: What to build (checklist)

### Backend API endpoints needed

- [ ] `GET  /app-config` — Returns min version + force update status for both apps
- [ ] `PUT  /app-config` — Updates min version / force update (called by admin portal)
- [ ] `POST /admin/ota-deploy` — Triggers EAS Update or CodePush deployment
- [ ] `POST /admin/broadcast-notification` — Sends FCM push notification to all users
- [ ] `POST /users/push-token` — Saves user's FCM token (called by mobile apps)

### Mobile app integrations needed

- [ ] **Force update check** — On app launch, fetch `/app-config` and show blocking modal if below min version
- [ ] **OTA update check** — Using `expo-updates`, check for and apply OTA updates on launch
- [ ] **FCM registration** — Register for push notifications on login and save token to backend
- [ ] **Handle update notification tap** — When user taps the "update available" notification, open App Store / Play Store

### Admin portal (already built)

- [x] Version Control cards (per app) with min version editor and force update toggle
- [x] OTA Deploy panel with channel and target selectors
- [x] Broadcast Notification composer with live preview
- [x] Update History log

---

## Current state of the admin portal UI

All buttons in the App Management page currently **simulate** their actions (fake loading + success states). They do not call any real API yet. Once you build the backend endpoints above, update the `handleOtaDeploy` and `handleBroadcast` functions in `app/dashboard/app-management/page.tsx` to call your real endpoints instead of using `setTimeout`.

The min version save button does update local state immediately — wire it up to `PUT /app-config` in the same way.
