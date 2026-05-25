"""DALTI Backend — README."""

# DALTI API — Smart Queue Management

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt

# Copy env template and fill in values
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux

# Run the corrected schema.sql in your Supabase SQL Editor

# Start the server
python run.py
```

## Architecture

```
routes (blueprints) → services → repositories → Supabase
```

- **Blueprints**: HTTP handling, input validation, response formatting
- **Services**: Business logic, orchestration  
- **Repositories**: Database queries via Supabase REST client

## API Base URL

```
http://localhost:5000/api
```

## Auth

All protected routes require `Authorization: Bearer <access_token>` header.

## Environment Variables

See `.env.example` for all required configuration.
