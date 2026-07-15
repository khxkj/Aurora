# AURORA Pro — 20 SAR / month

## Product model

| Feature | Free | Pro (20 SAR/month) |
|---------|------|---------------------|
| All weather (forecast, maps strip, AQI, cities…) | ✅ Unlimited | ✅ |
| Ask AURORA AI | **5 messages / day** | **Unlimited** |

Product ID (must match App Store Connect exactly):

```text
com.khxkj.aurora.pro.monthly
```

## Create the subscription in App Store Connect

1. [App Store Connect](https://appstoreconnect.apple.com) → your app **AURORA**
2. **Subscriptions** → create a **Subscription Group** (e.g. `aurora_pro`)
3. Add subscription:
   - Reference name: `AURORA Pro Monthly`
   - Product ID: `com.khxkj.aurora.pro.monthly`
   - Duration: **1 month**
   - Price: **Saudi Arabia — 20 SAR** (Apple maps nearby tiers if needed)
4. Add localization (English + Arabic optional)
5. Submit with the app binary when ready

## In the Xcode / Capacitor project

```bash
cd ~/aurora-weather
npm run build:ios
```

- Bundle ID must stay `com.khxkj.aurora`
- Signing: your paid Apple Developer team
- Capabilities: **In-App Purchase** enabled on the App target

## Testing

- Use a **Sandbox Apple ID** (App Store Connect → Users and Access → Sandbox)
- On device: Settings → App Store → Sandbox Account
- Purchase should activate Pro; **Restore purchases** reloads it

## Website

Web users get the **same free daily AI limit**.  
Subscribe CTA points them to the **iPhone app** (App Store billing).

## Legal (required for review)

- Privacy policy URL
- Terms of use / EULA (or Apple standard EULA)
- Clear subscription terms (already shown on paywall)
- “Restore purchases” button (included)
