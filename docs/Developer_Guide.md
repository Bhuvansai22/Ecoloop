# EcoLoop Developer Guide

Welcome to the EcoLoop developer documentation! This guide provides the necessary information to set up, understand, and contribute to the EcoLoop platform.

## 1. System Requirements
- **Node.js**: v18.x or higher
- **MongoDB**: Local instance or MongoDB Atlas cluster
- **Package Manager**: npm or yarn

## 2. Project Setup

### 2.1 Repository Structure
The project is a standard Monorepo containing a Vite-based React frontend and an Express.js backend.
```text
EcoLoop/
├── client/          # React Frontend (Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # Global state (AuthContext, SocketContext)
│   │   ├── pages/       # Route components
│   │   ├── services/    # Axios API wrappers
│   │   └── utils/       # Helper functions
│   └── .env             # Frontend environment variables
├── server/          # Node.js/Express Backend
│   ├── controllers/     # Business logic
│   ├── middleware/      # Express middleware (Auth, Upload, Error handling)
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express API routers
│   ├── utils/           # Helper functions (Carbon Calc, Geo Utils)
│   └── .env             # Backend environment variables
└── docs/            # Project documentation
```

### 2.2 Environment Configuration

**Backend (`server/.env`)**
Create a `.env` file in the `server` directory:
```env
PORT=5001
MONGODB_URI=mongodb://your_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Cloudinary Configuration (Required for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend (`client/.env`)**
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5001/api
VITE_GOOGLE_MAPS_API_KEY=optional_maps_key
```

### 2.3 Installation & Execution
Open two terminal instances.

**Terminal 1: Backend**
```bash
cd server
npm install
npm start
```
*The server will start on port 5001.*

**Terminal 2: Frontend**
```bash
cd client
npm install
npm run dev
```
*The client will start on port 5173.*

## 3. Architecture Overview

### 3.1 Data Models (Mongoose)
- **User**: Stores authentication details, roles (`buyer`, `seller`, `admin`), and profile data.
- **Material**: Represents a waste listing. Contains details like category, quantity, price, images, and auction details.
- **Bid**: Represents an offer made by a buyer on an auction material.
- **Transaction**: Created when a bid is accepted or a direct purchase is finalized. Tracks status and carbon savings.
- **Message**: Stores chat history between users.

### 3.2 Authentication & Authorization (RBAC)
Authentication is handled via JWT. The token is stored in `localStorage` on the client and passed in the `Authorization: Bearer <token>` header.
Role-Based Access Control is enforced using the `authorize('role')` middleware in Express.
- **Sellers**: Can create/edit materials, accept bids, manage transactions.
- **Buyers**: Can browse materials, place bids, request deals.

### 3.3 Real-Time Infrastructure (Socket.io)
Socket.io is used for instant messaging and live bidding.
- **Global Connection**: The client connects and joins a personalized room (`joinUser`) immediately upon authentication in `SocketContext`. This ensures messages are received regardless of the current page.
- **Events**:
  - `receiveMessage`: Emitted by server when a new chat message arrives.
  - `newBid`: Broadcasted to users viewing a specific material when a bid is placed.
  - `bidAccepted`: Emitted to a buyer when their bid is finalized.

## 4. Key API Endpoints

### Auth
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Authenticate and receive JWT.
- `GET /api/auth/me`: Get current user based on JWT.

### Materials
- `GET /api/materials`: Fetch active listings (supports filtering/pagination).
- `GET /api/materials/:id`: Fetch specific material details.
- `POST /api/materials/:id/view`: Increment view count (deduplicated by IP).
- `POST /api/materials`: Create a new listing (Seller only).
- `POST /api/materials/:id/bid`: Place a bid on an auction.
- `POST /api/materials/:id/accept-bid`: Accept a winning bid (Seller only).

### Transactions
- `GET /api/transactions`: Get user's transactions.
- `PATCH /api/transactions/:id/status`: Update transaction status (Seller only).

### Messages
- `GET /api/messages/conversations/list`: Get active chat contacts.
- `GET /api/messages/:userId`: Get chat history with specific user.
- `POST /api/messages`: Send a message.

## 5. Production Deployment Guidelines

1. **Database**: Use a managed database like MongoDB Atlas.
2. **Backend**: Deploy the `server` directory to services like Render, Heroku, or AWS EC2.
   - Ensure environment variables are securely set.
   - Set `CLIENT_URL` to your production frontend URL to avoid CORS errors.
3. **Frontend**: Deploy the `client` directory to Vercel or Netlify.
   - Ensure `VITE_API_URL` points to your production backend URL.
4. **Assets**: Ensure Cloudinary credentials in the production backend environment are valid, as local filesystem uploads are not persistent on cloud platforms like Render/Heroku.
