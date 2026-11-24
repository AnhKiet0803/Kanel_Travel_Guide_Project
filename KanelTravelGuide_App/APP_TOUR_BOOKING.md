# App tour booking and payments

The Flutter app now supports selecting a published departure, signing in with an existing website account, entering guest details, adding linked optional services, applying active promotion codes and saving a tour booking through the existing API. Adults are 18+, children are 2–17; each child needs an age. The server validates availability and recalculates prices.

## Payment flow

- PayPal Sandbox opens inside a native WebView on Android/iOS/macOS. Its return URL is intercepted, and the app calls server capture. Only the server returning Paid produces a successful payment result. A cancelled or failed attempt remains unpaid and can be resumed against the same booking ID in My bookings.
- Bank transfer and Pay after confirmation remain unpaid until the organizer handles confirmation/payment. The app shows the booking reference and instructions; no bank account is invented.
- The payment options API currently reports PayPal disabled. Valid backend Sandbox configuration is required before it becomes selectable. No credentials are stored in app source.
- New booking submission is guarded against duplicate taps. An uncertain network response directs the customer to My bookings instead of automatically creating another order.

## Existing APIs used; no backend changes in this update

POST /auth/login; GET /auth/me; GET /tours/{id}/departures; GET /tours/{id}/extras; GET /services/{id}?date=...; GET /schedules?date=...&status=Running; GET /promotions?activeOnly=true; POST /bookings; GET /bookings; GET /bookings/{id}; GET /payments/paypal/options; POST /payments/paypal/{id}/order; POST /payments/paypal/{id}/capture.

Authentication is held in memory for this app session. Room add-ons currently use one night on the departure date, matching the existing booking contract. The checkout states this explicitly.

## Run and verification

Stop the old Flutter run before restarting because webview_flutter adds a native plugin:

```powershell
flutter pub get
flutter run
```

Android emulator API defaults to http://10.0.2.2:5011/api. Keep the backend running. Browser preview does not offer native PayPal checkout.

All 37 Flutter tests passed, including 10 new quote, authentication, stock, duplicate submission and server-verified payment tests. Web build passed. No real booking or PayPal charge was created during testing. Android APK verification encountered local Gradle filesystem access errors; it has not yet been verified as a successful native build.
