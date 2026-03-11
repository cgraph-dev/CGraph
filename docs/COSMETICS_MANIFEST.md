# Cosmetics Manifest — Canonical Reference

> **Status**: Canonical · Phase 33  
> **Last updated**: 2026-03-11  
> **Purpose**: Single source of truth for all cosmetic items, counts, and rarity assignments.  
> **Machine-readable**: `apps/backend/priv/repo/seeds/cosmetics_manifest.json`

## Rarity Tiers (7)

| Tier      | Color     | Rank | Description                          |
| --------- | --------- | ---- | ------------------------------------ |
| free      | `#9ca3af` | 0    | Default items available to all users |
| common    | `#a3a3a3` | 1    | Easily obtainable                    |
| uncommon  | `#22c55e` | 2    | Moderate effort to obtain            |
| rare      | `#3b82f6` | 3    | Significant effort or purchase       |
| epic      | `#a855f7` | 4    | Hard to obtain                       |
| legendary | `#f59e0b` | 5    | Extremely rare                       |
| mythic    | `#ef4444` | 6    | Rarest tier, prestige only           |

> `unique`, `seasonal`, and `event` are **NOT rarity tiers** — they are **source categories**
> tracked via the `source` field.

## Summary

| Cosmetic Type  | Count   | Rarity Distribution                                                     |
| -------------- | ------- | ----------------------------------------------------------------------- |
| Badges         | 70      | 10 free, 15 common, 15 uncommon, 12 rare, 8 epic, 6 legendary, 4 mythic |
| Titles         | 70      | 5 free, 15 common, 15 uncommon, 15 rare, 10 epic, 6 legendary, 4 mythic |
| Nameplates     | 45      | 5 free, 10 common, 10 uncommon, 8 rare, 5 epic, 4 legendary, 3 mythic   |
| Profile Themes | 25      | 5 free, 4 common, 4 uncommon, 4 rare, 4 epic, 2 legendary, 2 mythic     |
| Name Styles    | 50      | 5 free, 10 common, 10 uncommon, 10 rare, 7 epic, 5 legendary, 3 mythic  |
| Profile Frames | 55      | 5 free, 10 common, 10 uncommon, 10 rare, 8 epic, 7 legendary, 5 mythic  |
| Forum Themes   | 10      | 0 free, 2 common, 2 uncommon, 2 rare, 2 epic, 1 legendary, 1 mythic     |
| **Total**      | **325** |                                                                         |

### Conflict Resolution Notes

| Source Conflict                                                   | Resolution                                                           |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| Badges: Cosmetics doc says 60, Forums doc adds 10 extras          | **70** = 60 base + 10 forum badges                                   |
| Titles: Cosmetics doc says 55, Forums doc adds 15 rank/tier/event | **70** = 55 base + 15 forum titles                                   |
| Nameplates: Cosmetics doc says 30, Forums doc adds 15             | **45** = 30 base + 15 forum nameplates                               |
| Profile Themes: Varies across docs                                | **25** = 5 free + 5 earned + 15 shop                                 |
| Name Styles: Sum of sub-categories                                | **50** = 8 fonts + 12 effects + 15 colors + 10 prefixes + 5 suffixes |
| Profile Frames: Forums doc says "50+"                             | **55** = 50 base + 5 free defaults                                   |
| Forum Themes: Neon Cyber → Zen Garden                             | **10** exactly                                                       |

---

## Badges (70)

