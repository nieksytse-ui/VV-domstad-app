# Implementatieplan — v.v. Domstad App

## Overzicht

Volledige webapplicatie voor een Nederlands amateurvoetbalteam. Op basis van de oorspronkelijke prompt en twee iteraties van overleg zijn de volgende keuzes vastgesteld:

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend/DB:** Supabase (PostgreSQL + Auth + Storage)
- **Hosting:** Vercel (gratis, snelle deploys, custom domein mogelijk)
- **Auth:** Magic link via Supabase Auth (geen wachtwoorden)
- **Toegang:** Teamcode (bijv. `DOMSTAD2026`) voor uitnodiging; admin reset de code indien nodig
- **Rollen:** `admin` (trainer/aanvoerder) en `player`; gasten als aparte rol (fase 3)
- **Seizoen:** Handmatig aangemaakt door admin; eerste seizoen 2026–2027 (aug–jun)
- **Notificaties:** In-app (belletje met badge) + e-mail via Supabase Edge Functions; PWA push notifications (fase 4)
- **Foto's:** Supabase Storage (gratis tier = 1 GB, ruim genoeg voor 25 spelers)
- **Lineup builder:** Fase 4 (complex drag & drop, niet in MVP)
- **Emoji reacties (prikbord):** Vaste set: 👍 😂 🔥 💪 ❤️
- **Teamgrootte:** ~25 spelers; geen speciale Firestore-optimalisaties nodig
- **Eerste admins:** Twee e-mailadressen hardcoded in seed-script
- **Boete-integriteit:** Fine documents worden nooit verwijderd; correcties zijn nieuwe entries

---

## Fasering

### Fase 1 — Fundament

Zonder dit werkt niets. Dit bouwt de complete basis van de app.

#### 1.1 Project setup

```bash
npm create vite@latest vv-domstad -- --template react-ts
cd vv-domstad
npm install tailwindcss framer-motion @supabase/supabase-js
npm install -D @types/react @types/react-dom
npx tailwindcss init -p
```

Mapstructuur:

```
src/
  features/
    auth/
    attendance/
    fines/
    lineup/
    stats/
    announcements/
    voting/
    calendar/
    rotation/
  components/
  hooks/
  lib/
  pages/
```

#### 1.2 Supabase setup

Supabase project aanmaken op supabase.com. Omgevingsvariabelen instellen:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxx
```

Client initialiseren in `src/lib/supabase.ts`.

#### 1.3 Auth systeem

- Magic link login via Supabase Auth
- Teamcode-flow: speler vult teamcode + e-mail in → ontvangt magic link → is ingelogd
- Invite-tabel in DB slaat gebruikte codes bij
- Eerste twee admins worden via seed-script ingesteld (e-mailadressen hardcoded)
- `useAuth` hook geeft `user`, `profile`, `role` terug
- Protected routes client-side via `<ProtectedRoute role="admin" />`

#### 1.4 Eerste login — profielflow

Na eerste login wordt speler doorgestuurd naar een onboarding-scherm:
- Naam invullen
- Positie kiezen (keeper, verdediger, middenvelder, aanvaller)
- Rugnummer kiezen (admin kan dit later corrigeren)
- Profielfoto uploaden naar Supabase Storage

#### 1.5 Layout & navigatie

- Clubkleuren: geel `#FFD700`, groen `#2D7A2D`, zwart, wit
- Desktop: sidebar navigatie
- Mobiel: bottom navigation bar
- Volledig in het Nederlands

#### 1.6 Dashboard

- Volgende wedstrijd + training (datum, tijd, locatie)
- Snelle RSVP-knoppen: Aanwezig / Afwezig / Misschien
- Laatste aankondigingen (max. 3, link naar volledig prikbord)
- Persoonlijk boetesaldo

#### 1.7 PWA setup

Via `vite-plugin-pwa`:
- `manifest.json` met clubnaam, icoontjes en clubkleuren
- Service worker voor offline caching
- Installeerbaar op Android en iOS homescreen

---

### Fase 2 — Kernfeatures

De features die het team dagelijks gebruikt.

#### 2.1 Trainingen & RSVP

- Admin maakt trainingen aan: datum, tijd, locatie, optionele notitie
- Spelers RSVP'en: Aanwezig / Afwezig / Misschien
- Admin ziet overzicht: wie komt er, wie is afwezig
- Aanwezigheidsgeschiedenis per speler

#### 2.2 Wedstrijden & RSVP

- Admin maakt wedstrijden aan: datum, tegenstander, thuis/uit, locatie
- Zelfde RSVP-flow als training
- Admin kan definitieve selectie/opstelling invullen (koppeling met fase 3 lineup builder)

#### 2.3 Boetepot

Vaste categorieën:

