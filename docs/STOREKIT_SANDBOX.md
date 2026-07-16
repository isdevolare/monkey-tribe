# StoreKit Sandbox testing

Monkey Tribe uses Apple's Sandbox environment for development-signed and TestFlight in-app purchases. Sandbox transactions never charge real money. Do not use the internal `MONKEYTEST5000` QA code to validate purchases; it does not exercise StoreKit or transaction fulfillment.

## App Store Connect setup

1. In App Store Connect, open **Users and Access > Sandbox > Testers** and create a Sandbox Apple Account with an email address that has never been used as an Apple Account or Sandbox tester.
2. Confirm all six consumable products are available for the app bundle `com.quickmoodigital.monkeytribe`, have their required localization and pricing, and are not missing agreements or tax/banking setup.
3. Install a development-signed build on the physical iPhone. TestFlight builds also use Sandbox automatically for test purchases.

Apple reference: [Create a Sandbox Apple Account](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/create-a-sandbox-apple-account/).

## Sign in on the iPhone

1. Do not sign the Sandbox tester into iCloud or Media & Purchases.
2. Launch the development build, open the Gem Store, and start the first purchase.
3. When the StoreKit sheet asks, enter the Sandbox Apple Account credentials.
4. After the first attempt, the tester appears under **Settings > Developer > Sandbox Apple Account**. Use that screen to inspect or change the active Sandbox tester.

The purchase confirmation sheet should identify the Sandbox environment and show Apple's localized product name and price. Consumables can be purchased repeatedly after each transaction is successfully finished.

Apple reference: [Testing in-app purchases with Sandbox](https://developer.apple.com/documentation/storekit/testing-in-app-purchases-with-sandbox).

## Clear Sandbox history

If a clean tester history is needed, open **Settings > Developer > Sandbox Apple Account**, choose **Manage**, then **Clear Purchase History**. Sign out and back in if StoreKit still shows cached test state. Clearing history is a test-only operation and is not a restore mechanism for consumables.

Apple reference: [Manage Sandbox Apple Account settings](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/manage-sandbox-apple-account-settings/).

## Required test matrix

For each product, confirm the Apple-localized price loads, cancellation grants nothing, success grants the configured amount once, and a second consumable purchase succeeds:

| Product ID | Expected grant |
| --- | ---: |
| `monkeytribe_gems_100` | 100 Gems |
| `monkeytribe_gems_330` | 330 Gems |
| `monkeytribe_gems_600` | 600 Gems |
| `monkeytribe_gems_1300` | 1,300 Gems |
| `monkeytribe_gems_2800` | 2,800 Gems |
| `monkeytribe_gems_6000` | 6,000 Gems |

Also perform these interruption checks:

- Cancel the Apple sheet: no Gem grant and no transaction marker.
- Use a Sandbox interrupted/pending purchase: no early grant; delivery occurs only after StoreKit reports a completed transaction.
- Force-close after payment confirmation: relaunch processes the unfinished transaction, persists the Gem grant and marker, then finishes it.
- Force-close after delivery: relaunch does not grant again because the transaction identifier is already in the ledger.
- Disable connectivity or make the store unavailable: affected cards show an unavailable/error state and never simulate success.
- Close the Gem Store after every result: the village and HUD remain tappable.

There is intentionally no **Restore Purchases** button. Gem packs are consumables; recovery comes from replaying unfinished paid StoreKit transactions, not from restoring previously consumed Gems.
