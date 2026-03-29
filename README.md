<div align="center">

# ⬡ FinGuard
### Real-Time Fraud Intelligence Platform

[![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Live_Feed-FF6B6B?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

**A production-grade, full-stack fraud detection system with a cinematic dark-terminal UI, ML-powered risk scoring, and sub-5ms inference latency - built end-to-end with Java Spring Boot and Next.js.**

[Live Demo](#) · [Architecture](#architecture) · [Getting Started](#getting-started) · [API Reference](#api-reference)

</div>

---

## ✨ Features

### 🎨 Frontend
- **Cinematic terminal UI** - custom typography (Bebas Neue + Share Tech Mono), glow effects, and animated micro-interactions throughout
- **Live transaction ticker** - streaming feed in the header, auto-scrolling
- **Animated SVG fraud gauge** - smooth needle animation tracking the system's composite risk index in real time
- **Geo risk heatmap** - country-level fraud intensity grid updated as transactions arrive
- **WebSocket-powered feed** - zero-polling, push-based live data from the backend
- **Transaction detail modal** - full forensic breakdown with Block / Approve actions
- **Graceful degradation** - runs standalone with realistic mock data if backend is offline

### ⚙️ Backend — Special Feature: Multi-Factor Fraud Scoring Engine
The core of FinGuard is a custom in-memory ML inference engine (`FraudScoringEngine.java`) that scores every transaction across **4 detection mechanisms**, all completing in under **5ms**:

| Mechanism | Description |
|---|---|
| 🧮 **Isolation Forest (Amount)** | Log-normal distribution fit on typical e-commerce amounts. Computes a 0–1 outlier score using sigmoid normalization. |
| 🔄 **Velocity Tracking** | Sliding 1-hour window per card using `ConcurrentHashMap` + `CopyOnWriteArrayList`. Flags burst patterns (>5, >8 transactions/hr). |
| 🌍 **Geo-Velocity (Impossible Travel)** | Haversine formula detects if a card appears in two locations physically impossible to travel between in the elapsed time (threshold: >900 km/h). |
| 🔒 **VPN / Proxy Detection** | Known VPN ASN prefix matching with extensible ruleset (production: plug in MaxMind GeoIP). |

Additional weighted features: high-risk merchant categories, high-risk country codes, off-hours detection, cross-border high-value transactions.

### 🔌 Real-Time WebSocket Feed
Spring's `WebSocketHandler` broadcasts a newly scored transaction every 1.5 seconds to all connected dashboard clients - no polling, zero latency overhead.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                      │
│                                                         │
│  ┌──────────────┐   WebSocket     ┌─────────────────┐  │
│  │  Next.js 14  │◄───────────────►│  Spring Boot    │  │
│  │  Dashboard   │   REST (HTTP)   │  Backend        │  │
│  │              │◄───────────────►│                 │  │
│  └──────────────┘                 └────────┬────────┘  │
│                                            │            │
│                              ┌─────────────▼──────────┐ │
│                              │  FraudScoringEngine    │ │
│                              │  ├─ Isolation Forest   │ │
│                              │  ├─ Velocity Tracker   │ │
│                              │  ├─ Geo-Velocity Check │ │
│                              │  └─ VPN Detection      │ │
│                              └────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router) |
| UI Library | React 18 + TypeScript |
| Styling | CSS-in-JS (inline styles with CSS variables) |
| Visualizations | Custom SVG (no chart library dependency) |
| Real-Time | Native WebSocket API |
| Backend Framework | Spring Boot 3.2 |
| Language | Java 17 |
| Security | Spring Security (CORS, CSRF, endpoint guards) |
| Real-Time | Spring WebSocket (`TextWebSocketHandler`) |
| ML Inference | Custom in-memory engine (no external ML deps) |
| Scheduling | Spring `@Scheduled` |
| Build | Maven |
| Containerization | Docker + Docker Compose |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Java 17+
- Maven 3.9+
- Docker + Docker Compose (optional)

### Option A : Docker (Recommended, one command)

```bash
git clone https://github.com/YOUR_USERNAME/finguard.git
cd finguard
docker-compose up --build
```

Then open **http://localhost:3000** 🎉

### Option B : Run Locally

**Backend:**
```bash
cd backend
./mvnw spring-boot:run
# API available at http://localhost:8080
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
# Dashboard at http://localhost:3000
```

> **Note:** The frontend works fully standalone without the backend, it falls back to a realistic mock data generator automatically. This makes it easy to showcase on GitHub Pages or Vercel.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions/history?limit=50` | Recent transaction history |
| `POST` | `/api/transactions/score` | Score an incoming transaction |
| `POST` | `/api/transactions/generate` | Generate a synthetic scored transaction |
| `GET` | `/api/transactions/stats` | System-wide fraud statistics |
| `GET` | `/actuator/health` | Backend health check |
| `WS` | `ws://localhost:8080/ws/transactions` | Live transaction stream |

### POST `/api/transactions/score` - Example

```json
// Request
{
  "id": "TXN-9001",
  "amount": 4850.00,
  "merchant": "Crypto Exchange",
  "merchantCategory": "Crypto",
  "cardLast4": "4242",
  "country": "RU",
  "city": "Moscow",
  "ipAddress": "185.220.101.45",
  "deviceFingerprint": "A1B2C3D4E5",
  "lat": 55.75,
  "lng": 37.6,
  "timestamp": "2025-01-15T02:34:00Z"
}

// Response
{
  "id": "TXN-9001",
  "riskScore": 91,
  "status": "blocked",
  "riskFactors": [
    "High-risk merchant category",
    "Elevated-risk country",
    "VPN/Proxy detected",
    "Off-hours transaction"
  ],
  "isVpn": true,
  "velocityCount": 1,
  "anomalyType": "High-risk merchant category"
}
```

---

## 🧪 Testing

```bash
cd backend
./mvnw test
```

Tests cover:
- Low-risk baseline scoring
- High-risk merchant + amount combinations
- VPN detection from known IP prefixes
- Velocity threshold enforcement
- Score bounds validation (always 0–99)
- Status assignment logic

---

## 📂 Project Structure

```
finguard/
├── docker-compose.yml
│
├── frontend/                        # Next.js 14 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx             # Main dashboard
│   │   ├── components/
│   │   │   ├── AlertPanel.tsx       # Live fraud alerts
│   │   │   ├── FraudScoreGauge.tsx  # Animated SVG gauge
│   │   │   ├── MetricCard.tsx       # KPI stat cards
│   │   │   ├── RiskHeatmap.tsx      # Geo risk grid
│   │   │   ├── TransactionFeed.tsx  # Live feed table
│   │   │   └── TransactionModal.tsx # Detail modal
│   │   ├── lib/
│   │   │   └── mockData.ts          # Standalone mock generator
│   │   └── types/
│   │       └── index.ts
│   ├── Dockerfile
│   └── package.json
│
└── backend/                         # Spring Boot App
    └── src/main/java/com/finguard/
        ├── FinGuardApplication.java
        ├── config/
        │   ├── SecurityConfig.java
        │   └── WebSocketConfig.java
        ├── controller/
        │   └── TransactionController.java
        ├── ml/
        │   └── FraudScoringEngine.java  # ⭐ Core ML engine
        ├── model/
        │   └── Transaction.java
        ├── service/
        │   └── TransactionService.java
        └── websocket/
            └── TransactionWebSocketHandler.java
```

---

## 💡 Key Engineering Decisions

**Why in-memory ML instead of an external model?**
For a dashboard that needs sub-5ms scoring at high throughput, calling an external Python ML service would add 20–100ms of network latency per transaction. The scoring engine is deliberately co-located with the transaction service for zero-latency inference, a pattern used in real-time fraud systems at scale (Stripe, PayPal).

**Why WebSocket over polling?**
Polling at 1-second intervals would generate ~86,400 HTTP requests per client per day. WebSocket maintains a single persistent connection, reducing server load by ~99% while delivering genuinely real-time updates.

**Why CopyOnWriteArrayList for velocity tracking?**
The velocity window is read-heavy (every transaction reads it) with infrequent writes. `CopyOnWriteArrayList` gives lock-free reads at the cost of write copies the right trade-off for this access pattern in a concurrent environment.

---

## 👤 Author

**Ravi Reddy**
Full Stack Java Developer | AWS Certified Developer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/ravi-reddyrr/)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=flat&logo=github)](https://github.com/YOUR_USERNAME)

---

<div align="center">
<sub>Built with Spring Boot · Next.js · WebSocket · Custom ML · Docker</sub>
</div>