| Categorie | Bedrag |
|---|---|
| Te laat | €1 |
| Gele kaart | €2 |
| Vergeten shirt | €3 |
| Rode kaart | €5 |
| Custom (admin bepaalt) | vrij |

Schermen:

1. **Logboek** — chronologische feed van alle boetes, nieuwste eerst, zichtbaar voor iedereen. Nooit verwijderbaar; correctie = nieuwe entry.
2. **Per speler** — alle boetes, totaalbedrag, openstaand vs. betaald, betalingsgeschiedenis
3. **Leaderboard** — totaal per speler, huidig seizoen

Betalingsflow: admin markeert boetes als betaald → wordt gelogd met datum en ontvangende admin.

Transparantie: elke speler ziet elke andere spelers boetes en saldo volledig.

#### 2.4 Aankondigingen / Prikbord

- Admin plaatst aankondigingen (titel, tekst, optionele emoji)
- Spelers zien ze op het dashboard en in een apart prikbord-scherm
- Spelers reageren met emoji: 👍 😂 🔥 💪 ❤️

#### 2.5 Spelersoverzicht

Pagina zichtbaar voor alle ingelogde spelers:

- Spelerfoto, naam, rugnummer, positie
- Boetesaldo (openstaand)
- Aanwezigheidspercentage (trainingen + wedstrijden)
- Statistieken samenvatting (doelpunten, assists, kaarten)
- Rotatieslot (wanneer is de speler aan de beurt voor training leiden)

Standaard gesorteerd op rugnummer; ook sorteerbaar op naam, boetes, aanwezigheid.

Doorklikken op speler opent volledig profiel: boetegeschiedenis, aanwezigheidsgeschiedenis, wedstrijdstatistieken, swapgeschiedenis.

---

### Fase 3 — Geavanceerde features

#### 3.1 Trainingsrotatie & swaps

Rotatieschema:
- Admin maakt een vaste volgorde (alfabetisch of handmatig)
- Elke speler leidt precies één keer training per cyclus
- Zichtbaar voor alle spelers: wie is er nu aan de beurt, volledige volgorde
- Voortgang getoond: "Week 6 van 14 — aan de beurt: Daan"
- Bij voltooide cyclus kan admin een nieuwe starten (zelfde of nieuwe volgorde)

Swapsysteem:
- Speler vraagt swap aan met een teamgenoot
- Teamgenoot ontvangt notificatie → accepteren of weigeren
- Bij acceptatie: schema wordt automatisch bijgewerkt
- Swapgeschiedenis opgeslagen en zichtbaar

Admin override:
- Admin kan iemand markeren als "niet komen opdagen" → blijft in rotatie, maar wordt gemarkeerd in geschiedenis
- Admin kan ook handmatig slots wisselen of opnieuw toewijzen

#### 3.2 Statistieken

Per speler per seizoen:
- Doelpunten, assists, gele kaarten, rode kaarten, gespeelde wedstrijden, getrainde trainingen

Admin voert stats in na elke wedstrijd.

Seizoensleaderboard per categorie.

#### 3.3 Man of the Match voting

- Na wedstrijd opent admin stemronde
- Spelers stemmen één keer op een teamgenoot (niet op zichzelf)
- Admin sluit stemronde → resultaten worden zichtbaar
- Winnaar opgeslagen in wedstrijdgeschiedenis

#### 3.4 Wedstrijdkalender

- Kalenderweergave van alle wedstrijden en trainingen
- Filterbaar op type (wedstrijd / training)
- Klikken op event → details + RSVP

#### 3.5 Leaderboards

- Meest aanwezig (trainingen + wedstrijden)
- Topscorer
- Meeste boetes
- Meeste Man of the Match-awards

#### 3.6 Notificaties

- In-app notificaties (belletje met badge)
- E-mail notificaties via Supabase Edge Functions voor: swap requests, nieuwe wedstrijd/training aangemaakt, boete ontvangen
- Gasten (tijdelijke spelers): kunnen RSVP'en voor een specifieke training/wedstrijd, geen eigen profiel, stats of boetes

---

### Fase 4 — Polish & extras

#### 4.1 Lineup builder

Drag & drop spelers op een veldgrafiek:
- Formaties: 4-3-3, 4-4-2, 3-5-2, etc.
- Opstelling opslaan per wedstrijd
- Spelers kunnen opstelling inzien (alleen admin kan bewerken)

#### 4.2 Push notifications

PWA push via Web Push API (werkt op Android; op iOS vanaf Safari 16.4):
- Push bij swap request
- Push bij nieuwe aankondiging
- Push bij nieuwe boete

#### 4.3 Seizoensarchief

- Vorige seizoenen inzien (stats, boetes, wedstrijden)
- Geen bewerkingen mogelijk in archief

