# CodeMentor AI — Intelligent Coding Mentor

> **"Write. Analyze. Understand. Improve."**

CodeMentor AI is a full-stack, AI-powered coding learning and mentorship platform tailored for Computer Science students and software engineers. Powered locally by **Ollama + Qwen2.5-Coder 7B**, CodeMentor AI delivers real-time algorithmic reviews, asymptotic computational complexity calculations, bug and edge-case detection, test case generation, multi-level code explanations, automated documentation, side-by-side optimization diffs, and personalized coding statistics without relying on external cloud AI APIs.

---

## 🌐 Supported Programming Languages

CodeMentor AI provides full multi-language programming support with syntax-highlighted Monaco editor workspaces, language-aware AST understanding, idiomatic refactoring, test case generation, and documentation for:

- **JavaScript** (`javascript`)
- **Python** (`python`)
- **Java** (`java`)
- **C++** (`cpp`)
- **C** (`c`)
- **TypeScript** (`typescript`)

All AI evaluations, asymptotic analysis, test generation, and documentation formatting are powered locally by:
- **Provider**: Ollama
- **Model**: `qwen2.5-coder:7b`
- **Endpoint**: `http://localhost:11434`

---

## 🌟 Features

### 🧠 Core AI Analysis (Phases 1–6)
- **Local AI Code Analysis**: Real-time evaluation of source code across 6 supported languages (**JavaScript, Python, Java, C++, C, TypeScript**).
- **Code Quality Assessment**: Accurate score (0–100), rating, and breakdown of strengths & weaknesses.
- **Bug & Edge-Case Detection**: Pinpoints line numbers, severity levels, descriptions, and step-by-step fixes.
- **Big-O Complexity Derivation**: Detailed Asymptotic Time & Space complexity ($O(1)$, $O(n)$, $O(n \log n)$, $O(n^2)$, etc.) with best, worst, and average cases.
- **Actionable Optimization & Refactoring**: Generates clean, idiomatic improved code in the original programming language accompanied by concise mentor explanations.
- **Dual-Mode Storage with Auto-Migration**: MongoDB primary storage with seamless fallback to `server/data/offline-store.json`.
- **JWT & Bcrypt Security**: Complete token-based authentication with strict user data isolation and Helmet HTTP headers.

### 🚀 Advanced AI Coding Features (Phase 7 & Phase 7.5)
- **AI Test Case Generator (`POST /api/code/test-cases`)**: Automatically creates structured test suites featuring input parameters, expected outputs, explanatory notes, and edge-case classification for all 6 languages.
- **Advanced Bug Explainer (`POST /api/code/explain-bugs`)**: Delivers deep diagnostic reports for detected bugs with severity tiers (*Critical, High, Medium, Low, Informational*), root cause analysis, prevention advice, and corrected snippets.
- **Multi-Level Code Explanations (`POST /api/code/explain`)**: Tailors conceptual explanations across 3 selectable depth modes:
  - **Beginner**: High-level intuitive analogies and friendly step-by-step logic.
  - **Intermediate**: Core control flow, functions, and language-specific idioms (Python dicts/lists, Java classes/types, C++ STL/pointers, C arrays/pointers, TypeScript types/interfaces, JavaScript objects).
  - **Advanced**: Algorithmic theory, memory management, concurrency, and architecture patterns.
- **Original vs Optimized Code Comparison (`POST /api/code/compare-optimization`)**: Side-by-side code diff viewer highlighting specific changes, optimization rationale, and before-and-after Time/Space complexity comparisons.
- **Automated Code Documentation Generator (`POST /api/code/documentation`)**: Generates language-idiomatic docstrings (JSDoc, Python Docstrings, Javadoc, Doxygen, TSDoc) across Simple, Professional, and Developer Documentation formats without modifying original code.
- **Bookmark & Favorites System (`PUT /api/analyses/:id/bookmark`, `GET /api/analyses/bookmarked`)**: Quick-save important analyses with dedicated bookmark filtering.
- **Flexible Analysis Tagging (`PUT /api/analyses/:id/tags`)**: Categorize and search analyses using custom tags (e.g. `algorithms`, `interview`, `bugs`, `practice`).
- **Multi-Language History Filter**: Filter past analyses by All, JavaScript, Python, Java, C++, C, or TypeScript.
- **Comprehensive Report Downloads**: Export comprehensive standalone HTML or Markdown reports containing all code, metrics, explanations, test cases, and optimizations with a single click.
- **Coding Statistics & Improvement Insights (`GET /api/analyses/stats`)**: Data-grounded dashboard analytics displaying language distributions across all 6 languages, weekly/monthly activity trends, quality averages, tag frequencies, and constructive practice insights.
- **Refined Developer-Grade UI/UX**: Monaco editor integration, 9-tabbed inspection panel, animated status toasts, accessible forms, and dark-theme aesthetic.

---

## 💻 Requirements

- **Node.js**: v18.x or later
- **MongoDB**: v6.x or later (local instance or MongoDB Atlas)
- **Ollama**: v0.3.x or later
- **Ollama Model**: `qwen2.5-coder:7b`

---

## 🚀 Installation & Setup

