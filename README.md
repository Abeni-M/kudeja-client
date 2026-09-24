# Kudeja Trading PLC – B2B Marketplace

[![Deploy](https://img.shields.io/badge/deploy-cPanel-orange)](https://github.com/Abeni-M/kudeja-client)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933)](https://expressjs.com)

> Ethiopian B2B marketplace platform connecting buyers and sellers.

## Architecture

```
kudeja-client/
├── Kudeja-frontend/    # React 18 + Vite + Tailwind CSS (SPA)
├── kudeja-backend/     # Node.js + Express + Sequelize + PostgreSQL
├── .cpanel.yml         # cPanel auto-deploy configuration
├── .htaccess           # Apache SPA routing + security headers
└── README.md
```

## Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm

### Backend
```bash
cd kudeja-backend
cp .env.example .env        # configure DB credentials
npm install
npm start                   # http://localhost:5000
```

### Frontend
```bash
cd Kudeja-frontend
cp .env.example .env        # configure API URL
npm install
npm run dev                 # http://localhost:5173
```

## Deployment (cPanel Git)

This repo deploys automatically via **cPanel Git Version Control**:

1. Push to `main` branch
2. In cPanel → Git Version Control → **Update from Remote**
3. Click **Deploy HEAD Commit**

The `.cpanel.yml` handles:
- Installing frontend dependencies
- Building the Vite React app
- Copying `dist/` output to `public_html/`
- Applying `.htaccess` for SPA routing

## Environment Variables

See `.env.example` files in each directory for required configuration.

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS      |
| Backend    | Node.js, Express, Socket.io       |
| Database   | PostgreSQL, Sequelize ORM         |
| Auth       | JWT, Google OAuth 2.0             |
| Email      | EmailJS                           |
| AI         | Google Gemini API                  |
| Hosting    | cPanel (Apache)                   |

## License

Proprietary – Kudeja Trading PLC © 2026
