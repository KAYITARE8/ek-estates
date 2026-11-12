# ek estates 🏠

A full-stack real estate e-commerce web application for browsing, listing, and managing properties across Rwanda.

## Live Demo

🔗 [https://ek-estates.onrender.com](https://ek-estates.onrender.com)

## GitHub Repository

🔗 [https://github.com/KAYITARE8/ek-estates](https://github.com/KAYITARE8/ek-estates)

---

## Features

- Browse properties for sale and rent across Rwanda
- Filter by type, district, status, and price range
- Property detail pages with inquiry forms
- Registered users can submit property listings with photos for admin review; accepted requests are published as non-featured properties
- Shopping cart with quantity controls and totals
- Full checkout process with order confirmation
- User registration and login (bcrypt hashed passwords)
- Registered-user account menu with property requests and request-history notifications
- User property requests include a photo and phone number; admins publish accepted listings or cancel with a reason visible to the user
- Admin panel to manage properties, agents (including profile photos), inquiries, orders, users, and settings
- Inquiry workflow: mark as read → mark as done → moves to Review Queue → permanently delete
- Analytics dashboard with real-time stats and bar charts
- Admin profile management with photo upload
- Supabase PostgreSQL database
- Fully containerized with Docker
- CI/CD pipeline via GitHub Actions
- Deployed on Render

---

## Technologies Used

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | Supabase PostgreSQL (`@supabase/supabase-js`) |
| Authentication | bcryptjs (password hashing), jsonwebtoken (admin and registered-user API sessions) |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | Render |

---

## Project Structure