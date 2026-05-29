# Coconut Factory System

A premium full-stack coconut factory production management system using:

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- ShadCN-style reusable UI components
- MongoDB Atlas
- Mongoose
- JWT authentication with role-based access
- PWA manifest + service worker
- Excel report generation

## Main Features

### Login
- Admin and Supervisor login with username and password.
- JWT stored in a secure HTTP-only cookie.
- Role-based routing after login.

### Admin Dashboard
- Production statistics.
- Day-by-day production summary.
- Section-wise analytics charts.
- Date selector for reports.
- Full filling Excel export.
- Additional filling Excel export.
- Add new sections beyond Section 1 and Section 2.
- Increase cage sections beyond the default 15 cages.
- Increase cage buttons beyond the default 24 buttons.

### Supervisor Flow
- Supervisor opens section selection page.
- VCO button shows: `Ongoing section not created yet.`
- CNO opens Section 1, Section 2 and Admin-created sections.
- Each section has:
  - Next Day Filling
  - Additional Filling
- Next Day Filling requires all cage sections to be completed before final submit.
- Additional Filling allows only required cage sections to be completed.
- Every cage opens cage buttons.
- Weight entry activates after all cage buttons are selected.
- Type dropdown: Small, Red, Black.
- Auto deduction:
  - Small: 108kg
  - Red: 136kg
  - Black: 139kg
- Auto final weight calculation.
- Coconut count: 50 per selected cage button. Default full cage = 50 × 24 = 1200.
- Draft data remains visible until Submit is clicked.
- After submit, data is saved by date and local draft is cleared.

## Folder Structure

```text
src/app/                  Next.js pages and route handlers
src/app/api/              Backend API routes
src/components/           Reusable UI and shell components
src/lib/                  DB, auth, helpers
src/models/               Mongoose models
scripts/seed.ts           First-time database seed script
public/manifest.json      PWA manifest
public/sw.js              Service worker
```

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Then update:

```env
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/coconut_factory?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret_key
NEXT_PUBLIC_APP_NAME=Coconut Factory System
```

### 3. Seed first users and default sections

```bash
npm run seed
```

This creates:

```text
Admin:      admin / admin123
Supervisor: supervisor / supervisor123
Sections:   Section 1 and Section 2
```

Change these passwords after your first deployment.

### 4. Run development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### 5. Build for production

```bash
npm run build
npm start
```

## MongoDB Atlas Notes

1. Create a MongoDB Atlas account.
2. Create a free cluster.
3. Add a database user.
4. Add your IP address in Network Access.
5. Copy your connection string into `.env.local`.
6. Run `npm run seed`.

## Deployment Notes

Recommended easy deployment:

- Vercel for Next.js hosting.
- MongoDB Atlas for database.

After deployment, add these environment variables in your hosting dashboard:

- `MONGODB_URI`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_NAME`

Then run the seed script locally against the same MongoDB Atlas database, or use your deployment platform's build/console tools if available.

## Important Security Notes

- Replace demo passwords before using with real factory data.
- Use a strong `JWT_SECRET`.
- Keep MongoDB Atlas credentials private.
- Do not expose `.env.local` publicly.

## Customization

You can change the natural coconut theme colors in:

```text
tailwind.config.ts
src/app/globals.css
```

You can control default cage and cage-button counts from the Admin Dashboard after login.
