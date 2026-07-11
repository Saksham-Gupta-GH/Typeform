# Typeform Clone

A full-stack Typeform clone built with Next.js, FastAPI, and SQLite. This project allows users to create highly customized, interactive forms with a drag-and-drop builder, and provides a polished, animated one-question-at-a-time filling experience for respondents.

**Live Demo:** [https://typeform-ivory.vercel.app](https://typeform-ivory.vercel.app)

## Tech Stack Used
- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS, Framer Motion, @dnd-kit (for drag and drop), lucide-react (for icons).
- **Backend**: Python 3, FastAPI, SQLAlchemy (ORM), Pydantic.
- **Database**: SQLite.
- **AI Integration**: OpenRouter API (`meta-llama/llama-3.2-3b-instruct:free`).

## System Architecture

The application is split into two distinct tiers:

1. **Frontend (Next.js 14, React, TailwindCSS, Framer Motion)**
   - **Builder App (`/builder/[id]`)**: A three-pane layout featuring a sortable question sidebar (`@dnd-kit`), a live preview canvas, and a dynamic settings panel.
   - **Respondent App (`/form/[shareToken]`)**: A highly polished, distraction-free filling experience utilizing `framer-motion` for smooth slide transitions and comprehensive client-side validation.
   - **Results Dashboard (`/results/[id]`)**: An analytical view displaying summary metrics and tabular submission data.
2. **Backend (Python, FastAPI, SQLAlchemy)**
   - A RESTful JSON API that handles all business logic.
   - Uses Pydantic for strict request/response validation.
   - Hosted on an Azure Virtual Machine.
3. **Database (SQLite)**
   - A single local file (`typeform_clone.db`) that guarantees persistent storage for forms, questions, and responses without the need for a complex cloud database.

## Database Schema

- **Form**: `id`, `title`, `share_token`, `status` (draft/published), `created_at`, `updated_at`.
- **Question**: `id`, `form_id`, `type`, `title`, `description`, `is_required`, `order_index`, `settings` (JSON blob for dynamic constraints like multiple choice options or min/max numeric limits).
- **Response**: `id`, `form_id`, `submitted_at`.
- **Answer**: `id`, `response_id`, `question_id`, `value` (stored as string to accommodate all types).

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run the API
uvicorn main:app --reload
```
The API will run at `http://localhost:8000`.

### 2. Database Seeding (Optional)
To populate the database with a pre-configured form and sample responses, run:
```bash
python seed.py
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Run the dev server
npm run dev
```
The application will run at `http://localhost:3000`.

## Deployment Strategy (Free Tier)

Given the constraints of using SQLite (which requires a persistent filesystem), standard serverless platforms for the backend are not viable. 
- **Frontend**: Deploy directly to **Vercel** for free.
- **Backend & Database**: Deploy to an **Azure Virtual Machine** (e.g., using the Azure for Students credit). You can clone the repository, install Python/FastAPI, and run the server using `uvicorn` or a process manager like `gunicorn` with persistent disk storage for the SQLite database.

## Key Features

- **Drag-and-Drop Reordering**: Built with `@dnd-kit`, allowing intuitive question organization that instantly persists to the database.
- **Dynamic Type Settings**: The builder intelligently alters the settings panel based on question type (e.g., exposing Min/Max for numbers, or an options array editor for multiple choice).
- **Keyboard Navigation**: Respondents can speed through forms using purely the `Enter` key.
- **Optimistic UI Rollbacks**: The builder implements optimistic updates to make the UI feel instantaneous, automatically rolling back state if the server request fails.

## Assumptions Made
1. **No authentication required for respondents**: As requested by the assignment, anyone with the shareable link can fill out the form.
2. **Simplified Creator Auth**: Creator authentication is simplified/assumed to be a default logged-in creator, so there is no complex login/signup flow for the workspace admin.
3. **Logic Jumps Included as Bonus**: Basic logic jumps (e.g. skipping questions) are fully implemented, allowing users to define rules on a per-question basis. Other placeholders like "Webhooks" or "Integrations" are omitted to maintain a clean UI.
4. **Local/VM Deployment**: The app uses SQLite for ease of setup and local/VM deployments. Standard serverless functions (like AWS Lambda or Vercel Serverless) are not ideal for the backend due to SQLite's need for a persistent file system, hence the Azure VM setup.

## API Overview

The FastAPI backend exposes the following key endpoints:

### Authentication
- `POST /auth/signup`: Create a new user account.
- `POST /auth/signin`: Authenticate and receive a JWT token.
- `GET /auth/verify`: Verify a JWT token's validity.

### Forms
- `GET /forms`: List all forms for the authenticated user.
- `POST /forms`: Create a new form.
- `GET /forms/{id}`: Retrieve a specific form.
- `PATCH /forms/{id}`: Update a form's metadata (e.g., title).
- `DELETE /forms/{id}`: Delete a form.
- `POST /forms/{id}/duplicate`: Duplicate an existing form.
- `POST /forms/{id}/publish`: Mark a form as published.
- `GET /forms/public/{share_token}`: Retrieve a published form for respondents (no auth required).

### Questions
- `GET /questions/form/{form_id}`: Get all questions for a specific form.
- `POST /questions`: Add a new question to a form.
- `PATCH /questions/{id}`: Update a question's content or settings.
- `DELETE /questions/{id}`: Remove a question.
- `POST /questions/reorder`: Reorder questions via drag-and-drop.

### Responses
- `GET /forms/{id}/responses`: Fetch all responses and answers for a specific form.
- `POST /forms/public/{share_token}/responses`: Submit a new response (no auth required).
