# Test checklist

Run the API at `http://localhost:5011` and call protected routes with `Authorization: Bearer <token>`.

## Accounts

- [ ] `POST /api/auth/login` with `admin` / `Admin@123` returns `token` and `role` `Admin`
- [ ] `GET /api/auth/me` without a token returns `401`
- [ ] `GET /api/auth/profile` returns the signed-in profile
- [ ] `PUT /api/auth/profile` updates full name, phone, and address
- [ ] `POST /api/auth/change-password` with a wrong current password returns `400`
- [ ] `POST /api/auth/forgot-password` for an unknown email still returns `200`
- [ ] `POST /api/auth/forgot-password` for `user@karnel.local` writes an `EmailLogs` row
- [ ] `POST /api/auth/reset-password` with the token from that row returns `204`, and the same token then returns `400`

## Notifications

- [ ] `GET /api/notifications` as `minhan` returns `items`, `total`, and `unreadCount`
- [ ] `PUT /api/notifications/{id}/read` marks one row read
- [ ] `PUT /api/notifications/read-all` clears the remaining unread rows
- [ ] A user cannot mark another user's notification read

## Admin moderation

- [ ] `GET /api/admin/feedbacks` without a token returns `401`
- [ ] The same call as `minhan` returns `403`
- [ ] As `admin`, pending feedback can be approved and then appears in `GET /api/feedbacks/approved`
- [ ] `PUT /api/admin/contacts/{id}/responded` sets `isResponded`
- [ ] `PUT /api/admin/users/{id}/active` can lock another account, and locking the signed-in admin returns `400`

## Backup and logs

- [ ] `POST /api/admin/backups` returns a file name and creates a `.bak` file
- [ ] `GET /api/admin/backups` lists that backup with the admin username
- [ ] `GET /api/admin/logs` includes the `BACKUP` row
- [ ] `POST /api/admin/backups/restore` rejects a file name that contains a path
