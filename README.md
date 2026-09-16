# Fleet Management Dataset — Prototype

This workspace contains a Python backend (simple HTTP API) and a Vite React frontend.

Quick start (development):

Backend

```bash
# create and activate virtualenv
python -m venv .venv
. .venv/bin/activate

# install
pip install -r requirements.txt

# run tests
python -m unittest discover -s tests -v

# run the server (example)
python server/server.py
```

Frontend

```bash
cd frontend
npm install
npm run dev
```

Authentication

- The backend exposes `/api/auth/login` and `/api/auth/refresh` endpoints.
- The frontend stores `access_token` and `refresh_token` in `localStorage` and the `apiFetch()` helper attaches `Authorization` and `X-Tenant-Id` headers.

CI

A GitHub Actions workflow is provided at `.github/workflows/ci.yml` that runs Python tests, linting, and builds the frontend on push/PR.

Contributing

Open an issue or PR and run the tests locally before submitting changes.
