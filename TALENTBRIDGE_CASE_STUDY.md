# TalentBridge — Full Case Study & Technical Documentation

---

## 1. Product Overview

TalentBridge is an AI-powered talent matching and career intelligence platform that bridges the gap between job seekers and employers. It is a dual-sided marketplace: candidates upload their résumé and receive a structured, data-backed gap analysis against any occupation in the U.S. Bureau of Labor Statistics O*NET database; employers search a pool of job-ready candidates filtered by skill and visibility preference.

The core value proposition is specificity. Rather than showing a generic job-fit percentage, TalentBridge produces a scored breakdown of skill alignment, experience relevance, and educational fit — each derived from Claude AI reasoning against real O*NET occupational requirements — along with a prioritised list of gaps and actionable recommendations for closing them.

### Who It Is For

| User Type | Core Job To Be Done |
|---|---|
| **Candidate** | Upload résumé → get AI analysis of skills vs. O*NET occupation → see exactly what is missing → take action |
| **Employer** | Search pre-screened candidates by keyword/skill → view profile with visibility-aware contact info |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────┐        ┌──────────────────────────────────────────┐
│         Next.js 14 Frontend         │  HTTP  │          Spring Boot 3.3.5 API           │
│         (port 3000)                 │◄──────►│          (port 8080, path /api)           │
│                                     │  JWT   │                                           │
│  Pages           State              │        │  Controllers    Services    Repositories  │
│  ─────────────── ───────────────    │        │  ─────────────────────────────────────   │
│  / (marketing)   TanStack Query     │        │  AuthController             UserRepo      │
│  /login          Axios + JWT        │        │  CandidateController        CandidateRepo │
│  /register       localStorage       │        │  EmployerController         EmployerRepo  │
│  /candidate/*    Cookie middleware  │        │  GapAnalysisController      GapAnalysisRepo│
│  /employer/*                        │        │  OnetController             AppRepo        │
└─────────────────────────────────────┘        └───────────────┬──────────────────────────┘
                                                               │
                        ┌──────────────────────────────────────┼──────────────────────┐
                        │                                       │                      │
               ┌────────▼────────┐              ┌──────────────▼──────┐  ┌────────────▼────────┐
               │   PostgreSQL    │              │  Anthropic Claude   │  │     AWS (us-east-1) │
               │  (primary DB)   │              │  claude-3-5-sonnet  │  │  S3 (résumés)       │
               │  JSONB columns  │              │  Spring AI 1.0.0-M4 │  │  SES (email)        │
               └─────────────────┘              └─────────────────────┘  └─────────────────────┘
                                                               │
                                                    ┌──────────▼──────────┐
                                                    │   O*NET Web API     │
                                                    │  (BLS occupations)  │
                                                    └─────────────────────┘
```

---

## 3. Technology Stack

### Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Java | 21 | LTS, virtual threads capable |
| Framework | Spring Boot | 3.3.5 | Web, Security, JPA, Validation |
| Database | PostgreSQL | latest | Primary persistence, JSONB columns for flexible data |
| ORM | Hibernate / Spring Data JPA | 6.x (via Boot) | Entity mapping, repositories |
| Migrations | Flyway | (via Boot) | Schema versioning |
| Security | Spring Security | 6.x | Stateless JWT filter chain |
| JWT | jjwt | 0.12.6 | Token generation and validation |
| AI | Spring AI (Anthropic) | 1.0.0-M4 | Structured prompts to Claude API |
| LLM | Anthropic Claude | claude-3-5-sonnet-20241022 | Résumé parsing + gap analysis |
| File Storage | AWS SDK v2 S3 | 2.26.12 | Résumé upload and presigned URLs |
| Email | AWS SDK v2 SES | 2.26.12 | Password reset transactional emails |
| Text Extraction | Apache Tika | 2.9.2 | PDF/DOCX → plain text for AI ingestion |
| Occupations API | O\*NET Web Services | REST | Occupation titles, skills, requirements |
| HTTP Client | Spring WebFlux WebClient | 6.x | Reactive O\*NET requests |
| Cache | Spring Cache (simple) | — | O\*NET responses cached in-memory |
| Code Generation | Lombok + MapStruct | 1.18.34 / 1.6.2 | Boilerplate reduction |
| Build | Maven | 3.9.x | Dependency management |

### Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | Next.js | 14.2.5 | App Router, SSR/CSR hybrid |
| Language | TypeScript | 5.5.3 | Type safety |
| UI | React | 18 | Component model |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Components | Radix UI | various | Accessible primitives (Dialog, Dropdown, Progress) |
| Server State | TanStack Query | v5 | API caching, loading/error states |
| HTTP | Axios | latest | HTTP client with JWT interceptors |
| Forms | react-hook-form + Zod | 7.x / 3.x | Typed form validation |
| Package Manager | pnpm | 10.x | Fast, disk-efficient installs |

### Testing

| Scope | Stack |
|---|---|
| Backend unit | JUnit 5 + Mockito |
| Backend web slice | `@WebMvcTest` + MockMvc + Spring Security Test |
| Backend DB | H2 (test scope, PostgreSQL MODE) |
| Frontend unit | Jest 30 + Testing Library React |
| Frontend DOM | jest-environment-jsdom |
| Frontend TS | ts-jest + ts-node |

---

## 4. Data Model

### Entity Relationships

```
users (1) ──────── (1) candidate_profiles
users (1) ──────── (1) employer_profiles
candidate_profiles (1) ──── (N) gap_analyses
candidate_profiles (N) ──── (N) job_postings   via applications
employer_profiles  (1) ──── (N) job_postings
gap_analyses       (N) ──── (1) applications   (optional FK)
```

### Table: `users`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK, generated |
| `email` | VARCHAR | Unique, not null |
| `password_hash` | VARCHAR | BCrypt |
| `role` | ENUM | `CANDIDATE` or `EMPLOYER` |
| `email_verified` | BOOLEAN | default false |
| `active` | BOOLEAN | default true, soft-disable accounts |
| `created_at` | TIMESTAMP | auto |
| `updated_at` | TIMESTAMP | auto |

### Table: `candidate_profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users, unique (1:1) |
| `headline` | VARCHAR | e.g. "Senior Software Engineer" |
| `location` | VARCHAR | — |
| `summary` | TEXT | AI-generated from résumé |
| `resume_s3_key` | VARCHAR | Path in S3 bucket |
| `visibility` | ENUM | `PUBLIC`, `EMPLOYERS_ONLY`, `PRIVATE` |
| `skills` | JSONB | `[{name, category, yearsExperience, proficiency}]` |
| `experiences` | JSONB | `[{title, company, startDate, endDate, description, current}]` |
| `educations` | JSONB | `[{degree, field, institution, year}]` |
| `certifications` | JSONB | `[{name, issuer, year}]` |
| `profile_complete` | BOOLEAN | set to true after résumé parse |
| `updated_at` | TIMESTAMP | auto |

**Design note:** Skills, experiences, educations, and certifications are stored as PostgreSQL JSONB rather than relational child tables. This allows schema-free evolution of the résumé data model without migrations, and enables GIN index-based full-text search directly on the JSONB column.

### Table: `employer_profiles`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `user_id` | UUID | FK → users, unique (1:1) |
| `company_name` | VARCHAR | — |
| `industry` | VARCHAR | — |
| `company_size` | VARCHAR | e.g. "50-200" |
| `website` | VARCHAR | — |
| `description` | TEXT | — |
| `location` | VARCHAR | — |
| `updated_at` | TIMESTAMP | auto |

### Table: `gap_analyses`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `candidate_id` | UUID | FK → candidate_profiles |
| `application_id` | UUID | FK → applications (nullable) |
| `occupation_code` | VARCHAR | O\*NET code, e.g. `15-1252.00` |
| `occupation_title` | VARCHAR | Human-readable |
| `overall_score` | INT | 0–100 weighted |
| `skill_score` | INT | 0–100 |
| `experience_score` | INT | 0–100 |
| `education_score` | INT | 0–100 |
| `strengths` | JSONB | `[{area, detail}]` |
| `gaps` | JSONB | `[{area, detail, severity}]` |
| `recommendations` | JSONB | `[{type, title, description}]` |
| `summary` | TEXT | 2–3 sentence AI narrative |
| `generated_at` | TIMESTAMP | auto |

### Table: `job_postings`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `employer_id` | UUID | FK → employer_profiles |
| `title` | VARCHAR | — |
| `description` | TEXT | — |
| `location` | VARCHAR | — |
| `job_type` | ENUM | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERNSHIP` |
| `status` | ENUM | `OPEN`, `CLOSED`, `DRAFT` |
| `required_skills` | JSONB | `["Java", "AWS", ...]` |
| `created_at` | TIMESTAMP | auto |
| `updated_at` | TIMESTAMP | auto |

### Table: `applications`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `job_posting_id` | UUID | FK → job_postings |
| `candidate_id` | UUID | FK → candidate_profiles |
| `status` | ENUM | `APPLIED`, `REVIEWING`, `SHORTLISTED`, `REJECTED`, `OFFER_EXTENDED`, `WITHDRAWN` |
| `cover_letter` | TEXT | optional |
| `applied_at` | TIMESTAMP | auto |
| `updated_at` | TIMESTAMP | auto |

**Constraint:** `UNIQUE(job_posting_id, candidate_id)` — one application per candidate per job.

### Table: `password_reset_tokens`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `token` | VARCHAR | UUID string, opaque |
| `user_id` | UUID | FK → users |
| `expires_at` | TIMESTAMP | 30 min from creation |
| `used` | BOOLEAN | one-time use |

---

## 5. Security Architecture

### Authentication Flow

```
Client                        API
──────                        ───
POST /auth/login
  {email, password}  ──────► validate credentials
                             generate JWT (24h) + refresh JWT (7d)
                     ◄──────  {accessToken, refreshToken, userId, email, role}

                             Tokens stored in:
                               localStorage: tb_access_token, tb_refresh_token, tb_user
                               Plain cookie:  tb_auth = {role}  (for middleware, 7d)

GET /candidates/me
  Authorization: Bearer <accessToken>  ──► JwtAuthFilter validates
                                           sets Authentication principal = UUID
                                ◄──────── profile JSON

POST /auth/refresh
  {refreshToken}  ──────► validate refresh token
                  ◄──────  new {accessToken, refreshToken, ...}

(401 on any request)  ──► clearAuth(), redirect /login
```

### JWT Token Structure

Tokens are signed with HMAC-SHA256 using a secret key from env var `JWT_SECRET`.

```json
{
  "sub": "uuid-of-user",
  "email": "user@example.com",
  "role": "CANDIDATE",
  "iat": 1714400000,
  "exp": 1714486400
}
```

- Access token TTL: 24 hours (`JWT_EXPIRATION` env var, in ms)
- Refresh token TTL: 7 days (`JWT_REFRESH_EXPIRATION` env var, in ms)

### JwtAuthFilter

`JwtAuthFilter extends OncePerRequestFilter` runs on every request:
1. Extracts Bearer token from `Authorization` header
2. Calls `jwtService.isValid(token)` — catches all JwtException subtypes
3. On valid token: parses claims, constructs `UsernamePasswordAuthenticationToken` with `UUID` as principal and `ROLE_<ROLE>` as authority
4. Stores in `SecurityContextHolder`
5. Continues filter chain

Controllers extract the user ID via `(UUID) auth.getPrincipal()`.

### Spring Security Configuration

```
/auth/**              → permit all (no token required)
/actuator/health      → permit all
everything else       → requires authenticated JWT
```

CSRF is disabled (stateless API). CORS allows `http://localhost:3000` (configurable via `app.cors.allowed-origins`).

`@EnableMethodSecurity` enables `@PreAuthorize` on individual endpoints:
- `@PreAuthorize("hasRole('EMPLOYER')")` — all employer endpoints
- `@PreAuthorize("hasRole('CANDIDATE')")` — gap analysis endpoints

### Frontend Route Guards

**Two-layer protection:**

1. **Next.js Middleware** (`src/middleware.ts`): Runs at the Edge before React renders. Reads the `tb_auth` cookie (JSON `{role}`). Redirects unauthenticated users to `/login?from=<path>`. Cross-redirects wrong-role users to their own dashboard. Applies to all `/candidate/*` and `/employer/*` routes.

2. **`useAuth` hook**: Client-side guard. On mount, checks `localStorage` for `tb_access_token` and `tb_user`. If either is missing (e.g. user cleared storage but cookie still exists), calls `clearAuth()` and redirects. Also enforces role on the client side.

### Password Reset Flow

```
1. POST /auth/forgot-password {email}
   → Always returns 204 (prevents email enumeration)
   → If email exists: deletes any existing reset tokens, generates UUID token,
     saves with 30-min expiry, sends HTML email via AWS SES

2. User clicks link: /reset-password?token=<uuid>

3. POST /auth/reset-password {token, password}
   → Validates token exists, not used, not expired
   → BCrypt-hashes new password, saves user
   → Marks token as used (one-time)
   → Returns 204
```

### Password Hashing

BCrypt via Spring Security's `BCryptPasswordEncoder`. Cost factor: Spring default (10 rounds).

---

## 6. API Reference

**Base URL:** `http://localhost:8080/api`

All authenticated endpoints require:
```
Authorization: Bearer <accessToken>
```

All error responses follow RFC 9457 Problem Details format:
```json
{
  "status": 400,
  "detail": "email: must be a well-formed email address"
}
```

---

### 6.1 Authentication — `/auth`

These endpoints are public (no JWT required).

---

#### `POST /auth/register`

Register a new user and create their profile stub.

**Request body:**
```json
{
  "email": "alice@example.com",
  "password": "mypassword123",
  "role": "CANDIDATE"
}
```

| Field | Validation |
|---|---|
| `email` | Must be a valid email format |
| `password` | Minimum 8 characters |
| `role` | `CANDIDATE` or `EMPLOYER` |

**Response: `201 Created`**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "alice@example.com",
  "role": "CANDIDATE"
}
```

**Errors:**
- `400 Bad Request` — validation failure (invalid email, short password)
- `400 Bad Request` — `"Email already in use"`

**Side effects:** Creates an empty `candidate_profiles` or `employer_profiles` row linked to the new user.

---

#### `POST /auth/login`

Authenticate with email and password.

**Request body:**
```json
{
  "email": "alice@example.com",
  "password": "mypassword123"
}
```

**Response: `200 OK`**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "alice@example.com",
  "role": "CANDIDATE"
}
```

**Errors:**
- `401 Unauthorized` — wrong email, wrong password, or inactive account

---

#### `POST /auth/refresh`

Exchange a refresh token for a new access + refresh token pair.

**Request body:**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Response: `200 OK`** — same shape as login response.

**Errors:**
- `401 Unauthorized` — invalid or expired refresh token

---

#### `POST /auth/forgot-password`

Trigger a password reset email. Always returns 204 regardless of whether the email exists (prevents enumeration).

**Request body:**
```json
{
  "email": "alice@example.com"
}
```

**Response: `204 No Content`**

**Side effects (if email exists):** Deletes previous reset tokens → generates new UUID token → saves with 30-min TTL → sends HTML email via AWS SES with link `<frontendUrl>/reset-password?token=<uuid>`.

---

#### `POST /auth/reset-password`

Set a new password using a reset token from email.

**Request body:**
```json
{
  "token": "uuid-from-email",
  "password": "newpassword123"
}
```

| Field | Validation |
|---|---|
| `token` | Not blank |
| `password` | Minimum 8 characters |

**Response: `204 No Content`**

**Errors:**
- `400 Bad Request` — `"Invalid or expired reset token"`
- `400 Bad Request` — `"Reset token has already been used"`
- `400 Bad Request` — `"Reset token has expired"`

---

### 6.2 Candidate Profile — `/candidates`

Requires: `Authorization: Bearer <CANDIDATE_token>`

---

#### `GET /candidates/me`

Retrieve the authenticated candidate's full profile.

**Response: `200 OK`**
```json
{
  "id": "uuid",
  "headline": "Senior Software Engineer",
  "location": "Austin, TX",
  "summary": "10 years building distributed systems...",
  "resumeS3Key": "resumes/uuid/resume.pdf",
  "visibility": "EMPLOYERS_ONLY",
  "skills": [
    { "name": "Java", "category": "Language", "yearsExperience": 8, "proficiency": "EXPERT" },
    { "name": "Spring Boot", "category": "Framework", "yearsExperience": 5, "proficiency": "ADVANCED" }
  ],
  "experiences": [
    {
      "title": "Senior Engineer",
      "company": "Acme Corp",
      "startDate": "2020-03",
      "endDate": null,
      "description": "Led migration to microservices...",
      "current": true
    }
  ],
  "educations": [
    { "degree": "BS", "field": "Computer Science", "institution": "UT Austin", "year": 2014 }
  ],
  "certifications": [
    { "name": "AWS Solutions Architect", "issuer": "Amazon", "year": 2022 }
  ],
  "profileComplete": true,
  "updatedAt": "2026-04-28T10:00:00Z"
}
```

**Errors:**
- `404 Not Found` — profile not found (should not happen in normal flow; profile is created on register)

---

#### `PATCH /candidates/me`

Partially update the candidate's profile. All fields are optional; only non-null fields are applied.

**Request body** (all fields optional):
```json
{
  "headline": "Principal Engineer",
  "location": "Remote",
  "summary": "Updated summary...",
  "visibility": "PUBLIC",
  "skills": [...],
  "experiences": [...],
  "educations": [...],
  "certifications": [...]
}
```

**Visibility options:** `PUBLIC` | `EMPLOYERS_ONLY` | `PRIVATE`

**Response: `200 OK`** — full updated profile (same shape as GET).

---

#### `POST /candidates/me/resume`

Upload a résumé file (PDF or DOCX). Triggers AI parsing.

**Request:** `multipart/form-data` with field `file`.

**Processing pipeline:**
1. File is uploaded to S3 at key `resumes/<userId>/<filename>`
2. Apache Tika extracts raw text from the PDF/DOCX bytes
3. Extracted text is sent to Claude (claude-3-5-sonnet-20241022) with a structured system prompt
4. Claude returns JSON matching the `ParsedResume` schema
5. Profile is updated: headline, summary, skills, experiences, educations, certifications, `profileComplete = true`

**Response: `200 OK`** — full updated profile.

**Errors:**
- `500 Internal Server Error` — S3 upload failure or AI parsing failure

**File size limit:** 10 MB (configurable via `spring.servlet.multipart.max-file-size`).

---

### 6.3 Employer Profile & Candidate Search — `/employers`

Requires: `Authorization: Bearer <EMPLOYER_token>` + `ROLE_EMPLOYER` authority.

---

#### `GET /employers/me`

Retrieve the authenticated employer's company profile.

**Response: `200 OK`**
```json
{
  "id": "uuid",
  "companyName": "TechCorp Inc.",
  "industry": "Software",
  "companySize": "200-500",
  "website": "https://techcorp.io",
  "description": "We build developer tools...",
  "location": "San Francisco, CA",
  "updatedAt": "2026-04-28T10:00:00Z"
}
```

---

#### `PATCH /employers/me`

Partially update the employer's company profile.

**Request body** (all fields optional):
```json
{
  "companyName": "TechCorp Inc.",
  "industry": "Software",
  "companySize": "200-500",
  "website": "https://techcorp.io",
  "description": "We build developer tools...",
  "location": "San Francisco, CA"
}
```

**Response: `200 OK`** — full updated profile.

---

#### `GET /employers/candidates/search`

Search the candidate pool with keyword filtering and pagination.

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `keyword` | string | — | Filter by headline or summary (case-insensitive LIKE) |
| `page` | int | `0` | Zero-indexed page number |
| `size` | int | `20` | Page size |

**Filtering rules (always applied):**
- Visibility must not be `PRIVATE`
- `profileComplete` must be `true`

**Response: `200 OK`** — Spring `Page<CandidateSearchResult>`
```json
{
  "content": [
    {
      "id": "uuid",
      "headline": "Senior Software Engineer",
      "location": "Remote",
      "summary": "10 years in distributed systems...",
      "skills": [...],
      "educations": [...],
      "visibility": "EMPLOYERS_ONLY",
      "email": null
    }
  ],
  "totalElements": 47,
  "totalPages": 3,
  "number": 0,
  "size": 20
}
```

**Email visibility rule:**
- `visibility = PUBLIC` → `email` field is populated with the candidate's email
- `visibility = EMPLOYERS_ONLY` → `email` is `null`

---

#### `GET /employers/candidates/{candidateId}`

Fetch a single candidate's public-facing profile by their profile UUID.

**Path variable:** `candidateId` — UUID of the `candidate_profiles` row.

**Response: `200 OK`** — same `CandidateSearchResult` shape as above.

**Errors:**
- `404 Not Found` — candidate ID does not exist
- `404 Not Found` (via `IllegalStateException`) — profile has `PRIVATE` visibility (treated as not found to prevent probing)

---

### 6.4 O\*NET Occupations — `/onet`

Requires authentication (any role). Responses are cached in-memory.

---

#### `GET /onet/occupations/search`

Search O\*NET occupations by keyword.

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `keyword` | string | required | Search term (e.g. `"software engineer"`) |
| `start` | int | `1` | Pagination start index (1-based) |
| `end` | int | `20` | Pagination end index |

**Response: `200 OK`** — O\*NET `OnetSearchResult` with matching occupation list. Cached per `keyword + start` key for 24 hours.

---

#### `GET /onet/occupations/{code}`

Get full occupation details including required skills.

**Path variable:** `code` — O\*NET SOC code, e.g. `15-1252.00`.

**Processing:** Makes two parallel WebClient calls to O\*NET — one for occupation metadata, one for skills — and merges them via `OnetResponseMapper`.

**Response: `200 OK`** — `OnetOccupation` with title, description, industry, and `requiredSkills` array. Cached per code.

---

#### `GET /onet/industries`

List all O\*NET career clusters / industry categories.

**Response: `200 OK`** — array of `OnetIndustry` objects. Cached globally.

---

### 6.5 Gap Analysis — `/gap-analysis`

Requires: `Authorization: Bearer <CANDIDATE_token>` + `ROLE_CANDIDATE` authority.

---

#### `POST /gap-analysis?occupationCode={code}`

Run an AI gap analysis comparing the candidate's profile to an O\*NET occupation.

**Query parameter:** `occupationCode` — e.g. `15-1252.00`

**Processing pipeline:**
1. Loads candidate's full profile from DB
2. Fetches O\*NET occupation details (from cache or live API)
3. Serializes candidate summary (headline, summary, skills, experiences, educations, certifications) to JSON
4. Constructs a two-part prompt for Claude:
   - **System prompt:** Instructs Claude to act as a "career intelligence engine," defines exact JSON output schema, and specifies the scoring rubric (skills 40%, experience 40%, education 20%)
   - **User message:** Provides candidate JSON + occupation JSON, asks for gap analysis
5. Calls Claude via `ChatClient`, receives raw JSON string
6. Deserializes JSON into `GapAnalysisResult`
7. **Upserts** to DB: deletes any existing analysis for this candidate + occupation code pair, saves new record
8. Returns saved entity

**Scoring rubric (from Claude system prompt):**
- `skillScore` — % of required O\*NET skills the candidate possesses, weighted by importance
- `experienceScore` — relevance and depth of work experience to the role
- `educationScore` — how well education meets the role's requirements
- `overallScore` — weighted average: skills 40% + experience 40% + education 20%

**Response: `200 OK`**
```json
{
  "id": "uuid",
  "occupationCode": "15-1252.00",
  "occupationTitle": "Software Developers",
  "overallScore": 74,
  "skillScore": 82,
  "experienceScore": 78,
  "educationScore": 45,
  "strengths": [
    { "area": "Backend Engineering", "detail": "Strong Java and Spring Boot experience directly applicable to this role." }
  ],
  "gaps": [
    { "area": "Cloud Infrastructure", "detail": "Role requires AWS/Azure experience not evidenced in profile.", "severity": "HIGH" },
    { "area": "CI/CD Pipelines", "detail": "No mention of GitLab CI or GitHub Actions.", "severity": "MEDIUM" }
  ],
  "recommendations": [
    { "type": "CERTIFICATION", "title": "AWS Solutions Architect Associate", "description": "Directly addresses the cloud gap identified in this analysis." },
    { "type": "TRAINING", "title": "Docker & Kubernetes Fundamentals", "description": "Containerisation is a listed requirement for this SOC code." }
  ],
  "summary": "Strong backend foundation with 8 years of Java experience. The primary gap is cloud infrastructure depth — obtaining AWS certification and hands-on Kubernetes experience would close ~60% of the identified skill gap.",
  "generatedAt": "2026-04-29T14:00:00Z"
}
```

**Gap severity values:** `LOW`, `MEDIUM`, `HIGH`
**Recommendation types:** `TRAINING`, `CERTIFICATION`, `EXPERIENCE`, `EDUCATION`

**Errors:**
- `500 Internal Server Error` — Claude API failure or JSON deserialization error

---

#### `GET /gap-analysis/history`

Retrieve all gap analyses previously run by the authenticated candidate.

**Response: `200 OK`** — array of `GapAnalysis` objects (same shape as above), sorted by database insertion order.

---

## 7. Frontend Application

### Pages

| Route | Component | Auth | Description |
|---|---|---|---|
| `/` | `HomePage` | Public | Marketing landing page |
| `/login` | `LoginPage` | Public | Email/password login form |
| `/register` | `RegisterPage` | Public | Role-select + registration form |
| `/forgot-password` | `ForgotPasswordPage` | Public | Email entry for reset link |
| `/reset-password` | `ResetPasswordPage` | Public | New password form (token from URL) |
| `/candidate/dashboard` | `CandidateDashboard` | CANDIDATE | Stats, recent analyses, completeness widget |
| `/candidate/profile` | `CandidateProfilePage` | CANDIDATE | Edit profile, upload résumé |
| `/candidate/explore` | `ExplorePage` | CANDIDATE | Search O\*NET occupations, trigger analyses |
| `/candidate/gap-analysis` | `GapAnalysisPage` | CANDIDATE | View detailed gap analysis results |
| `/employer/dashboard` | `EmployerDashboard` | EMPLOYER | Company stats overview |
| `/employer/search` | `EmployerSearchPage` | EMPLOYER | Search and browse candidate pool |

### Key Flows

#### Candidate Onboarding
1. `/register?role=CANDIDATE` → form validation (Zod) → `POST /auth/register` → `saveAuth()` → redirect `/candidate/dashboard`
2. Dashboard shows `ProfileCompleteness` widget — prompts to upload résumé
3. `/candidate/profile` → file input → `POST /candidates/me/resume` (multipart) → AI parses → profile populates automatically

#### Gap Analysis Flow
1. `/candidate/explore` → type keyword or click quick-search chip → TanStack Query fetches `GET /onet/occupations/search`
2. User clicks "Analyze my fit" on any occupation card → `useMutation` calls `POST /gap-analysis?occupationCode=XX-XXXX.XX`
3. On success: invalidates `gap-analyses` query cache → redirect `/candidate/gap-analysis`
4. Page shows `ScoreRing` SVG rings for overall/skill/experience/education scores, expandable strengths/gaps/recommendations lists

#### Employer Search Flow
1. `/employer/search` → keyword input → `GET /employers/candidates/search?keyword=...`
2. Two-column layout: candidate list on left, detail panel on right
3. Click candidate → detail panel shows skills, experience, education, contact info (if PUBLIC)

### State Management

- **Server state:** TanStack Query with query keys: `['candidate-profile']`, `['gap-analyses']`, `['onet-search', keyword]`, `['candidate-search', keyword, page]`
- **Auth state:** Plain functions — `saveAuth()`, `clearAuth()`, `getToken()`, `getStoredUser()` — reading/writing `localStorage` directly. No global store.
- **Form state:** react-hook-form with Zod schema resolvers on all auth forms.

### Auth Storage

```
localStorage:
  tb_access_token   → JWT (24h)
  tb_refresh_token  → JWT (7d)
  tb_user           → JSON { userId, email, role }

document.cookie:
  tb_auth           → JSON { role } encoded, 7d, SameSite=Lax
                      (readable by Next.js Edge middleware — not HttpOnly)
```

### Profile Completeness Scoring

`calcCompleteness()` in `src/lib/completeness.ts` produces a 0–100 score:

| Item | Points |
|---|---|
| Upload résumé | 20 |
| 3+ skills | 20 |
| Work experience (1+ roles) | 20 |
| Professional headline | 10 |
| 8+ skills with proficiency | 10 |
| Education (1+ entry) | 10 |
| Non-private visibility | 5 |
| Location set | 5 |
| **Total** | **100** |

Tier thresholds: starter (0–34), building (35–64), strong (65–89), complete (90–100).

---

## 8. AI Integration Deep Dive

### Résumé Parser

**File:** `ResumeParserService.java`

**Input:** PDF or DOCX file (up to 10 MB)

**Step 1 — Text extraction:** Apache Tika's `Tika.parseToString()` handles both PDF and DOCX formats, stripping formatting and extracting raw plain text. Tika auto-detects MIME type from content (not filename extension).

**Step 2 — Structured extraction via Claude:**

System prompt instructs Claude to return only valid JSON (no markdown fences) matching this exact schema:
```json
{
  "headline": "string",
  "summary": "string",
  "skills": [{"name", "category", "yearsExperience", "proficiency"}],
  "experiences": [{"title", "company", "startDate", "endDate", "description", "current"}],
  "educations": [{"degree", "field", "institution", "year"}],
  "certifications": [{"name", "issuer", "year"}]
}
```

Proficiency levels: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`

The user message is: `"Parse this resume:\n\n" + resumeText`.

Response is deserialized by Jackson's `ObjectMapper.readValue()` into `ParsedResume`. If Claude returns malformed JSON, the exception propagates as a 500.

### Gap Analysis Engine

**File:** `GapAnalysisService.java`

**Input:** `CandidateProfile` (from DB) + `OnetOccupation` (from cache or O\*NET API)

**Candidate data sent to Claude:**
- headline, summary
- skills (name, category, years, proficiency)
- experiences (title, company, dates, description, current)
- educations (degree, field, institution, year)
- certifications (name, issuer, year)

**Occupation data sent to Claude:**
- O\*NET SOC code, title, description, industry
- `requiredSkills` array from O\*NET (with importance weights)

**System prompt key section (scoring rubric):**
```
- skillScore:      % of required O*NET skills the candidate possesses (weighted by importance)
- experienceScore: relevance and depth of work experience to the role
- educationScore:  how well education meets the role's requirements
- overallScore:    weighted average (skills 40%, experience 40%, education 20%)
```

**Upsert strategy:** On each analysis call, any existing `GapAnalysis` row for the same `(candidateId, occupationCode)` pair is deleted before saving the new result. This keeps exactly one analysis per occupation per candidate and ensures the latest Claude response is always canonical.

**Model configuration:** `claude-3-5-sonnet-20241022`, max tokens 4096 (set in `application.yml`).

---

## 9. O\*NET Integration

The O\*NET Web Services API (operated by the U.S. Department of Labor) provides the occupational backbone of the platform.

**Authentication:** HTTP Basic Auth using the O\*NET API key as both username and password (Base64 encoded per O\*NET documentation).

**Caching:** Spring Cache with `@Cacheable` annotations. Cache TTL: 24 hours (configured but not enforced at framework level with the `simple` cache provider — in production this should be replaced with Redis + TTL).

Three endpoints are consumed:

| O\*NET Endpoint | Usage |
|---|---|
| `GET /mnm/search?keyword=&start=&end=` | Occupation search for the Explore page |
| `GET /online/occupations/{code}` | Occupation metadata for gap analysis |
| `GET /online/occupations/{code}/skills` | Skill requirements for gap analysis |
| `GET /mnm/careers` | Industry/career cluster listing |

The occupation detail and skills are fetched as parallel `WebClient` calls, then merged by `OnetResponseMapper` into the internal `OnetOccupation` record.

---

## 10. File Storage

### Upload

`S3Service.upload(key, file)` calls `S3Client.putObject()` with:
- Bucket: from `app.aws.s3.bucket` env var
- Key: `resumes/<userId>/<originalFilename>`
- Content-Type: from multipart upload

### Presigned URLs

`S3Service.generatePresignedUrl(key, duration)` creates a time-limited S3 GET URL via `S3Presigner`. This can be used to serve résumé downloads without exposing the bucket publicly.

### AWS Region

Configured to `us-east-1`. Both S3 and SES clients use this region. AWS credentials are expected from the standard credential chain (env vars, IAM role, etc.).

---

## 11. Error Handling

`GlobalExceptionHandler` (`@RestControllerAdvice`) maps exceptions to RFC 9457 Problem Details:

| Exception | HTTP Status | When |
|---|---|---|
| `BadCredentialsException` | 401 Unauthorized | Wrong password, invalid token |
| `IllegalArgumentException` | 400 Bad Request | Duplicate email, invalid reset token, business rule violations |
| `IllegalStateException` | 404 Not Found | Profile not found, private candidate |
| `AuthorizationDeniedException` | 403 Forbidden | Wrong role for endpoint |
| `MethodArgumentNotValidException` | 400 Bad Request | Bean Validation failures (field-level messages) |
| `Exception` (catch-all) | 500 Internal Server Error | Unexpected errors (logged at ERROR level) |

---

## 12. Configuration & Environment Variables

### Backend (`application.yml`)

| Variable | Description |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME` | PostgreSQL connection |
| `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL credentials |
| `JWT_SECRET` | HMAC-SHA256 signing key (min 32 chars) |
| `JWT_EXPIRATION` | Access token TTL in milliseconds (e.g. `86400000` = 24h) |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL in milliseconds (e.g. `604800000` = 7d) |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `AWS_S3_RESUME_BUCKET` | S3 bucket name for résumé storage |
| `AWS_SES_FROM_EMAIL` | Verified SES sender address |
| `ONET_API_KEY` | O\*NET Web Services API key |
| `CORS_ORIGINS` | Allowed frontend origin (e.g. `http://localhost:3000`) |
| `FRONTEND_URL` | Base URL used in password reset email links |

### Frontend

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (defaults to `http://localhost:8080/api`) |

---

## 13. Testing

### Backend Test Suite (54 tests)

| File | Type | Count | Coverage |
|---|---|---|---|
| `JwtServiceTest` | Unit | 8 | Token generation, validation, expiry, wrong key, empty token |
| `AuthServiceTest` | Unit (Mockito) | 12 | Register (CANDIDATE/EMPLOYER/duplicate), login (valid/bad email/bad password/inactive), forgot-password, reset-password (valid/used/expired) |
| `AuthControllerTest` | `@WebMvcTest` | 10 | All auth endpoints with valid and invalid inputs |
| `CandidateProfileServiceTest` | Unit (Mockito) | 6 | Create, get, update, upload+parse résumé |
| `CandidateControllerTest` | `@WebMvcTest` | 3 | GET /me, PATCH /me, 404 case |
| `CandidateSearchServiceTest` | Unit (Mockito) | 7 | Search with keyword, null keyword, getById for PUBLIC/EMPLOYERS_ONLY/PRIVATE, unknown ID, email exposure |
| `EmployerControllerTest` | `@WebMvcTest` | 6 | GET /me, PATCH /me, search with results/empty, getById 200/404 |
| `GapAnalysisServiceTest` | Unit (Mockito) | 2 | analyzeAndSave creates new, upserts existing |

**Test infrastructure:**
- `application-test.yml`: H2 in-memory DB (`MODE=PostgreSQL`), Flyway disabled, stub credentials
- `TestSecurityConfig`: Permissive `@TestConfiguration` security (permits all, no CSRF) for `@WebMvcTest` slices
- All controller tests use `@MockBean JwtService` (required because `JwtAuthFilter` is a `@Component`)
- Controller tests use `SecurityMockMvcRequestPostProcessors.authentication()` to inject a mock UUID principal

### Frontend Test Suite (43 tests)

| File | Count | Coverage |
|---|---|---|
| `auth.test.ts` | 10 | `saveAuth`, `clearAuth`, `getToken`, `getStoredUser`, `isLoggedIn` — full storage lifecycle |
| `utils.test.ts` | 12 | `cn`, `scoreColor`, `scoreBg`, `severityColor`, `formatDate` |
| `completeness.test.ts` | 10 | Each scoring item individually, tier thresholds, undefined profile |
| `SkillBadge.test.tsx` | 6 | Render name, render/omit years, proficiency styles, fallback style |

Run commands:
```bash
# Frontend
pnpm test
pnpm test:coverage

# Backend
JAVA_HOME="/path/to/jdk-21" mvn test -Dspring.profiles.active=test
```

---

## 14. Known Gaps & Roadmap Items

The following entities are modelled in the database but do not yet have active API controllers or frontend pages:

| Feature | Status | Notes |
|---|---|---|
| Job Postings | Schema ready (`job_postings` table) | No CRUD controller implemented |
| Applications | Schema ready (`applications` table + status enum) | No application submission flow |
| Token refresh automation | Manual via `POST /auth/refresh` | Frontend does not auto-retry on 401 with refresh token — just clears and redirects to login |
| Redis cache | Dependency present but excluded via `autoconfigure.exclude` | O\*NET cache is in-memory; no TTL enforcement |
| Email verification | `email_verified` column exists | No verification flow implemented |
| Flyway migrations | Enabled in production config | No migration files exist in `src/main/resources/db/migration/` — schema is created via `ddl-auto: create` |
| Presigned URL endpoint | `S3Service.generatePresignedUrl()` exists | No endpoint exposes résumé download |
| HTTPS / production CORS | Hardcoded to localhost | Needs env-specific CORS config |

---

## 15. Running Locally

### Backend prerequisites
- Java 21
- Maven 3.9+
- PostgreSQL running on port 5432
- All env vars set (see Section 12 — copy `.env.local.example` to `.env.local`)

```bash
cd talent-bridge-api
mvn spring-boot:run
# API available at http://localhost:8080/api
```

### Frontend prerequisites
- Node.js 20+
- pnpm

```bash
cd talent-bridge
cp .env.local.example .env.local
pnpm install
pnpm dev
# UI available at http://localhost:3000
```
