# QuantNova

[![Live Website](https://img.shields.io/badge/Live%20Website-QuantNova-blue?style=for-the-badge)](https://www.quantnova.in)
[![Setup Guide](https://img.shields.io/badge/Setup-Guide-blue?style=for-the-badge)](docs/SETUP.md)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Binance API](https://img.shields.io/badge/Binance%20API-Klines-F0B90B?logo=binance&logoColor=111827)](https://developers.binance.com/)
[![Lightweight Charts](https://img.shields.io/badge/Lightweight%20Charts-5-2962FF)](https://tradingview.github.io/lightweight-charts/)
[![Tests](https://img.shields.io/badge/tests-passing-16a34a)](#testing-and-checks)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)


---

QuantNova is an open-source GUI-based quantitative backtesting foundation for OHLCV market data, technical indicators, simple strategies, and beginner-friendly contribution.

This repository is intentionally scoped as an initial MVP for contributors. It currently does not include authentication, databases, brokerage integrations, payments, AI agents, or live trading execution.

## Quick Start

> 📖 New to development? Start with the [**Beginner Setup Guide**](docs/SETUP.md) first.

Get the project running locally in a few minutes.

### 1. Clone the repository

```bash
git clone https://github.com/yashvardhancse/QuantNova.git
cd QuantNova
```

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

- [Live Website](#live-website)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Quick Start](#quick-start)
- [Frontend Setup](#frontend-setup)
- [Backend Setup](#backend-setup)
- [API Endpoints](#api-endpoints)
- [Testing and Checks](#testing-and-checks)
- [CSV Format](#csv-format)
- [How to Contribute](#how-to-contribute)
- [Beginner Contribution Flow](#beginner-contribution-flow)
- [Contribution Workflow](#contribution-workflow)
- [Common Setup Issues](#Common Setup Issues)
- [Repository Labels](#repository-labels)
- [Known Limitations as of now](#known-limitations-as-of-now)
- [Architecture Workflow](#architecture-workflow)
- [Repository Structure](#repository-structure)
- [Roadmap](#roadmap)
- [License](#license)

---
## Live Website

[Visit QuantNova](https://www.quantnova.in)


QuantNova is an open-source GUI-based quantitative backtesting foundation for OHLCV market data, technical indicators, simple strategies, and beginner-friendly contribution.
...
This repository is intentionally scoped as an initial MVP for contributors. It currently does not include authentication, databases, brokerage integrations, payments, AI agents, or live trading execution.


---
## Features

- Dark React + Vite + TypeScript trading-terminal frontend
- Python + FastAPI backend
- Live Binance OHLCV candle fetches by symbol, interval, and date range
- Bundled sample BTC-USD OHLCV fallback data
- CSV/XLSX upload and OHLCV validation
- Technical indicators:
  - SMA
  - EMA
  - RSI
  - Bollinger Bands
- Moving average crossover backtest
- Backtest summary, Sharpe ratio, signals, equity curve, and trade log
- Interactive `lightweight-charts` candlestick/bar chart with SMA, signal, volume, zoom, and reset controls
- Frontend fallback calculations if the backend is not running
- Frontend and backend tests
- GitHub Actions CI for frontend and backend checks
- Open-source contribution docs, issue templates, PR template, labels, and license
...

---
## Tech Stack

Frontend:

- React
- Vite
- TypeScript
- Plain CSS
- Lightweight Charts
- Vitest
- ESLint
- Prettier

Backend:

- Python 3.11+
- FastAPI
- Uvicorn
- Pydantic
- Pytest
- HTTPX
- Pandas
- OpenPyXL
- Ruff
...

---
## Screenshots

Current UI screenshots are documented in `docs/FRONTEND.md` and stored under `docs/screenshots/`.

### Terminal Dashboard

![QuantNova terminal dashboard](docs/screenshots/screenshot2_api_connected.png)

### OHLCV Candlestick Chart with Signals

![QuantNova OHLCV candlestick chart with signals](docs/screenshots/ohlcv-candlestick-signals.png)

### Backtest History

![QuantNova backtest history](docs/screenshots/backtest-history.png)

...

---
## Quick Start

## Clone the Repository

```bash
git clone https://github.com/your-username/QuantNova.git
cd QuantNova
```
## Frontend Setup

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer

Verify installation:

```bash
node -v
npm -v
```

### Install dependencies

```bash
cd frontend
npm install
```

### Create environment file (optional)

If you want the frontend to communicate with the backend locally:

```bash
cd frontend
cp .env.example .env
```

Windows CMD:

```cmd
copy .env.example .env
```

### Start the frontend

```bash
cd frontend
npm run dev
```

Vite will print a local development URL, usually:

```text
http://localhost:5173
```

## Backend Setup

### Prerequisites

- Python 3.11 or newer

Verify installation:

```bash
python3 --version
```

### Create and activate virtual environment

#### macOS/Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
```

#### Windows PowerShell

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### Install backend dependencies

```bash
pip install -e ".[dev]"
```

### Start the backend server

```bash
uvicorn app.main:app --reload
```

The backend runs at:

```text
http://localhost:8000
```

### Verify backend health

Open:

```text
http://localhost:8000/health
```

The frontend reads `VITE_API_URL`, which defaults to:

```text
http://localhost:8000
```

## API Endpoints

- `GET /health` returns backend service status.
- `GET /api/sample-data` returns bundled OHLCV candles.
- `POST /api/upload-csv` validates and normalizes OHLCV CSV uploads.
- `POST /api/data/upload` validates and normalizes OHLCV CSV/XLSX uploads.
- `GET /market/binance/klines` fetches Binance public OHLCV candles.
- `POST /api/indicators` calculates SMA, EMA, RSI, and Bollinger Bands.
- `POST /api/backtest/ma-crossover` runs the moving-average crossover backtest.

## Testing and Checks

Frontend:

```bash
cd frontend
npm run lint
npm run format:check
npm test
npm run build
```

Backend:

```bash
cd backend
ruff check .
ruff format --check .
pytest
```

## CSV Format

CSV/XLSX uploads must include a time column such as `timestamp`, `date`, `datetime`, or `time`, plus these numeric columns:

```csv
timestamp,open,high,low,close,volume
2024-01-01,100,105,98,103,150000
```
...

---
## How to Contribute

1. Fork the repository.
2. Clone your fork locally.
3. Create a new branch using the naming convention in `CONTRIBUTING.md`.
4. Make a small, focused change.
5. Run the relevant frontend and backend checks.
6. Commit using a clear commit message.
7. Push your branch and open a pull request using the PR template.

## Beginner Contribution Flow

```text
Fork Repository
       ↓
Clone Your Fork
       ↓
Create New Branch
       ↓
Make Changes
       ↓
Run Tests & Checks
       ↓
Commit Changes
       ↓
Push Branch
       ↓
Open Pull Request
       ↓
Code Review & Merge
```

## Contribution Workflow

### 1. Fork the Repository

Fork the repository to your GitHub account.

### 2. Clone Your Fork Locally

```bash
git clone https://github.com/your-username/QuantNova.git
cd QuantNova
```

### 3. Create a New Branch

```bash
git checkout -b feature/your-feature-name
```

### 4. Make Changes and Run Checks

#### Frontend Checks

```bash
cd frontend
npm run lint
npm test
npm run build
```

#### Backend Checks

```bash
cd backend
ruff check .
pytest
```

### 5. Commit Your Changes

```bash
git add .
git commit -m "Add meaningful commit message"
```

### 6. Push Your Branch

```bash
git push origin feature/your-feature-name
```

### 7. Open a Pull Request

- Describe the changes clearly
- Link the related issue using:

```text
Fixes #issue-number
```
...

---
## Common Setup Issues

### `code .` command not working in terminal

Install the VS Code shell command:

1. Open VS Code
2. Press `Cmd + Shift + P`
3. Search for:

```text
Shell Command: Install 'code' command in PATH
```

4. Restart terminal

### Port already in use

If `5173` or `8000` is already occupied, stop the previous running process or change the port configuration.

### Python virtual environment activation fails

Ensure Python 3.11+ is installed and accessible from your terminal.

### `npm install` fails

Try removing `node_modules` and reinstalling:

```bash
rm -rf node_modules package-lock.json
npm install
```

### Backend dependencies fail to install

Upgrade pip:

```bash
pip install --upgrade pip
```

Example branch names:

```text
docs/readme-improvements
fix/csv-validation-error
feature/add-macd-indicator
```

Example commit messages:

```text
docs: improve onboarding instructions
fix: improve csv upload validation
feat: add macd indicator
```

Beginner-friendly tasks are listed in:

```text
docs/GOOD_FIRST_ISSUES.md
```

---
## Repository Labels

The starter labels are defined in `.github/labels.yml`:

- `good first issue`
- `bug`
- `feature`
- `help wanted`
- `documentation`

If the GitHub CLI is installed and authenticated, maintainers can apply or update the labels with:

```bash
bash scripts/setup-labels.sh
```

Without GitHub CLI, create the labels manually in the GitHub repository settings using `.github/labels.yml` as the source of truth.
...

---
## Known Limitations as of now

- No live trading or brokerage execution.
- No authentication or user accounts.
- No database or persisted backtest history.
- No order execution, portfolio accounting, or risk engine.
- Support/resistance zones are planned but not implemented yet.
...

---
## Architecture Workflow

```text
                +----------------------+
                |     React Frontend   |
                |  (Vite + TypeScript) |
                +----------+-----------+
                           |
                           | API Requests
                           v
                +----------------------+
                |    FastAPI Backend   |
                |  Validation & Logic  |
                +----------+-----------+
                           |
        -----------------------------------------
        |                    |                  |
        v                    v                  v
+---------------+   +----------------+   +------------------+
| Binance API   |   | Indicator Calc |   | Backtesting Logic|
| OHLCV Data    |   | SMA / EMA / RSI|   | Strategy Engine  |
+---------------+   +----------------+   +------------------+
                           |
                           v
                +----------------------+
                |  Chart Visualization |
                | Lightweight Charts   |
                +----------------------+
```


## Repository Structure

```text
frontend/   React + Vite + TypeScript terminal UI
backend/    Python + FastAPI validation, indicators, and backtesting API
docs/       Contributor docs, good first issues, and screenshots
.github/    Issue templates, PR template, labels, and CI
```
...

---
## Beginner Contributor Notes

If you are new to open source or quantitative finance projects:

- Start with documentation, UI polish, or small validation fixes.
- Read existing code before making large changes.
- Keep pull requests small and focused.
- Ask questions early if something is unclear.
- Avoid unrelated refactors in beginner pull requests.

Recommended first contribution types:

- Documentation improvements
- README cleanup
- Setup troubleshooting
- Small frontend fixes
- Accessibility improvements
- Additional tests


## Roadmap

- Add more indicators such as ATR and MACD.
- Improve CSV validation and documentation examples.
- Add more strategy examples.
- Add persisted backtest history when a database is introduced.
- Add demo GIFs and refresh screenshots as the UI evolves.
- Improve accessibility and keyboard navigation.
- Maybe create blog where users can share their strategies.
- take inspiration from takeprofit.com, croid.app, quantConnect, tradingview, Ai-trader GitHub repo
- add user authentication with login id password credentials. allow user to save strategies and backtest results.

<!--## Contact

Maintainer contact channel: add a GitHub Discussions link or community chat link before public program onboarding.-->
...

---
## License

MIT License. See `LICENSE`.
