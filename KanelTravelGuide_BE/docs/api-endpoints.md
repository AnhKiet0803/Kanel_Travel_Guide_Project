# Karnel Travel Guide — API documentation (backend, due 09/11)

This document belongs to the backend repository. The frontend uses these JSON samples and is not included here.

Columns and constraints follow `docs/Thiet_Ke_CSDL_Karnel_Travel_Guide.xlsx`. SQL Server column names are snake_case (`user_id`, `spot_name`). The JSON below uses camelCase.

Stored text values are English, including status values.

Local base URL: `http://localhost:5011`

OpenAPI: `http://localhost:5011/openapi/v1.json`

Sample timestamps are UTC. Amounts are VND numbers.

Business APIs (tourist spots, tours, bookings, search) are implemented by Doan Anh Kiet. Account, contact, feedback, notification, and backup APIs are implemented by Vu Hoang Giap. This document fixes the JSON contract before those APIs are written.

## Run the database

SQL Server LocalDB is required.

```powershell
dotnet run --project KanelTravelGuide_BE/KanelTravelGuide_BE/KanelTravelGuide_BE.csproj --launch-profile http
```

The first run creates the `KarnelTravelGuide` database, applies the migration, and loads sample data.

Sample accounts:

| Role | Username | Email | Password |
|---|---|---|---|
| Admin | admin | admin@karnel.local | Admin@123 |
| User | minhan | user@karnel.local | User@123 |

CORS allows `http://localhost:5173`, `http://localhost:3000`, and `http://localhost:4200`.

Login returns a JWT in the `token` field. The token expires after 7 days. Protected APIs read `Authorization: Bearer <token>`. A missing or expired token returns `401`. A signed-in account with the wrong role returns `403`. Admin-only APIs use role `Admin`. Public registration always creates role `User` and does not return a token.

## Shared values

- `role`: `Admin`, `User`
- Contact `isResponded`: `false` means not handled, `true` means replied
- Feedback `isApproved`: `true` is visible on the site, `false` is hidden or waiting for review
- `notificationType`: `BOOKING`, `PROMOTION`, `SYSTEM`
- `serviceType`: `Hotel`, `Resort`, `Restaurant`
- `vehicleType`: for example `Bus`, `Limousine`, `Tourist car`
- Schedule `status`: `Running`, `Suspended`
- `bookingType`: `Tour`, `Transport`, `Combo`
- `paymentStatus`: `Unpaid`, `Paid`
- `bookingStatus`: `Pending`, `Confirmed`, `Completed`, `Cancelled`
- A booking line sets one of `tourId`, `scheduleId`, or `serviceItemId`
- `region`: `North`, `Central`, `South`

Shared error body:

```json
{
  "message": "Error description"
}
```

## Health check

`GET /api/health`

```json
{
  "status": "ok",
  "database": "connected"
}
```

## Accounts — Giap (code due 13/11 and 15/11)

### Register

`POST /api/auth/register`

```json
{
  "username": "minhan2",
  "fullName": "Nguyen Minh An",
  "email": "an.nguyen@example.com",
  "password": "User@123",
  "phone": "0901000002",
  "address": "Son Tra, Da Nang"
}
```

Returns `201`:

```json
{
  "userId": 3,
  "username": "minhan2",
  "fullName": "Nguyen Minh An",
  "email": "an.nguyen@example.com",
  "phone": "0901000002",
  "role": "User",
  "isActive": true
}
```

### Login

`POST /api/auth/login`

```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

Returns `200`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "username": "admin",
  "fullName": "Karnel Admin",
  "email": "admin@karnel.local",
  "role": "Admin"
}
```

A wrong username or password returns `401`. A disabled account returns `403`.

### Current user

`GET /api/auth/me` requires `Authorization: Bearer <token>`. The body matches login without the `token` field. A missing or invalid token returns `401`.

### Logout

`POST /api/auth/logout` returns `204`. The server does not store the JWT, so the client deletes the saved token. Sending the token again after logout still works until it expires.

### Change password

`POST /api/auth/change-password`

```json
{
  "currentPassword": "User@123",
  "newPassword": "User@456"
}
```

### Forgot and reset password

`POST /api/auth/forgot-password`

```json
{
  "email": "user@karnel.local"
}
```

`POST /api/auth/reset-password`

```json
{
  "email": "user@karnel.local",
  "token": "token-from-email",
  "newPassword": "User@456"
}
```

