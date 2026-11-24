# Tour travel information — 21 November 2026

Admin Tour now edits the information displayed on the public tour page.

## Database

Migration `20261120190000_AddTourTravelInformation` adds nullable columns to `TourPackages`:

| API property | SQL column | Maximum length |
| --- | --- | --- |
| meetingPoint | meeting_point | 255 |
| endPoint | end_point | 255 |
| transportDescription | transport_description | 2000 |
| accommodationDescription | accommodation_description | 2000 |
| guideDescription | guide_description | 2000 |
| mealsDescription | meals_description | 2000 |
| includedServices | included_services | 4000 |
| excludedServices | excluded_services | 4000 |

`TourDepartures.return_time` is a nullable SQL `time` column.
Existing meeting points embedded in itinerary text are copied to the new column.
Existing itinerary text and booking records are preserved.

## API

- `GET /api/tours` and `GET /api/tours/{id}` return all eight properties.
- `POST /api/tours` and `PUT /api/tours/{id}` accept these properties.
- On tour updates, omitted or null travel properties preserve the stored value; an empty string clears it.
- Departure list, create and update routes under `/api/tours/{tourId}/departures` support `returnTime` (`HH:mm:ss` or null).
- An omitted `returnTime` on update preserves the stored value. Explicit null clears it.
- On same-day departures with both times specified, return must be later than departure.
- A published return time cannot change after a booking references that departure.

## Frontend

Admin add/edit forms save travel information as separate properties. The public page displays meeting point, end point, inclusions, exclusions and departure/return times. Legacy itinerary meeting points remain readable. Fare, capacity and dates continue to be edited per departure.

## Startup and existing content

Restart the backend after building. `Program.cs` already runs migrations at startup.
The migration fills new fields once for the four named project tours whose detailed programs contain `Included:`, `Not included:` and `Before you travel:`. Later administrator edits and field clearing are preserved. Prices, departure schedules and bookings are unchanged. These programs and prices are project configuration, not independently verified commercial offers. No reviews or bookings are fabricated.

## Verification

FE and BE build; targeted frontend lint; model/snapshot comparison; migration SQL generation; text-length validation; omitted/null return-time compatibility; same-day and overnight time validation. A live database save/read check requires the backend to be running.