Follow these 9 simple steps to set up and run CodeMentor AI locally:

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/codementor-ai.git
cd "AI CODE MENTOR"
```

### 2. Install Backend Dependencies
```bash
cd server
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../client
npm install
```

### 4. Configure Environment Variables
- **Backend**:
  ```bash
  cd ../server
  cp .env.example .env
  ```
  *(On Windows PowerShell: `Copy-Item .env.example .env`)*

- **Frontend**:
  ```bash
  cd ../client
  cp .env.example .env
  ```

### 5. Start MongoDB
Ensure your local MongoDB daemon is active on port 27017:
```powershell
mongod --dbpath "$HOME\.codementor-mongodb" --port 27017
```

### 6. Start Ollama
Start the Ollama application or daemon:
```bash
ollama serve
```

### 7. Pull the Qwen2.5-Coder Model
Download the 7B coder model (one-time setup):
```bash
ollama run qwen2.5-coder:7b
```

### 8. Start the Backend API Server
```bash
cd server
npm run dev
# Backend runs at: http://localhost:5000
```

### 9. Start the Frontend Client
```bash
cd client
npm run dev
# Frontend runs at: http://localhost:5173
```

---

## ⚙️ Environment Variables Reference

### Backend (`server/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for the Express backend server |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`) |
| `CLIENT_URL` | `http://localhost:5173` | Allowed frontend origin for CORS |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/codementor` | MongoDB connection URI (local or Atlas) |
| `OLLAMA_URL` | `http://localhost:11434/api/generate` | Local Ollama inference endpoint |
| `OLLAMA_MODEL`| `qwen2.5-coder:7b` | Name of the local LLM model |
| `JWT_SECRET` | *(secret key)* | Secret key for signing JWT tokens |
| `JWT_EXPIRES_IN`| `7d` | JWT session lifetime (e.g. `7d`, `24h`) |

### Frontend (`client/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:5000` | Backend API base URL |

---

## 🌐 Running Addresses

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **Health Check Endpoint**: `http://localhost:5000/api/health`
- **Local Ollama AI**: `http://localhost:11434`

---

## 🗄️ Database Architecture & Offline Fallback

CodeMentor AI uses a resilient **Dual-Mode Storage Architecture**:

1. **Primary Database (MongoDB)**:
   - Stores users in `users` collection with unique email index.
   - Stores analyses in `analyses` collection with compound index on `{ userId: 1, createdAt: -1 }`, `isBookmarked`, and `tags`.
   - Supports both local MongoDB instances and cloud-hosted MongoDB Atlas clusters.
2. **Resilient Fallback (`server/data/offline-store.json`)**:
   - If MongoDB is stopped or unreachable, the server automatically degrades to the local persistent JSON file without throwing 500 errors.
   - When MongoDB is reconnected, any records in the offline fallback are safely and idempotently migrated to MongoDB.

---

## 🧠 Local AI Model (Ollama + Qwen2.5-Coder 7B)

CodeMentor AI communicates with Ollama over HTTP using structured JSON schemas.
- **Zero API Costs**: No external subscription or internet connection required for inference.
- **Privacy First**: Source code never leaves the local machine.
- **Multi-Language Aware**: Prompt engineering provides explicit language context across JavaScript, Python, Java, C++, C, and TypeScript.
- **Error Handling**: If Ollama is offline or timed out, user receives clear guidance:
  > *"AI service is currently unavailable. Please make sure Ollama is running."*

---

## 🔌 API Endpoints Summary

### Health & System
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System health, database, and AI status |

### Authentication
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user account |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive JWT |
| `GET` | `/api/auth/me` | Private | Get authenticated user profile |
| `PUT` | `/api/auth/me` | Private | Update profile name / change password |
| `POST` | `/api/auth/logout` | Public | Logout endpoint |

### Core AI Analysis & History
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/code/analyze` | Public / Private | Full code quality, bug, complexity & optimization analysis (6 languages) |
| `GET` | `/api/analyses` | Private | Fetch user's analysis history with search, language & tag filters |
| `GET` | `/api/analyses/:id` | Private | Fetch specific analysis detail |
| `DELETE`| `/api/analyses/:id` | Private | Delete specific analysis record |

### Phase 7 & 7.5 Advanced Features
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/code/test-cases` | Private | Generate structured test cases (inputs, outputs, edge-case tags) |
| `POST` | `/api/code/explain-bugs`| Private | Generate detailed bug diagnostic breakdowns and fixes |
| `POST` | `/api/code/explain` | Private | Multi-depth code explanation (`beginner`, `intermediate`, `advanced`) |
| `POST` | `/api/code/documentation` | Private | Generate idiomatic docstrings (`simple`, `professional`, `developer`) |
| `POST` | `/api/code/compare-optimization` | Private | Generate side-by-side optimization diff and complexity delta |
| `PUT` | `/api/analyses/:id/bookmark` | Private | Toggle or set bookmark state for an analysis |
| `GET` | `/api/analyses/bookmarked` | Private | Fetch all bookmarked analyses for current user |
| `PUT` | `/api/analyses/:id/tags` | Private | Add/update tag array for an analysis |
| `GET` | `/api/analyses/stats` | Private | Get user coding statistics, language breakdown & insights |

---

## 📜 Version

**Current Release**: `7.5.0-phase7.5` (Phase 7.5: Multi-Language Programming Support)
