# RADAR 📡

> Keep track of what's new.

RADAR is a cybersecurity intelligence and case knowledge platform.

It collects cybersecurity information from trusted sources, transforms verified information into structured security cases, and makes historical cybersecurity cases searchable and understandable.

## Core Features

- Cybersecurity intelligence collection
- Vulnerability tracking
- Structured security cases
- Source verification
- Security View
- Developer View
- Similar Cases
- Search and filtering
- Telegram notifications

## Tech Stack

### Backend

- Python
- FastAPI
- PostgreSQL

### Frontend

- Next.js
- React
- TypeScript

### Data Sources

- NVD
- CISA Known Exploited Vulnerabilities
- GitHub Security Advisories
- Vendor security advisories
- Trusted cybersecurity RSS feeds

## Project Structure

```text
RADAR/
├── backend/
├── frontend/
├── README.md
├── .gitignore
└── .env.example


Development Status
RADAR is currently under active development.
The project is being built incrementally, starting with the backend foundation and data pipeline before expanding into the frontend intelligence dashboard.
Security
RADAR follows secure development practices including:
- Environment-based secrets
- Input validation
- Secure database access
- External URL validation
- Rate limiting
- Dependency management
- Security-focused logging
License
This project is currently for portfolio and educational development.