| #   | ID        | Slug               | Name                | Rarity    | Category | Track         | Unlock Type | Unlock Condition                       | Nodes Cost |
| --- | --------- | ------------------ | ------------------- | --------- | -------- | ------------- | ----------- | -------------------------------------- | ---------- |
| 1   | badge-001 | newcomer           | Newcomer            | free      | social   | onboarding    | default     | Account created                        | 0          |
| 2   | badge-002 | first-message      | First Message       | free      | social   | onboarding    | achievement | Send first message                     | 0          |
| 3   | badge-003 | first-friend       | First Friend        | free      | social   | onboarding    | achievement | Add first friend                       | 0          |
| 4   | badge-004 | profile-complete   | Profile Complete    | free      | social   | onboarding    | achievement | Complete profile setup                 | 0          |
| 5   | badge-005 | first-post         | First Post          | free      | forums   | onboarding    | achievement | Create first forum post                | 0          |
| 6   | badge-006 | explorer           | Explorer            | free      | social   | onboarding    | achievement | Visit 5 different sections             | 0          |
| 7   | badge-007 | early-adopter      | Early Adopter       | free      | meta     | onboarding    | achievement | Join during beta period                | 0          |
| 8   | badge-008 | verified-email     | Verified Email      | free      | security | onboarding    | achievement | Verify email address                   | 0          |
| 9   | badge-009 | two-factor         | Two-Factor Guardian | free      | security | onboarding    | achievement | Enable 2FA                             | 0          |
| 10  | badge-010 | avatar-set         | Avatar Set          | free      | social   | onboarding    | achievement | Upload avatar                          | 0          |
| 11  | badge-011 | chatterbox         | Chatterbox          | common    | social   | messaging     | achievement | Send 100 messages                      | 0          |
| 12  | badge-012 | social-butterfly   | Social Butterfly    | common    | social   | social        | achievement | Add 10 friends                         | 0          |
| 13  | badge-013 | night-owl          | Night Owl           | common    | social   | activity      | achievement | Active after midnight 10 times         | 0          |
| 14  | badge-014 | early-bird         | Early Bird          | common    | social   | activity      | achievement | Active before 7am 10 times             | 0          |
| 15  | badge-015 | thread-starter     | Thread Starter      | common    | forums   | forums        | achievement | Create 5 forum threads                 | 0          |
| 16  | badge-016 | helpful-reply      | Helpful Reply       | common    | forums   | forums        | achievement | Get 5 upvoted replies                  | 0          |
| 17  | badge-017 | group-joiner       | Group Joiner        | common    | social   | groups        | achievement | Join 3 groups                          | 0          |
| 18  | badge-018 | emoji-fan          | Emoji Fan           | common    | social   | messaging     | achievement | Use 50 emojis                          | 0          |
| 19  | badge-019 | streak-starter     | Streak Starter      | common    | social   | activity      | achievement | 3-day login streak                     | 0          |
| 20  | badge-020 | voice-debut        | Voice Debut         | common    | social   | voice         | achievement | Join first voice call                  | 0          |
| 21  | badge-021 | file-sharer        | File Sharer         | common    | social   | messaging     | achievement | Share 10 files                         | 0          |
| 22  | badge-022 | reactor            | Reactor             | common    | social   | messaging     | achievement | Add 50 reactions                       | 0          |
| 23  | badge-023 | poll-voter         | Poll Voter          | common    | forums   | forums        | achievement | Vote in 10 polls                       | 0          |
| 24  | badge-024 | bookworm           | Bookworm            | common    | forums   | forums        | achievement | Read 50 threads                        | 0          |
| 25  | badge-025 | customizer         | Customizer          | common    | meta     | customization | achievement | Change theme 5 times                   | 0          |
| 26  | badge-026 | conversationalist  | Conversationalist   | uncommon  | social   | messaging     | achievement | Send 500 messages                      | 0          |
| 27  | badge-027 | community-pillar   | Community Pillar    | uncommon  | social   | social        | achievement | Add 25 friends                         | 0          |
| 28  | badge-028 | forum-regular      | Forum Regular       | uncommon  | forums   | forums        | achievement | Post 25 times in forums                | 0          |
| 29  | badge-029 | streak-keeper      | Streak Keeper       | uncommon  | social   | activity      | achievement | 7-day login streak                     | 0          |
| 30  | badge-030 | group-leader       | Group Leader        | uncommon  | social   | groups        | achievement | Create a group                         | 0          |
| 31  | badge-031 | voice-regular      | Voice Regular       | uncommon  | social   | voice         | achievement | 10 hours in voice calls                | 0          |
| 32  | badge-032 | media-maven        | Media Maven         | uncommon  | social   | messaging     | achievement | Share 50 media files                   | 0          |
| 33  | badge-033 | poll-creator       | Poll Creator        | uncommon  | forums   | forums        | achievement | Create 5 polls                         | 0          |
| 34  | badge-034 | mentor             | Mentor              | uncommon  | social   | social        | achievement | Help 10 new users                      | 0          |
| 35  | badge-035 | event-attendee     | Event Attendee      | uncommon  | social   | events        | achievement | Attend 3 events                        | 0          |
| 36  | badge-036 | bug-reporter       | Bug Reporter        | uncommon  | meta     | contribution  | achievement | Report 3 bugs                          | 0          |
| 37  | badge-037 | top-contributor    | Top Contributor     | uncommon  | forums   | forums        | achievement | Get 50 upvotes on posts                | 0          |
| 38  | badge-038 | gif-master         | GIF Master          | uncommon  | social   | messaging     | achievement | Send 100 GIFs                          | 0          |
| 39  | badge-039 | sticker-collector  | Sticker Collector   | uncommon  | social   | customization | achievement | Collect 20 stickers                    | 0          |
| 40  | badge-040 | calendar-keeper    | Calendar Keeper     | uncommon  | social   | activity      | achievement | Create 10 calendar events              | 0          |
| 41  | badge-041 | debate-champion    | Debate Champion     | rare      | forums   | forums        | achievement | Win 5 forum debates                    | 0          |
| 42  | badge-042 | marathon-chatter   | Marathon Chatter    | rare      | social   | messaging     | achievement | Send 2000 messages                     | 0          |
| 43  | badge-043 | streak-master      | Streak Master       | rare      | social   | activity      | achievement | 30-day login streak                    | 0          |
| 44  | badge-044 | voice-veteran      | Voice Veteran       | rare      | social   | voice         | achievement | 50 hours in voice calls                | 0          |
| 45  | badge-045 | community-builder  | Community Builder   | rare      | social   | groups        | achievement | Grow group to 50 members               | 0          |
| 46  | badge-046 | forum-sage         | Forum Sage          | rare      | forums   | forums        | achievement | Post 100 forum replies                 | 0          |
| 47  | badge-047 | event-organizer    | Event Organizer     | rare      | social   | events        | achievement | Organize 5 events                      | 0          |
| 48  | badge-048 | crypto-pioneer     | Crypto Pioneer      | rare      | security | crypto        | achievement | Set up E2EE conversations              | 0          |
| 49  | badge-049 | polyglot           | Polyglot            | rare      | social   | messaging     | achievement | Chat in 5 languages                    | 0          |
| 50  | badge-050 | wiki-editor        | Wiki Editor         | rare      | forums   | forums        | achievement | Edit 20 wiki pages                     | 0          |
| 51  | badge-051 | trending-poster    | Trending Poster     | rare      | forums   | forums        | achievement | Get a trending post                    | 0          |
| 52  | badge-052 | connector          | Connector           | rare      | social   | social        | achievement | Introduce 10 users to each other       | 0          |
| 53  | badge-053 | influencer         | Influencer          | epic      | social   | social        | achievement | Have 100 friends                       | 0          |
| 54  | badge-054 | forum-legend       | Forum Legend        | epic      | forums   | forums        | achievement | Post 500 forum messages                | 0          |
| 55  | badge-055 | streak-legend      | Streak Legend       | epic      | social   | activity      | achievement | 90-day login streak                    | 0          |
| 56  | badge-056 | voice-star         | Voice Star          | epic      | social   | voice         | achievement | 200 hours in voice calls               | 0          |
| 57  | badge-057 | event-legend       | Event Legend        | epic      | social   | events        | achievement | Organize 25 events                     | 0          |
| 58  | badge-058 | security-guru      | Security Guru       | epic      | security | security      | achievement | Complete security audit                | 0          |
| 59  | badge-059 | content-creator    | Content Creator     | epic      | forums   | content       | achievement | 50 original posts with high engagement | 0          |
| 60  | badge-060 | moderator-star     | Moderator Star      | epic      | meta     | moderation    | achievement | Moderate for 30 days                   | 0          |
| 61  | badge-061 | og-member          | OG Member           | legendary | meta     | tenure        | achievement | Account older than 1 year              | 0          |
| 62  | badge-062 | forum-elder        | Forum Elder         | legendary | forums   | forums        | achievement | 1000 forum posts                       | 0          |
| 63  | badge-063 | streak-immortal    | Streak Immortal     | legendary | social   | activity      | achievement | 365-day login streak                   | 0          |
| 64  | badge-064 | community-legend   | Community Legend    | legendary | social   | social        | achievement | 500 friends and high reputation        | 0          |
| 65  | badge-065 | grand-moderator    | Grand Moderator     | legendary | meta     | moderation    | achievement | Moderate for 1 year                    | 0          |
| 66  | badge-066 | platform-guardian  | Platform Guardian   | legendary | meta     | contribution  | achievement | Exceptional platform contribution      | 0          |
| 67  | badge-067 | transcendent       | Transcendent        | mythic    | meta     | prestige      | achievement | Reach maximum prestige                 | 0          |
| 68  | badge-068 | founder            | Founder             | mythic    | meta     | tenure        | achievement | Founding member status                 | 0          |
| 69  | badge-069 | mythic-contributor | Mythic Contributor  | mythic    | meta     | contribution  | achievement | Legendary contributions to platform    | 0          |
| 70  | badge-070 | the-one            | The One             | mythic    | meta     | special       | achievement | Complete all other achievements        | 0          |

