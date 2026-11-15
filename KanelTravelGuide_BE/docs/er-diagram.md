# Entity-relationship diagram

Eighteen tables. A booking line points at one of a tour, a schedule, or a service item.

```mermaid
erDiagram
    Users ||--o{ Bookings : places
    Users ||--o{ Notifications : receives
    Users ||--o{ EmailLogs : receives
    Users ||--o{ SystemLogs : performs
    Locations ||--o{ TouristSpots : contains
    CategoryTypes ||--o{ TouristSpots : classifies
    Locations ||--o{ ServiceProviders : hosts
    ServiceProviders ||--o{ ServiceItems : offers
    Locations ||--o{ TransportRoutes : departs
    Locations ||--o{ TransportRoutes : arrives
    TransportRoutes ||--o{ Schedules : runs
    Vehicles ||--o{ Schedules : assigned
    TouristSpots ||--o{ TourPackages : includes
    Promotions ||--o{ TourPackages : discounts
    Promotions ||--o{ Bookings : discounts
    Bookings ||--o{ BookingDetails : contains
    Bookings ||--o{ EmailLogs : confirms
    TourPackages ||--o{ BookingDetails : booked
    Schedules ||--o{ BookingDetails : booked
    ServiceItems ||--o{ BookingDetails : booked
```

Contacts and Feedbacks stand alone. They store the customer's name and email without a user foreign key.
