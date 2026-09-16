# SpendWise

SpendWise is a full-stack personal finance web app where users can manage income, expenses, budgets, recurring payments, SIP planning, and mutual fund investments.

## Live Demo

[View SpendWise Live](https://spendwise-dgq0.onrender.com)

## Features

- User login and signup
- Add, edit, delete, and search transactions
- Filter transactions by type and category
- Export transactions as CSV
- Set monthly budgets
- Track how much of the budget is used
- Add recurring transactions
- View monthly income, expenses, and savings
- SIP calculator and goal planner
- Search mutual fund schemes
- Calculate units using historical NAV data
- Show latest NAV and current investment value
- Show profit or loss on mutual funds
- Responsive design for different screen sizes

## Tech Stack

- **Frontend:** React, JavaScript, HTML, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Authentication:** JWT and bcrypt
- **Mutual Fund Data:** MFapi

## Project Structure

```text
SpendWise/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   ├── api.js
│   │   ├── constants.js
│   │   └── index.js
│   ├── package.json
│   └── package-lock.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── auth.js
│   │   ├── db.js
│   │   └── models.js
│   └── server.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Run Locally

Install the main dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
npm run frontend-install
```

Start the backend:

```bash
npm run backend
```

Start the frontend:

```bash
npm run frontend
```

Or run both together:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

Backend runs on:

```text
http://localhost:5000
```

## Environment Variables

Create a `.env` file in the main project folder.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
AUTH_SECRET=your_secret_key
CLIENT_ORIGIN=http://localhost:3000
```

Do not upload your real `.env` file to GitHub.

## Production

Build the frontend:

```bash
npm run build
```

Then start the app:

```bash
npm start
```

For production, set:

```env
NODE_ENV=production
```

## Main Sections

### Transactions

Users can:
- Add income and expenses
- Edit transactions
- Delete transactions
- Search transactions
- Filter transactions
- Export transactions to CSV

### Budgets

Users can:
- Set a monthly budget for a category
- See how much money has been spent
- See when the budget is exceeded

### Recurring Transactions

Users can:
- Add weekly, monthly, or yearly recurring transactions
- Pause a recurring transaction
- Delete a recurring transaction

### SIP Planner

Users can:
- Enter monthly SIP amount
- Enter expected return
- Enter investment time
- See projected value
- Calculate the SIP needed for a goal

### Mutual Funds

Users can:
- Search for a mutual fund
- Enter invested amount
- Enter investment date
- Get the NAV from that date
- Calculate the number of units
- Get the latest NAV
- See current investment value
- See profit or loss

## Purpose

This project was built to practice and demonstrate full-stack web development using React, Node.js, Express, MongoDB, APIs, and authentication.