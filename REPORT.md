# EWA408510 â€“ E-Commerce and Web Application
## Final Project Report

---

**Institution:** University of Lay Adventists of Kigali (UNILAK)
**Campus:** Nyanza Campus
**Faculty:** Computing and Information Sciences
**Programme:** Bachelor of Science in Information Systems and Management
**Option:** Information Systems and Management
**Course Code & Name:** EWA408510 â€“ E-Commerce and Web Application
**Instructor:** Eric Maniraguha
**Student Name:** Emmanuel Kayitare
**Student ID:** 25264/2024
**Academic Year:** 2025â€“2026

---

## 1. Introduction

ek estates is a full-stack property e-commerce web application developed to facilitate the browsing, listing, and management of properties across Rwanda. The platform serves as a digital marketplace where customers can explore properties for sale or rent, submit inquiries, add properties to a shopping cart, and complete a full checkout process. An integrated admin panel allows the business owner to manage all aspects of the platform including properties, agents, orders, users, and inquiries.

The application was built using modern web technologies including Node.js, Express.js, and NeDB, and was deployed on Render with a fully automated CI/CD pipeline via GitHub Actions and Docker containerization.

---

## 2. Problem Statement

The real estate market in Rwanda is growing rapidly, yet most property listings are still managed through informal channels such as phone calls, social media posts, and physical signage. There is no centralized, professional platform where buyers and renters can browse verified property listings, filter by location and price, and directly contact agents or place orders online.

This project addresses that gap by providing a structured, accessible, and fully functional e-commerce platform tailored to the Rwandan real estate market, enabling both customers and administrators to interact with property data efficiently and securely.

---

## 3. Project Objectives

The main objectives of this project are:

- To design and develop a responsive, professional real estate e-commerce web application
- To implement a complete product (property) management system with listing, filtering, and detail pages
- To build a fully functional shopping cart and checkout process with order confirmation
- To integrate a persistent database for storing properties, users, orders, and inquiries
- To implement user authentication with secure password hashing
- To deploy the application online and ensure it remains accessible
- To implement a CI/CD pipeline using GitHub Actions for automated build, test, and deployment
- To containerize the application using Docker for consistent and portable execution
- To provide an admin panel for full management of all platform data

---

## 4. System Features

### Public-Facing Features

| Feature | Description |
|---|---|
| Homepage | Hero section, featured properties, company stats, agent profiles |
| Property Listing | Browse all properties with search and filter by type, district, status, and price |
| Property Detail | Full property info, image, features list, and inquiry form |
| Shopping Cart | Add/remove properties, update quantities, view running total |
| Checkout | Customer info form, order summary, payment method selection |
| Order Confirmation | Confirmation page with order ID after successful checkout |
| User Registration | Sign up with name, email, and password |
| User Login | Unified login modal â€” admin redirects to dashboard, users stay on site |
| Contact Page | General inquiry form that submits to the admin panel |
| About Page | Company info, mission, and agent profiles |

### Admin Panel Features

| Section | Description |
|---|---|
| Dashboard | Real-time stats: total properties, agents, inquiries, unread count |
| Properties | Add, edit, delete, and feature properties with image upload |
| Agents | Manage real estate agent profiles |
| Inquiries | View, mark as read, and mark as done |
| Users | View and remove registered user accounts |
| Done | Archive of handled inquiries with permanent delete |
| Analytics | Bar charts for properties by type/status, inquiries by month, orders by status |
| Settings | Update company name, contact details, and about text |
| Profile | Update admin name, email, password, and profile photo |

---

## 5. Technologies Used

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript | UI structure, styling, and interactivity |
| Backend | Node.js, Express.js | REST API server |
| Database | Supabase PostgreSQL | Hosted relational database |
| Authentication | bcryptjs, signed JWT sessions | Password hashing and protected admin API |
| Containerization | Docker, Docker Compose | Application packaging and portability |
| CI/CD | GitHub Actions | Automated build, test, and deployment |
| Deployment | Render | Cloud application hosting |
| Version Control | Git, GitHub | Source code management |

---

## 6. System Architecture

The application follows a classic **Clientâ€“Server** architecture:

