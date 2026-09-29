# Kwetu Hotel — Management System

"Your Home Away From Home" — a full hotel, spa & resort management system for Kwetu Hotel, Homabay County, Kenya.

## Stack
- **Backend:** Node.js + Express + Prisma ORM + PostgreSQL
- **Frontend:** React
- **Auth:** JWT
- **Payments:** M-Pesa Daraja API

## Project Structure
```
kwetu-hotel/
├── backend/    → Express API + Prisma schema
└── frontend/   → React app (website + 3 dashboards)
```

## Backend Setup (run these on your own machine)

1. **Get a free cloud PostgreSQL database:**
   - Go to [neon.tech](https://neon.tech) (recommended) or [supabase.com](https://supabase.com)
   - Sign up, create a new project
   - Copy the connection string (looks like `postgresql://user:pass@host/db`)

2. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Set up your environment file:**
   ```bash
   cp .env.example .env
   ```
   Then open `.env` and paste in your real `DATABASE_URL`, and generate a `JWT_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

4. **Run the first migration** — this creates all the tables in your database from `prisma/schema.prisma`:
   ```bash
   npx prisma migrate dev --name init
   ```
   This will:
   - Connect to your database using `DATABASE_URL`
   - Create every table (users, rooms, bookings, services, etc.)
   - Generate the Prisma Client so our code can query the database

5. **(Optional) Open Prisma Studio** to see your database visually:
   ```bash
   npx prisma studio
   ```

## Next Steps
Once step 4 succeeds and you can see the tables (via Prisma Studio or your Neon/Supabase dashboard), let me know and we'll move on to building the Express server and the first API routes (auth: register/login).
