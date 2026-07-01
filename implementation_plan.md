# Implementation of New Features for Kudeja Trading Platform

This document outlines the approach to implementing the 6 features requested to enhance the e-commerce experience and admin capabilities.

## User Review Required

> [!IMPORTANT]
> Please review following the proposed implementation and answer the clarification questions below to make sure the solutions align perfectly with your vision before we begin code execution.

## Proposed Changes

---

### 1. Live Chat Service (`kudeja-backend` & `Kudeja-frontend`)

Based on our existing Socket.io setup, we will add a real-time floating chat widget.
- **Backend:** Expand the Socket.io logic in `server.js` to handle real-time chat messages between users and admins (using a dedicated `chat` namespace or `message` events). Create a `Chat` or expand the `Message` model to handle fast real-time threads.
- **Frontend:** Build a floating chat icon at the bottom right corner. Clicking it opens a `LiveChatModal` powered by Socket.io for immediate conversation with the support team. Admin will have a corresponding view in their dashboard.

#### [NEW] /src/components/LiveChatWidget.jsx
#### [MODIFY] /src/pages/admin/Dashboard.jsx
#### [MODIFY] kudeja-backend/server.js

---

### 2. Stock Limit on Bulk Orders (`Kudeja-frontend`)

Ensure users cannot order more items than are currently in stock.
- **Frontend (`CartContext.jsx` & `ProductDetail.jsx`):** When modifying quantities in the cart or validating "Add to Cart" actions, verify the requested quantity against `product.stock`. If it exceeds the stock, limit it to the maximum available and show a Toast notification alerting the user.

#### [MODIFY] /src/context/CartContext.jsx
#### [MODIFY] /src/pages/ProductDetail.jsx
#### [MODIFY] /src/pages/Cart.jsx

---

### 3. Product Page: Minimize Icon and Shipping Cost (`Kudeja-frontend`)

- **Minimize Icon:** Add an icon (e.g., `-` or `v`) to sections like "Specifications" or "Description" to allow users to open/close (accordian style) that information, reducing clutter.
- **Shipping Cost Addition:** We will add a "Shipping Cost Estimation" UI section near the "Add to Cart" button. It will display a base shipping cost or "Calculated at Checkout" notice, giving users clarity right on the product page.

#### [MODIFY] /src/pages/ProductDetail.jsx
#### [MODIFY] /src/pages/ProductDetail.css

---

### 4. Admin-Managed Ads on Home Page (`kudeja-backend` & `Kudeja-frontend`)

- **Backend:** Create a new `Ad` mongoose model: `{ imageUrl: String, companyName: String, address: String, isActive: Boolean }`. Add REST routes (`/api/ads`) for admin CRUD operations.
- **Frontend (Admin):** Add a "Manage Ads" section in the Admin Dashboard to upload Ad pictures and input company details.
- **Frontend (Home):** Display active Ad images in a carousel or grid layout. When a user clicks an Ad picture, a stylish modal pop-up displays the company's name and address.

#### [NEW] kudeja-backend/models/Ad.js
#### [NEW] kudeja-backend/routes/adRoutes.js
#### [MODIFY] /src/pages/admin/Dashboard.jsx
#### [MODIFY] /src/pages/Home.jsx
#### [MODIFY] /src/pages/Home.css

---

### 5. Related Products on Product Detail (`kudeja-backend` & `Kudeja-frontend`)

- **Backend:** Add a query parameter or simple `/api/products/:id/related` endpoint. (Or filter on the frontend if the catalog is sent completely, but ideally backend to keep it performant).
- **Frontend:** On `ProductDetail.jsx`, below the Specifications section, add a horizontally scrollable "Related Products" list by filtering products with the same `category`.

#### [MODIFY] /src/pages/ProductDetail.jsx
#### [MODIFY] /src/pages/ProductDetail.css

---

### 6. Home Page Spacing & Navbar Minimizing (`Kudeja-frontend`)

- **Navbar Minimizing:** Modify `Navbar.jsx` to be sticky (`position: sticky; top: 0`). When the user scrolls down, change its styling (e.g., reduce padding, resize logo) to "minimize" the navbar so it uses less screen space while remaining accessible.
- **Home Spacing:** Update `Home.css` to remove excess CSS margins and paddings (`free space`) between the Hero Section, Services, Features, and Ads so the content looks cohesive and closer together.

#### [MODIFY] /src/components/Navbar.jsx
#### [MODIFY] /src/components/Navbar.css
#### [MODIFY] /src/pages/Home.css

---

## Open Questions

> [!WARNING]  
> Please provide feedback on these items so I can proceed accurately:
> 1. **Live Chat:** Should the Live Chat only be available to logged-in users, or can guests initiate a chat (and just provide a temporary name)?
> 2. **Shipping Cost:** How is the shipping cost calculated? Should we just hardcode a fixed estimated fee (e.g., `100 ETB`) on the product page, or do you have a specific formula based on the product?
> 3. **Minimize Icon:** Did you mean turning the Description and Specifications into open/close accordions using a minimize (-/+) icon?

## Verification Plan

### Automated Tests
- N/A

### Manual Verification
- Testing the Add to Cart button and Cart page to ensure `quantity` <= `stock`.
- Verifying the sticky minimized state of the Navbar on scroll.
- Checking Admin dashboard's Ad creation form, and verifying it renders properly on the Home view with modal popups.
- Testing Live Chat sockets by simulating an admin and user split-screen view.
