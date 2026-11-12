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
- Shopping cart with quantity controls and totals
- Full checkout process with order confirmation
- User registration and login (bcrypt hashed passwords)
- Admin panel to manage properties, agents, inquiries, orders, users, and settings
- Inquiry workflow: mark as read → mark as done → moves to Done page → permanently delete
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
| Authentication | bcryptjs (password hashing), jsonwebtoken (admin API sessions) |
| Containerization | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Deployment | Render |

---

## Project Structure

```
ek-estates/
├── css/
│   ├── style.css          # Public site styles
│   └── admin.css          # Admin panel styles
├── js/
│   ├── storage.js         # API client (fetch-based)
│   ├── cart.js            # Shopping cart logic
│   ├── main.js            # Shared UI rendering
│   └── admin.js           # Admin panel logic
├── .github/
│   └── workflows/
│       └── deploy.yml     # CI/CD pipeline
├── supabase/
│   └── schema.sql         # Database tables and row-level security
├── index.html             # Homepage
├── properties.html        # Property listing
├── property.html          # Property detail
├── about.html             # About page
├── contact.html           # Contact page
├── cart.html              # Shopping cart
├── checkout.html          # Checkout form
├── confirmation.html      # Order confirmation
├── admin.html             # Admin dashboard
├── admin-login.html       # Admin login
├── server.js              # Express API server
├── db.js                  # Supabase client and initial demo data
├── package.json
├── Dockerfile
├── docker-compose.yml
├── render.yaml            # Render environment variable configuration
└── .gitignore
```

---

## Database Design