## Titles (70)

| #   | ID        | Slug                | Name                | Rarity    | Category | Track         | Unlock Type | Unlock Condition                      | Nodes Cost |
| --- | --------- | ------------------- | ------------------- | --------- | -------- | ------------- | ----------- | ------------------------------------- | ---------- |
| 1   | title-001 | new-user            | New User            | free      | social   | onboarding    | default     | Account created                       | 0          |
| 2   | title-002 | member              | Member              | free      | social   | onboarding    | achievement | 7 days active                         | 0          |
| 3   | title-003 | chatter             | Chatter             | free      | social   | messaging     | achievement | Send 10 messages                      | 0          |
| 4   | title-004 | forum-reader        | Forum Reader        | free      | forums   | forums        | achievement | Read 10 threads                       | 0          |
| 5   | title-005 | friendly            | Friendly            | free      | social   | social        | achievement | Add 3 friends                         | 0          |
| 6   | title-006 | messenger           | Messenger           | common    | social   | messaging     | achievement | Send 200 messages                     | 0          |
| 7   | title-007 | socialite           | Socialite           | common    | social   | social        | achievement | Add 15 friends                        | 0          |
| 8   | title-008 | forum-poster        | Forum Poster        | common    | forums   | forums        | achievement | Post 10 forum messages                | 0          |
| 9   | title-009 | group-member        | Group Member        | common    | social   | groups        | achievement | Join 5 groups                         | 0          |
| 10  | title-010 | voice-user          | Voice User          | common    | social   | voice         | achievement | 5 hours voice calls                   | 0          |
| 11  | title-011 | night-chatter       | Night Chatter       | common    | social   | activity      | achievement | Active after midnight 20 times        | 0          |
| 12  | title-012 | reaction-king       | Reaction King       | common    | social   | messaging     | achievement | Add 100 reactions                     | 0          |
| 13  | title-013 | emoji-expert        | Emoji Expert        | common    | social   | messaging     | achievement | Use 200 unique emojis                 | 0          |
| 14  | title-014 | file-master         | File Master         | common    | social   | messaging     | achievement | Share 50 files                        | 0          |
| 15  | title-015 | subscriber          | Subscriber          | common    | forums   | forums        | achievement | Subscribe to 10 boards                | 0          |
| 16  | title-016 | streak-runner       | Streak Runner       | common    | social   | activity      | achievement | 5-day streak                          | 0          |
| 17  | title-017 | event-goer          | Event Goer          | common    | social   | events        | achievement | Attend first event                    | 0          |
| 18  | title-018 | theme-changer       | Theme Changer       | common    | social   | customization | achievement | Change theme 3 times                  | 0          |
| 19  | title-019 | verified            | Verified            | common    | security | security      | achievement | Verify email and phone                | 0          |
| 20  | title-020 | helper              | Helper              | common    | social   | social        | achievement | Help 5 new users                      | 0          |
| 21  | title-021 | correspondent       | Correspondent       | uncommon  | social   | messaging     | achievement | Send 1000 messages                    | 0          |
| 22  | title-022 | networker           | Networker           | uncommon  | social   | social        | achievement | Add 50 friends                        | 0          |
| 23  | title-023 | forum-contributor   | Forum Contributor   | uncommon  | forums   | forums        | achievement | Post 50 forum messages                | 0          |
| 24  | title-024 | group-admin         | Group Admin         | uncommon  | social   | groups        | achievement | Administer a group                    | 0          |
| 25  | title-025 | voice-enthusiast    | Voice Enthusiast    | uncommon  | social   | voice         | achievement | 25 hours voice calls                  | 0          |
| 26  | title-026 | streak-warrior      | Streak Warrior      | uncommon  | social   | activity      | achievement | 14-day streak                         | 0          |
| 27  | title-027 | event-regular       | Event Regular       | uncommon  | social   | events        | achievement | Attend 10 events                      | 0          |
| 28  | title-028 | bug-hunter          | Bug Hunter          | uncommon  | meta     | contribution  | achievement | Report 5 valid bugs                   | 0          |
| 29  | title-029 | content-star        | Content Star        | uncommon  | forums   | content       | achievement | 25 upvoted posts                      | 0          |
| 30  | title-030 | crypto-user         | Crypto User         | uncommon  | security | crypto        | achievement | Enable E2EE                           | 0          |
| 31  | title-031 | media-star          | Media Star          | uncommon  | social   | messaging     | achievement | Share 100 media items                 | 0          |
| 32  | title-032 | calendar-pro        | Calendar Pro        | uncommon  | social   | activity      | achievement | Manage 25 events                      | 0          |
| 33  | title-033 | wiki-contributor    | Wiki Contributor    | uncommon  | forums   | forums        | achievement | Edit 10 wiki entries                  | 0          |
| 34  | title-034 | poll-master         | Poll Master         | uncommon  | forums   | forums        | achievement | Create 10 popular polls               | 0          |
| 35  | title-035 | sticker-pro         | Sticker Pro         | uncommon  | social   | customization | achievement | Collect 50 stickers                   | 0          |
| 36  | title-036 | diplomat            | Diplomat            | rare      | social   | messaging     | achievement | Send 5000 messages                    | 0          |
| 37  | title-037 | popular             | Popular             | rare      | social   | social        | achievement | 100 friends                           | 0          |
| 38  | title-038 | forum-veteran       | Forum Veteran       | rare      | forums   | forums        | achievement | Post 200 forum messages               | 0          |
| 39  | title-039 | community-organizer | Community Organizer | rare      | social   | groups        | achievement | Grow group to 100 members             | 0          |
| 40  | title-040 | voice-commander     | Voice Commander     | rare      | social   | voice         | achievement | 100 hours voice                       | 0          |
| 41  | title-041 | streak-champion     | Streak Champion     | rare      | social   | activity      | achievement | 60-day streak                         | 0          |
| 42  | title-042 | event-champion      | Event Champion      | rare      | social   | events        | achievement | Organize 10 events                    | 0          |
| 43  | title-043 | security-conscious  | Security Conscious  | rare      | security | security      | achievement | All security features enabled         | 0          |
| 44  | title-044 | trendsetter         | Trendsetter         | rare      | forums   | content       | achievement | 5 trending posts                      | 0          |
| 45  | title-045 | moderator           | Moderator           | rare      | meta     | moderation    | achievement | Become moderator                      | 0          |
| 46  | title-046 | collector           | Collector           | rare      | meta     | customization | achievement | Collect 50 cosmetic items             | 0          |
| 47  | title-047 | archivist           | Archivist           | rare      | forums   | forums        | achievement | Create 50 wiki entries                | 0          |
| 48  | title-048 | connector-pro       | Connector Pro       | rare      | social   | social        | achievement | Introduce 25 users                    | 0          |
| 49  | title-049 | mentor-pro          | Mentor Pro          | rare      | social   | social        | achievement | Mentor 25 new users                   | 0          |
| 50  | title-050 | referee             | Referee             | rare      | forums   | moderation    | achievement | Resolve 20 disputes                   | 0          |
| 51  | title-051 | legend              | Legend              | epic      | social   | social        | achievement | 250 friends and top reputation        | 0          |
| 52  | title-052 | forum-master        | Forum Master        | epic      | forums   | forums        | achievement | Post 500 forum messages               | 0          |
| 53  | title-053 | streak-hero         | Streak Hero         | epic      | social   | activity      | achievement | 180-day streak                        | 0          |
| 54  | title-054 | voice-legend        | Voice Legend        | epic      | social   | voice         | achievement | 500 hours voice                       | 0          |
| 55  | title-055 | grand-organizer     | Grand Organizer     | epic      | social   | events        | achievement | Organize 50 events                    | 0          |
| 56  | title-056 | senior-moderator    | Senior Moderator    | epic      | meta     | moderation    | achievement | Moderate for 6 months                 | 0          |
| 57  | title-057 | platinum-member     | Platinum Member     | epic      | meta     | tenure        | achievement | 6 months active                       | 0          |
| 58  | title-058 | master-collector    | Master Collector    | epic      | meta     | customization | achievement | Collect 200 cosmetics                 | 0          |
| 59  | title-059 | community-hero      | Community Hero      | epic      | social   | social        | achievement | Outstanding community contributions   | 0          |
| 60  | title-060 | crypto-master       | Crypto Master       | epic      | security | crypto        | achievement | Advanced E2EE usage                   | 0          |
| 61  | title-061 | immortal            | Immortal            | legendary | meta     | prestige      | achievement | Maximum prestige level                | 0          |
| 62  | title-062 | forum-oracle        | Forum Oracle        | legendary | forums   | forums        | achievement | 2000 forum posts with high reputation | 0          |
| 63  | title-063 | eternal-flame       | Eternal Flame       | legendary | social   | activity      | achievement | 365-day streak                        | 0          |
| 64  | title-064 | community-icon      | Community Icon      | legendary | social   | social        | achievement | Top 1% reputation                     | 0          |
| 65  | title-065 | grand-master        | Grand Master        | legendary | meta     | moderation    | achievement | Head moderator                        | 0          |
| 66  | title-066 | diamond-member      | Diamond Member      | legendary | meta     | tenure        | achievement | 1 year active member                  | 0          |
| 67  | title-067 | ascendant           | Ascendant           | mythic    | meta     | prestige      | achievement | Transcend all prestige levels         | 0          |
| 68  | title-068 | architect           | Architect           | mythic    | meta     | contribution  | achievement | Shape the platform                    | 0          |
| 69  | title-069 | eternal             | Eternal             | mythic    | meta     | special       | achievement | Complete all achievements             | 0          |
| 70  | title-070 | genesis             | Genesis             | mythic    | meta     | tenure        | achievement | Founding member, all milestones       | 0          |

