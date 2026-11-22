# FixMate – Backend API

FixMate is a backend API for a home appliance and smart device repair service
platform. It provides RESTful APIs for customer bookings, technician services,
repair requests, user management, and secure payments.

## 🌐 Live API URL

**Backend URL:** https://fix-mate-server-pi.vercel.app

## 🔐 Admin Credentials

- **Email:** tarek@gmail.com
- **Password:** Tarek1122

## ✨ Key Features

### Authentication & Authorization

- Secure JWT-based authentication.
- Google OAuth integration with Better Auth.
- Role-based access control for Customer, Technician, and Admin.
- Protected API routes.

### User Management

- Get user profile.
- Update user information.
- Manage platform users.
- Admin user management.

### Service Management

- Create new repair services.
- Get all available services.
- Get service details by ID.
- Update and delete services.
- Manage service availability.
- Admin service management.

### Booking Management

- Create repair bookings.
- Get customer bookings.
- Get technician repair requests.
- Accept or reject repair requests.
- Start and complete repair services.
- Update booking status.
- Prevent conflicting confirmed bookings.

### Payment Integration

- Stripe Checkout integration.
- Create payment sessions.
- Verify payment status.
- Store transaction information.
- View payment history.

### Admin Features

- Manage users.
- Manage services.
- Manage bookings.
- Monitor transactions.
- Access platform statistics.

## 🛠️ Technology Stack

- Node.js
- Express.js
- MongoDB
- JWT
- Better Auth
- Stripe
- ImgBB

## 📦 NPM Packages Used

- `express`
- `mongodb`
- `cors`
- `dotenv`
- `jose`
- `better-auth`
- `stripe`
- `bcryptjs`

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone YOUR_BACKEND_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the Project

```bash
cd fixmate-server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Variables

Create a `.env` file in the root directory.

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string
DB_NAME=fixmate

JWT_SECRET=your_jwt_secret

STRIPE_SECRET_KEY=your_stripe_secret_key

IMGBB_API_KEY=your_imgbb_api_key

FRONTEND_URL=your_frontend_url
```

Add any additional environment variables required by your project.

### 5. Run Development Server

```bash
npm run dev
```

### 6. Run Production Server

```bash
npm start
```

## 📁 Project Structure

```text
fixmate-server/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── utils/
│   └── server.js
├── .env
├── package.json
└── README.md
```

## 👥 User Roles

| Role       | Responsibilities                                   |
| ---------- | -------------------------------------------------- |
| Customer   | Browse services, book repairs, and make payments   |
| Technician | Manage services and repair requests                |
| Admin      | Manage users, services, bookings, and transactions |

---

**FixMate – Making Home Repairs Simple, Reliable, and Hassle-Free.**
