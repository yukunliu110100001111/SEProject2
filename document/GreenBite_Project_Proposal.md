# Project Proposal

## GreenBite: A Sustainable Healthy Meal Recommendation Platform for Small Food Businesses

### 1. Project Overview
GreenBite is a web-based platform designed for small food businesses such as healthy meal shops, cafes, or company canteens. The system recommends meals to users based on their dietary needs and preferences, while also helping the business operate more sustainably by reducing ingredient waste, encouraging lower-carbon meal choices, and improving visibility of sustainability-related data.

The idea is not just to build a general "healthy eating website," but to create a software solution that helps a business make better decisions about food, stock usage, and menu design. This matches the project brief, which asks for a solution that helps a client make their business more sustainable.

### 2. Problem Statement
Many small food businesses want to offer healthy meals, but they often face three connected problems:

1. Customers do not know which meals are healthy and suitable for them.
2. Businesses do not know how to reduce food waste effectively.
3. Businesses rarely consider the environmental impact of their menu choices.

At the same time, the client in the brief is new to sustainability and expects the team to make recommendations, not just build a generic website. Therefore, this project aims to provide both a practical meal recommendation service and a simple sustainability support tool for business owners.

### 3. Target Client
The target client is a **small food-related business**, for example:

- a healthy meal-prep shop,
- a cafe with lunch bowls and salads,
- a company canteen.

This is a good fit because food businesses directly deal with nutrition, ingredient stock, packaging, and waste, so software can clearly improve their sustainability performance.

### 4. Aim of the Project
The aim of GreenBite is to help a food business become more sustainable through software by:

- recommending healthier meals to users,
- promoting lower-carbon menu options,
- prioritising meals that use ingredients with high stock or near-expiry dates,
- generating clear sustainability-related reports for managers.

This makes the platform both customer-facing and business-facing, which gives it stronger practical value than a simple recommendation site.

### 5. Main Features

#### 5.1 Customer Features
Customers can:

- create or log into an account,
- enter dietary preferences and goals, such as vegetarian, low calorie, high protein, or allergy restrictions,
- receive recommended meals,
- view nutrition information,
- view a simple sustainability score for each meal,
- place or simulate an order.

#### 5.2 Staff Features
Staff can:

- add and edit meals,
- manage ingredients and stock levels,
- mark ingredients as "high stock" or "near expiry,"
- monitor which meals are being recommended most often,
- update sustainability tags such as low-carbon or plant-based.

#### 5.3 Manager/Admin Features
Managers can:

- view dashboards showing meal popularity, ingredient usage, and waste risk,
- monitor how often lower-carbon meals are selected,
- track how much stock is saved through recommendation logic,
- generate simple sustainability summary reports.

This multi-role design is suitable for testing because it allows the system to demonstrate both customer-facing and business-facing value.

### 6. Sustainability Contribution
The sustainability contribution of the project comes from three aspects.

First, the system reduces food waste by recommending meals that use ingredients with high stock levels or ingredients that are close to expiry.

Second, it encourages environmentally friendlier choices by showing low-carbon and plant-based options more clearly.

Third, it helps business owners understand their own operations through dashboards and reports, which is important because the client is described as being very new to sustainability.

So the platform does not only help people eat better; it also helps the business reduce waste, improve resource use, and make more informed decisions.

### 7. Innovation
The creative aspect of this project is that it combines three things in one platform:

- health-focused recommendation,
- sustainability-focused recommendation,
- inventory-aware business support.

A normal meal recommendation website would only recommend food based on calories or preferences. GreenBite goes further by including sustainability scoring and ingredient waste reduction in the recommendation logic. This makes it more innovative and more aligned with the project brief's emphasis on creativity and business sustainability.

### 8. Proposed Recommendation Logic
There is no need to build a very complex AI model for this course project. A practical scoring system is enough.

For example, each meal can be scored using:

**Recommendation Score = Health Match + Preference Match + Sustainability Score + Stock Priority**

Where:

- **Health Match** considers calorie level, protein level, and similar nutrition indicators.
- **Preference Match** considers vegetarian options, allergy restrictions, disliked ingredients, and user goals.
- **Sustainability Score** reflects carbon level, plant-based ingredients, local ingredients, or eco-friendly packaging.
- **Stock Priority** gives extra weight to meals that help use ingredients with high stock or near-expiry dates.

This approach is realistic, explainable, and easy to demonstrate during assessment.

### 9. Technical Implementation
The project can be implemented using familiar technologies rather than spending too much time learning a completely new framework.

A reasonable stack could be:

- **Frontend:** HTML, CSS, JavaScript, or a framework already known by the team
- **Backend:** Java, Python, or Node.js depending on team skills
- **Database:** MySQL, SQLite, or PostgreSQL
- **Hosting:** University-provided VM
- **Remote testing:** accessible through a browser with prepared test accounts

This also allows the team to demonstrate skills from databases, networks, distributed systems, and web development.

### 10. Possible Data Model
A simple database design could include:

- **Users**
- **Meals**
- **Ingredients**
- **Meal_Ingredients**
- **Orders**
- **Dietary_Preferences**
- **Sustainability_Tags**
- **Stock_Records**
- **Reports**

This gives the project enough structure to show clear database design and system logic.

### 11. Remote Testing Plan
To support remote testing, GreenBite will:

- be deployed on the provided VM,
- be accessible through a browser,
- include pre-created accounts,
- provide at least one customer account and one staff or admin account.

Example test accounts:

- Customer: `customer1 / 123456`
- Staff: `staff1 / 123456`
- Admin: `admin1 / 123456`

This makes the system easy for lecturers or testers to access without needing to register manually.

### 12. Why This Project Fits the Assignment
This project fits the assignment well because:

- it directly helps a business become more sustainable, not just healthier;
- it is creative and practical, combining diet recommendation with food waste reduction;
- it can demonstrate technical skills from several modules;
- it is straightforward to deploy and test remotely.

### 13. Expected Outcome
At the end of the project, the team expects to deliver a working web platform that allows customers to receive healthy and sustainable meal recommendations, while giving staff and managers useful tools for reducing food waste and improving sustainability performance.

The final product should demonstrate that software can help small businesses become more sustainable in a practical, measurable, and user-friendly way.