## Nameplates (45)

| #   | ID     | Slug              | Name              | Rarity    | Category  | Track         | Unlock Type | Unlock Condition         | Nodes Cost |
| --- | ------ | ----------------- | ----------------- | --------- | --------- | ------------- | ----------- | ------------------------ | ---------- |
| 1   | np-001 | default-plate     | Default Plate     | free      | basic     | onboarding    | default     | Account created          | 0          |
| 2   | np-002 | simple-gradient   | Simple Gradient   | free      | basic     | onboarding    | default     | Account created          | 0          |
| 3   | np-003 | clean-border      | Clean Border      | free      | basic     | onboarding    | default     | Account created          | 0          |
| 4   | np-004 | minimal-dark      | Minimal Dark      | free      | basic     | onboarding    | default     | Account created          | 0          |
| 5   | np-005 | minimal-light     | Minimal Light     | free      | basic     | onboarding    | default     | Account created          | 0          |
| 6   | np-006 | ocean-wave        | Ocean Wave        | common    | nature    | customization | purchase    | Buy from shop            | 50         |
| 7   | np-007 | sunset-glow       | Sunset Glow       | common    | nature    | customization | purchase    | Buy from shop            | 50         |
| 8   | np-008 | forest-green      | Forest Green      | common    | nature    | customization | purchase    | Buy from shop            | 50         |
| 9   | np-009 | sky-blue          | Sky Blue          | common    | nature    | customization | purchase    | Buy from shop            | 50         |
| 10  | np-010 | rose-gold         | Rose Gold         | common    | elegant   | customization | purchase    | Buy from shop            | 75         |
| 11  | np-011 | silver-shine      | Silver Shine      | common    | elegant   | customization | purchase    | Buy from shop            | 75         |
| 12  | np-012 | copper-tone       | Copper Tone       | common    | elegant   | customization | purchase    | Buy from shop            | 75         |
| 13  | np-013 | pastel-dream      | Pastel Dream      | common    | cute      | customization | purchase    | Buy from shop            | 60         |
| 14  | np-014 | warm-earth        | Warm Earth        | common    | nature    | customization | purchase    | Buy from shop            | 50         |
| 15  | np-015 | cool-mint         | Cool Mint         | common    | nature    | customization | purchase    | Buy from shop            | 50         |
| 16  | np-016 | neon-pulse        | Neon Pulse        | uncommon  | tech      | customization | purchase    | Buy from shop            | 150        |
| 17  | np-017 | cyber-grid        | Cyber Grid        | uncommon  | tech      | customization | purchase    | Buy from shop            | 150        |
| 18  | np-018 | retro-pixel       | Retro Pixel       | uncommon  | retro     | customization | purchase    | Buy from shop            | 125        |
| 19  | np-019 | vaporwave         | Vaporwave         | uncommon  | retro     | customization | purchase    | Buy from shop            | 125        |
| 20  | np-020 | aurora-borealis   | Aurora Borealis   | uncommon  | nature    | customization | achievement | 14-day streak            | 0          |
| 21  | np-021 | galaxy-swirl      | Galaxy Swirl      | uncommon  | space     | customization | achievement | Send 1000 messages       | 0          |
| 22  | np-022 | crystal-ice       | Crystal Ice       | uncommon  | nature    | customization | purchase    | Buy from shop            | 150        |
| 23  | np-023 | flame-border      | Flame Border      | uncommon  | elemental | customization | purchase    | Buy from shop            | 150        |
| 24  | np-024 | lightning-strike  | Lightning Strike  | uncommon  | elemental | customization | purchase    | Buy from shop            | 150        |
| 25  | np-025 | bamboo-zen        | Bamboo Zen        | uncommon  | nature    | customization | purchase    | Buy from shop            | 125        |
| 26  | np-026 | dragon-scale      | Dragon Scale      | rare      | fantasy   | customization | purchase    | Buy from shop            | 300        |
| 27  | np-027 | phoenix-feather   | Phoenix Feather   | rare      | fantasy   | customization | achievement | 30-day streak            | 0          |
| 28  | np-028 | holographic       | Holographic       | rare      | tech      | customization | purchase    | Buy from shop            | 350        |
| 29  | np-029 | animated-matrix   | Animated Matrix   | rare      | tech      | customization | purchase    | Buy from shop            | 350        |
| 30  | np-030 | sakura-bloom      | Sakura Bloom      | rare      | nature    | customization | purchase    | Buy from shop            | 300        |
| 31  | np-031 | cosmic-nebula     | Cosmic Nebula     | rare      | space     | customization | achievement | 50 forum posts           | 0          |
| 32  | np-032 | royal-crest       | Royal Crest       | rare      | elegant   | customization | purchase    | Buy from shop            | 400        |
| 33  | np-033 | steampunk-gears   | Steampunk Gears   | rare      | retro     | customization | purchase    | Buy from shop            | 350        |
| 34  | np-034 | diamond-shimmer   | Diamond Shimmer   | epic      | luxury    | customization | purchase    | Buy from shop            | 750        |
| 35  | np-035 | enchanted-forest  | Enchanted Forest  | epic      | fantasy   | customization | achievement | 90-day streak            | 0          |
| 36  | np-036 | quantum-flux      | Quantum Flux      | epic      | tech      | customization | purchase    | Buy from shop            | 800        |
| 37  | np-037 | volcanic-eruption | Volcanic Eruption | epic      | elemental | customization | purchase    | Buy from shop            | 750        |
| 38  | np-038 | celestial-gold    | Celestial Gold    | epic      | space     | customization | purchase    | Buy from shop            | 800        |
| 39  | np-039 | prismatic-cascade | Prismatic Cascade | legendary | special   | customization | achievement | 180-day streak           | 0          |
| 40  | np-040 | eternal-flame     | Eternal Flame     | legendary | elemental | customization | achievement | All fire badges          | 0          |
| 41  | np-041 | void-walker       | Void Walker       | legendary | space     | customization | purchase    | Buy from shop            | 2000       |
| 42  | np-042 | divine-aura       | Divine Aura       | legendary | special   | customization | achievement | Top 1% reputation        | 0          |
| 43  | np-043 | infinity-loop     | Infinity Loop     | mythic    | special   | customization | achievement | Complete all collections | 0          |
| 44  | np-044 | genesis-plate     | Genesis Plate     | mythic    | special   | customization | achievement | Founding member          | 0          |
| 45  | np-045 | transcendence     | Transcendence     | mythic    | special   | customization | achievement | Max prestige             | 0          |

