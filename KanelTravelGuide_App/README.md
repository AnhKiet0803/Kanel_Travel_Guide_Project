# Karnel Travel Guide — Mobile App (Flutter)

A mobile client for the Karnel Travel Guide website. It calls the same ASP.NET Core API
(`KanelTravelGuide_BE`, see `KanelTravelGuide_BE/docs/api-endpoints.md`).

## Structure

| Folder | Content |
|---|---|
| `lib/screens` | One file per screen: About, Contact, Feedback, Notifications |
| `lib/services` | `api_client.dart` (HTTP + JWT), `karnel_api.dart` (endpoints used by the screens) |
| `lib/models` | Data classes for API responses |
| `lib/utils` | Form validators (same rules as the website) |
| `lib/widgets` | Shared widgets |
| `test` | Unit and widget tests (fake backend, no server needed) |

`lib/main.dart` is a temporary shell with a bottom navigation bar. The shared foundation (theme, navigation,
sign-in) replaces it later; keep the screens in `lib/screens`.

## Run

1. Install the Flutter SDK and run `flutter doctor`.
2. Start the backend (it listens on `http://localhost:5011`).
3. `flutter pub get`, then `flutter run`.

The API address is chosen automatically: `http://10.0.2.2:5011/api` on the Android emulator (that is how the emulator
reaches your computer), `http://localhost:5011/api` elsewhere. On a real phone, connect it to the same Wi-Fi and pass the
computer's address:

```
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:5011/api
```

Signed-in screens (Notifications) send `Authorization: Bearer <token>`. Whoever builds the login screen must set
`api.client.token` to the `token` returned by `POST /api/auth/login`.

## Test

```
flutter analyze
flutter test
```
