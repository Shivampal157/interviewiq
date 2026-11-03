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

**[🌐 Visit Live Application](https://interviewiq-tb6d.onrender.com)** • **[📸 Visual Tour](#-visual-tour)** • **[🚀 Key Features](#-key-features)** • **[🏛 Architecture](#-system-architecture)** • **[⚡ Quick Start](#-quick-start)** • **[📡 API & WebSocket Reference](#-api--websocket-reference)**

<br/>

<a href="https://interviewiq-tb6d.onrender.com">
  <img src="client/src/assets/img1.png" alt="InterviewIQ.AI Platform Preview" width="100%" style="border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.25);" />
</a>

<br/>

**InterviewIQ** is an end-to-end, FAANG-caliber technical interview readiness platform. It pairs intelligent, dynamic LLM-driven mock interviews with a high-performance, real-time collaborative peer coding canvas equipped with live WebRTC video, synchronized code editing, in-room multi-language sandbox execution, anti-cheat monitoring, and deep analytical performance reports.

</div>

---

## 📸 Visual Tour

<div align="center">

### 1. 🤖 AI Mock Interview Studio (Technical & Behavioral)
*Resume-aware dynamic question generation with speech-to-text recording, live timer countdowns, and real-time response evaluation.*

| Technical Role Assessment | HR & Behavioral Assessment |
|:---:|:---:|
| <img src="client/src/assets/tech.png" width="450" alt="Technical Interview Mode" /> | <img src="client/src/assets/HR.png" width="450" alt="HR Interview Mode" /> |

<br/>

### 2. 👥 Real-Time Peer Collaborative Coding Canvas
*Sub-5ms synchronized typing, WebRTC peer-to-peer video/audio calling, instant code runner (JavaScript, Python, Java, C++), and anti-cheat tab-switch detection.*

<img src="client/src/assets/MM.png" width="850" alt="Peer Collaborative Coding & Video Studio" style="border-radius: 8px;" />

<br/>

### 3. 📊 AI Evaluation & Real-Time Performance Feedback
*Granular category scoring across Problem Solving, Technical Communication, Correctness, and Speech Confidence.*

| AI Instant Scoring & Feedback | Multi-Factor Confidence Radar |
|:---:|:---:|
| <img src="client/src/assets/ai-ans.png" width="450" alt="AI Answer Scoring" /> | <img src="client/src/assets/confi.png" width="450" alt="Confidence & Metrics" /> |

<br/>

### 4. 📄 Deep Performance Dossier & 1-Click PDF Export
*Historical analytical breakdown of every interview round with comprehensive feedback and exportable high-resolution PDF dossiers.*

| Historical Performance Tracker | 1-Click Printable PDF Dossier |
|:---:|:---:|
| <img src="client/src/assets/history.png" width="450" alt="Interview History Dashboard" /> | <img src="client/src/assets/pdf.png" width="450" alt="PDF Scorecard Export" /> |

<br/>

### 5. 📑 PDF Resume Context & Credit Economy
*Automated PDF resume text extraction to seed personalized interview questions, backed by a flexible credit bundle system.*

| In-Browser Resume Ingestion | Interview Credits & Monetization |
|:---:|:---:|
| <img src="client/src/assets/resume.png" width="450" alt="Resume Parser" /> | <img src="client/src/assets/credit.png" width="450" alt="Credit System" /> |

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
- **Resilient MongoDB Driver**: Auto-reconnect pooling with non-blocking graceful fallback.

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

The repository is live at:  
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
