KARNEL TRAVEL GUIDE - GROUP 4
FIRST PROGRESS SUBMISSION
============================================================

1. PROJECT INFORMATION

Project title: Karnel Travel Guide
Group: Group 4
Curriculum: OV-7195-ADSE - Semester 3
Centre: ACE-HANOI-2-FPT
Start date: 30 October 2026
Scheduled submission: 19 December 2026
Final deadline: 25 December 2026

Team members:
- PHAM TIEN DUNG - 1734901
- VU HOANG GIAP - 1673940
- PHAM THI ANH HUYEN - 1654103
- NGUYEN CONG TIEN - 1652949
- DOAN ANH KIET - 1652946

This project provides travel information and booking services for tours,
hotels, resorts, dining and transportation. It includes a customer website,
an administration interface, backend APIs and a Flutter application.

2. FOLDER STRUCTURE

KanelTravelGuide_FE   : React website and administration interface.
KanelTravelGuide_BE   : ASP.NET Core Web API, models and migrations.
KanelTravelGuide_App  : Flutter application.
README.txt           : Setup and running instructions.

The Feedback Form and Status Report are submitted with the report package.

3. REQUIREMENTS

- Node.js and npm compatible with Vite 8 in package.json.
- .NET SDK 10.0.
- SQL Server or SQL Server Express LocalDB.
- Flutter SDK with Dart compatible with ^3.13.1 in pubspec.yaml.
- Android Studio, Android SDK and an emulator for the Android app.

Internet access is needed to download dependencies. Run the commands from
the project root unless stated otherwise. Use separate terminals for the
backend, frontend and Flutter app.

4. DATABASE AND BACKEND

Backend project:
KanelTravelGuide_BE/KanelTravelGuide_BE/KanelTravelGuide_BE.csproj

Check ConnectionStrings:DefaultConnection in the backend configuration.
Update the server and authentication settings for your computer.

PowerShell example for SQL Server Express LocalDB, if installed:

$env:ConnectionStrings__DefaultConnection = 'Server=(localdb)\MSSQLLocalDB;Database=KarnelTravelGuide;Trusted_Connection=True;TrustServerCertificate=True'

Restore dependencies and start the backend:

dotnet restore .\KanelTravelGuide_BE\KanelTravelGuide_BE\KanelTravelGuide_BE.csproj
dotnet run --project .\KanelTravelGuide_BE\KanelTravelGuide_BE\KanelTravelGuide_BE.csproj --launch-profile http

Backend: http://localhost:5011
API base URL: http://localhost:5011/api
OpenAPI document: http://localhost:5011/openapi/v1.json

At startup, the backend applies EF Core migrations and runs DbSeeder.
SQL Server must be available, and the database account must have permission
to create or update the database.

Seed data may differ from records entered on the team's computer. To retain
existing records, images and bookings, include a database backup or a script
containing schema and data if required by the instructor. Copying the source
code does not copy the SQL Server database.

5. REACT WEBSITE

Open a new terminal from the project root:

cd .\KanelTravelGuide_FE
npm ci
npm run dev -- --port 5173 --strictPort

Website: http://localhost:5173
Default API URL: http://localhost:5011/api

To change the API URL, create or edit .env.local in the frontend folder:

VITE_API_URL=http://localhost:5011/api

Restart the frontend after changing this setting.
To check the production build, run: npm run build

6. FLUTTER APPLICATION

Start an Android emulator and open a new terminal from the project root:

cd .\KanelTravelGuide_App
flutter pub get
flutter devices
flutter run

The Android emulator uses http://10.0.2.2:5011/api by default.
Keep the backend running on the host computer.

For a physical phone, use the computer's LAN IP address and allow access to
the backend port. The backend must also listen on a reachable network
interface. Replace YOUR_COMPUTER_LAN_IP in the following command:

flutter run --dart-define=API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:5011/api

Browser preview (native PayPal WebView checkout is not available here):

flutter run -d chrome --web-port=4200 --dart-define=API_BASE_URL=http://localhost:5011/api

After adding a native plugin such as webview_flutter, stop the existing
Flutter run and start it again. Hot reload alone may not be sufficient.

7. ACCOUNTS AND TESTING

- The website and app use accounts from the same backend.
- Register a customer account on the website to test customer features.
- Administration features require an account with the Admin role.
- Default accounts for a new database are defined in DbSeeder.cs. If these
  accounts have been changed, use the current credentials.
- Use Personal Sandbox accounts for PayPal testing, not real accounts.

Suggested test flow:
Browse services -> view details -> select a service or tour departure ->
sign in -> enter guest details -> review the total -> create a booking ->
open My bookings. Check booking and payment status in the admin area.

8. PAYMENT AND EMAIL CONFIGURATION

Payment options include PayPal Sandbox, Bank transfer and Pay after
confirmation. PayPal requires valid backend configuration before use.
The Client ID and Client Secret must belong to the same Sandbox app.

Backend configuration keys:
PayPalSandbox:Enabled
PayPalSandbox:ClientId
PayPalSandbox:ClientSecret
PayPalSandbox:FrontendUrl
PayPalSandbox:VndPerUsd

Provide private settings through environment variables or configured .NET
user-secrets on the machine running the backend. Do not include real Client
Secrets, email passwords, database passwords or private JWT signing keys in
the submission package. PayPal is not required to browse the catalog.

Environment variables are inherited by the backend started from that
terminal. Set them again in a new session, or configure user-secrets for
the backend if supported by the project setup.

A payment is successful only after the backend confirms Paid. Bank transfer
and Pay after confirmation do not automatically mark bookings as paid.
These bookings require follow-up according to the selected method.
Sending brochures by email requires SMTP settings and an app password.

9. FIRST SUBMISSION STATUS

We have completed the main website pages, database and APIs. We are still
working on the Flutter app, booking and payment features.

Remaining tasks include verifying PayPal configuration, testing the Android
integration, fixing bugs and completing the documentation. This is a first
progress submission; full testing is still in progress.

10. TROUBLESHOOTING

- No data loads: check the backend, database and API URL.
- SQL connection fails: check DefaultConnection and SQL Server availability.
- PayPal is disabled: check sign-in, Sandbox settings and the app platform.
- PayPal OAuth returns 401: check the Sandbox Client ID and Client Secret.
- Android cannot reach localhost: use 10.0.2.2 on the Android emulator.
- Website uses another port: use 5173 to match the backend CORS policy.

Please review the submitted files and give us feedback. Thank you.

