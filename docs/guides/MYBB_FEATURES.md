# MyBB Feature Set (v0.9.1)

## Scope
Legacy-style community features layered on forums/users: member list, presence, profiles, referrals.

## API Surface
- Members: `GET /api/v1/members`, `GET /api/v1/members/:id`, `GET /api/v1/user-groups`
- Presence (MyBB style): `GET /api/v1/presence/online`, `POST /api/v1/presence/heartbeat`, `GET /api/v1/presence/stats`
- Profiles: `GET /api/v1/profiles/:username`, `PUT /api/v1/profiles/signature`, `PUT /api/v1/profiles/bio`, `GET /api/v1/profiles/:username/posts`, `GET /api/v1/profiles/:username/threads`, `GET/POST /api/v1/profiles/:username/reputation`
- Referrals: `GET /api/v1/referrals/stats`, `GET /leaderboard`, `GET /rewards`, `POST /rewards/:id/claim`, `GET /validate/:code`, `POST /apply`

## Behavior
- Presence endpoints expose online users and aggregate stats; heartbeat must be called periodically.
- Member list supports discovery; user groups expose roles/visibility.
- Profiles allow signatures/bio updates plus reputation flow.
- Referrals: codes can be validated/applied; rewards claimable per tier.

## Incomplete / TODO
- Pagination/filters for members not documented—specify when added.
- Reputation anti-abuse (rate limits/cooldowns) undocumented—add once enforced.
- Referrals reward rules and eligibility windows need explicit docs.
