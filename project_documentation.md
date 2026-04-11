# Kudeja Trading Platform - Full Project Documentation

## 1. Project Overview
Kudeja Trading is a modern, high-performance e-commerce platform designed for **Kudeja Trading PLC**, a general trading company based in Addis Ababa, Ethiopia. The platform facilitates direct-to-consumer sales of IT equipment, security systems, and office supplies, featuring an AI-powered multi-lingual support system and a robust administrative management suite.

---

## 2. Technology Stack

### Frontend
- **Framework**: React.js (Vite)
- **State Management**: React Context API
- **Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router DOM (v6)
- **Styling**: Vanilla CSS with modern Glassmorpism & CSS Variables
- **Animations**: Framer Motion
- **Icons**: React Icons (Lucide, Icons8)
- **Notifications**: React Hot Toast

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database ORM**: Sequelize (supporting PostgreSQL/MySQL)
- **Real-time Communication**: Socket.io
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **File Storage**: Cloudinary (for product and ad images)

---

## 3. Directory Structure

### Root Directory
- `/kudeja-backend`: Server-side logic, API routes, and database models.
- `/Kudeja-frontend`: Client-side React application.
- `/logo`: Branding assets.

### Backend Structure (`/kudeja-backend`)
- `/models`: Sequelize model definitions (User, Product, Order, etc.) and centralized association registry.
- `/routes`: API endpoints grouped by feature (Auth, Products, Orders, Admin).
- `/services`: Business logic layers (AI Service for chat, Email/Notification triggers).
- `/middleware`: Authentication guards and error handlers.
- `/database`: Configuration for the SQL database connection.

### Frontend Structure (`/Kudeja-frontend/src`)
- `/pages`: Full-page components (Home, Shop, Dashboard, Admin).
- `/components`: Reusable UI elements (Navbar, ProductCard, LiveChatWidget).
- `/context`: Global state providers (Auth, Cart, Theme).
- `/services`: API client functions to communicate with the backend.
- `/styles`: Global and component-specific CSS.
- `/utils`: Formatting helpers and link generators.

---

## 4. Core Features

### 🛍️ Customer Experience
1. **Dynamic Catalog**: Full product listing with category filtering, real-time search, and sorting.
2. **Advanced Product Details**: Comprehensive specification lists and review system.
3. **Cart & Checkout**: Persistent cart management and structured checkout process.
4. **Order Tracking**: Users can view their order history and real-time status in their private dashboard.
5. **Multi-lingual AI Chat**: An intelligent support bot that speaks **English and Amharic**, providing product recommendations with direct clickable links.

### 🛡️ Administrative Suite
1. **Operational Dashboard**: Real-time stats on users, products, and order activity (focused on operations, not just revenue).
2. **Inventory Management**: Full CRUD (Create, Read, Update, Delete) for products with Cloudinary image upload and category-specific specs.
3. **Order Management**: Real-time order status updates with automated customer notifications.
4. **Ad Management**: Control home page advertisements and featured banners.
5. **Notification System**: Persistent, deletable system alerts for site-wide operational awareness.
6. **Platform Settings**: Administrative control over site maintenance mode, titles, and branding.

---

## 5. Database Schema & Models

- **User**: Stores profile data, hashed passwords, and roles (`admin` vs `user`).
- **Product**: Core product data including price, stock, images, and a flexible JSON `specs` field.
- **Category**: Hierarchical categorization with defined `specFields` for consistent data entry.
- **Order**: Tracks transaction data, status (`pending`, `paid`, `shipped`, `delivered`), and user associations.
- **Message & MessageReply**: Persists chat history between users and the AI/Admin.
- **Notification**: Stores system-wide alerts for administrators.
- **Ad**: Manages promotional banners and side-bar advertisements.

---

## 6. Technical Architecture Details

### Centralized Model Registry
The backend uses a pattern in `models/index.js` where all models are imported at once. This ensures that database relationships (Associations) are initialized correctly before any API route is hit, preventing "Server Error" issues caused by race conditions.

### AI Multi-lingual Logic
The `aiService.js` uses a Regex-based detection system to identify **Ethiopic script (Unicode U+1200-U+137F)**. Based on the detection, it dynamically switches the response template between English and Amharic, while providing direct deep-links to product pages.

### Premium Design System
The frontend uses a custom CSS system built on **CSS Variables**. This allows for easy maintenance of the "Kudeja Branding" across all components, including Glassmorphic navbars, high-contrast product cards, and interactive dark/light mode support.

---

## 7. Setup & Installation

### Backend Setup
1. Navigate to `/kudeja-backend`.
2. Run `npm install`.
3. Create a `.env` file with `DATABASE_URL`, `JWT_SECRET`, and `CLOUDINARY_URL`.
4. Run `npm start` to sync models and start the server.

### Frontend Setup
1. Navigate to `/Kudeja-frontend`.
2. Run `npm install`.
3. Run `npm run dev`.

---

## 8. Maintainer Notes
- **Models**: Always export new models from `models/index.js` to maintain registry integrity.
- **Styling**: Use the existing CSS variables in `index.css` for any new UI components to stay "on-brand."
- **Images**: Ensure high-quality photos are used; the system automatically fits them to a white background with no cropping.

---
*Documentation last updated: April 7, 2026*
