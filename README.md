# GreenBite

GreenBite is a sustainable meal recommendation and ordering MVP. It combines customer meal discovery, dietary preference management, inventory-aware recommendation, staff catalog operations, admin analytics, sustainability reporting, and an AI assistant.

Payment, pricing, refunds, and other money-related workflows are intentionally left empty for this submission scope.

## Main Features

- Customer registration and login
- Role-based access for customer, staff, and admin users
- Customer profile and dietary preference management
- Allergen-aware and vegetarian-aware meal recommendation
- Meal list, meal detail, category filtering, and image upload/display
- Cart, order creation, order confirmation, cancellation, and order history
- Staff meal management, ingredient management, stock update, and image upload
- Admin dashboard with top meals, recommendation analytics, stock usage, high-stock ingredients, near-expiry ingredients, and sustainability stats
- Sustainability report generation, history, and detail pages
- AI assistant with database-backed tools and confirmation-required write actions

## Business Flow

1. A customer signs in and manages dietary targets, vegetarian preference, and allergens.
2. GreenBite ranks meals using health fit, dietary preference fit, sustainability score, allergen conflict, and stock priority.
3. The customer adds meals to the cart and creates an order.
4. Confirming an order deducts ingredient stock.
5. Staff maintain meals, ingredients, inventory, and uploaded meal images.
6. Admin users review operational and sustainability analytics.
7. The AI assistant can explain recommendations, look up orders, and propose profile/order actions that require explicit confirmation.

## Tech Stack

- Frontend: React 19, React Router 7, Vite 8, Axios, lucide-react
- Backend: Java 21, Spring Boot 4, MyBatis Plus, PostgreSQL
- Test database: H2 in PostgreSQL compatibility mode
- Deployment: Docker Compose, PostgreSQL 15, Nginx

## Project Structure

```text
.
├── backend/              # Spring Boot API
├── frontend/             # React/Vite single-page app
├── document/             # Project reports and API documents
├── scripts/              # Seed and black-box verification scripts
├── init.sql              # PostgreSQL schema for Docker deployment
├── docker-compose.yml    # Full-stack local deployment
└── README.md
```

## Demo Accounts

The backend seed data creates:

| Role | Username | Password |
| --- | --- | --- |
| Customer | `customer1` | `123456` |
| Staff | `staff1` | `123456` |
| Admin | `admin1` | `123456` |

Passwords are stored as PBKDF2 hashes. Legacy plaintext passwords are accepted only for migration and are rehashed after successful login.

## Environment Variables

AI assistant calls use `AI_ARK_API_KEY` when it is set. If it is missing or blank, the backend falls back to the configured demo key.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `AI_ARK_API_KEY` | No | configured demo key | Overrides the fallback Ark API key |
| `AI_ARK_MODEL` | No | `doubao-seed-2-0-pro-260215` | Ark model name |
| `AI_ARK_BASE_URL` | No | `https://ark.cn-beijing.volces.com/api/v3` | Ark API base URL |
| `AI_ARK_PROTOCOL` | No | `auto` | AI API protocol: `responses`, `chat`, or `auto`. Use `chat` for OpenRouter/OpenAI-compatible chat completions. |

Prefer setting real API keys in your shell or `.env` file before Docker startup.

OpenRouter example:

```bash
AI_ARK_BASE_URL=https://openrouter.ai/api/v1 \
AI_ARK_PROTOCOL=chat \
AI_ARK_MODEL=openai/gpt-4.1-mini \
AI_ARK_API_KEY=your_openrouter_key_here \
docker compose up --build
```

## Run With Docker

From the repository root:

```bash
docker compose up --build
```

Open:

```text
http://localhost
```

Docker starts PostgreSQL, backend, and frontend. Uploaded meal images are stored in the Docker `uploads_data` volume.

To enable the AI assistant:

```bash
AI_ARK_API_KEY=your_key_here docker compose up --build
```

## Run Locally

Start PostgreSQL with Docker:

```bash
docker compose up postgres
```

Run the backend:

```bash
cd backend
./mvnw spring-boot:run
```

Run the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` requests to `http://localhost:8080`.

## Verification

Backend tests use an in-memory H2 database and do not require a local PostgreSQL server:

```bash
cd backend
./mvnw test
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

Backend package build:

```bash
cd backend
./mvnw -DskipTests package
```

## Security And Reliability Notes

- API keys are environment-based and are not stored in source files.
- Session tokens are random, stored only as SHA-256 hashes in `auth_sessions`, and expire after 12 hours.
- Passwords are hashed with PBKDF2-HMAC-SHA256.
- Backend integration tests run on an isolated in-memory database.
- Runtime uploads are ignored by Git through `backend/uploads/`.

## Known Scope Limits

- Payment, price, invoice, refund, and checkout money logic are not implemented.
- Order status is intentionally simple: `pending`, `confirmed`, `cancelled`.
- Recommendation is rule-based and explainable, not machine-learning based.
- Inventory uses latest stock records for operational flows; full batch-level stock accounting can be expanded later.
- The AI assistant requires external API configuration for live model responses.
