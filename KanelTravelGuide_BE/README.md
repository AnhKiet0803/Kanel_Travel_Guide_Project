# Kanel Travel Guide — Backend

This folder is the backend in the shared repository. `KanelTravelGuide_FE` and `KanelTravelGuide_App` are separate.

Included:

- A `DbContext` for 18 tables, migrations, and sample data
- Account, contact, feedback, notification, email, backup, and system-log APIs
- Business APIs for spots, tours, services, transport, and bookings
- API samples: `docs/api-endpoints.md`
- Install steps: `docs/installation.md`
- E-R diagram: `docs/er-diagram.md`
- Manual test checklist: `docs/test-checklist.md`
- Database design file: `docs/Thiet_Ke_CSDL_Karnel_Travel_Guide.xlsx`

All sample text and status values are in English. Login returns a JWT.

## Run

From the repository root:

```powershell
dotnet run --project KanelTravelGuide_BE/KanelTravelGuide_BE/KanelTravelGuide_BE.csproj --launch-profile http
```

The API runs at `http://localhost:5011`. The first run creates the `KarnelTravelGuide` database on LocalDB and loads the sample data.

| Role | Username | Password |
|---|---|---|
| Admin | admin | Admin@123 |
| User | minhan | User@123 |
