# Installation

## Requirements

- .NET 10 SDK
- SQL Server LocalDB (`MSSQLLocalDB`)
- The frontend, when used, runs separately and calls `http://localhost:5011`

## Run the API

From the repository root:

```powershell
dotnet run --project KanelTravelGuide_BE/KanelTravelGuide_BE/KanelTravelGuide_BE.csproj --launch-profile http
```

The first run creates the `KarnelTravelGuide` database, applies migrations, and loads sample data.

| Role | Username | Password |
|---|---|---|
| Admin | admin | Admin@123 |
| User | minhan | User@123 |

Login returns a JWT. Send it on later requests as `Authorization: Bearer <token>`. The token lasts 7 days.

## Frontend

The React app reads `VITE_API_URL`. The default in `src/api/http.js` is `http://localhost:5011/api`. After login, the app stores the token in `localStorage` under the key `token`.

## Email

Password reset uses SMTP when `Email:Host` is set in `appsettings.json`. Leave `Host` empty for local development. The API then stores the message in `EmailLogs` and writes the reset link to the console. The link opens `http://localhost:5173/reset-password?token=...` and expires after one hour.

## Backup

`POST /api/admin/backups` writes a `.bak` file under `KanelTravelGuide_BE/KanelTravelGuide_BE/App_Data/backups`. LocalDB must be allowed to write that folder. Restore uses `POST /api/admin/backups/restore` with the file name only. Restore replaces the live database, so take a fresh backup first.

## Tests

```powershell
dotnet test KanelTravelGuide_BE/KanelTravelGuide_BE.Tests/KanelTravelGuide_BE.Tests.csproj
```
