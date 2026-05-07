# Group33_CS308

Group 33 CS308 project: a full-stack marketplace application built with React,
Express, and PostgreSQL.

## Features

- Product browsing with categories, sorting, product details, ratings, and reviews
- User authentication with profile and account management pages
- Shopping cart with stock-aware quantity updates
- Checkout flow with address selection, invoices, and order emails
- Admin dashboard for products, orders, users, and review moderation

## Project Structure

```text
client/   React + Vite frontend
server/   Express API, routes, utilities, and Jest tests
db/       PostgreSQL schema and seed data
```

## Backend Environment

Copy `server/.env.example` to `server/.env` and adjust values if your local
PostgreSQL setup is different.

Default local database settings:

```text
DB_USER=postgres
DB_HOST=localhost
DB_NAME=marketplace
DB_PASSWORD=password
DB_PORT=5432
```

## Database Setup

Create the PostgreSQL database, then run the schema and seed scripts:

```bash
createdb -U postgres marketplace
psql -U postgres -d marketplace -f db/schema.sql
psql -U postgres -d marketplace -f db/seed_products.sql
```

## Running Locally

Install and start the backend:

```bash
cd server
npm install
npm run dev
```

Install and start the frontend in another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend runs through Vite, and the API defaults to
`http://localhost:5001`.

## Tests

Run backend tests with:

```bash
cd server
npm test
```
