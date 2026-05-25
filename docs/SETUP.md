# QuantNova Setup Guide

> **Zero experience required.** This guide walks you through every tool you need to install and every command you need to run to get QuantNova working on your computer — on Windows, macOS, or Linux.

---

## Table of Contents

- [What Is QuantNova?](#what-is-quantnova)
- [How the Stack Works](#how-the-stack-works)
- [1. Python Installation](#1-python-installation)
- [2. Node.js and npm Installation](#2-nodejs-and-npm-installation)
- [3. Git Installation](#3-git-installation)
- [4. What Is Vite?](#4-what-is-vite)
- [5. What Is FastAPI?](#5-what-is-fastapi)
- [6. Frontend Setup](#6-frontend-setup)
- [7. Backend Setup](#7-backend-setup)
- [8. Running the Full Project](#8-running-the-full-project)
- [9. Common Errors and Troubleshooting](#9-common-errors-and-troubleshooting)
- [10. Learning Resources](#10-learning-resources)

---

## What Is QuantNova?

QuantNova is an open-source **quantitative backtesting tool**. In plain English: it lets you test trading strategies against historical market data to see how they would have performed — before risking real money.

It has two parts:

| Part | Technology | What it does |
|---|---|---|
| **Frontend** | React + TypeScript + Vite | The visual interface you see in your browser |
| **Backend** | Python + FastAPI | Processes data, runs indicators, runs backtests |

Both parts run on your computer during development. Your browser talks to the backend over a local network connection.

---

## How the Stack Works

```
Your Browser  ──►  Frontend (React, port 5173)
                        │
                        │  HTTP requests (fetch/axios)
                        ▼
                   Backend API (FastAPI, port 8000)
                        │
                        │  Fetches market data, runs logic
                        ▼
                   Binance API / Uploaded CSV
```

- The **frontend** is what you see: charts, buttons, forms.
- The **backend** is the engine: it calculates indicators (SMA, RSI, etc.) and runs backtests.
- They communicate using **JSON** — a simple text format for exchanging data.
- When the backend is not running, the frontend falls back to built-in sample calculations.

---

## 1. Python Installation

### What is Python?

Python is a programming language. QuantNova's backend is written in Python. Think of it as the language your computer uses to understand and run the backend code.

### Why does QuantNova use Python?

Python has excellent libraries for data analysis (like Pandas) and is the standard language in quantitative finance. FastAPI, which powers the backend API, is also a Python framework.

### Install Python

**Required version: Python 3.11 or newer**

#### Windows

1. Visit https://www.python.org/downloads/
2. Click **"Download Python 3.x.x"** (the big yellow button)
3. Run the installer
4. ⚠️ **On the first screen, check "Add Python to PATH"** — this is important
5. Click "Install Now"

> **What is PATH?**  
> PATH is a list your computer uses to find programs. If Python is not in PATH, your terminal won't recognize the `python` command.

#### macOS

Option A — Official installer:
1. Visit https://www.python.org/downloads/
2. Download the macOS installer
3. Run the `.pkg` file and follow the steps

Option B — Homebrew (recommended if you use a Mac for development):
```bash
brew install python@3.11
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
```

For other distributions, use your package manager (`dnf`, `pacman`, etc.) or the official installer at https://www.python.org/downloads/.

### Verify Python installation

Open a terminal (on Windows: search "Command Prompt" or "PowerShell") and run:

```bash
python --version
# or on macOS/Linux:
python3 --version
```

You should see something like:
```
Python 3.11.x
```

Also verify pip (Python's package installer):
```bash
pip --version
# or
pip3 --version
```

---

## 2. Node.js and npm Installation

### What is JavaScript?

JavaScript is the programming language of the web. Every interactive website uses it. QuantNova's frontend is written in TypeScript, which is JavaScript with added type safety.

### What is Node.js?

Normally, JavaScript only runs inside a browser. **Node.js** lets JavaScript run on your computer directly, outside of a browser. This is needed for build tools and the development server.

> **Analogy:** JavaScript is a recipe. Node.js is the kitchen that lets you cook it outside a restaurant (browser).

### What is npm?

**npm** (Node Package Manager) is installed automatically with Node.js. It downloads and manages packages — reusable pieces of code written by other developers. When you run `npm install`, npm reads `package.json` and downloads everything the project needs.

### Install Node.js

**Required version: Node.js 20 LTS or newer**

1. Visit https://nodejs.org/
2. Click **"LTS"** (Long Term Support) — this is the stable version recommended for most users
3. Download the installer for your operating system
4. Run it and follow the steps (defaults are fine)

> On Linux, you can also use [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) for more control.

### Verify Node.js installation

```bash
node --version
```

Expected output:
```
v20.x.x
```

```bash
npm --version
```

Expected output:
```
10.x.x
```

---

## 3. Git Installation

### What is Git?

Git is a **version control system**. It tracks changes to code over time and lets multiple people collaborate on the same project without overwriting each other's work. GitHub hosts Git repositories online.

### Install Git

#### Windows

1. Visit https://git-scm.com/download/win
2. Download and run the installer
3. Accept all defaults — they are fine for beginners

#### macOS

Git is usually pre-installed. Verify with:
```bash
git --version
```

If not installed:
```bash
brew install git
```

#### Linux

```bash
sudo apt install git       # Debian/Ubuntu
sudo dnf install git       # Fedora
sudo pacman -S git         # Arch
```

### Configure Git (required once)

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## 4. What Is Vite?

### The problem with plain HTML

A plain HTML file works in a browser, but a modern React app has hundreds of files, imports, TypeScript, and JSX syntax — none of which a browser understands directly.

### What Vite does

**Vite** is a build tool and development server. It:

- Transforms TypeScript and JSX into JavaScript the browser understands
- Bundles all files together efficiently
- Provides **hot reload** — when you save a file, the browser updates instantly without a full refresh

### What is hot reload?

Hot reload means you edit a component, save the file, and the browser reflects the change in under a second — without losing the app's current state. It makes development much faster.

### What does "build" mean?

When you run `npm run build`, Vite compiles all your TypeScript + React into a small bundle of plain HTML, CSS, and JavaScript that any browser can run — ready to deploy to a server.

---

## 5. What Is FastAPI?

### What is an API?

An **API** (Application Programming Interface) is a way for two programs to talk to each other. When the QuantNova frontend needs to calculate RSI for a stock, it sends an HTTP request to the backend API and receives a JSON response with the results.

### What is JSON?

**JSON** (JavaScript Object Notation) is a simple text format both the frontend and backend use to exchange data:

```json
{
  "symbol": "BTCUSDT",
  "interval": "1d",
  "close": [42000, 43500, 41800]
}
```

### What is FastAPI?

**FastAPI** is a Python framework for building APIs quickly. QuantNova uses it to expose endpoints like:

- `POST /api/indicators` — calculate SMA, EMA, RSI, Bollinger Bands
- `POST /api/backtest/ma-crossover` — run a moving average crossover strategy
- `GET /market/binance/klines` — fetch live OHLCV data from Binance

FastAPI automatically generates interactive API documentation at `http://localhost:8000/docs` — you can test every endpoint directly in your browser.

### What is REST?

REST is a convention for structuring APIs using standard HTTP methods:

| Method | Action |
|---|---|
| `GET` | Read data |
| `POST` | Send data / trigger computation |

---

## 6. Frontend Setup

### Navigate to the frontend folder

```bash
cd QuantNova/frontend
```

### Install dependencies

```bash
npm install
```

This reads `package.json` and downloads all required packages into a `node_modules` folder. This may take a minute or two on first run.

### (Optional) Create environment file

The environment file tells the frontend where the backend is running.

macOS/Linux:
```bash
cp .env.example .env
```

Windows CMD:
```cmd
copy .env.example .env
```

The default value (`http://localhost:8000`) is correct for local development — you usually don't need to change anything.

### Start the frontend development server

```bash
npm run dev
```

You will see output similar to:
```
  VITE v5.x.x  ready in 300ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser and go to **http://localhost:5173** — you should see the QuantNova trading terminal.

### What is localhost?

`localhost` means "this computer". Port `5173` is just a number that identifies which program on your computer to connect to. Think of it as an apartment number in a building.

---

## 7. Backend Setup

Open a **new terminal window** (keep the frontend running in the first one).

### Navigate to the backend folder

```bash
cd QuantNova/backend
```

### What is a virtual environment and why does it matter?

A **virtual environment** is an isolated Python installation just for this project. Without it, packages you install for QuantNova might conflict with packages installed for other Python projects on your computer.

> **Analogy:** A virtual environment is like a dedicated toolbox for one job, rather than throwing all your tools in one pile.

### Create the virtual environment

macOS/Linux:
```bash
python3 -m venv .venv
```

Windows PowerShell:
```powershell
python -m venv .venv
```

### Activate the virtual environment

macOS/Linux:
```bash
source .venv/bin/activate
```

Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
```

After activation, your terminal prompt will show `(.venv)` at the start — this confirms you are inside the virtual environment.

### Install backend dependencies

```bash
pip install -e ".[dev]"
```

This installs FastAPI, Pandas, Uvicorn, and all other backend dependencies listed in `pyproject.toml`.

### Start the backend server

```bash
uvicorn app.main:app --reload
```

You will see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

### Verify the backend is working

Open your browser and go to **http://localhost:8000/health**

You should receive a JSON response indicating the service is healthy.

You can also explore all available endpoints interactively at:
**http://localhost:8000/docs**

### What is `--reload`?

The `--reload` flag makes Uvicorn watch your Python files and restart automatically when you save changes — similar to hot reload in the frontend.

---

## 8. Running the Full Project

You need **two terminal windows** running at the same time:

| Terminal | Command | URL |
|---|---|---|
| Terminal 1 (frontend) | `npm run dev` (inside `frontend/`) | http://localhost:5173 |
| Terminal 2 (backend) | `uvicorn app.main:app --reload` (inside `backend/`, venv active) | http://localhost:8000 |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Your Browser                         │
│              http://localhost:5173                      │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP requests (JSON)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend Dev Server (Vite)                 │
│         React + TypeScript + Lightweight Charts         │
└──────────────────────┬──────────────────────────────────┘
                       │ API calls to port 8000
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API Server (FastAPI)                │
│         Indicators · Backtesting · Data Fetching        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
              Binance API / Uploaded CSV
```

### How they communicate

The frontend uses `fetch()` to send HTTP requests to the backend. For example, when you click "Run Backtest", the frontend sends a `POST` request to `http://localhost:8000/api/backtest/ma-crossover` with your parameters. The backend processes the data and returns a JSON response with results, which the frontend then displays as charts and tables.

---

## 9. Common Errors and Troubleshooting

### ❌ `python` is not recognized

**Symptom:**
```
'python' is not recognized as an internal or external command
```

**Fix:**
- On Windows: Re-run the Python installer and check "Add Python to PATH"
- On macOS/Linux: Use `python3` instead of `python`
- Restart your terminal after installing

---

### ❌ `npm` is not found

**Symptom:**
```
npm: command not found
```

**Fix:**
- Node.js was not installed correctly or PATH was not updated
- Reinstall Node.js from https://nodejs.org/ and restart your terminal

---

### ❌ Port already in use

**Symptom:**
```
error: address already in use :::5173
# or
ERROR: [Errno 98] Address already in use: port 8000
```

**Fix:**
Find and stop the process using that port.

macOS/Linux:
```bash
lsof -i :5173    # find which process
kill -9 <PID>    # replace <PID> with the number shown
```

Windows PowerShell:
```powershell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

Or simply close all terminals and reopen them.

---

### ❌ `npm install` fails

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
```

Also make sure you are in the `frontend/` directory, not the root.

---

### ❌ Virtual environment activation fails on Windows

**Symptom:**
```
cannot be loaded because running scripts is disabled on this system
```

**Fix:**
Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy RemoteSigned
```
Then try activating the venv again.

---

### ❌ `pip install` fails

**Fix:**
```bash
pip install --upgrade pip
pip install -e ".[dev]"
```

Make sure your virtual environment is activated (you see `(.venv)` in the prompt).

---

### ❌ Vite startup errors (missing packages)

**Fix:**
```bash
rm -rf node_modules
npm install
npm run dev
```

---

### ❌ Backend import errors

**Symptom:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Fix:**
Your virtual environment is not activated. Run:

macOS/Linux:
```bash
source .venv/bin/activate
```

Windows:
```powershell
.\.venv\Scripts\Activate.ps1
```

Then restart the backend server.

---

### ❌ Node version mismatch

**Symptom:**
```
error: The engine "node" is incompatible with this module
```

**Fix:**
Install Node.js 20 LTS from https://nodejs.org/ or use [nvm](https://github.com/nvm-sh/nvm) to switch versions:
```bash
nvm install 20
nvm use 20
```

---

### ❌ Frontend cannot connect to backend (CORS or network errors)

**Symptom:**
The frontend loads but backtests or indicator data fail silently or show errors.

**Check:**
1. Is the backend running? Visit http://localhost:8000/health
2. Does `frontend/.env` have `VITE_API_URL=http://localhost:8000`?
3. Try hard-refreshing the browser (Ctrl+Shift+R)

The frontend has built-in fallback calculations, so it will still work partially without the backend.

---

## 10. Learning Resources

### Python

- [Official Python Tutorial](https://docs.python.org/3/tutorial/) — the definitive beginner reference
- [Python for Everybody (freeCodeCamp)](https://www.youtube.com/watch?v=8DvywoWv6fI) — 14-hour beginner course on YouTube
- [Real Python](https://realpython.com/) — practical tutorials for all levels

### Node.js and JavaScript

- [Node.js Official Docs](https://nodejs.org/en/docs)
- [JavaScript Full Course (freeCodeCamp)](https://www.youtube.com/watch?v=PkZNo7MFNFg) — beginner JavaScript on YouTube
- [The Odin Project](https://www.theodinproject.com/) — free full-stack curriculum

### React and TypeScript

- [React Official Docs](https://react.dev/) — the best starting point for React
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React + TypeScript Tutorial (Jack Herrington)](https://www.youtube.com/watch?v=FJDVKeh7RJI)

### Vite

- [Vite Official Docs](https://vitejs.dev/guide/)
- [Vite Crash Course (Traversy Media)](https://www.youtube.com/watch?v=89NJdbYTgJ8)

### FastAPI

- [FastAPI Official Docs](https://fastapi.tiangolo.com/) — excellent, beginner-friendly documentation
- [FastAPI Tutorial (freeCodeCamp)](https://www.youtube.com/watch?v=0sOvCWFmrtA) — full course on YouTube

### Git and GitHub

- [Git Official Docs](https://git-scm.com/doc)
- [GitHub Skills](https://skills.github.com/) — interactive courses for beginners
- [Git and GitHub for Beginners (freeCodeCamp)](https://www.youtube.com/watch?v=RGOj5yH7evk)

### Quantitative Finance Basics

- [Quantitative Finance Reading List (QuantLib)](https://quantlib.org/)
- [Algorithmic Trading 101 (YouTube)](https://www.youtube.com/results?search_query=algorithmic+trading+for+beginners)

---

> Still stuck? Open an issue on [GitHub](https://github.com/yashvardhancse/QuantNova/issues) with your error message and operating system. The community is here to help.