# TalentBridge

An AI-powered career intelligence platform that helps job seekers understand exactly where they stand against any O\*NET occupation and what it takes to close the gap.

## What It Does

Candidates upload their résumé and TalentBridge produces a scored, skill-by-skill breakdown against any of the ~1,000 occupations in the U.S. Department of Labor O\*NET database. Each analysis returns an overall match percentage (skills 40%, experience 40%, education 20%), identifies specific strengths and gaps with severity ratings, and generates prioritised recommendations for closing those gaps.

Employers get a searchable, visibility-controlled candidate pool.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query |
| Backend | Spring Boot 3.3, Java 21, Spring Security (JWT), Spring AI |
| AI | Anthropic Claude (`claude-3-5-sonnet-20241022`) via Spring AI |
| Database | PostgreSQL with JSONB columns |
| File Storage | AWS S3 (résumé upload + presigned URLs) |
| Email | AWS SES (password reset) |
| Occupations | O\*NET Web Services API |
| Testing | JUnit 5 + Mockito (54 tests) · Jest + Testing Library (43 tests) |

## Project Structure

```
talentbridge/
├── talent-bridge/          # Next.js frontend (port 3000)
└── talent-bridge-api/      # Spring Boot REST API (port 8080)
```

## Getting Started

### Prerequisites

- Java 21
- Maven 3.9+
- Node.js 20+ and pnpm
- PostgreSQL 16
- Anthropic API key — [console.anthropic.com](https://console.anthropic.com/)
- O\*NET API key — [services.onetcenter.org/developer](https://services.onetcenter.org/developer/)
- AWS account (S3 bucket + SES verified sender) for file upload and email

### 1. Start the database

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432. Set `POSTGRES_PASSWORD` in your environment or a `.env` file (defaults to `localdev` for local development).

### 2. Configure the backend

Copy the example environment file and fill in your values:

```bash
cp .env.local.example .env.local
```

Required variables:

| Variable | Description |
|---|---|
| `DB_HOST / DB_PORT / DB_NAME` | PostgreSQL connection |
| `DB_USERNAME / DB_PASSWORD` | PostgreSQL credentials |
| `JWT_SECRET` | HMAC-SHA256 signing key — `openssl rand -base64 64` |
| `JWT_EXPIRATION` | Access token TTL in ms (e.g. `86400000` = 24 h) |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL in ms (e.g. `604800000` = 7 d) |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `ONET_API_KEY` | O\*NET Web Services key |
| `AWS_S3_RESUME_BUCKET` | S3 bucket for résumé storage |
| `AWS_SES_FROM_EMAIL` | Verified SES sender address |
| `CORS_ORIGINS` | Frontend origin (default `http://localhost:3000`) |
| `FRONTEND_URL` | Used in password reset emails (default `http://localhost:3000`) |

For VS Code, copy `.vscode/launch.json.example` to `.vscode/launch.json` and populate it.

### 3. Run the backend

```bash
cd talent-bridge-api
mvn spring-boot:run
# API available at http://localhost:8080/api
```

The schema is created automatically on first run via `spring.jpa.hibernate.ddl-auto`.

### 4. Run the frontend

```bash
cd talent-bridge
cp .env.local.example .env.local   # already set — no changes needed for local dev
pnpm install
pnpm dev
# UI available at http://localhost:3000
```

## Running Tests

```bash
# Backend (54 tests)
cd talent-bridge-api
mvn test

# Frontend (43 tests)
cd talent-bridge
pnpm test
pnpm test:coverage
```

## Architecture & Design

See [TALENTBRIDGE_CASE_STUDY.md](TALENTBRIDGE_CASE_STUDY.md) for the full technical case study covering:

- System architecture diagram
- Data model and entity relationships
- Security architecture (JWT, route guards, password reset flow)
- Full REST API reference
- AI integration deep dive (résumé parsing + gap analysis engine)
- O\*NET integration details
- Testing strategy
- Known gaps and roadmap

## License

This project is released for portfolio and educational purposes.