## Profile Themes (25)

| #   | ID     | Slug               | Name               | Rarity    | Category | Track         | Unlock Type | Unlock Condition         | Nodes Cost |
| --- | ------ | ------------------ | ------------------ | --------- | -------- | ------------- | ----------- | ------------------------ | ---------- |
| 1   | pt-001 | default-dark       | Default Dark       | free      | basic    | onboarding    | default     | Account created          | 0          |
| 2   | pt-002 | default-light      | Default Light      | free      | basic    | onboarding    | default     | Account created          | 0          |
| 3   | pt-003 | minimal-clean      | Minimal Clean      | free      | basic    | onboarding    | default     | Account created          | 0          |
| 4   | pt-004 | simple-gradient    | Simple Gradient    | free      | basic    | onboarding    | default     | Account created          | 0          |
| 5   | pt-005 | ocean-breeze       | Ocean Breeze       | free      | nature   | onboarding    | default     | Account created          | 0          |
| 6   | pt-006 | forest-calm        | Forest Calm        | common    | nature   | customization | achievement | 7-day streak             | 0          |
| 7   | pt-007 | sunset-warm        | Sunset Warm        | common    | nature   | customization | achievement | 50 messages sent         | 0          |
| 8   | pt-008 | pastel-soft        | Pastel Soft        | common    | cute     | customization | achievement | Add 5 friends            | 0          |
| 9   | pt-009 | midnight-blue      | Midnight Blue      | common    | elegant  | customization | achievement | 3 forum posts            | 0          |
| 10  | pt-010 | cyberpunk-neon     | Cyberpunk Neon     | uncommon  | tech     | customization | purchase    | Buy from shop            | 200        |
| 11  | pt-011 | retro-arcade       | Retro Arcade       | uncommon  | retro    | customization | purchase    | Buy from shop            | 200        |
| 12  | pt-012 | space-explorer     | Space Explorer     | uncommon  | space    | customization | purchase    | Buy from shop            | 250        |
| 13  | pt-013 | fantasy-castle     | Fantasy Castle     | uncommon  | fantasy  | customization | purchase    | Buy from shop            | 250        |
| 14  | pt-014 | aurora-dreams      | Aurora Dreams      | rare      | nature   | customization | purchase    | Buy from shop            | 500        |
| 15  | pt-015 | neon-city          | Neon City          | rare      | tech     | customization | purchase    | Buy from shop            | 500        |
| 16  | pt-016 | galaxy-dream       | Galaxy Dream       | rare      | space    | customization | purchase    | Buy from shop            | 550        |
| 17  | pt-017 | cherry-blossom     | Cherry Blossom     | rare      | nature   | customization | purchase    | Buy from shop            | 450        |
| 18  | pt-018 | holographic-wave   | Holographic Wave   | epic      | tech     | customization | purchase    | Buy from shop            | 1000       |
| 19  | pt-019 | dragon-lair        | Dragon Lair        | epic      | fantasy  | customization | purchase    | Buy from shop            | 1000       |
| 20  | pt-020 | cosmic-void        | Cosmic Void        | epic      | space    | customization | purchase    | Buy from shop            | 1200       |
| 21  | pt-021 | steampunk-workshop | Steampunk Workshop | epic      | retro    | customization | purchase    | Buy from shop            | 1000       |
| 22  | pt-022 | ethereal-glow      | Ethereal Glow      | legendary | special  | customization | achievement | 365-day streak           | 0          |
| 23  | pt-023 | royal-majesty      | Royal Majesty      | legendary | luxury   | customization | purchase    | Buy from shop            | 3000       |
| 24  | pt-024 | genesis-theme      | Genesis Theme      | mythic    | special  | customization | achievement | Founding member          | 0          |
| 25  | pt-025 | transcendent-aura  | Transcendent Aura  | mythic    | special  | customization | achievement | Max prestige, all themes | 0          |

