# GreenBite Testing Section for Week 12

## 1. Testing Approach

For Week 12 peer testing, GreenBite uses a mixed testing approach:

- **Black-box testing**: peer groups test the system from the user interface and API behavior without reading our implementation code. This matches the course peer testing requirement because external testers interact with the system as real users.
- **Functional testing**: testers verify whether each major feature works according to the user document and system document, including login, meal browsing, recommendations, cart/order flow, staff management, and admin dashboard.
- **User Acceptance Testing (UAT)**: customer, staff, and admin workflows are tested with realistic accounts to confirm that the system is usable for the intended roles.
- **Integration testing**: backend API, database, authentication, recommendation, order, and dashboard flows are checked together rather than only testing isolated functions.
- **Frontend component testing**: Vitest and React Testing Library are used to test selected frontend utilities, API wrappers, and reusable UI components.

This approach was selected because GreenBite is a role-based web application. The most important testing goal is to confirm that other groups can log in, understand the documents, and complete the main customer/staff/admin tasks without developer assistance.

## 2. Test Environment

| Item | Environment |
|---|---|
| Application type | Web application |
| Frontend | React + Vite |
| Backend | Spring Boot |
| Database | PostgreSQL |
| Deployment method | Docker Compose |
| Browser | Chrome / Edge / Safari |
| Frontend production port | `http://localhost` or deployed VM URL |
| Backend API route | `/api` through frontend reverse proxy |
| Database port for local development | `55432` |

## 3. Test Accounts

These accounts must be included in the user documentation so peer testers can directly access the system.

| Role | Username | Password | Main Testing Scope |
|---|---|---|---|
| Customer | `customer1` | `123456` | Browse meals, view recommendations, update profile/preferences, add to cart, place orders |
| Staff | `staff1` | `123456` | Manage meals, ingredients, and stock |
| Admin | `admin1` | `123456` | View dashboard and sustainability report |

## 4. Manual Peer Testing Cases

| Test ID | Role | Function | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| T01 | Customer | Login | Log in with `customer1 / 123456` | User enters customer home page | To be filled during peer testing | To be filled |
| T02 | Customer | Register | Create a new customer account | Account is created and user can enter the system | To be filled during peer testing | To be filled |
| T03 | Customer | Meal browsing | Open the meal list and inspect meal cards | Meals are displayed with nutrition and sustainability information | To be filled during peer testing | To be filled |
| T04 | Customer | Meal detail | Open a meal detail page | Detail page shows ingredients, calories, protein, and sustainability score | To be filled during peer testing | To be filled |
| T05 | Customer | Recommendation | Open recommendation/home page after login | Recommended meals are shown with recommendation reasons or scores | To be filled during peer testing | To be filled |
| T06 | Customer | Cart | Add one or more meals to cart and adjust quantity | Cart total updates correctly and quantity can be increased/decreased | To be filled during peer testing | To be filled |
| T07 | Customer | Order creation | Place an order from the cart | Order is created and appears in order history | To be filled during peer testing | To be filled |
| T08 | Customer | Profile/preferences | Update dietary preferences | Updated preferences are saved and reflected in later recommendations | To be filled during peer testing | To be filled |
| T09 | Staff | Staff login | Log in with `staff1 / 123456` | Staff page is accessible | To be filled during peer testing | To be filled |
| T10 | Staff | Meal management | Create or edit a meal | Meal data is saved and visible in meal list | To be filled during peer testing | To be filled |
| T11 | Staff | Ingredient management | Create or update ingredient data | Ingredient data is saved successfully | To be filled during peer testing | To be filled |
| T12 | Staff | Stock management | Update stock quantity or expiry date | Stock status updates correctly | To be filled during peer testing | To be filled |
| T13 | Admin | Admin login | Log in with `admin1 / 123456` | Admin dashboard is accessible | To be filled during peer testing | To be filled |
| T14 | Admin | Dashboard | Open dashboard page | Dashboard shows meal, stock, and sustainability statistics | To be filled during peer testing | To be filled |
| T15 | Permission | Role access control | Try accessing staff/admin pages as customer | Unauthorized pages are blocked or redirected | To be filled during peer testing | To be filled |
| T16 | Error handling | Invalid login | Log in with wrong password | System rejects login and shows error feedback | To be filled during peer testing | To be filled |

## 5. Automated Testing

The project also includes automated tests to support manual peer testing.

### Frontend tests

Command:

```bash
cd frontend
npm test
```

Current frontend coverage includes:

- local storage session/cart utility behavior
- frontend API wrapper request construction
- password field rendering and interaction

Latest result:

| Test Suite | Result |
|---|---|
| Frontend Vitest test files | 3 passed |
| Frontend test cases | 9 passed |

### Backend tests

Command:

```bash
cd backend
./mvnw test
```

Current backend coverage includes:

- Spring Boot application context
- MVP flow integration testing
- AI assistant integration testing

### Black-box verification script

Command:

```bash
bash scripts/blackbox_verify.sh
```

The black-box script verifies health check, login for all roles, meal list, recommendations, allergen preference behavior, order creation/confirmation, stock update, and dashboard permission control through HTTP requests.

## 6. Peer Testing Feedback

The following table should be completed after Week 12 peer testing.

| Peer Group | Documents Reviewed | Main Feedback | Severity | Action Taken | Status |
|---|---|---|---|---|---|
| Group ___ | User Document / System Document | To be filled | To be filled | To be filled | To be filled |
| Group ___ | User Document / System Document | To be filled | To be filled | To be filled | To be filled |

Example feedback categories:

- unclear user documentation or missing login information
- confusing navigation between customer, staff, and admin pages
- missing error messages
- role permission problems
- inconsistent data after order or stock update
- layout or browser compatibility issues

## 7. Improvements Based on Peer Feedback

After receiving peer feedback, we will only improve our own implementation and documentation. We will not copy another group’s design or project ideas. Any final changes will be traceable to our draft, our own system goals, and specific peer feedback.

Planned improvement log:

| Feedback Source | Issue | Improvement | Related Page/File | Completed |
|---|---|---|---|---|
| To be filled | To be filled | To be filled | To be filled | To be filled |

## 8. Limitations

- Peer testing is mainly manual, so coverage depends on the time and attention of peer testers.
- Automated frontend tests currently cover selected utilities and components, not every page.
- Concurrent user testing is limited.
- Mobile browser testing is not yet complete.
- Large-scale performance testing has not been performed.
- AI assistant behavior can vary if the external AI service configuration changes.

## 9. Summary

The Week 12 testing work focuses on whether GreenBite can be used by external testers with clear documentation and test accounts. The main quality evidence will come from peer testing results, role-based functional test cases, automated frontend/backend tests, and documented improvements based on peer feedback.