---

## Databasestructuur (Supabase / PostgreSQL)

### Kerntabellen

```sql
players
  id, email, name, role, shirt_number, position, photo_url, invited_at, season_id

seasons
  id, name (bijv. "2026-2027"), start_date, end_date, active

trainings
  id, season_id, date, time, location, notes, created_by

matches
  id, season_id, date, opponent, home_away, location, notes, created_by

rsvps
  id, player_id, event_id, event_type (training/match), status (aanwezig/afwezig/misschien)

fines
  id, player_id, player_name, category, amount, reason,
  match_id (optioneel), training_id (optioneel),
  added_by, added_by_name, created_at,
  paid, paid_at, paid_received_by

fine_payments
  id, fine_ids[], total_amount, player_id, paid_at, received_by

announcements
  id, title, body, emoji, created_by, created_at

announcement_reactions
  id, announcement_id, player_id, emoji

rotation_cycles
  id, season_id, order (jsonb: [{player_id, player_name, slot_index, done, flagged}]), created_at

rotation_swaps
  id, requested_by, requested_with, slot_a, slot_b,
  status (pending/accepted/declined), created_at, resolved_at

match_stats
  id, match_id, player_id, goals, assists, yellow_cards, red_cards

motm_votes
  id, match_id, voter_id, voted_for_id

invites
  id, code, created_by, used_by, used_at
```

### Ontwerpbeslissingen

- `fine_balance` en `attendance_rate` worden **niet** opgeslagen op het player-record. Ze worden client-side berekend of via een Supabase database function, zodat ze nooit out-of-sync raken.
- Fine-documenten worden nooit verwijderd (ook via RLS afgedwongen: `allow delete: false`).
- Correcties op boetes zijn altijd nieuwe entries, gemarkeerd als correctie, met verwijzing naar de originele boete.

---

## Beveiliging (Row Level Security)

```sql
-- Spelers kunnen alle profielen lezen
allow select on players for authenticated;

-- Spelers mogen alleen hun eigen profiel bijwerken
allow update on players for authenticated
  using (auth.uid() = id);

-- Alleen admins mogen boetes toevoegen
allow insert on fines for authenticated
  using (get_role(auth.uid()) = 'admin');

-- Boetes nooit verwijderen (ook voor admins)
allow delete on fines: false;

-- Alleen admins mogen trainingen en wedstrijden aanmaken
allow insert on trainings for authenticated
  using (get_role(auth.uid()) = 'admin');

allow insert on matches for authenticated
  using (get_role(auth.uid()) = 'admin');
```

Admin-only routes zijn ook client-side beschermd via `<ProtectedRoute role="admin" />`, maar de Supabase RLS-regels zijn de echte beveiliging.

---

## Aanbevolen aanpak per overleg-item

| Vraag | Beslissing |
|---|---|
| Firebase vs Supabase | **Supabase** — relationele data, magic link ingebouwd, al ervaring mee |
| Login methode | **Magic link** — geen wachtwoorden, makkelijk voor spelers |
| Uitnodiging | **Teamcode** (bijv. `DOMSTAD2026`), reset mogelijk door admin |
| Eerste admins | **Seed-script** met twee hardcoded e-mailadressen |
| Seizoen definitie | Handmatig door admin; eerste seizoen **2026–2027** |
| Notificaties | In-app + e-mail (fase 2/3), push via PWA (fase 4) |
| Foto-opslag | **Supabase Storage** (gratis, 1 GB) |
| Lineup builder | **Fase 4** — te complex voor MVP |
| Emoji reacties | Vaste set: 👍 😂 🔥 💪 ❤️ |
| Hosting | **Vercel** — gratis, snelle deploys, custom domein |
| fineBalance veld | **Niet opgeslagen**, berekend client-side of via DB function |
| Fine verwijderen | **Nooit** — ook via RLS afgedwongen |

---

## Startpunt — volgorde van implementatie

1. Supabase project aanmaken + tabellen + RLS policies
2. React/Vite/Tailwind setup + mapstructuur
3. Auth flow: teamcode → magic link → eerste login → profielpagina
4. Seed-script: twee admins instellen
5. Layout: sidebar (desktop), bottom nav (mobiel), clubkleuren
6. Dashboard: volgende event + RSVP + aankondigingen + boetesaldo
7. PWA manifest + service worker
8. Trainingen RSVP + wedstrijden RSVP
9. Boetepot: logboek + per-speler + leaderboard + betalingen
10. Prikbord + emoji reacties
11. Spelersoverzicht
12. Rotatieschema + swaps
13. Statistieken + Man of the Match
14. Kalender + leaderboards
15. Notificaties (in-app + e-mail)
16. Lineup builder (drag & drop)
17. Push notifications + seizoensarchief
