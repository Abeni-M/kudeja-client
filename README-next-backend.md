# Kudeja Monorepo: Next.js Frontend + Node.js Backend

This repository now contains:

- `kudeja-backend`: Node.js (Express + Sequelize) REST API with PostgreSQL.
- `Kudeja-frontend`: Original React SPA (Vite-based). **(Currently actively developed)**
- `kudeja-frontend-next`: New Next.js app that consumes the REST API.

> **Note on Architecture:** Currently, both a Vite frontend and a Next.js frontend exist in this repository. Active development (like the Admin Dashboard) seems heavily concentrated in the Vite app (`Kudeja-frontend`). At some point, you should decide whether to commit fully to migrating to Next.js or to retire the `kudeja-frontend-next` directory to avoid split efforts.

## Running the backend (Node.js + PostgreSQL)

1. Go to the backend folder:

```bash
cd kudeja-backend
```

2. Make sure your `.env` is configured to point to your PostgreSQL database.

3. Install dependencies (if not already done) and start the server:

```bash
npm install
npm run dev    # or: npm start
```

The backend is expected to run on `http://localhost:5000` and expose a `GET /api/products` endpoint that returns a list of products, for example:

```json
{ "data": [ { "id": 1, "name": "Product", "price": 100, "stock": 10 } ] }
```

or

```json
{ "products": [ ... ] }
```

or a raw array:

```json
[ ... ]
```

## Running the new Next.js frontend

1. In another terminal, go to the Next.js app:

```bash
cd kudeja-frontend-next
```

2. Install dependencies (only needed once):

```bash
npm install
```

3. (Optional) Point the frontend to a different API URL using an environment variable:

Create a `.env.local` file in `kudeja-frontend-next`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the Next.js dev server:

```bash
npm run dev
```

5. Open the app in your browser:

- Home: `http://localhost:3000`
- Products (Next.js + REST API): `http://localhost:3000/products`

The `/products` page:

- Fetches products from the backend REST API.
- Uses a clean, modern grid layout and `ProductCard` component.

## Notes on migration

- The old `Kudeja-frontend` React SPA is still present so you can compare and gradually migrate routes/components into the Next.js app.
- As you move pages over to Next.js, you can eventually remove unused code from `Kudeja-frontend`.

