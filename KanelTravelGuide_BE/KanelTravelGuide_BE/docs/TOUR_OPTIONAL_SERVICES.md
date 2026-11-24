# Tour optional services — 21 November 2026

## Admin workflow

Open Admin → Tours → View or Edit → **Optional services — Make this trip your own**, below Departures.

1. Create a room/dining option for an existing active provider, or a transport schedule for an existing route and vehicle. Enter the unit price and total inventory. Saving creates the catalog item and links it to this tour.
2. Alternatively link an existing catalog option. Hotels, resorts, restaurants and transport can be chosen independently of the tour destination.
3. Hide/show or remove an option for this tour. Existing bookings are preserved.
4. Edit price/inventory to update the underlying catalog item. Catalog changes affect all places where that item is offered. Existing booking line prices are retained.

Prices use the existing catalog APIs; there is no separate override price on the tour link.
Accommodation is one room for one night on the tour departure date; dining is per option and transport per ticket. Additional service dates and multi-night stays are not part of this change.

## Backend and database

Migration `20261121120000_AddTourExtraOptions` creates `TourExtraOptions` with `option_id`, `tour_id`, nullable `service_item_id` / `schedule_id`, and `is_enabled`.

- Exactly one service item or schedule is required by a check constraint.
- Unique filtered indexes prevent duplicate links within a tour.
- Foreign keys remove obsolete links when a source item or tour is removed. Booking history continues to use the original booking details.
- Initial links copy the former destination-based suggestions once. Subsequent admin choices are preserved.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/tours/{tourId}/extras` | Public enabled, active catalog links |
| GET | `/api/tours/{tourId}/extras?includeDisabled=true` | All links; Admin only |
| POST | `/api/tours/{tourId}/extras` | Admin links `{serviceItemId}` or `{scheduleId}`, optional `isEnabled` |
| PUT | `/api/tours/{tourId}/extras/{optionId}` | Admin changes `{isEnabled: true/false}` |
| DELETE | `/api/tours/{tourId}/extras/{optionId}` | Admin unlinks an option |

The public detail and booking forms load linked options and date-specific availability using existing service and schedule APIs. Booking creation rejects extras that are not enabled for the selected tour, and continues to check inventory and calculate current catalog prices on the server in the booking transaction.

Restart the backend to apply the migration before using the new UI/API.