These two APIs ship with email delivery, due 17/11.

### Profile

`GET /api/account/profile`

```json
{
  "userId": 2,
  "username": "minhan",
  "fullName": "Nguyen Minh An",
  "email": "user@karnel.local",
  "phone": "0901000002",
  "address": "Son Tra, Da Nang",
  "role": "User",
  "deviceToken": null,
  "isActive": true
}
```

`PUT /api/account/profile`

```json
{
  "fullName": "Nguyen Minh An",
  "phone": "0901000009",
  "address": "Hai Chau, Da Nang",
  "deviceToken": null
}
```

### Account management (Admin)

`GET /api/account/users`

```json
[
  {
    "userId": 2,
    "username": "minhan",
    "fullName": "Nguyen Minh An",
    "email": "user@karnel.local",
    "phone": "0901000002",
    "role": "User",
    "isActive": true
  }
]
```

`PUT /api/account/users/{id}`

```json
{
  "role": "User",
  "isActive": false
}
```

## Contacts and feedback — Giap (code due 11/11 and 15/11)

### Send a contact message

`POST /api/contacts`

```json
{
  "fullName": "Tran Thu Ha",
  "email": "ha.tran@example.com",
  "phone": "0912000001",
  "subject": "Hoi An tour question",
  "message": "Please send me the weekend tour schedule."
}
```

```json
{
  "contactId": 1,
  "isResponded": false,
  "createdAt": "2026-11-08T08:00:00"
}
```

### Contact list (Admin)

`GET /api/contacts`

```json
[
  {
    "contactId": 1,
    "fullName": "Tran Thu Ha",
    "email": "ha.tran@example.com",
    "phone": "0912000001",
    "subject": "Hoi An tour question",
    "message": "Please send me the weekend tour schedule.",
    "isResponded": false,
    "createdAt": "2026-11-08T08:00:00"
  }
]
```

### Mark a contact as replied (Admin)

`PUT /api/contacts/{id}/responded` sets `isResponded` to `true`. Returns `204`.

### Send feedback

`POST /api/feedbacks`

```json
{
  "fullName": "Nguyen Minh An",
  "email": "user@karnel.local",
  "rating": 5,
  "title": "Golden Bridge",
  "content": "The Golden Bridge is beautiful."
}
```

```json
{
  "feedbackId": 3,
  "isApproved": false
}
```

### Approved feedback (public page)

`GET /api/feedbacks/approved`

```json
[
  {
    "feedbackId": 1,
    "fullName": "Nguyen Minh An",
    "rating": 5,
    "title": "Golden Bridge",
    "content": "The Golden Bridge is beautiful.",
    "createdAt": "2026-11-06T08:00:00"
  }
]
```

Only records with `isApproved = true` are returned.

### Feedback management (Admin)

`GET /api/feedbacks/manage`

`PUT /api/feedbacks/{id}/approval`

```json
{
  "isApproved": true
}
```

## Notifications, logs, and backup — Giap (code due 17/11)

`GET /api/notifications`

```json
[
  {
    "notificationId": 1,
    "title": "Booking confirmed",
    "message": "Booking BK20261108-001 has been confirmed.",
    "notificationType": "BOOKING",
    "referenceId": "BK20261108-001",
    "isRead": false,
    "createdAt": "2026-11-08T08:00:00"
  }
]
```

`PUT /api/notifications/{id}/read` returns `204`.

`GET /api/system/logs` (Admin)

```json
[
  {
    "logId": 1,
    "userId": 1,
    "actionType": "INSERT",
    "actionDescription": "Seeded sample data.",
    "createdAt": "2026-11-08T08:00:00"
  }
]
```

`POST /api/system/backup` and `POST /api/system/restore` (Admin). Restore accepts a backup file. The file format will be fixed with CN24.

## Home, tourist spots, and categories — Kiet

`GET /api/home`

```json
{
  "spots": [
    {
      "spotId": 1,
      "spotName": "Ba Na Hills",
      "locationName": "Da Nang",
      "categoryName": "Ecotourism",
      "thumbnailUrl": "/images/ba-na.jpg",
      "isFeatured": true
    }
  ],
  "tours": [
    {
      "tourId": 1,
      "tourName": "Da Nang 2 days 1 night",
      "duration": "2 days 1 night",
      "standardPrice": 2500000,
      "salePrice": 2250000,
      "isFeatured": true
    }
  ],
  "promotions": [
    {
      "promotionId": 1,
      "title": "Da Nang tour discount",
      "promoCode": "DANANG10",
      "discountPercent": 10
    }
  ]
}
```

