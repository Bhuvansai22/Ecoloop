# EcoLoop — B2B Circular Economy Resource Exchange Platform

A production-ready MERN stack platform connecting industries that generate waste materials with businesses that can reuse them.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Cloudinary account (optional — for image uploads)

### 1. Setup Backend
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Cloudinary keys
npm install
npm run dev
```
Server runs on **http://localhost:5000**

### 2. Setup Frontend
```bash
cd client
cp .env .env.local
# Edit VITE_GOOGLE_MAPS_API_KEY if you have one
npm install
npm run dev
```
Client runs on **http://localhost:5173**

---

## 🗂️ Project Structure

```
EcoLoop/
├── server/                    # Node.js + Express backend
│   ├── models/                # Mongoose schemas
│   │   ├── User.js            # User (buyer/seller/admin)
│   │   ├── Material.js        # Waste material listings
│   │   └── Transaction.js     # Deal transactions
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── materialController.js
│   │   └── transactionController.js
│   ├── routes/                # Express routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── materials.js
│   │   └── transactions.js
│   ├── middleware/
│   │   ├── auth.js            # JWT protect + role authorize
│   │   └── upload.js          # Multer + Cloudinary
│   ├── utils/
│   │   ├── carbonCalc.js      # CO2 savings calculator
│   │   └── geoUtils.js        # Haversine distance formula
│   └── server.js              # Entry point
│
└── client/                    # React + Vite + Tailwind CSS frontend
    └── src/
        ├── context/
        │   └── AuthContext.jsx # Global JWT auth state
        ├── services/
        │   ├── api.js          # Axios instance + interceptors
        │   └── index.js        # Material, transaction, user services
        ├── components/
        │   ├── Navbar.jsx
        │   ├── MaterialCard.jsx
        │   ├── FilterSidebar.jsx
        │   ├── TransactionCard.jsx
        │   ├── CarbonChart.jsx
        │   └── ProtectedRoute.jsx
        ├── pages/
        │   ├── HomePage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── MarketplacePage.jsx
        │   ├── MaterialDetailPage.jsx
        │   ├── MaterialFormPage.jsx
        │   ├── ProfilePage.jsx
        │   ├── CarbonDashboardPage.jsx
        │   └── AdminPage.jsx
        └── App.jsx
```

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register |
| POST | `/api/auth/login`    | Public | Login |
| GET  | `/api/auth/me`       | JWT   | Current user |
| GET  | `/api/users/profile` | JWT   | Get profile |
| PUT  | `/api/users/update`  | JWT   | Update profile |
| GET  | `/api/users/dashboard` | JWT | Dashboard stats |
| GET  | `/api/users/carbon`  | JWT   | Carbon data |
| GET  | `/api/materials`     | Public | List with filters |
| POST | `/api/materials`     | Seller | Create listing |
| GET  | `/api/materials/:id` | Public | Single listing |
| PUT  | `/api/materials/:id` | Seller | Update |
| DELETE | `/api/materials/:id` | Seller/Admin | Delete |
| GET  | `/api/materials/matches` | JWT | Smart matches |
| GET  | `/api/materials/my`  | Seller | Own listings |
| POST | `/api/transactions`  | Buyer  | Request deal |
| GET  | `/api/transactions`  | JWT   | My transactions |
| PATCH | `/api/transactions/:id/status` | JWT | Update status |
| GET  | `/api/users`         | Admin | All users |
| PATCH | `/api/users/:id/verify` | Admin | Toggle verify |

---

## 🔑 Environment Variables

### Server (`server/.env`)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
PORT=5000
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)
```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=...
```

---

## 🌱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS 3 |
| State | React Context API + Hooks |
| Forms | react-hook-form |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js, Express 5 |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Uploads | Multer + Cloudinary |
| Maps | @react-google-maps/api |

---

## 🌍 Carbon Calculation

CO₂ savings are calculated using industry-standard emission factors per material category (source: IPCC/EPA data). Formula:

```
carbonSaved (kg) = quantity (tonnes) × carbonFactor[category]
```

Example factors: Metal Scrap = 1800 kg/tonne, Plastics = 600 kg/tonne

---

Built for IEEE Academic Project — EcoLoop 2025
