# Karnel Travels app home

The Home tab is now the initial screen. About remains accessible using the information button in the app bar. Existing Stays, Search, Contact, Feedback and Alerts screens are retained.

The home page includes destination photography, search, service shortcuts, featured destinations and tours, actual rating aggregates, current published catalog prices, promotion-code copying, accommodation suggestions and a contact link. Design reference: [Airbnb's Explore homepage and service discovery](https://news.airbnb.com/airbnb-2025-summer-release).

Data comes from the existing backend at `/api/tourist-spots`, `/api/tours`, `/api/services` and `/api/promotions?activeOnly=true`. An unavailable backend produces an error/retry state on Home, without substituting invented inventory. Relative image paths are resolved against the configured API origin, including photos stored as database binaries. Images have a neutral placeholder if unavailable.

Selecting a destination or tour opens its detail page. Tours show the published itinerary, travel information, departures, available seats and adult/child prices. Tour authentication, booking and payments are now connected; see APP_TOUR_BOOKING.md.

## Run

From this folder:

```powershell
flutter pub get
flutter run
```

Android Emulator defaults to `http://10.0.2.2:5011/api`. Desktop/web defaults to `http://localhost:5011/api`.

For a physical phone, configure the reachable backend address:

```powershell
flutter run --dart-define=API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:5011/api
```

Use the existing web CORS port 4200 for a browser preview:

```powershell
flutter run -d chrome --web-port=4200 --dart-define=API_BASE_URL=http://localhost:5011/api
```

The existing service API still contains a curated offline fallback in the Stays/Search feature authored earlier; this home-page change does not modify that behavior.

## Validation

The added tests verify API-backed home content and fares at mobile width, an actual route to the tour list, API failure handling and image URL resolution. Existing contact, feedback, service/search and notification tests are retained. The new/modified application source passes targeted Flutter analysis. Verification uses the installed Flutter 3.47.1 / Dart 3.13.1 SDK.