The home page reads `TouristSpots.isFeatured = true` and `TourPackages.isFeatured = true`.

`GET /api/locations`

```json
[
  { "locationId": 1, "locationName": "Da Nang", "region": "Central" }
]
```

`GET /api/category-types`

```json
[
  { "categoryId": 1, "categoryName": "Beach" }
]
```

`GET /api/tourist-spots?locationId=2&categoryId=2&q=Hoi`

```json
[
  {
    "spotId": 3,
    "spotName": "Hoi An Ancient Town",
    "locationId": 2,
    "locationName": "Quang Nam",
    "categoryId": 2,
    "categoryName": "Culture and heritage",
    "thumbnailUrl": "/images/hoi-an.jpg",
    "description": "The ancient town along the Hoai River.",
    "isFeatured": true
  }
]
```

`GET /api/tourist-spots/{id}`

```json
{
  "spotId": 1,
  "locationId": 1,
  "locationName": "Da Nang",
  "categoryId": 3,
  "categoryName": "Ecotourism",
  "spotName": "Ba Na Hills",
  "thumbnailUrl": "/images/ba-na.jpg",
  "description": "A mountain resort known for the Golden Bridge.",
  "detailedContent": "Ba Na Hills is in Hoa Vang, Da Nang.",
  "isFeatured": true,
  "createdAt": "2026-11-08T08:00:00"
}
```

`POST /api/tourist-spots`, `PUT /api/tourist-spots/{id}`, `DELETE /api/tourist-spots/{id}` (Admin). The create and update body matches the detail JSON without `spotId` and without `*Name` display fields.

## Tours and promotions — Kiet

`GET /api/tours` and `GET /api/tours/{id}`

```json
{
  "tourId": 1,
  "spotId": 1,
  "spotName": "Ba Na Hills",
  "promotionId": 1,
  "tourName": "Da Nang 2 days 1 night",
  "duration": "2 days 1 night",
  "standardPrice": 2500000,
  "salePrice": 2250000,
  "itineraryDetail": "Day 1: Ba Na Hills. Day 2: My Khe Beach.",
  "isFeatured": true
}
```

`POST /api/tours`, `PUT /api/tours/{id}`, `DELETE /api/tours/{id}` (Admin).

`GET /api/promotions`

```json
[
  {
    "promotionId": 1,
    "promoCode": "DANANG10",
    "title": "Da Nang tour discount",
    "discountPercent": 10,
    "discountAmount": null,
    "startDate": "2026-11-08T00:00:00",
    "endDate": "2027-01-08T00:00:00",
    "isActive": true
  }
]
```

`POST /api/promotions`, `PUT /api/promotions/{id}`, `DELETE /api/promotions/{id}` (Admin).

## Hotels, restaurants, and resorts — Kiet

`GET /api/services?type=Hotel`

`type` accepts `Hotel`, `Restaurant`, or `Resort`. Omit it to return all three.

```json
[
  {
    "providerId": 1,
    "providerName": "Karnel Beach Hotel",
    "serviceType": "Hotel",
    "locationId": 1,
    "locationName": "Da Nang",
    "address": "Vo Nguyen Giap, Da Nang",
    "phone": "02361111001",
    "starRating": 4,
    "minPrice": 1500000,
    "maxPrice": 2200000,
    "imageUrl": "/images/hotel-beach.jpg"
  }
]
```

`GET /api/services/{id}` includes rooms or tables:

```json
{
  "providerId": 1,
  "providerName": "Karnel Beach Hotel",
  "serviceType": "Hotel",
  "locationId": 1,
  "locationName": "Da Nang",
  "address": "Vo Nguyen Giap, Da Nang",
  "description": "A sea-view hotel.",
  "phone": "02361111001",
  "website": "https://karnel.local/beach-hotel",
  "starRating": 4,
  "minPrice": 1500000,
  "maxPrice": 2200000,
  "imageUrl": "/images/hotel-beach.jpg",
  "isActive": true,
  "items": [
    {
      "itemId": 1,
      "itemName": "Deluxe room",
      "capacity": 2,
      "price": 1500000,
      "totalQuantity": 20,
      "isAvailable": true
    }
  ]
}
```

