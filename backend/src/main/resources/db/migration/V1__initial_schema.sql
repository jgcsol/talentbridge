-- V1: Initial TalentBridge schema
-- Generated to match the JPA entity definitions

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(50)  NOT NULL,
    email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ
);

CREATE TABLE candidate_profiles (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL UNIQUE REFERENCES users(id),
    headline         VARCHAR(255),
    location         VARCHAR(255),
    summary          TEXT,
    resume_s3_key    VARCHAR(512),
    visibility       VARCHAR(50)  NOT NULL DEFAULT 'EMPLOYERS_ONLY',
    skills           JSONB,
    experiences      JSONB,
    educations       JSONB,
    certifications   JSONB,
    profile_complete BOOLEAN      NOT NULL DEFAULT FALSE,
    updated_at       TIMESTAMPTZ
);

-- GIN indexes for JSONB keyword search
CREATE INDEX idx_candidate_skills_gin      ON candidate_profiles USING GIN (skills);
CREATE INDEX idx_candidate_experiences_gin ON candidate_profiles USING GIN (experiences);

CREATE TABLE employer_profiles (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL UNIQUE REFERENCES users(id),
    company_name VARCHAR(255),
    industry     VARCHAR(255),
    company_size VARCHAR(50),
    website      VARCHAR(512),
    description  TEXT,
    location     VARCHAR(255),
    updated_at   TIMESTAMPTZ
);

CREATE TABLE job_postings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id     UUID         NOT NULL REFERENCES employer_profiles(id),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    location        VARCHAR(255),
    job_type        VARCHAR(50),
    status          VARCHAR(50)  NOT NULL DEFAULT 'OPEN',
    required_skills JSONB,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ
);

CREATE TABLE applications (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID        NOT NULL REFERENCES job_postings(id),
    candidate_id   UUID        NOT NULL REFERENCES candidate_profiles(id),
    status         VARCHAR(50) NOT NULL DEFAULT 'APPLIED',
    cover_letter   TEXT,
    applied_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ,
    UNIQUE (job_posting_id, candidate_id)
);

CREATE TABLE gap_analyses (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id     UUID        NOT NULL REFERENCES candidate_profiles(id),
    application_id   UUID                 REFERENCES applications(id),
    occupation_code  VARCHAR(20) NOT NULL,
    occupation_title VARCHAR(255),
    overall_score    INT,
    skill_score      INT,
    experience_score INT,
    education_score  INT,
    strengths        JSONB,
    gaps             JSONB,
    recommendations  JSONB,
    summary          TEXT,
    generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE password_reset_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token      VARCHAR(512) NOT NULL UNIQUE,
    user_id    UUID         NOT NULL REFERENCES users(id),
    expires_at TIMESTAMPTZ  NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
