# SpendWise

SpendWise is a full-stack personal finance dashboard for managing day-to-day money, monthly budgets, recurring transactions, spending reports and investment goals.

## Highlights

- Email/password authentication with JWT sessions and password hashing
- User-scoped income and expense CRUD with search, filtering and CSV export
- Monthly category budgets with live spent-vs-limit progress
- Weekly, monthly and yearly recurring transactions with idempotent duplicate protection
- Monthly income, expense, savings and category analytics
- Investment/SIP goal tracking with latest mutual-fund NAV lookup through MFapi
- Responsive React dashboard and REST API

## Stack

- **Frontend:** React, JavaScript, HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas with Mongoose
- **Authentication:** JWT + bcrypt
- **External data:** MFapi

## Project structure

```text
SpendWise/
├─ server.js
├─ src/
│  ├─ auth.js
│  ├─ db.js
│  ├─ models.js
│  └─ routes/
│     ├─ auth.js
│     └─ finance.js
└─ client/
   ├─ public/index.html
   └─ src/
      ├─ App.js
      ├─ api.js
      ├─ constants.js
      ├─ components/
      ├─ index.js
      ├─ base.css
      └─ dashboard.css
```

## Run locally

1. Copy `.env.example` to `.env` and configure `MONGO_URI` and `AUTH_SECRET`.
2. Install server dependencies with `npm install`.
3. Install client dependencies with `npm run client-install`.
4. Run the API with `npm run server` and the React app with `npm run client`.

For production, build the client with `npm run build` and run the server with `NODE_ENV=production npm start`.
