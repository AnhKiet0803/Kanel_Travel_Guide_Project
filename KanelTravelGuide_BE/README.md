# Kanel Travel Guide — Backend (due 09/11)

This folder is the backend in the shared repository. `KanelTravelGuide_FE` and `KanelTravelGuide_App` are separate.

The 09/11 delivery includes:

- A `DbContext` for 18 tables
- The `InitialCreate` migration
- Sample data
- The API endpoint list and JSON samples: `docs/api-endpoints.md`
- The database design file: `docs/Thiet_Ke_CSDL_Karnel_Travel_Guide.xlsx`

Login, contact, tourist-spot, and booking APIs are not implemented yet.

All sample text and status values are in English.

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
