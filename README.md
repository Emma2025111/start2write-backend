# Start2Write API

Secure Node.js + Express service powering the Start2Write admin dashboard. It stores feedback submissions, manages OTP-based admin authentication, and exposes export-ready endpoints.

## 🚀 Quick Start

1. Install dependencies:
   ```powershell
   npm install
   ```
2. Copy the environment template and update secrets:
   ```powershell
   Copy-Item .env.example .env
   ```

   - `MONGODB_URI` should point to your local MongoDB instance (defaults to `mongodb://127.0.0.1:27017/start2write`).
   - Set `SESSION_SECRET`, `JWT_SECRET`, and `ADMIN_PASSWORD` to strong values before production.
   - Configure SMTP credentials (or Bravo provider keys) to deliver OTP codes.
3. Start MongoDB locally.
4. Run the development server:
   ```powershell
   npm run dev
   ```
5. The API becomes available at `http://localhost:4000`. Health check: `GET /health`.

## 🔐 Authentication Flow

- `POST /api/auth/login` – password verification and OTP dispatch (login context).
- `POST /api/auth/verify-otp` – finalises login, issues HttpOnly JWT cookie, and joins the Mongo-backed session.
- `POST /api/auth/forgot` + `context=reset` in `verify-otp` – optional password reset path.
- `POST /api/auth/logout` – clears session + cookie.

## 📊 Feedback Management

- `POST /api/public/feedback` – public submission endpoint consumed by the landing page.
- `GET /api/admin/feedback` – authenticated list with filter, sort, pagination, and search.
- `GET /api/admin/feedback/export?format=csv|xlsx` – server-side export using `json2csv` or `exceljs`.
- `GET /api/admin/stats` – lightweight stats endpoint surfaced in the dashboard summary cards.

## 🛡️ Security Defaults

- Helmet, CORS (origin controlled via `CLIENT_URL`), and express-rate-limit guard requests.
- HttpOnly, `SameSite=strict` cookies with optional custom domain (`COOKIE_DOMAIN`).
- Sessions stored in MongoDB via `connect-mongo`.
- OTPs hashed with SHA-256, expiring automatically through TTL indexes.

## 🧪 Scripts

- `npm run dev` – start with live reload (`tsx watch`).
- `npm run build` – compile TypeScript.
- `npm run start` – serve compiled output from `dist/`.

## 🧾 Environment Reference

See `.env.example` for the full list of configurable values (ports, rate limiting, OTP settings, SMTP/Bravo credentials).
