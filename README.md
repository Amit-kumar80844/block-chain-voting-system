# Blockchain Voting System

A secure and transparent voting system inspired by blockchain concepts — built with **Node.js**, **Express**, and **MongoDB**. Includes voter registration, candidate management, one-person-one-vote enforcement, SHA-256 hash chaining, and a blockchain explorer/integrity verifier.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Project Structure](#-project-structure)
- [Setup & Installation](#-setup--installation)
- [Running the Project](#-running-the-project)
- [How to Use](#-how-to-use)
- [API Reference](#-api-reference)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

- **Admin Panel** — Register voters, add candidates, start/end election, view results
- **Voter Ballot** — Login with Voter ID, cast one vote, receive block-hash confirmation
- **Public Results** — Live vote tallies calculated from blockchain blocks (not a plain vote table)
- **Blockchain Explorer** — Browse every block, inspect hashes, verify chain integrity

---

## 🛠 Tech Stack

| Layer    | Technology                    |
|----------|-------------------------------|
| Backend  | Node.js, Express.js           |
| Database | MongoDB (local or Atlas)      |
| Frontend | Vanilla HTML + CSS + JS (static files served by Express) |
| Hashing  | SHA-256 (custom `utils/hash.js`) |

---

## 📦 Prerequisites

Make sure the following are installed on your machine:

1. **Node.js** v18 or later → [https://nodejs.org/en/download](https://nodejs.org/en/download)
2. **MongoDB** (choose **one** of these options):

   ### Option A — Local MongoDB (Recommended for beginners)
   - Download & install MongoDB Community Server → [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
   - After installation, ensure **MongoDB service is running** (see [Troubleshooting](#-troubleshooting))

   ### Option B — MongoDB Atlas (Cloud, free tier)
   - Create a free account at [https://cloud.mongodb.com](https://cloud.mongodb.com)
   - Create a **free M0 cluster**
   - Create a database user and whitelist your IP (`0.0.0.0/0` for open access)
   - Copy your **connection string** (looks like `mongodb+srv://user:pass@cluster.mongodb.net/`)

---

## 📁 Project Structure

```
blockchain-voting-system/
├── backend/
│   ├── .env                  ← Your environment variables (edit this)
│   ├── .env.example          ← Example env file
│   ├── server.js             ← Entry point
│   ├── app.js                ← Express app setup & routes
│   ├── config/
│   │   └── db.js             ← MongoDB connection
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── voterController.js
│   │   └── publicController.js
│   ├── models/
│   │   ├── Block.js
│   │   ├── Candidate.js
│   │   ├── Election.js
│   │   └── Voter.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── voterRoutes.js
│   │   └── publicRoutes.js
│   ├── services/
│   │   └── blockchainService.js  ← Core blockchain logic
│   └── utils/
│       └── hash.js               ← SHA-256 hashing utility
├── frontend/
│   ├── index.html            ← Home page
│   ├── admin.html            ← Admin panel
│   ├── vote.html             ← Voter ballot
│   ├── results.html          ← Public results
│   ├── blockchain.html       ← Blockchain explorer
│   ├── css/
│   └── js/
├── package.json
└── README.md
```

---

## ⚙️ Setup & Installation

### Step 1 — Clone or download the project

```bash
# If using Git:
git clone <your-repo-url>
cd blockchain-voting-system

# Or navigate to the project folder:
cd "c:\Users\amits\Downloads\Voting System\blockchain-voting-system"
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Configure environment variables

Open `backend/.env` and set your MongoDB connection URI:

```env
PORT=5000

# ── Option A: Local MongoDB ──────────────────────────
MONGO_URI=mongodb://127.0.0.1:27017/blockchain_voting_db

# ── Option B: MongoDB Atlas (replace with your URI) ──
# MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/blockchain_voting_db
```

> **Tip:** Comment out the line you're not using with a `#`.

---

## 🚀 Running the Project

### Start MongoDB first (if using local)

**On Windows (PowerShell as Administrator):**
```powershell
# Check if MongoDB service is running:
Get-Service -Name MongoDB

# Start it if it's stopped:
Start-Service -Name MongoDB
```

**Or start it manually:**
```powershell
& "C:\Program Files\MongoDB\Server\<version>\bin\mongod.exe" --dbpath "C:\data\db"
```
> Replace `<version>` with your installed MongoDB version (e.g., `7.0`). Make sure `C:\data\db` exists.

### Start the application

```powershell
# Production mode:
npm start

# Development mode (auto-restarts on file changes):
npm run dev
```

### Open in browser

```
http://localhost:5000
```

---

## 🗳 How to Use

Follow this workflow to run a complete election:

### 1. Admin Setup
Go to **[Admin Panel](http://localhost:5000/admin.html)**

- **Add Voters** — Enter a Voter ID (e.g., `V001`) and full name
- **Add Candidates** — Enter a Candidate ID (e.g., `C001`), name, and optional party
- **Start Election** — Click "Start Election" (requires at least 1 candidate)

### 2. Voting
Go to **[Vote Now](http://localhost:5000/vote.html)**

- Enter your Voter ID and select a candidate
- Submit — you'll receive a **block hash** as proof of your vote

### 3. View Results
Go to **[Results](http://localhost:5000/results.html)**

- See live vote counts calculated directly from the blockchain

### 4. Blockchain Explorer
Go to **[Blockchain](http://localhost:5000/blockchain.html)**

- Inspect each block's index, timestamp, hash, previous hash, and vote data
- Verify chain integrity

### 5. End Election
Go back to the **Admin Panel** and click **"End Election"**

---

## 📡 API Reference

### Admin Routes (`/api/admin`)

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | `/api/admin/voters`   | Add a new voter                |
| GET    | `/api/admin/voters`   | List all voters                |
| POST   | `/api/admin/candidates` | Add a new candidate           |
| GET    | `/api/admin/candidates` | List all candidates           |
| POST   | `/api/admin/election/start` | Start the election        |
| POST   | `/api/admin/election/end`   | End the election          |
| GET    | `/api/admin/results`  | Get results from blockchain    |

### Voter Routes (`/api/voter`)

| Method | Endpoint            | Description            |
|--------|---------------------|------------------------|
| POST   | `/api/voter/login`  | Voter login            |
| POST   | `/api/voter/vote`   | Cast a vote            |

### Public Routes (`/api/public`)

| Method | Endpoint                   | Description                   |
|--------|----------------------------|-------------------------------|
| GET    | `/api/public/candidates`   | Get candidate list            |
| GET    | `/api/public/results`      | Get public election results   |
| GET    | `/api/public/blockchain`   | Get blockchain data           |
| GET    | `/api/public/verify`       | Verify chain integrity        |
| GET    | `/api/public/election`     | Get election status           |

---

## 🔧 Troubleshooting

### ❌ Error: `MongoDB connection failed: bad auth: authentication failed`

Your `MONGO_URI` credentials are wrong.

**Fix A (Local MongoDB):** Switch to local:
```env
MONGO_URI=mongodb://127.0.0.1:27017/blockchain_voting_db
```

**Fix B (Atlas):** Go to [MongoDB Atlas](https://cloud.mongodb.com) → your cluster → **Connect** → copy the new URI. Paste it in `backend/.env`.

---

### ❌ Error: `MongoDB connection failed: ECONNREFUSED 127.0.0.1:27017`

Local MongoDB is not running.

**Fix:** Start it (PowerShell as Admin):
```powershell
Start-Service -Name MongoDB
```
If MongoDB is not installed, install it from [https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community).

---

### ❌ Error: `Cannot find module '...'`

Dependencies are not installed.

**Fix:**
```bash
npm install
```

---

### ❌ Error: `EADDRINUSE: address already in use :::5000`

Port 5000 is already occupied.

**Fix A:** Kill the process on port 5000:
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Fix B:** Change the port in `backend/.env`:
```env
PORT=3000
```

---

### ❌ Page loads but API calls fail (network errors in browser console)

Make sure the backend server is running (`npm start`). The frontend is served as **static files by Express** — no separate web server needed.

---

### ❌ `npm run dev` not found / nodemon error

Install devDependencies:
```bash
npm install --save-dev nodemon
```

---

## 📄 License

MIT — free to use and modify for educational purposes.