## Name Styles (50)

| #   | ID     | Slug                | Name              | Rarity    | Category | Track         | Unlock Type | Unlock Condition         | Nodes Cost |
| --- | ------ | ------------------- | ----------------- | --------- | -------- | ------------- | ----------- | ------------------------ | ---------- |
| 1   | ns-001 | default-font        | Default Font      | free      | font     | onboarding    | default     | Account created          | 0          |
| 2   | ns-002 | sans-serif          | Sans Serif        | free      | font     | onboarding    | default     | Account created          | 0          |
| 3   | ns-003 | serif-classic       | Serif Classic     | free      | font     | onboarding    | default     | Account created          | 0          |
| 4   | ns-004 | white-text          | White Text        | free      | color    | onboarding    | default     | Account created          | 0          |
| 5   | ns-005 | gray-text           | Gray Text         | free      | color    | onboarding    | default     | Account created          | 0          |
| 6   | ns-006 | monospace           | Monospace         | common    | font     | customization | purchase    | Buy from shop            | 30         |
| 7   | ns-007 | cursive             | Cursive           | common    | font     | customization | purchase    | Buy from shop            | 30         |
| 8   | ns-008 | bold-impact         | Bold Impact       | common    | font     | customization | purchase    | Buy from shop            | 40         |
| 9   | ns-009 | handwritten         | Handwritten       | common    | font     | customization | purchase    | Buy from shop            | 40         |
| 10  | ns-010 | pixel-font          | Pixel Font        | common    | font     | customization | purchase    | Buy from shop            | 50         |
| 11  | ns-011 | green-glow          | Green Glow        | common    | color    | customization | purchase    | Buy from shop            | 40         |
| 12  | ns-012 | blue-tint           | Blue Tint         | common    | color    | customization | purchase    | Buy from shop            | 40         |
| 13  | ns-013 | red-accent          | Red Accent        | common    | color    | customization | purchase    | Buy from shop            | 40         |
| 14  | ns-014 | gold-text           | Gold Text         | common    | color    | customization | purchase    | Buy from shop            | 60         |
| 15  | ns-015 | purple-haze         | Purple Haze       | common    | color    | customization | purchase    | Buy from shop            | 40         |
| 16  | ns-016 | shimmer             | Shimmer           | uncommon  | effect   | customization | purchase    | Buy from shop            | 100        |
| 17  | ns-017 | glow-pulse          | Glow Pulse        | uncommon  | effect   | customization | purchase    | Buy from shop            | 120        |
| 18  | ns-018 | rainbow-shift       | Rainbow Shift     | uncommon  | effect   | customization | purchase    | Buy from shop            | 150        |
| 19  | ns-019 | neon-outline        | Neon Outline      | uncommon  | effect   | customization | purchase    | Buy from shop            | 120        |
| 20  | ns-020 | gradient-flow       | Gradient Flow     | uncommon  | effect   | customization | purchase    | Buy from shop            | 130        |
| 21  | ns-021 | typewriter-effect   | Typewriter Effect | uncommon  | effect   | customization | purchase    | Buy from shop            | 100        |
| 22  | ns-022 | ocean-blue          | Ocean Blue        | uncommon  | color    | customization | purchase    | Buy from shop            | 80         |
| 23  | ns-023 | sunset-orange       | Sunset Orange     | uncommon  | color    | customization | purchase    | Buy from shop            | 80         |
| 24  | ns-024 | cherry-pink         | Cherry Pink       | uncommon  | color    | customization | purchase    | Buy from shop            | 80         |
| 25  | ns-025 | emerald-shine       | Emerald Shine     | uncommon  | color    | customization | purchase    | Buy from shop            | 90         |
| 26  | ns-026 | fire-text           | Fire Text         | rare      | effect   | customization | purchase    | Buy from shop            | 250        |
| 27  | ns-027 | ice-crystal         | Ice Crystal       | rare      | effect   | customization | purchase    | Buy from shop            | 250        |
| 28  | ns-028 | lightning-bolt      | Lightning Bolt    | rare      | effect   | customization | purchase    | Buy from shop            | 275        |
| 29  | ns-029 | shadow-depth        | Shadow Depth      | rare      | effect   | customization | purchase    | Buy from shop            | 250        |
| 30  | ns-030 | holographic-text    | Holographic Text  | rare      | effect   | customization | purchase    | Buy from shop            | 300        |
| 31  | ns-031 | diamond-sparkle     | Diamond Sparkle   | rare      | color    | customization | purchase    | Buy from shop            | 200        |
| 32  | ns-032 | midnight-glow       | Midnight Glow     | rare      | color    | customization | purchase    | Buy from shop            | 200        |
| 33  | ns-033 | star-prefix         | ★ Star            | rare      | prefix   | customization | achievement | 50 stars received        | 0          |
| 34  | ns-034 | crown-prefix        | 👑 Crown          | rare      | prefix   | customization | purchase    | Buy from shop            | 350        |
| 35  | ns-035 | shield-prefix       | 🛡️ Shield         | rare      | prefix   | customization | achievement | Moderator badge          | 0          |
| 36  | ns-036 | plasma-wave         | Plasma Wave       | epic      | effect   | customization | purchase    | Buy from shop            | 500        |
| 37  | ns-037 | cosmic-dust         | Cosmic Dust       | epic      | effect   | customization | purchase    | Buy from shop            | 500        |
| 38  | ns-038 | dragon-prefix       | 🐉 Dragon         | epic      | prefix   | customization | purchase    | Buy from shop            | 600        |
| 39  | ns-039 | phoenix-prefix      | 🔥 Phoenix        | epic      | prefix   | customization | achievement | 90-day streak            | 0          |
| 40  | ns-040 | diamond-prefix      | 💎 Diamond        | epic      | prefix   | customization | purchase    | Buy from shop            | 700        |
| 41  | ns-041 | sparkle-suffix      | ✨                | epic      | suffix   | customization | purchase    | Buy from shop            | 400        |
| 42  | ns-042 | verified-suffix     | ✓                 | epic      | suffix   | customization | achievement | Full verification        | 0          |
| 43  | ns-043 | void-text           | Void Text         | legendary | effect   | customization | achievement | 365-day streak           | 0          |
| 44  | ns-044 | aurora-text         | Aurora Text       | legendary | effect   | customization | purchase    | Buy from shop            | 1500       |
| 45  | ns-045 | eternal-prefix      | ∞ Eternal         | legendary | prefix   | customization | achievement | Max prestige             | 0          |
| 46  | ns-046 | crown-jewel-suffix  | 👑✨              | legendary | suffix   | customization | purchase    | Buy from shop            | 2000       |
| 47  | ns-047 | legendary-glow      | Legendary Glow    | legendary | color    | customization | achievement | All legendary items      | 0          |
| 48  | ns-048 | genesis-text        | Genesis Text      | mythic    | effect   | customization | achievement | Founding member          | 0          |
| 49  | ns-049 | transcendent-text   | Transcendent Text | mythic    | effect   | customization | achievement | Complete all collections | 0          |
| 50  | ns-050 | mythic-crown-prefix | ⚜️ Mythic         | mythic    | prefix   | customization | achievement | All mythic badges        | 0          |

