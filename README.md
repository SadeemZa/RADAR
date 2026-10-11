# RADAR 📡

### Cybersecurity Intelligence & Vulnerability Tracking Platform

RADAR is a cybersecurity project that helps organize, track, and explore security vulnerabilities through an interactive dashboard.

The platform uses FastAPI, PostgreSQL, and the National Vulnerability Database (NVD) API to collect and manage CVE records.

## Features

- Interactive vulnerability dashboard.
- Import vulnerability data from NVD.
- Search and filter vulnerabilities.
- Filter records by severity and vendor.
- Store vulnerability records in PostgreSQL.
- REST API built with FastAPI.
- Update existing CVE records and prevent duplicates.

## Tech Stack

**Backend**
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL

**Frontend**
- Next.js
- React
- TypeScript
- CSS

**Data Source**
- National Vulnerability Database (NVD)

## Project Structure

```text
RADAR/
├── backend/
│   ├── app/
│   └── requirements.txt
├── frontend/
│   └── src/
├── .env.example
├── .gitignore
└── README.md

Getting Started
Backend
Open a terminal and run:
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

API: http://127.0.0.1:8000
API Documentation: http://127.0.0.1:8000/docs
Frontend
Open another terminal and run:
cd frontend
npm install
npm run dev

Dashboard: http://localhost:3000
NVD Integration
RADAR supports manually importing CVE records from the NVD API.
Automatic scheduled imports are not implemented yet.
Security
- Sensitive credentials must remain in environment variables.
- Never upload .env files or database passwords to GitHub.
- Configure the database connection before running the backend.
Development Status
RADAR is an ongoing cybersecurity project. The dashboard, API, database integration, vulnerability filtering, and manual NVD import have been implemented and tested locally.
More features and improvements are planned.
License
This project is currently intended for educational and portfolio purposes.