# AI-Powered Fitness & Smart Nutrition Tracker

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)
![React Native](https://img.shields.io/badge/React_Native-0.72+-61DAFB.svg)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)

**An AI-Native Personal Health Companion**

*Understand what you eat, how you move, and how to optimize — powered by computer vision and large language models.*

[Overview](#overview) • [Features](#key-features) • [Architecture](#system-architecture) • [Quick Start](#quick-start) • [Roadmap](#roadmap)

</div>

---

## Overview

Most fitness and nutrition applications rely on manual food logging, static dietary recommendations, and disconnected tracking tools. The result is poor adherence, inaccurate data, and generic advice that fails individual users.

**AI-Powered Fitness & Smart Nutrition Tracker** addresses this gap by building AI natively into every layer of the health tracking stack. Users can photograph a meal and receive instant macro breakdowns, ask natural language questions about their health data, and receive dynamically personalized guidance — all without manual input friction.

### Why AI is Essential Here

Traditional apps treat AI as a feature. This project treats AI as the foundation. Nutritional data is inherently unstructured (a photo of a plate), highly personal (macros vary by goal), and contextually dependent (intensity of today's workout changes tonight's caloric need). Solving this well requires computer vision for food recognition, NLP for conversational guidance, and predictive modeling for trend analysis — not rule-based lookup tables.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **AI Food Recognition** | Upload or capture a meal photo; the system identifies food items, estimates portions, and returns calorie and macronutrient breakdown |
| **Calorie & Macro Tracking** | Daily log of calories, protein, carbohydrates, fat, and fiber with goal-based progress indicators |
| **Water Intake Monitoring** | Hydration tracking with smart reminders calibrated to body weight and daily activity level |
| **Workout Logging** | Exercise session recording with type, duration, sets/reps, and estimated caloric expenditure |
| **AI Diet & Fitness Guidance** | Conversational AI coach that answers nutritional questions, suggests meal adjustments, and adapts recommendations based on logged history |
| **Analytics Dashboard** | Weekly and monthly visualizations of body weight trends, macro balance, workout frequency, and goal progress |
| **Personalized Goal Engine** | User profile-driven targets (weight loss, muscle gain, maintenance) that recalibrate recommendations dynamically |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AI HEALTH COMPANION SYSTEM                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    MOBILE / WEB CLIENT                       │  │
│   │          React Native App  ·  Dashboard UI (React)           │  │
│   └────────────────────────┬─────────────────────────────────────┘  │
│                            │  HTTPS / WebSocket                      │
│   ┌────────────────────────▼─────────────────────────────────────┐  │
│   │                     API GATEWAY (FastAPI)                     │  │
│   │     Auth  ·  Rate Limiting  ·  Request Routing  ·  Logging   │  │
│   └──────┬──────────────────────┬───────────────────┬────────────┘  │
│          │                      │                   │                │
│   ┌──────▼──────┐    ┌──────────▼────────┐  ┌──────▼──────────┐    │
│   │   CORE API  │    │    AI ENGINE       │  │  ANALYTICS SVC  │    │
│   │  User/Goal  │    │                   │  │                  │    │
│   │  Nutrition  │    │ ┌───────────────┐ │  │  Trend Analysis  │    │
│   │  Hydration  │    │ │ Food Vision   │ │  │  Goal Progress   │    │
│   │  Workouts   │    │ │ (YOLOv8/CLIP) │ │  │  Weekly Reports  │    │
│   └──────┬──────┘    │ └───────────────┘ │  └──────────────────┘    │
│          │           │ ┌───────────────┐ │                           │
│          │           │ │  LLM Coach    │ │                           │
│          │           │ │ (GPT-4/Llama) │ │                           │
│          │           │ └───────────────┘ │                           │
│          │           │ ┌───────────────┐ │                           │
│          │           │ │ Macro Estimator│ │                          │
│          │           │ └───────────────┘ │                           │
│          │           └──────────┬────────┘                           │
│          │                      │                                    │
│   ┌──────▼──────────────────────▼──────────────────────────────┐    │
│   │                        DATA LAYER                           │    │
│   │   PostgreSQL (structured)  ·  Redis (cache/sessions)        │    │
│   │   S3-compatible Object Store (food images, avatars)         │    │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Technology | Responsibility |
|-------|------------|---------------|
| **Mobile Client** | React Native | Cross-platform iOS/Android interface, camera integration, offline caching |
| **Web Dashboard** | React + Recharts | Analytics visualization, admin views, desktop experience |
| **API Gateway** | FastAPI + OAuth2 | Request routing, JWT authentication, rate limiting |
| **Core API** | FastAPI (services) | Business logic for nutrition, hydration, workout, user management |
| **AI Engine** | PyTorch + OpenAI API | Food detection, macro estimation, conversational coaching |
| **Analytics Service** | Python + Pandas | Aggregations, trend computation, report generation |
| **Database** | PostgreSQL + Redis | Persistent storage and high-speed caching |
| **Object Storage** | AWS S3 / MinIO | Food image storage, meal photo history |

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.72+ | Cross-platform mobile application |
| React | 18+ | Web dashboard |
| Recharts | 2.x | Data visualization |
| React Navigation | 6.x | Mobile routing |
| Axios | 1.x | HTTP client |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.10+ | Primary backend language |
| FastAPI | 0.100+ | REST API framework |
| SQLAlchemy | 2.x | ORM and database abstraction |
| Alembic | 1.x | Database migrations |
| Celery | 5.x | Async task queue (AI inference jobs) |
| Pydantic | 2.x | Data validation and serialization |

### AI & Machine Learning

| Technology | Purpose |
|------------|---------|
| YOLOv8 (Ultralytics) | Real-time food object detection |
| CLIP (OpenAI) | Food image classification and embedding |
| OpenAI GPT-4 / Llama 3 | Conversational health coaching |
| PyTorch 2.0 | Model inference runtime |
| USDA FoodData Central API | Nutritional reference database |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| PostgreSQL 15 | Primary relational database |
| Redis 7 | Session cache, real-time counters |
| AWS S3 / MinIO | Image object storage |
| Docker + Docker Compose | Containerized local and cloud deployment |
| Nginx | Reverse proxy, SSL termination |

---

## How It Works

```
1. USER ACTION
   └── Opens app → takes photo of meal OR logs workout OR asks AI coach a question

2. IMAGE PROCESSING (Food Recognition Flow)
   └── Image uploaded to API → stored in object store
   └── AI Engine runs YOLOv8 detection → identifies food items in frame
   └── CLIP classifier refines food category labels
   └── Macro Estimator queries USDA FoodData Central for nutritional data
   └── Portion estimation applied using bounding box size heuristics

3. DATA PERSISTENCE
   └── Detected foods + macros written to user's daily nutrition log
   └── Timestamps, meal type (breakfast/lunch/dinner/snack), and image reference stored

4. AI COACHING
   └── User asks: "Was today's lunch balanced for muscle gain?"
   └── LLM receives: user goal profile + today's macro log + recent workout data
   └── LLM returns: contextual, personalized nutritional analysis and suggestions

5. ANALYTICS ENGINE
   └── Nightly job aggregates daily logs → weekly/monthly summaries
   └── Trend models compute weight trajectory, macro adherence rate, workout consistency
   └── Dashboard surfaces actionable insights and progress-to-goal percentage

6. FEEDBACK LOOP
   └── User ratings and corrections on food detection improve future inference accuracy
   └── Coach conversation history informs increasingly personalized recommendations
```

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Docker & Docker Compose
- OpenAI API key (or local Llama 3 deployment)
- PostgreSQL 15 (or use Docker)

---

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/Abiram348/AI-Powered-Fitness-Smart-Nutrition-Tracker-AI-Native-Health-Companion-.git
cd AI-Powered-Fitness-Smart-Nutrition-Tracker-AI-Native-Health-Companion-

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your database URL, API keys, and object storage credentials

# Run database migrations
alembic upgrade head

# Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.  
Interactive documentation: `http://localhost:8000/docs`

---

### Frontend Setup

```bash
# Navigate to the mobile app directory
cd mobile

# Install dependencies
npm install

# Start Metro bundler
npx react-native start

# Run on iOS (requires Xcode)
npx react-native run-ios

# Run on Android (requires Android Studio / emulator)
npx react-native run-android
```

For the web dashboard:

```bash
cd dashboard
npm install
npm start    # Opens at http://localhost:3000
```

---

### Docker Deployment (Recommended)

```bash
# Build and start all services
docker-compose up -d

# Verify running containers
docker-compose ps

# View API logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

Services started:
- `api` — FastAPI backend on port 8000
- `worker` — Celery AI inference worker
- `db` — PostgreSQL on port 5432
- `redis` — Redis on port 6379
- `dashboard` — React dashboard on port 3000
- `minio` — Object storage on port 9000

---

## Example Output

### Daily Summary Response (`GET /api/summary/daily`)

```json
{
  "date": "2025-02-27",
  "user_id": "usr_a8f21c",
  "goals": {
    "calories": 2200,
    "protein_g": 165,
    "carbs_g": 220,
    "fat_g": 73,
    "water_ml": 3000
  },
  "actuals": {
    "calories": 1940,
    "protein_g": 148,
    "carbs_g": 198,
    "fat_g": 61,
    "water_ml": 2400,
    "calories_burned_exercise": 320
  },
  "adherence": {
    "calorie_pct": 88,
    "protein_pct": 90,
    "hydration_pct": 80
  },
  "meals": [
    {
      "meal_type": "breakfast",
      "time": "08:14:22",
      "detected_foods": ["oatmeal", "banana", "almond milk"],
      "calories": 410,
      "confidence": 0.91
    },
    {
      "meal_type": "lunch",
      "time": "13:02:10",
      "detected_foods": ["grilled chicken breast", "brown rice", "broccoli"],
      "calories": 650,
      "confidence": 0.95
    }
  ],
  "workouts": [
    {
      "type": "strength",
      "duration_minutes": 45,
      "calories_burned": 320,
      "exercises": ["bench press", "squat", "deadlift"]
    }
  ],
  "ai_insight": "Protein intake is on track. Consider adding a high-carb snack post-workout to support glycogen replenishment. Hydration is below target — aim for 2 more glasses before 9 PM."
}
```

---

## Security & Privacy

### Data Protection

- All user health data is encrypted at rest (AES-256) and in transit (TLS 1.3)
- Food images are stored with user-scoped access controls; no image is shared or used for third-party model training without explicit opt-in
- PII fields (name, email, biometrics) are stored separately from behavioral/health logs with strict access segmentation

### Authentication

- JWT-based authentication with short-lived access tokens (15 min) and rotating refresh tokens
- OAuth2 social login support (Google, Apple)
- Rate limiting enforced at the gateway layer to prevent enumeration and abuse

### Compliance Readiness

| Standard | Status |
|----------|--------|
| GDPR (data export & deletion) | Implemented |
| HIPAA-ready architecture | In progress (Phase 2) |
| SOC 2 Type I preparation | Roadmap (Phase 3) |

---

## Project Structure

```
ai-fitness-tracker/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py             # Authentication endpoints
│   │   │   ├── nutrition.py        # Food logging & macro endpoints
│   │   │   ├── workouts.py         # Workout tracking endpoints
│   │   │   ├── hydration.py        # Water intake endpoints
│   │   │   ├── analytics.py        # Dashboard data endpoints
│   │   │   └── coaching.py         # AI coach chat endpoints
│   │   └── dependencies.py         # Shared FastAPI dependencies
│   ├── ai/
│   │   ├── food_detection.py       # YOLOv8 + CLIP inference pipeline
│   │   ├── macro_estimator.py      # Nutritional data lookup & estimation
│   │   ├── coach.py                # LLM coaching engine
│   │   └── prompts/                # Structured prompt templates
│   ├── core/
│   │   ├── config.py               # Environment-based configuration
│   │   ├── security.py             # JWT, hashing utilities
│   │   └── database.py             # SQLAlchemy engine & session factory
│   ├── models/                     # SQLAlchemy ORM models
│   ├── schemas/                    # Pydantic request/response schemas
│   ├── services/                   # Business logic layer
│   ├── tasks/                      # Celery async tasks
│   └── main.py                     # FastAPI application entry point
├── mobile/                         # React Native mobile application
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── navigation/
│   │   └── services/
│   └── package.json
├── dashboard/                      # React web dashboard
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── hooks/
│   └── package.json
├── alembic/                        # Database migration scripts
├── tests/                          # Unit and integration tests
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.worker
│   └── Dockerfile.dashboard
├── docker-compose.yml
├── requirements.txt
├── .env.example
└── README.md
```

---

## Roadmap

### Phase 1 — MVP (Current)

- [x] User registration, authentication, and goal profile setup
- [x] AI food image recognition and macro logging
- [x] Manual workout and hydration logging
- [x] Daily summary dashboard
- [x] Basic AI coaching (GPT-4 integration)
- [x] Docker Compose deployment

### Phase 2 — Enhanced Intelligence

- [ ] On-device food detection model (CoreML / TFLite) for offline support
- [ ] Fine-tuned food recognition model on domain-specific dataset
- [ ] Meal planning: AI-generated weekly meal plans based on goals
- [ ] Wearable integration (Apple Health, Google Fit, Fitbit)
- [ ] HIPAA-aligned data architecture
- [ ] Push notifications and smart hydration reminders

### Phase 3 — Platform Scale

- [ ] Multi-user support (families, teams, coaches)
- [ ] Registered Dietitian collaboration portal
- [ ] Longitudinal health trend forecasting (90-day predictive models)
- [ ] API marketplace for third-party health app integrations
- [ ] SOC 2 Type I certification
- [ ] White-label enterprise offering

---

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes with clear, atomic commits

   ```bash
   git commit -m "feat: add barcode scanning for packaged foods"
   ```

4. Run the test suite before submitting

   ```bash
   pytest tests/ --cov=app
   ```

5. Push to your fork and open a Pull Request against `main`

Please review `CONTRIBUTING.md` for code style guidelines, branch naming conventions, and PR review expectations.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for full terms.

---

## Vision

The long-term goal of this project is to build the infrastructure layer for truly personalized, AI-native health management — a system that does not merely track behavior but understands it.

Most people do not fail at fitness and nutrition because they lack information. They fail because the systems they use are too generic, too manual, and too disconnected from their actual lives. A user who ate well all week but poorly at a restaurant should not be treated the same as a user with consistently poor habits. A user recovering from injury needs different guidance than one training for a marathon.

The vision is a health companion that accumulates longitudinal context — months and years of real behavioral data — and uses that context to provide guidance that is genuinely individualized. One that bridges the gap between consumer wellness apps and clinical-grade health monitoring, making proactive, preventive healthcare accessible without requiring a dietitian or personal trainer.

This repository is the foundation of that system.

---

<div align="center">

**Built for people who take their health as seriously as their code.**

</div>