The app stores data in Supabase PostgreSQL. Create the tables by running [`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor. The server connects using the Supabase URL and server-side secret key; never put the secret key in frontend code or commit it. The first server startup adds the sample listings, agents, and site settings without overwriting existing records. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` to create the initial admin account.

| Table | Contents |
|---|---|
| `properties` | Listings, features, location, pricing, and status |
| `agents` | Agent contact and profile information |
| `inquiries` | Customer inquiries and read/done state |
| `orders` | Checkout customer, items, payment, and order status |
| `users` | Registered accounts with bcrypt-hashed passwords |
| `settings` | Company profile and site settings |
| `admins` | Admin username, bcrypt-hashed password, and profile |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/properties | List all properties |
| GET | /api/properties/:id | Get single property |
| POST | /api/properties | Create property |
| PUT | /api/properties/:id | Update property |
| DELETE | /api/properties/:id | Delete property |
| GET | /api/agents | List all agents |
| POST | /api/agents | Create agent |
| PUT | /api/agents/:id | Update agent |
| DELETE | /api/agents/:id | Delete agent |
| GET | /api/inquiries | List all inquiries |
| POST | /api/inquiries | Submit inquiry |
| PUT | /api/inquiries/:id/read | Mark inquiry as read |
| PUT | /api/inquiries/:id/done | Mark inquiry as done (moves to Done page) |
| DELETE | /api/inquiries/:id | Delete inquiry permanently |
| GET | /api/settings | Get site settings |
| PUT | /api/settings | Update settings |
| POST | /api/register | Register new user |
| POST | /api/login | Unified login (admin + user) |
| GET | /api/admin | Get admin profile |
| PUT | /api/admin | Update admin profile & photo |
| GET | /api/users | List all users |
| DELETE | /api/users/:id | Delete user |
| GET | /api/orders | List all orders |
| GET | /api/orders/:id | Get single order |
| POST | /api/orders | Place order |
| PUT | /api/orders/:id/status | Update order status |
| DELETE | /api/orders/:id | Delete order |

---

## Admin Panel

- URL: `/admin-login.html` or use the 🔒 Login button on the homepage
- Default credentials set during first run via `db.js` seed

### Sections

| Section | Description |
|---|---|
| Dashboard | Overview stats, recent properties and inquiries |
| Properties | Add, edit, delete, and feature properties |
| Agents | Manage real estate agents |
| Inquiries | View and handle incoming customer inquiries |
| Users | View and remove registered user accounts |
| Done | Archive of handled inquiries — click Done to permanently remove |
| Analytics | Bar charts for properties by type/status, inquiries by month, orders by status |
| Settings | Update company info, contact details, and admin credentials |
| Profile | Update admin name, email, password, and photo |

### Inquiry Workflow

1. Customer submits inquiry → appears in **Inquiries** section (bold = unread)
2. Admin clicks **Mark Read** → removes bold styling
3. Admin clicks **Done** → inquiry moves to the **Done** section
4. In Done section, admin clicks **Done** button → permanently deletes the inquiry

---

## Running Locally

### Option 1 — Node.js

```bash
npm install
npm start
```
Open [http://localhost:3000](http://localhost:3000)

### Option 2 — Docker

```bash
docker-compose up --build
```
Open [http://localhost:3000](http://localhost:3000)

---

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on every push to `main`:

1. Checkout code
2. Install Node.js 22 dependencies
3. Run tests (`npm test`)
4. Build Docker image
5. Trigger deployment to Render via deploy hook

---

## Deployment (Render)

1. Push code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repository
4. Set build command: `npm install`
5. Set start command: `node server.js`
6. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` in Render. Keep these private server-side settings out of browser code.
7. Copy the **Deploy Hook URL** and add it as a GitHub secret named `RENDER_DEPLOY_HOOK_URL`.

### Supabase setup

1. Create a Supabase project.
2. In **SQL Editor**, run `supabase/schema.sql`.
3. Copy `.env.example` to `.env`, then add the project URL, server-side secret key, and a strong admin username and password. Generate a random `SESSION_SECRET` (for example, `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`).
4. Add the same variables to your hosting provider's environment settings, then deploy. Existing NeDB files are not imported automatically.

---

## Docker

```bash
# Build
docker build -t ek-estates .

# Run
docker run --env-file .env -p 3000:3000 ek-estates

# Or with docker-compose after creating a local .env file from .env.example
docker-compose up --build
```

---

## Security

- Passwords hashed with **bcryptjs** (salt rounds: 10)
- Unified login endpoint checks admin first, then users
- Input validation on all forms (frontend + backend)
- Admin API routes require a signed, expiring token; the token is kept in `sessionStorage`

---

## Changelog

All changes are automatically deployed via the CI/CD pipeline on every push to `main`.

| Run | Commit | Description |
|---|---|---|
| #18 | `ae59e6b` | Update README with accurate project info, remove stray image files |
| #17 | `f90a1e4` | Stats section: use real DB counts for all 4 figures |
| #16 | `d5ec637` | Fix order inquiry: read from nested customer object |
| #15 | `dcb8a5e` | Auto-create inquiry from every order for admin visibility |
| #14 | `3d4df63` | Fix inquiries not showing: normalize propertyTitle field name |
| #13 | `2282942` | Fix: auto-login after signup, add render.yaml persistent disk for NeDB |
| #12 | `a0cf95d` | Remove login credentials hint from admin login page |
| #11 | `ab616b7` | Replace property image URL field with file upload |
| #10 | `f99f13d` | Fix profile photo save: increase body limit to 5mb, resize image before upload |
| #9 | `1d24b69` | Add Users, Analytics, Profile sections to admin panel |
| #8 | `cd6771d` | Fix login: use email key consistently across all auth flows |
| #7 | `65464b9` | Unified login: admin redirects to dashboard, users stay on site |
| #6 | `a6c6762` | Update admin credentials to email login |
| #5 | `7c931a8` | Add customer sign up/in modal, remove admin title from modal |
| #4 | `a5df8f3` | Add login modal to homepage, bcrypt password hashing |
| #3 | `4105f42` | Add shopping cart, checkout, and order confirmation |
| #2 | `dfa0557` | Force Node.js runtime for Render |
| #1 | `50eaeb3` | Fix README repo URL |

---

## Author

Developed as a final project for **EWA408510 – E-Commerce and Web Application**
Faculty of Computing and Information Sciences — UNILAK, 2025–2026
