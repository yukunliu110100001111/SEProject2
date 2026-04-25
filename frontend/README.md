# GreenBite Frontend

GreenBite Frontend is a React + Vite single-page application for the GreenBite meal recommendation system. It provides the customer ordering flow, staff operations view, admin dashboard, profile management, and AI assistant interaction.

## Tech Stack

- React 19
- React Router 7
- Vite 8
- Axios
- premium-react-loaders
- lucide-react

## Features

- User login and registration
- Personalized meal recommendation homepage
- Meal detail page and shopping cart drawer
- Order creation and order history
- User profile and dietary preference management
- Staff-side meal and inventory operations
- Admin dashboard and sustainability report view
- AI assistant chat and streaming response support
- Custom loading page with Pac-Man animation

## Project Structure

```text
frontend/
├── public/
├── src/
│   ├── api/              # API wrappers and axios config
│   ├── assets/           # Static assets
│   ├── components/       # Reusable UI components
│   ├── utils/            # Local storage and helper logic
│   ├── views/            # Route-level pages
│   ├── App.jsx           # Route configuration and auth guards
│   └── main.jsx          # App entry
├── package.json
└── vite.config.js
```

## Main Routes

- `/login`: login page
- `/register`: registration page
- `/loading`: loading transition page
- `/home`: recommendation homepage
- `/meals/:mealId`: meal detail page
- `/orders`: order list
- `/profile`: user profile
- `/staff`: staff page
- `/dashboard`: admin dashboard

## Prerequisites

Before starting the frontend, make sure the backend is available on `http://localhost:8080`.

This frontend uses a Vite proxy in [vite.config.js](/Users/zhangzekai/SEProject2/frontend/vite.config.js:1), so browser requests go to `/api/...` and are forwarded to the backend.

If the backend is not running, pages that depend on data requests will fail to load.

## Install Dependencies

Run inside the frontend directory:

```bash
cd /Users/zhangzekai/SEProject2/frontend
npm install
```

## Run in Development

```bash
cd /Users/zhangzekai/SEProject2/frontend
npm run dev
```

Vite will print the local URL after startup, typically:

```text
http://localhost:5173
```

## Build for Production

```bash
cd /Users/zhangzekai/SEProject2/frontend
npm run build
```

## Preview Production Build

```bash
cd /Users/zhangzekai/SEProject2/frontend
npm run preview
```

## Lint

```bash
cd /Users/zhangzekai/SEProject2/frontend
npm run lint
```

## Backend Dependency

The frontend expects the backend proxy target to be:

- Backend base URL: `http://localhost:8080`
- Frontend request prefix: `/api`

The proxy behavior is:

- Browser request: `/api/auth/login`
- Forwarded backend request: `http://localhost:8080/auth/login`

If you change the backend port, update [vite.config.js](/Users/zhangzekai/SEProject2/frontend/vite.config.js:1).

## Demo Accounts

The backend seed data currently creates these demo accounts:

- Customer: `customer1` / `123456`
- Staff: `staff1` / `123456`
- Admin: `admin1` / `123456`

These accounts depend on the backend seed process running successfully.

## Notes

- Frontend session data is stored in `localStorage`.
- Unauthorized API responses clear local session and redirect to `/login`.
- AI assistant streaming uses `fetch` against `/api/ai/chat/stream`.
- The loading page is lazy-loaded through `React.Suspense`.

## Useful Commands

```bash
# install dependencies
npm install

# start dev server
npm run dev

# build
npm run build

# preview build
npm run preview

# lint
npm run lint
```
简单来说 运行docker，然后运行后端，然后执行
cd /Users/zhangzekai/SEProject2/frontend
npm install
npm run dev
