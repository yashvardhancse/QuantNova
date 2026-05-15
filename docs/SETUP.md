# QuantNova Setup Guide

> **What is QuantNova?**
> QuantNova is an open-source, GUI-based tool for testing trading strategies against historical market data. Think of it as a rehearsal room for algorithmic trading — load price data, apply indicators (SMA, RSI, etc.), run a strategy, and see how it would have performed.

This guide will walk you through getting the entire project running locally on your computer, from zero to open backtesting-dashboard view. It's written for someone new to coding, so every step is explained.

---

## What You'll Need Before You Start

Before installing anything, make sure you have the following on your computer. You can check if something is already installed by opening a terminal and typing the command — if it shows a version number, you're good.

### Required

| Tool | Check By | Why We Need It |
|---|---|---|
| **Git** | `git --version` | To clone/download the project from GitHub |
| **Python 3.11+** | `python3 --version` | Runs the backend API server |
| **Node.js 18+** | `node --version` | Runs the frontend web interface |
| **npm** | `npm --version` | Installs frontend packages (comes with Node.js) |

### How to Install Each

#### Git

- **macOS:** `git` is pre-installed. Run `git --version` to confirm.
- **Windows:** Download from [git-scm.com](https://git-scm.com/download/win). During setup, keep "Git from the command line" selected.
- **Linux (Ubuntu/Debian):** `sudo apt update && sudo apt install git -y`

#### Python

- **macOS:** `brew install python@3.11`
- **Windows:** Download from [python.org](https://www.python.org/downloads/). **Check "Add Python to PATH"** during installation.
- **Linux (Ubuntu/Debian):** `sudo apt update && sudo apt install python3.11 python3.11-venv -y`

#### Node.js

- **macOS:** `brew install node`
- **Windows:** Download from [nodejs.org](https://nodejs.org/) (LTS version)
- **Linux (Ubuntu/Debian):** Download from [nodejs.org](https://nodejs.org/en/download) or use `nvm` (recommended):
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  nvm install --lts
  nvm use --lts
  ```

- [Video: How to install Node.js on Windows / Mac / Linux (8 min)](https://www.youtube.com/watch?v=6mbwKpyH2Ho)
- [Video: How to install Python 3.11 on Windows (5 min)](https://www.youtube.com/watch?v=9b0PcU8xqAE)

---

## The Project Structure

Here is what the repository looks like at a high level:

```text
QuantNova/
├── backend/           ← Python FastAPI server (data fetching, backtesting logic)
│   ├── app/           ← Application code (routes, models, services)
│   └── tests/         ← Backend unit tests
│
├── frontend/          ← React + Vite + TypeScript web UI
│   ├── src/
│   │   ├── api/       ← Calls to the backend
│   │   ├── backtest/  ← Frontend fallback backtest logic
│   │   ├── components/← UI components (panels, charts, controls)
│   │   ├── data/      ← Bundled sample data (works without backend)
│   │   └── indicators/← SMA, EMA, RSI, Bollinger Bands calculations
│   └── ...
│
├── docs/              ← Documentation
│   └── screenshots/   ← App screenshots
│
└── README.md          ← Project overview, quick-start, features
```

---

## Step-by-Step Setup

Below is the full, step-by-step process from cloning the repo to running the app in your browser. Follow these steps in order; don't skip.

---

### Step 1 — Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/yashvardhancse/QuantNova.git
```

This copies the entire project to your computer. You'll see a new folder called `QuantNova`.

Next, enter the folder:

```bash
cd QuantNova
```

You should now be inside the project folder. Every command in this guide assumes your terminal is pointing at QuantNova/.

---

### Step 2 — Start the Frontend

Open a **second terminal** (don't close the first).

```bash
cd frontend
npm install
```

> 👉 What does this do?  
> `npm install` reads `frontend/package.json` and downloads every third-party JavaScript/TypeScript package this app needs. It only needs to run once (unless someone updates the list of packages).

After the install finishes:

```bash
npm run dev
```

**Frontend is running at:** [`http://localhost:5173`](http://localhost:5173)

A screenshot of the running dashboard:

![QuantNova terminal dashboard](./screenshots/terminal-dashboard.png)

> If the frontend alone is enough for you (it ships with bundled sample data so you can explore indicators and charts without the backend running), you can stop here. You'll see the dashboard at the URL above.

---

### Step 3 — Start the Backend

Switch back to the **first terminal** (the one already inside `QuantNova/`).

#### macOS / Linux

```bash
cd backend
python3 -m venv .venv
```

> 👉 What does this do?  
> `python3 -m venv .venv` creates an isolated Python environment inside the `backend` folder. Everything we install stays in `.venv/` and doesn't mess with other Python projects on your computer.

Activate the virtual environment:

```bash
source .venv/bin/activate
```

The prompt changes to show `(.venv)` at the start, like this:

```text
(.venv) spoidy@Abdul ~/QuantNova/backend$
```

Install the backend packages:

```bash
pip install -e ".[dev]"
```

> 👉 What does this do?  
> `pip install -e ".[dev]"` installs FastAPI, uvicorn, pandas, and all the developer/testing tools the backend needs. The `-e` flag means "editable" — if you edit Python files, the server picks up the changes without reinstalling.

Start the backend server:

```bash
uvicorn app.main:app --reload
```

#### Windows (PowerShell)

```powershell
cd backend
python -m venv .venv
```

Activate the virtual environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

> ⚠️ If PowerShell blocks the activation script, run this first:  
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

Install dependencies and start the server:

```powershell
pip install -e ".[dev]"
uvicorn app.main:app --reload
```

**Backend is running at:** [`http://localhost:8000`](http://localhost:8000)

---

### Step 4 — Verify Everything Is Running

In a **new** terminal tab (or your browser), check the backend health endpoint:

```bash
curl http://localhost:8000/health
```

If you see a similar response, the backend is ready:

```json
{"status":"ok"}
```

If the frontend is running too, open:

```
http://localhost:5173
```

You should see the QuantNova terminal dashboard.

![QuantNova OHLCV candlestick chart with signals](./screenshots/ohlcv-candlestick-signals.png)
![QuantNova backtest history](./screenshots/backtest-history.png)

---

## How to Run the App (Quick Reference)

Once the setup is done, you just need three commands every time you open a new session:

### Terminal 1 — Backend

```bash
cd QuantNova/backend
source .venv/bin/activate  # (Windows: .\.venv\Scripts\Activate.ps1)
uvicorn app.main:app --reload
```

### Terminal 2 — Frontend

```bash
cd QuantNova/frontend
npm run dev
```

### Browser

Open [`http://localhost:5173`](http://localhost:5173)

---

## Running Tests

### Backend Tests

```bash
cd backend
source .venv/bin/activate
pytest
```

### Frontend Tests

```bash
cd frontend
npm test
```

---

## First-Time Run Checklist

Use this checklist to confirm everything is working correctly after your first local setup.

- [ ] Frontend opens at `http://localhost:5173` with no blank page or errors
- [ ] Backend returns `{"status":"ok"}` at `http://localhost:8000/health`
- [ ] "Load Sample Data" button in the frontend loads OHLCV candles on the chart
- [ ] Binance "Connect" button fetches live BTC/USDT candles
- [ ] SMA / RSI / Bollinger Bands indicator toggles overlay correctly
- [ ] Backtest tab runs and produces Sharpe ratio and trade log
- [ ] Both `pytest` (backend) and `npm test` (frontend) pass

---

## Project Module References

| Module | Description |
|---|---|
| `backend/app/main.py` | FastAPI app entry point and route registration |
| `backend/app/api/routes/` | All REST API endpoints (`/health`, `/backtest`, `/ohlcv`, …) |
| `backend/app/services/` | Core business logic (backtesting engine, binance fetcher, indicators) |
| `backend/app/models/` | Pydantic data models |
| `frontend/src/api/` | TypeScript API client wrapping all backend calls |
| `frontend/src/components/` | React components: `Dashboard.tsx`, `IndicatorPanel.tsx`, `TradeLog.tsx`, … |
| `frontend/src/indicators/` | Pure TypeScript indicator functions (SMA, EMA, RSI, Bollinger Bands) |
| `frontend/src/backtest/` | Frontend-only backtest fallback (runs in browser when backend is unavailable) |

---

## Common Issues & Fixes

### Port Already in Use

You'll know this from an error like `OSError: [Errno 48] Address already in use` (macOS/Linux) or `[WinError 10048]` (Windows).

```bash
# Kill the process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9    # macOS / Linux
netstat -o -n -b | findstr 5173  # Windows — find PID, then Task Manager → End Task

# Kill the process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9    # macOS / Linux
```

### `pip` / `uvicorn` Not Found Inside the Virtual Environment

This happens if the virtual environment wasn't created correctly. Delete it and start again:

```bash
cd backend
rm -rf .venv           # macOS / Linux
# rd /s /q .venv       # Windows CMD
rm -r .venv            # Windows PowerShell

python3 -m venv .venv  # macOS / Linux
# python -m venv .venv  # Windows
source .venv/bin/activate
pip install -e ".[dev]"
```

If `python3` / `python` says "command not found", revisit **What You'll Need Before You Start** and install Python first.

### Frontend Shows "Module not found" Errors

Delete and re-install:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### CORS Errors in the Browser Console

If the frontend can't reach the backend, verify the backend health endpoint first (`http://localhost:8000/health`). If it works there but not through the UI, confirm the frontend `.env` or `VITE_API_URL` points to `http://localhost:8000`.

### Code Won't Format (`npm run format` Fails)

There are pre-existing formatting warnings across the `frontend/` tree (especially in generated or generated-like files). Run `npm run format` on the file you changed, not the whole tree, to avoid being blocked by unrelated issues.

---

## Next Steps After Setup

Head to the [Contributing Guide](https://github.com/yashvardhancse/QuantNova/blob/main/docs/WORK_PROGRESS.md) to see the current progress and open issues.

**Good first issues for new contributors:**

- Add tooltip explanations for SMA, EMA, RSI, and Bollinger Bands indicators
- Improve the empty CSV upload error message
- Expand the README with a clearer OHLCV CSV format example

---

## More Resources

- **FastAPI Docs:** [fastapi.tiangolo.com](https://fastapi.tiangolo.com/)
- **React + Vite Guide:** [vite.dev/guide](https://vite.dev/guide/)
- **Lightweight Charts Docs:** [tradingview.github.io](https://tradingview.github.io/lightweight-charts/)
- **QuantNova GitHub:** [yashvardhancse/QuantNova](https://github.com/yashvardhancse/QuantNova)