```
Browser (Client)
      â”‚
      â”‚  HTTP Requests (fetch API)
      â–¼
Express.js Server (server.js)
      â”‚
      â”œâ”€â”€ Static Files (HTML, CSS, JS)
      â”‚
      â”œâ”€â”€ REST API (/api/*)
      â”‚
      â””â”€â”€ Supabase PostgreSQL
            â”œâ”€â”€ properties
            â”œâ”€â”€ agents
            â”œâ”€â”€ inquiries
            â”œâ”€â”€ orders
            â”œâ”€â”€ users
            â”œâ”€â”€ settings
            â””â”€â”€ admins
```

**Request Flow:**
1. The browser loads static HTML/CSS/JS files served by Express
2. JavaScript on the client makes fetch() calls to the REST API endpoints
3. Express routes handle each request, query Supabase, and return JSON responses
4. The client renders the response data dynamically into the DOM

**Deployment Architecture:**
```
GitHub (main branch)
      â”‚
      â”‚  push
      â–¼
GitHub Actions (CI/CD)
      â”‚
      â”œâ”€â”€ Build & Test
      â”‚     â”œâ”€â”€ npm install
      â”‚     â”œâ”€â”€ npm test
      â”‚     â””â”€â”€ docker build
      â”‚
      â””â”€â”€ Deploy
            â””â”€â”€ curl â†’ Render Deploy Hook
                        â”‚
                        â–¼
                  Render Web Service â”€â”€â”€ Supabase Project
                  (Node.js API)          (PostgreSQL)
```

---

## 7. Database Design

The application uses Supabase PostgreSQL for persistent data. Run `supabase/schema.sql` in the Supabase SQL Editor to create the tables. The server connects with a private server-side key; row-level security is enabled, and admin API operations require a signed session token.

### Tables

**properties**
```
{
  id, title, type, status, price, currency,
  location, district, bedrooms, bathrooms,
  area, description, features[], image,
  featured, createdAt
}
```

**agents**
```
{ id, name, role, phone, email, photo }
```

**inquiries**
```
{
  id, name, email, phone, message,
  propertyTitle, is_read, is_done, date
}
```

**orders**
```
{
  id,
  customer: { firstName, lastName, email, phone, address, district },
  items[], total, paymentMethod, notes, status, createdAt
}
```

**users**
```
{ id, name, email, password (bcrypt hashed), created_at }
```

**settings**
```
{ id, company_name, tagline, phone, email, address, whatsapp, about }
```

**admins**
```
{ id, username, password (bcrypt hashed), name, photo }
```

### Entity Relationships

- An **order** contains multiple **properties** (items array)
- Every **order** automatically generates an **inquiry** for admin visibility
- An **inquiry** belongs to a **property** (via propertyTitle)
- A **user** can submit multiple **inquiries**

---

## 8. Screenshots of the Application

### Homepage

### Properties Listing

### About Page

### Contact Page

### Admin Dashboard

### Inquiries Management

### Users Management

### Analytics Dashboard

---

## 9. GitHub Repository

ðŸ”— **Repository URL:** https://github.com/KAYITARE8/-kigali-estates

The repository contains:
- Full source code with meaningful commit history (25+ commits)
- Complete README.md documentation
- CI/CD workflow configuration under `.github/workflows/deploy.yml`
- Dockerfile and docker-compose.yml
- `.gitignore` excluding sensitive data files

### Commit History Highlights

| Run | Commit | Description |
|---|---|---|
| #18 | `ae59e6b` | Update README with accurate project info |
| #17 | `f90a1e4` | Stats section: use real DB counts for all 4 figures |
| #16 | `d5ec637` | Fix order inquiry: read from nested customer object |
| #15 | `dcb8a5e` | Auto-create inquiry from every order for admin visibility |
| #14 | `3d4df63` | Fix inquiries not showing: normalize propertyTitle field name |
| #13 | `2282942` | Fix: auto-login after signup, add render.yaml persistent disk |
| #11 | `ab616b7` | Replace property image URL field with file upload |
| #9 | `1d24b69` | Add Users, Analytics, Profile sections to admin panel |
| #7 | `65464b9` | Unified login: admin redirects to dashboard, users stay on site |
| #4 | `a5df8f3` | Add login modal to homepage, bcrypt password hashing |
| #3 | `4105f42` | Add shopping cart, checkout, and order confirmation |

---

## 10. Deployment Link

ðŸ”— **Live Application:** https://kigali-estates.onrender.com

