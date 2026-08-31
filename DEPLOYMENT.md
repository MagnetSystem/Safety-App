# Deploying for Testing

This guide gets a shared test environment live:

| Piece | Host | URL shape |
|-------|------|-----------|
| Backend API | Render (`render.yaml`) | `https://campus-safety-api.onrender.com/api` |
| Admin portal | Vercel (`vercel.json`) | `https://<project>.vercel.app` |
| Student app | Expo Go + tunnel | QR code from your machine |
| Database | Existing Supabase Postgres | — |

---

## 0. Rotate the database password (do this first)

The old password was committed to a local `.env` and is weak.

1. Supabase dashboard → Project Settings → Database → **Reset database password** → generate a strong one.
2. Copy the new **Connection string (URI)** for both the pooled and direct URLs.
3. Update `backend/.env` locally (`DATABASE_URL`, `DIRECT_URL`) so local dev keeps working.
4. You'll paste the same values into Render in step 2.

---

## 1. Push the code to GitHub

Render and Vercel both deploy from a branch. Merge this branch to `main` (or push it and
point the hosts at it):

```bash
git push origin main
```

---

## 2. Backend → Render

1. [dashboard.render.com](https://dashboard.render.com) → **New → Blueprint** → connect this repo.
   Render reads `render.yaml` and creates the `campus-safety-api` service.
2. Fill in the secret env vars (marked `sync: false`) in the service's **Environment** tab:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | rotated Supabase pooled URI |
   | `DIRECT_URL` | rotated Supabase direct URI |
   | `JWT_ACCESS_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` |
   | `JWT_REFRESH_SECRET` | run the command again (different value) |
   | `CORS_ORIGINS` | your Vercel URL, e.g. `https://campus-safety-admin.vercel.app` (fill in after step 3, comma-separated, no trailing slash) |
   | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | only if you want evidence-file uploads in this test; otherwise leave blank |
   | `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` | for the one-time seed below |

3. Deploy. `npm run start:prod` runs `prisma migrate deploy` automatically, so the schema is
   created on first boot.
4. Seed the first super-admin: Render service → **Shell** tab →

   ```bash
   npm run prisma:seed
   ```

5. Verify: open `https://<your-service>.onrender.com/api/health` → expect
   `{"status":"ok","database":"ok",...}`.

> Free Render services spin down after ~15 min idle; the first request after that takes
> ~30–60s. Fine for testing.

---

## 3. Admin portal → Vercel

1. [vercel.com/new](https://vercel.com/new) → import this repo.
2. **Root Directory**: `Admin-collge-portal/campus-safety-admin`. Vercel detects Vite from
   `vercel.json`.
3. Environment variable:

   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | `https://<your-render-service>.onrender.com/api` |

4. Deploy. Then go back to Render and set `CORS_ORIGINS` to this Vercel URL, and redeploy the
   backend.
5. Log in with the seeded super-admin credentials.

---

## 4. Student app → Expo Go

1. Set the API URL so testers' phones can reach the backend. Edit `student-frontend/.env`:

   ```
   EXPO_PUBLIC_API_BASE_URL=https://<your-render-service>.onrender.com/api
   ```

   Commit and push (it's not a secret).
2. From `student-frontend/`:

   ```bash
   npm install
   npx expo start --tunnel
   ```

3. Testers install **Expo Go** (App Store / Play Store) and scan the QR code from your
   terminal. The tunnel keeps working as long as this command runs on your machine.

> To hand testers a real installable app instead (no dependency on your machine), you'd need
> EAS Build: add `ios.bundleIdentifier` + `android.package` to `app.json`, an Expo account,
> and run `eas build --profile preview`. Not required for this round.

---

## Known limitations for this test round

- **Push notifications don't fire.** The in-app notification feed works but only refreshes on
  screen load — no real-time delivery. An emergency SOS reaches the admin portal feed, not a
  push to anyone's phone.
- **Evidence upload** needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set, plus a private
  `evidence` bucket in Supabase Storage. Skip if not testing that flow.
- **No automated tests** — exercise auth and cross-college isolation manually.
- `npm audit` shows 3 highs in the `prisma` CLI (build-time dev dependency, not shipped in the
  runtime bundle). `npm audit --omit=dev` is clean.
- Admin portal ships one ~780 kB JS chunk (jsPDF + html2canvas). Loads fine; optimize later
  with dynamic imports.
