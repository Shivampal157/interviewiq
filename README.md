<div align="center">

# ⚡ InterviewIQ.AI

### **Production-Grade AI Mock Interview & Real-Time Peer Collaborative Coding Platform**

[![Go Version](https://img.shields.io/badge/Go-1.23%2B-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![React Version](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Real--Time-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)](https://railway.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

**InterviewIQ** is an end-to-end, FAANG-caliber technical interview readiness suite. It pairs intelligent, dynamic LLM-driven mock interviews with a high-performance, real-time collaborative peer coding environment equipped with live WebRTC video, synchronized code editing, in-room multi-language sandbox execution, anti-cheat monitoring, and deep analytical performance reports.

[Explore Features](#-key-features) • [System Architecture](#-system-architecture) • [Quick Start](#-quick-start) • [Deployment Guide](#-production-deployment) • [API Specs](#-api--websocket-reference)

</div>

---

## 🚀 Key Features

### 🤖 1. AI Mock Interview Simulator
- **Resume-Driven Context**: Upload PDF resumes to automatically extract technical background, project history, and tech stack proficiencies.
- **Dynamic Question Generation**: Generates customized behavioral, system design, and data structure/algorithm questions matching target seniority levels.
- **Multi-Modal Answer Submission**: Real-time voice speech-to-text recording or manual text input with dynamic countdown timers.
- **Granular AI Scoring & Feedback**: Instant category-wise scoring across Problem Solving, Technical Communication, Code Quality, and Behavioral Fit.
- **Comprehensive PDF Reports**: Export high-resolution graphical interview performance dossiers with radar charts via `jsPDF`.

### 👥 2. Real-Time Collaborative Peer Coding Rooms
- **Bidirectional WebSocket Sync**: Sub-5ms synchronized typing, state reconciliation, and room presence powered by a custom Go WebSocket Hub.
- **Live Video & Audio Streaming**: WebRTC peer-to-peer audio/video calling directly in the interview canvas.
- **Multi-Language Sandbox Code Runner**: Instant server-side compilation & execution for **JavaScript**, **Python**, **Java**, and **C++**.
- **Anti-Cheat & Proctoring Engine**: Automatic detection and real-time logging of tab switches, window blur events, and full-screen exits.

### ⚡ 3. Ultra-Fast Go Backend Architecture
- **Sub-Millisecond Response Times**: Native Go standard library HTTP routing with lightweight concurrency primitives (`goroutines` + channels).
- **Hardened Authentication**: Stateless JWT session tokens securely delivered via `HttpOnly`, `SameSite=Lax`, and SSL-enforced cookies.
- **Resilient MongoDB Driver**: High-throughput indexing and connection pooling.

### 💳 4. Flexible Credits & Monetization
- **Tier-Based Credit System**: Basic and Pro interview preparation bundles.
- **Razorpay Checkout Integration**: End-to-end automated payment ordering, client SDK integration, and cryptographically verified HMAC-SHA256 webhooks.

### 📦 5. Unified Single-Container Production Build
- Multi-stage Docker container serving both the built React SPA and high-throughput Go API from a single port (`8000`), completely eliminating cross-origin cookie and CORS issues across Safari, Brave, and Chrome.

---

## 🏛 System Architecture

```mermaid
graph TD
    User["Candidate / Peer Browser"] -->|HTTPS / WSS| Ingress["Production Single-Container (Port 8000)"]
    
    subgraph "InterviewIQ Container"
        Ingress -->|Static Routes /*| SPAServer["Go Static SPA Handler (React Dist)"]
        Ingress -->|/api/*| APIRoutes["Go REST API Gateway"]
        Ingress -->|/ws| WSHub["Goroutine WebSocket Hub"]
        
        APIRoutes --> AuthModule["JWT / Google OAuth"]
        APIRoutes --> SandboxRunner["In-Container Sandbox Runner (Node / Python / Remote Compilers)"]
    end
    
    subgraph "External Cloud Services"
        APIRoutes -->|Prompts & Evaluation| OpenRouter["OpenRouter AI (LLM Engine)"]
        APIRoutes -->|Data Persistence| MongoCluster[("MongoDB Database")]
        APIRoutes -->|Payment Validation| Razorpay["Razorpay Gateway"]
        User <-->|P2P Audio / Video| WebRTC["WebRTC Mesh Connection"]
        User -->|OAuth Sign-In| Firebase["Firebase Google Auth"]
    end
```

---

## 🛠 Tech Stack

| Domain | Technology | Description |
|---|---|---|
| **Frontend Framework** | React 19 (Vite) | High-speed component rendering, modern hooks, zero-lag UI |
| **Styling** | TailwindCSS v4 | Modern responsive glassmorphism and theme engine |
| **State Management** | Redux Toolkit | Predictable centralized application state |
| **Real-Time Gateway** | WebSockets (Gorilla/Native) | Bidirectional room broadcast and peer synchronization |
| **Backend API** | Go (Golang 1.23+) | High-concurrency, memory-safe compiled backend |
| **Database** | MongoDB 7.0 | Document store for users, peer rooms, reports, and payments |
| **AI Engine** | OpenRouter (LLMs) | Dynamic question synthesis and multi-factor evaluation |
| **Authentication** | Firebase Auth + JWT | Google OAuth + HttpOnly secure cookie sessions |
| **Payments** | Razorpay API | Secure payment checkout and cryptographic verification |
| **Containerization** | Docker & Docker Compose | Multi-stage, minimal footprint Alpine Linux runtime |

---

## 📁 Repository Structure

```text
├── client/                     # React 19 Frontend SPA (Vite + TailwindCSS v4)
│   ├── src/
│   │   ├── components/         # Reusable UI elements (Navbar, Modals, Editor)
│   │   ├── hooks/              # Custom hooks (useRoomSocket, WebRTC handlers)
│   │   ├── pages/              # Primary application routes
│   │   │   ├── Home.jsx        # Landing page & feature showcase
│   │   │   ├── Auth.jsx        # Google sign-in & onboarding
│   │   │   ├── InterviewPage.jsx # AI mock interview studio
│   │   │   ├── InterviewReport.jsx # Analytical score reports & PDF export
│   │   │   ├── PeerInterviews.jsx  # Collaborative lobby & room generation
│   │   │   ├── PeerRoom.jsx    # Split-screen editor, video, and code runner
│   │   │   └── Pricing.jsx     # Subscription & interview credit plans
│   │   └── utils/              # Firebase configuration, API clients, helpers
│   ├── package.json
│   └── vite.config.js
│
├── server-go/                  # High-Performance Go Backend Engine
│   ├── internal/
│   │   ├── auth/               # JWT creation, cookie dispatch, token parsing
│   │   ├── config/             # Environment configuration loader
│   │   ├── db/                 # MongoDB connection & index pool
│   │   ├── handlers/           # HTTP controllers (Auth, AI, Peer, Payment)
│   │   ├── httpx/              # HTTP middleware, CORS, JSON context wrappers
│   │   ├── models/             # Domain entities (User, Interview, Room, Payment)
│   │   ├── realtime/           # Thread-safe WebSocket room hub & broadcasting
│   │   └── services/           # AI extraction, Razorpay order/verification, PDF parser
│   ├── go.mod
│   ├── go.sum
│   └── main.go                 # Server entrypoint & SPA file server
│
├── Dockerfile                  # Production multi-stage build (Client + Go API)
├── docker-compose.yml          # Local containerized MongoDB service
├── render.yaml                 # One-click Render Blueprint definition
├── start.ps1                   # One-click development bootstrap script
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- **Go**: `1.23+` installed ([Download Go](https://go.dev/dl/))
- **Node.js**: `v20+` & `npm` ([Download Node.js](https://nodejs.org/))
- **Docker Desktop** or local **MongoDB**: `7.0+`

---

### Option A: One-Command Bootstrap (Windows PowerShell)

Run the included automated startup script:

```powershell
.\start.ps1
```
*This launches MongoDB in Docker, starts the Go backend on port 8000, and spins up the Vite development server on port 5173.*

---

### Option B: Manual Step-by-Step Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Shivampal157/interviewiq.git
cd interviewiq
```

#### 2. Start Local MongoDB
```bash
docker compose up -d
```
*(Runs MongoDB mapped to port `27018`).*

#### 3. Configure Backend Environment
Copy the example environment configuration into `server-go/.env`:

```bash
cp server-go/.env.example server-go/.env
```

Edit `server-go/.env`:
```env
PORT=8000
MONGODB_URL=mongodb://127.0.0.1:27018/interviewiq
JWT_SECRET=your-secure-random-jwt-secret-string
CLIENT_URL=http://localhost:5173
OPENROUTER_API_KEY=your-openrouter-api-key
RAZORPAY_KEY_ID=optional-razorpay-key
RAZORPAY_KEY_SECRET=optional-razorpay-secret
```

#### 4. Run the Go API
```bash
cd server-go
go run .
```
Backend will be listening at **`http://localhost:8000`**.

#### 5. Run the React Client
In a separate terminal:
```bash
cd client
npm install
npm run dev
```
Frontend will be running at **`http://localhost:5173`**.

---

## 🌐 Production Deployment

### Strategy 1: Railway (Recommended — 1-Click MongoDB Included)

1. Navigate to [railway.com](https://railway.com/) and click **"New Project"**.
2. Select **"Deploy from GitHub repo"** and connect **`Shivampal157/interviewiq`**.
3. In the canvas, click **"+ New"** -> **"Database"** -> **"Add MongoDB"**.
4. In your `interviewiq` service **Variables** tab, set:
   - `MONGODB_URL`: `${{MongoDB.MONGO_URL}}`
   - `OPENROUTER_API_KEY`: `your-openrouter-api-key`
   - `JWT_SECRET`: `your-strong-jwt-secret`
   - `CLIENT_URL`: `https://${{RAILWAY_PUBLIC_DOMAIN}}`
5. Under **Settings** -> **Networking**, click **"Generate Domain"**.
6. Hit **Apply** — your production application is live!

---

### Strategy 2: Render (Blueprint Automation)

This repository includes a native [render.yaml](render.yaml) blueprint:

1. Go to [dashboard.render.com](https://dashboard.render.com/) and click **"New +"** -> **"Blueprint"**.
2. Select **`Shivampal157/interviewiq`**.
3. Fill in your environment secrets (`MONGODB_URL`, `OPENROUTER_API_KEY`, `CLIENT_URL`).
4. Click **Apply** to deploy the Docker container.

---

### Strategy 3: Self-Hosted Docker Container

To package and run the self-contained single image anywhere:

```bash
# Build the production image
docker build -t interviewiq:latest .

# Run container on port 8000
docker run -d \
  -p 8000:8000 \
  -e PORT=8000 \
  -e MONGODB_URL="mongodb+srv://user:pass@cluster.mongodb.net/interviewiq" \
  -e JWT_SECRET="your-jwt-secret" \
  -e OPENROUTER_API_KEY="your-openrouter-key" \
  --name interviewiq \
  interviewiq:latest
```

---

## 🔐 Google OAuth Configuration (Firebase)

To enable Google Sign-In across your production URLs:
1. Open the [Firebase Console](https://console.firebase.google.com/) -> Select **`interviewiq-3746a`**.
2. Navigate to **Authentication** -> **Settings** tab -> **Authorized domains**.
3. Click **Add Domain** and register your deployed domain (e.g., `your-app.up.railway.app` or `your-app.onrender.com`).

---

## 📡 API & WebSocket Reference

### REST Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/google` | Verify Google ID token & generate HTTP-only session cookie | ❌ |
| `GET` | `/api/auth/logout` | Clear authenticated session cookies | ❌ |
| `GET` | `/api/user/current-user` | Fetch authenticated user profile & remaining credits | ✅ |
| `POST` | `/api/interview/resume` | Upload & parse candidate resume PDF | ✅ |
| `POST` | `/api/interview/generate-questions`| Generate tailored AI interview questions | ✅ |
| `POST` | `/api/interview/submit-answer` | Submit candidate answer for real-time scoring | ✅ |
| `POST` | `/api/interview/finish` | Finalize interview & generate comprehensive feedback report | ✅ |
| `GET` | `/api/interview/get-interview` | Retrieve candidate interview history | ✅ |
| `GET` | `/api/interview/report/{id}` | Retrieve specific detailed interview scorecard | ✅ |
| `POST` | `/api/peer/create` | Create a synchronized peer interview room | ✅ |
| `GET` | `/api/peer/{code}` | Retrieve room metadata & active participant status | ✅ |
| `POST` | `/api/peer/{code}/run` | Execute code against sandbox runner (JS, Python, Java, C++) | ✅ |
| `POST` | `/api/payment/order` | Initialize Razorpay payment order for credits | ✅ |
| `POST` | `/api/payment/verify` | Cryptographically verify HMAC payment signature | ✅ |
| `GET` | `/health` | Service health probe & engine verification | ❌ |

### Real-Time WebSocket Protocol (`/ws`)

Clients authenticate and join collaborative rooms over WebSocket with standard payloads:

```json
// Example: Code Synchronization Broadcast
{
  "type": "code-update",
  "room": "ROOM_CODE",
  "payload": {
    "code": "function twoSum(nums, target) { ... }",
    "language": "javascript",
    "cursor": { "line": 12, "ch": 4 }
  }
}
```

```json
// Example: Anti-Cheat Tab-Switch Event
{
  "type": "anti-cheat-alert",
  "room": "ROOM_CODE",
  "payload": {
    "event": "tab_switch_detected",
    "timestamp": 1729601400000
  }
}
```

---

## 🤝 Contributing

Contributions make the open-source community an incredible place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">

Developed with ❤️ by **[Shivam Pal](https://github.com/Shivampal157)**

⭐ If you found this project helpful, please consider giving it a star on GitHub!

</div>
