<div align="center">

# ⚡ InterviewIQ.AI

### **Production-Grade AI Mock Interview & Real-Time Peer Collaborative Coding Platform**

[![Live Demo](https://img.shields.io/badge/LIVE%20DEMO-interviewiq--tb6d.onrender.com-00C7B7?style=for-the-badge&logo=render&logoColor=white)](https://interviewiq-tb6d.onrender.com)
[![Go Version](https://img.shields.io/badge/Go-1.23%2B-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![React Version](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas%20Ready-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Docker](https://img.shields.io/badge/Docker-Single--Container-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

**[🌐 Launch Live Application](https://interviewiq-tb6d.onrender.com)** • **[📸 Product Showcase](#-product-showcase)** • **[🚀 Key Capabilities](#-key-capabilities)** • **[🏛 System Architecture](#-system-architecture)** • **[⚡ Quick Start](#-quick-start)** • **[📡 API Specs](#-api--websocket-reference)**

<br/>

<a href="https://interviewiq-tb6d.onrender.com">
  <img src="docs/screenshots/hero-landing.png" alt="InterviewIQ Landing Page" width="100%" style="border-radius: 12px; box-shadow: 0 12px 35px rgba(0,0,0,0.18);" />
</a>

<br/>

**InterviewIQ** is an end-to-end, FAANG-caliber interview readiness suite. It combines intelligent, dynamic LLM-driven mock interviews with live anti-cheat camera proctoring, multi-modal answer inputs (speech-to-text / text), real-time peer collaborative coding with WebRTC video, and comprehensive performance scorecards.

</div>

---

## 📸 Product Showcase

<div align="center">

### 1. 🎯 Personalized Interview Setup & Resume Context
*Customize target job role, experience level, and interview focus. Upload PDF resumes for automatic background and stack extraction.*

<img src="docs/screenshots/interview-setup.png" alt="Interview Setup Screen" width="90%" style="border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.12);" />

<br/><br/>

### 2. 🤖 Live AI Mock Interview Studio with Real-Time Proctoring
*Interactive AI interviewer avatar, live speech-to-text voice answer recording, per-question countdown timers, and in-browser camera anti-cheat integrity tracking (detecting tab switches, face presence, and window blur).*

<img src="docs/screenshots/live-interview-anti-cheat.png" alt="Live AI Mock Interview Studio with Camera Proctoring" width="90%" style="border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.12);" />

<br/><br/>

### 3. ⚡ Advanced AI Capabilities
*Dynamic question progression, multi-factor evaluation (Correctness, Technical Communication, Confidence), automated PDF scorecards, and historical progress tracking.*

<img src="docs/screenshots/ai-capabilities.png" alt="Advanced AI Capabilities" width="90%" style="border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.12);" />

<br/><br/>

### 4. 🔥 Versatile Interview Modes
*From Technical Deep-Dives to HR Behavioral evaluation, Tone & Confidence detection, and Peer Collaborative Coding rooms.*

<img src="docs/screenshots/interview-modes.png" alt="Multiple Interview Modes" width="90%" style="border-radius: 10px; box-shadow: 0 8px 25px rgba(0,0,0,0.12);" />

</div>

---

## 🚀 Key Capabilities

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
- **Resilient MongoDB Driver**: Auto-reconnecting connection pool with non-blocking graceful fallback.

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
        APIRoutes -->|Data Persistence| MongoCluster[("MongoDB Atlas Database")]
        APIRoutes -->|Payment Validation| Razorpay["Razorpay Gateway"]
        User <-->|P2P Audio / Video| WebRTC["WebRTC Mesh Connection"]
        User -->|OAuth Sign-In| Firebase["Firebase Google Auth"]
    end
```

---

## 🛠 Tech Stack

| Domain | Technology | Description |
|---|---|---|
| **Live Production** | [Render](https://render.com) | Unified Docker web service (`https://interviewiq-tb6d.onrender.com`) |
| **Frontend Framework** | React 19 (Vite) | High-speed component rendering, modern hooks, zero-lag UI |
| **Styling** | TailwindCSS v4 | Modern responsive glassmorphism and theme engine |
| **State Management** | Redux Toolkit | Predictable centralized application state |
| **Real-Time Gateway** | WebSockets (Gorilla/Native) | Bidirectional room broadcast and peer synchronization |
| **Backend API** | Go (Golang 1.23+) | High-concurrency, memory-safe compiled backend |
| **Database** | MongoDB 7.0 / Atlas | Document store for users, peer rooms, reports, and payments |
| **AI Engine** | OpenRouter (LLMs) | Dynamic question synthesis and multi-factor evaluation |
| **Authentication** | Firebase Auth + JWT | Google OAuth + HttpOnly secure cookie sessions |
| **Payments** | Razorpay API | Secure payment checkout and cryptographic verification |
| **Containerization** | Docker & Docker Compose | Multi-stage, minimal footprint Alpine Linux runtime |

---

## 📁 Repository Structure

```text
├── docs/screenshots/           # High-resolution production application previews
├── client/                     # React 19 Frontend SPA (Vite + TailwindCSS v4)
│   ├── src/
│   │   ├── components/         # Reusable UI elements (Navbar, Modals, Editor, Timer)
│   │   ├── hooks/              # Custom hooks (useRoomSocket, WebRTC handlers, useProctoring)
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
│   │   ├── db/                 # Resilient MongoDB Atlas connection & auto-retry pool
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
├── railway.json                # 1-Click Railway deployment configuration
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

### Live Deployment on Render (Current Production)

The application is deployed and live at:  
👉 **`https://interviewiq-tb6d.onrender.com`**

To deploy your own instance using the included Blueprint:

1. Navigate to **[dashboard.render.com](https://dashboard.render.com/blueprint/new?repo=https://github.com/Shivampal157/interviewiq)**.
2. Connect your GitHub repository (`Shivampal157/interviewiq`).
3. Set your environment variables:
   - `MONGODB_URL`: Your MongoDB Atlas connection string.
   - `OPENROUTER_API_KEY`: Your OpenRouter API key.
4. Click **Deploy Blueprint** — Render will build the unified multi-stage Docker container and go live in ~2 minutes.
5. In **Firebase Console** -> **Authentication** -> **Settings** -> **Authorized domains**, add your `.onrender.com` domain.

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
| `GET` | `/health` | Service health probe & database connection status | ❌ |

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

⭐ If you found this project helpful, please consider giving it a star on [GitHub](https://github.com/Shivampal157/interviewiq)!

</div>