The application is deployed on **Render** as a Web Service with:
- Build command: `npm install`
- Start command: `node server.js`
- Private environment variables for Supabase connection, JWT signing, and initial admin credentials
- Supabase PostgreSQL stores data independently of application deployments

---

## 11. CI/CD Implementation

The CI/CD pipeline is implemented using **GitHub Actions** and defined in `.github/workflows/deploy.yml`.

### Pipeline Trigger
The pipeline runs automatically on every push to the `main` branch.

### Pipeline Stages

**Stage 1 â€” Build & Test**
```yaml
- Checkout code
- Set up Node.js 22
- Install dependencies (npm install)
- Run tests (npm test)
- Build Docker image (docker build)
```

**Stage 2 â€” Deploy to Render**
```yaml
- Trigger Render deploy hook via curl POST request
- Uses RENDER_DEPLOY_HOOK_URL stored as a GitHub secret
```

### Evidence
- 25 successful workflow runs recorded on GitHub Actions
- Both Build & Test and Deploy to Render jobs pass on every push
- Pipeline duration averages 24â€“38 seconds per run

---

## 12. Docker Implementation

The application is fully containerized using Docker.

### Dockerfile
The `Dockerfile` defines a Node.js 22 Alpine-based image that:
1. Sets the working directory to `/app`
2. Copies `package.json` and installs dependencies
3. Copies all source files
4. Exposes port 3000
5. Starts the server with `node server.js`

### docker-compose.yml
The `docker-compose.yml` file defines:
- The web service built from the local Dockerfile
- Port mapping `3000:3000`
- A local `.env` file for private Supabase and session configuration

### Running with Docker
```bash
# Build and run
docker-compose up --build

# Access at
http://localhost:3000
```

### render.yaml
The Render configuration declares the required Supabase connection, session-signing, and admin bootstrap environment variables.

---

## 13. Challenges Encountered

| Challenge | Solution |
|---|---|
| NeDB data lost on every Render redeploy | Replaced file-based storage with Supabase PostgreSQL |
| Property images couldn't be stored as URLs reliably | Replaced URL input with file upload; images are resized and stored as base64 using Canvas API |
| Profile photo exceeding request body limit | Increased Express body limit to 5mb and added client-side image resizing before upload |
| Inquiries not showing due to inconsistent field names | Normalized `propertyTitle` and `property_title` fields across all API responses |
| Admin and user login using the same endpoint | Implemented unified login that checks admin first, then regular users, and redirects accordingly |
| CI/CD deploy job failing | Added `RENDER_DEPLOY_HOOK_URL` as a GitHub Actions secret and fixed curl command with `--fail` flag |
| Sessions persisting after browser close | Used `sessionStorage` instead of `localStorage` so sessions clear automatically on tab close |

---

## 14. Future Enhancements

- **Payment Gateway Integration** â€” Integrate MTN Mobile Money or Airtel Money for real transactions
- **Real-Time Notifications** â€” Use WebSockets to notify admin of new inquiries instantly
- **Progressive Web App (PWA)** â€” Add service worker and manifest for offline access and installability
- **Advanced Search** â€” Full-text search across property titles, descriptions, and locations
- **Property Map View** â€” Integrate Google Maps or Leaflet.js to show property locations on a map
- **Multi-Language Support** â€” Add Kinyarwanda and French language options
- **Email Notifications** â€” Send automated email confirmations to customers after inquiry or order submission
- **AI Property Recommendations** â€” Suggest similar properties based on browsing history

---

## 15. Conclusion

ek estates successfully demonstrates a complete, production-ready e-commerce web application built for the Rwandan property market. The project covers all required functional areas including product management, shopping cart, checkout, database integration, user authentication, and a comprehensive admin panel.

From a DevOps perspective, the application is fully containerized with Docker, version-controlled on GitHub with a meaningful commit history, and automatically built, tested, and deployed through a GitHub Actions CI/CD pipeline to Render.

The development process involved solving real-world challenges such as persistent data storage in cloud environments, image handling without a dedicated file storage service, and unified authentication for multiple user roles. These challenges strengthened both the technical implementation and the understanding of full-stack web development principles.

This project reflects the practical application of e-commerce concepts, modern web development practices, and DevOps principles as taught in EWA408510.

---

**Student:** Emmanuel Kayitare
**Student ID:** 25264/2024
**Programme:** BSc Information Systems and Management
**Campus:** Nyanza Campus â€” UNILAK
**Academic Year:** 2025â€“2026