## Profile Frames (55)

| #   | ID     | Slug                | Name                | Rarity    | Category  | Track         | Unlock Type | Unlock Condition         | Nodes Cost |
| --- | ------ | ------------------- | ------------------- | --------- | --------- | ------------- | ----------- | ------------------------ | ---------- |
| 1   | pf-001 | default-circle      | Default Circle      | free      | basic     | onboarding    | default     | Account created          | 0          |
| 2   | pf-002 | default-rounded     | Default Rounded     | free      | basic     | onboarding    | default     | Account created          | 0          |
| 3   | pf-003 | default-square      | Default Square      | free      | basic     | onboarding    | default     | Account created          | 0          |
| 4   | pf-004 | thin-border         | Thin Border         | free      | basic     | onboarding    | default     | Account created          | 0          |
| 5   | pf-005 | dotted-ring         | Dotted Ring         | free      | basic     | onboarding    | default     | Account created          | 0          |
| 6   | pf-006 | ocean-ring          | Ocean Ring          | common    | nature    | customization | purchase    | Buy from shop            | 60         |
| 7   | pf-007 | forest-ring         | Forest Ring         | common    | nature    | customization | purchase    | Buy from shop            | 60         |
| 8   | pf-008 | sunset-ring         | Sunset Ring         | common    | nature    | customization | purchase    | Buy from shop            | 60         |
| 9   | pf-009 | sky-frame           | Sky Frame           | common    | nature    | customization | purchase    | Buy from shop            | 60         |
| 10  | pf-010 | pastel-ring         | Pastel Ring         | common    | cute      | customization | purchase    | Buy from shop            | 50         |
| 11  | pf-011 | copper-ring         | Copper Ring         | common    | elegant   | customization | purchase    | Buy from shop            | 75         |
| 12  | pf-012 | silver-frame        | Silver Frame        | common    | elegant   | customization | purchase    | Buy from shop            | 75         |
| 13  | pf-013 | wooden-frame        | Wooden Frame        | common    | nature    | customization | purchase    | Buy from shop            | 50         |
| 14  | pf-014 | stone-frame         | Stone Frame         | common    | nature    | customization | purchase    | Buy from shop            | 50         |
| 15  | pf-015 | simple-glow         | Simple Glow         | common    | basic     | customization | purchase    | Buy from shop            | 40         |
| 16  | pf-016 | neon-ring           | Neon Ring           | uncommon  | tech      | customization | purchase    | Buy from shop            | 150        |
| 17  | pf-017 | cyber-frame         | Cyber Frame         | uncommon  | tech      | customization | purchase    | Buy from shop            | 150        |
| 18  | pf-018 | pixel-border        | Pixel Border        | uncommon  | retro     | customization | purchase    | Buy from shop            | 125        |
| 19  | pf-019 | retro-tv            | Retro TV            | uncommon  | retro     | customization | purchase    | Buy from shop            | 140        |
| 20  | pf-020 | aurora-ring         | Aurora Ring         | uncommon  | nature    | customization | achievement | 14-day streak            | 0          |
| 21  | pf-021 | crystal-frame       | Crystal Frame       | uncommon  | elegant   | customization | purchase    | Buy from shop            | 175        |
| 22  | pf-022 | flower-wreath       | Flower Wreath       | uncommon  | nature    | customization | purchase    | Buy from shop            | 130        |
| 23  | pf-023 | lightning-frame     | Lightning Frame     | uncommon  | elemental | customization | purchase    | Buy from shop            | 160        |
| 24  | pf-024 | gear-frame          | Gear Frame          | uncommon  | tech      | customization | purchase    | Buy from shop            | 150        |
| 25  | pf-025 | vine-wrap           | Vine Wrap           | uncommon  | nature    | customization | purchase    | Buy from shop            | 125        |
| 26  | pf-026 | dragon-frame        | Dragon Frame        | rare      | fantasy   | customization | purchase    | Buy from shop            | 350        |
| 27  | pf-027 | phoenix-ring        | Phoenix Ring        | rare      | fantasy   | customization | achievement | 30-day streak            | 0          |
| 28  | pf-028 | holographic-frame   | Holographic Frame   | rare      | tech      | customization | purchase    | Buy from shop            | 400        |
| 29  | pf-029 | animated-pulse      | Animated Pulse      | rare      | tech      | customization | purchase    | Buy from shop            | 375        |
| 30  | pf-030 | sakura-frame        | Sakura Frame        | rare      | nature    | customization | purchase    | Buy from shop            | 325        |
| 31  | pf-031 | cosmic-ring         | Cosmic Ring         | rare      | space     | customization | achievement | 50 forum posts           | 0          |
| 32  | pf-032 | royal-frame         | Royal Frame         | rare      | elegant   | customization | purchase    | Buy from shop            | 450        |
| 33  | pf-033 | steampunk-frame     | Steampunk Frame     | rare      | retro     | customization | purchase    | Buy from shop            | 375        |
| 34  | pf-034 | enchanted-ring      | Enchanted Ring      | rare      | fantasy   | customization | purchase    | Buy from shop            | 400        |
| 35  | pf-035 | lava-frame          | Lava Frame          | rare      | elemental | customization | purchase    | Buy from shop            | 350        |
| 36  | pf-036 | diamond-frame       | Diamond Frame       | epic      | luxury    | customization | purchase    | Buy from shop            | 800        |
| 37  | pf-037 | enchanted-glow      | Enchanted Glow      | epic      | fantasy   | customization | achievement | 90-day streak            | 0          |
| 38  | pf-038 | quantum-ring        | Quantum Ring        | epic      | tech      | customization | purchase    | Buy from shop            | 850        |
| 39  | pf-039 | volcanic-frame      | Volcanic Frame      | epic      | elemental | customization | purchase    | Buy from shop            | 800        |
| 40  | pf-040 | celestial-frame     | Celestial Frame     | epic      | space     | customization | purchase    | Buy from shop            | 900        |
| 41  | pf-041 | prismatic-ring      | Prismatic Ring      | epic      | special   | customization | purchase    | Buy from shop            | 950        |
| 42  | pf-042 | ancient-rune        | Ancient Rune        | epic      | fantasy   | customization | purchase    | Buy from shop            | 850        |
| 43  | pf-043 | nebula-frame        | Nebula Frame        | epic      | space     | customization | purchase    | Buy from shop            | 900        |
| 44  | pf-044 | prismatic-frame     | Prismatic Frame     | legendary | special   | customization | achievement | 180-day streak           | 0          |
| 45  | pf-045 | eternal-flame-frame | Eternal Flame Frame | legendary | elemental | customization | achievement | All fire achievements    | 0          |
| 46  | pf-046 | void-ring           | Void Ring           | legendary | space     | customization | purchase    | Buy from shop            | 2500       |
| 47  | pf-047 | divine-frame        | Divine Frame        | legendary | special   | customization | achievement | Top 1% reputation        | 0          |
| 48  | pf-048 | aurora-crown        | Aurora Crown        | legendary | special   | customization | achievement | All legendary cosmetics  | 0          |
| 49  | pf-049 | dragon-throne       | Dragon Throne       | legendary | fantasy   | customization | purchase    | Buy from shop            | 3000       |
| 50  | pf-050 | cosmic-halo         | Cosmic Halo         | legendary | space     | customization | achievement | All space items          | 0          |
| 51  | pf-051 | infinity-frame      | Infinity Frame      | mythic    | special   | customization | achievement | Complete all collections | 0          |
| 52  | pf-052 | genesis-ring        | Genesis Ring        | mythic    | special   | customization | achievement | Founding member          | 0          |
| 53  | pf-053 | transcendent-frame  | Transcendent Frame  | mythic    | special   | customization | achievement | Max prestige             | 0          |
| 54  | pf-054 | celestial-throne    | Celestial Throne    | mythic    | special   | customization | achievement | All mythic items         | 0          |
| 55  | pf-055 | omega-frame         | Omega Frame         | mythic    | special   | customization | achievement | Complete everything      | 0          |