`POST /api/services`, `PUT /api/services/{id}`, `DELETE /api/services/{id}` (Admin).

`POST /api/services/{id}/items`, `PUT /api/services/{serviceId}/items/{itemId}`, `DELETE /api/services/{serviceId}/items/{itemId}` (Admin).

## Search — Kiet

`GET /api/search?q=Hoi An`

```json
{
  "spots": [],
  "tours": [],
  "services": []
}
```

Each array uses the short list JSON of that resource.

`GET /api/search/advanced?locationId=1&serviceType=Hotel&minPrice=0&maxPrice=3000000&starRating=4&sort=price_asc`

`sort` accepts `price_asc`, `price_desc`, or `name_asc`.

## Transport — Kiet

`GET /api/routes`

```json
[
  {
    "routeId": 1,
    "departureLocationId": 1,
    "departureLocationName": "Da Nang",
    "destinationLocationId": 2,
    "destinationLocationName": "Quang Nam",
    "distanceKm": 30,
    "estimatedDuration": "1 hour"
  }
]
```

`GET /api/routes/{id}` includes schedules:

```json
{
  "routeId": 1,
  "departureLocationId": 1,
  "departureLocationName": "Da Nang",
  "destinationLocationId": 2,
  "destinationLocationName": "Quang Nam",
  "distanceKm": 30,
  "estimatedDuration": "1 hour",
  "schedules": [
    {
      "scheduleId": 1,
      "vehicleId": 3,
      "vehicleName": "16-seat tourist car",
      "vehicleType": "Tourist car",
      "departureTime": "08:00:00",
      "ticketPrice": 150000,
      "status": "Running"
    }
  ]
}
```

`POST /api/routes`, `PUT /api/routes/{id}`, `DELETE /api/routes/{id}` (Admin).

`GET /api/vehicles`

`POST /api/vehicles`, `PUT /api/vehicles/{id}`, `DELETE /api/vehicles/{id}` (Admin).

```json
{
  "vehicleName": "16-seat tourist car",
  "vehicleType": "Tourist car",
  "totalSeats": 16
}
```

`GET /api/schedules?routeId=1`

`POST /api/schedules`, `PUT /api/schedules/{id}`, `DELETE /api/schedules/{id}` (Admin).

```json
{
  "routeId": 1,
  "vehicleId": 3,
  "departureTime": "08:00:00",
  "ticketPrice": 150000,
  "status": "Running"
}
```

## Bookings — Kiet

`POST /api/bookings`

```json
{
  "customerName": "Nguyen Minh An",
  "customerPhone": "0901000002",
  "customerEmail": "user@karnel.local",
  "bookingType": "Tour",
  "startDate": "2026-11-16",
  "totalPassengers": 2,
  "notes": "Two travelers.",
  "details": [
    {
      "tourId": 2,
      "quantity": 2
    }
  ]
}
```

```json
{
  "bookingId": 1,
  "bookingCode": "BK20261108-001",
  "bookingType": "Tour",
  "bookingStatus": "Pending",
  "paymentStatus": "Unpaid",
  "totalAmount": 1513000,
  "bookingDate": "2026-11-08T08:00:00"
}
```

`GET /api/bookings` returns bookings for the signed-in user.

`GET /api/bookings/{id}`

```json
{
  "bookingId": 1,
  "bookingCode": "BK20261108-001",
  "userId": 2,
  "customerName": "Nguyen Minh An",
  "customerPhone": "0901000002",
  "customerEmail": "user@karnel.local",
  "bookingType": "Tour",
  "bookingDate": "2026-11-08T08:00:00",
  "startDate": "2026-11-16",
  "totalPassengers": 2,
  "totalAmount": 1513000,
  "paymentStatus": "Paid",
  "bookingStatus": "Confirmed",
  "notes": "Two travelers.",
  "details": [
    {
      "detailId": 1,
      "tourId": 2,
      "scheduleId": null,
      "serviceItemId": null,
      "quantity": 2,
      "unitPrice": 756500
    }
  ]
}
```

`PUT /api/bookings/{id}/cancel`

```json
{
  "reason": "Change the travel date"
}
```

`GET /api/bookings/manage?bookingStatus=Pending` (Admin).

`PUT /api/bookings/{id}/status` (Admin)

```json
{
  "bookingStatus": "Confirmed",
  "paymentStatus": "Paid"
}
```

Creating or cancelling a booking calls Giap's notification and system-log services.