## Forum Themes (10)

| #   | ID     | Slug            | Name            | Rarity    | Category | Track  | Unlock Type | Unlock Condition         | Nodes Cost |
| --- | ------ | --------------- | --------------- | --------- | -------- | ------ | ----------- | ------------------------ | ---------- |
| 1   | ft-001 | neon-cyber      | Neon Cyber      | common    | tech     | forums | purchase    | Buy from shop            | 100        |
| 2   | ft-002 | retro-terminal  | Retro Terminal  | common    | retro    | forums | purchase    | Buy from shop            | 100        |
| 3   | ft-003 | forest-grove    | Forest Grove    | uncommon  | nature   | forums | purchase    | Buy from shop            | 200        |
| 4   | ft-004 | ocean-depths    | Ocean Depths    | uncommon  | nature   | forums | purchase    | Buy from shop            | 200        |
| 5   | ft-005 | galaxy-view     | Galaxy View     | rare      | space    | forums | purchase    | Buy from shop            | 400        |
| 6   | ft-006 | dragon-den      | Dragon Den      | rare      | fantasy  | forums | purchase    | Buy from shop            | 450        |
| 7   | ft-007 | crystal-cave    | Crystal Cave    | epic      | fantasy  | forums | purchase    | Buy from shop            | 800        |
| 8   | ft-008 | void-realm      | Void Realm      | epic      | space    | forums | purchase    | Buy from shop            | 850        |
| 9   | ft-009 | ethereal-garden | Ethereal Garden | legendary | nature   | forums | achievement | 500 forum posts          | 0          |
| 10  | ft-010 | zen-garden      | Zen Garden      | mythic    | nature   | forums | achievement | Forum elder + all themes | 0          |

---

## Source Categories

Items can have a `source` field indicating provenance:

| Source          | Description                                 |
| --------------- | ------------------------------------------- |
| `earned`        | Unlocked through achievements or milestones |
| `purchased`     | Bought with Nodes currency                  |
| `seasonal`      | Available during seasonal events            |
| `event`         | Tied to specific limited-time events        |
| `admin_granted` | Manually granted by administrators          |
| `gifted`        | Received as a gift from another user        |
