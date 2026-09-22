# Architecture

## High-Level Architecture

The platform uses a typical modern web stack consisting of a separate frontend, backend, and database.

```
Next.js Frontend (React, Tailwind) 
       | (REST API)
       v
FastAPI Backend (Python)
       | (PyMongo/Motor)
       v
MongoDB Database
```

## Phase 1: Project Foundation
In Phase 1, we set up the frontend and backend without a database connection. The Next.js frontend communicates with the FastAPI backend, which has a basic `/health` endpoint to verify connectivity.

## Phase 2: MongoDB Integration
In Phase 2, we integrated MongoDB into the FastAPI backend using `motor`. We use environment variables `MONGODB_URL` and `MONGODB_DATABASE` to establish the connection on application startup, and provide a `/health/db` endpoint to verify database connectivity.

## Phase 3: REST API Foundation
In Phase 3, we created the `/api/v1` structure with placeholder routes for users, projects, and tasks. We also introduced Pydantic schemas, centralized exception handling for `RequestValidationError` and `Exception`, and basic route testing.

## Phase 4: Authentication
In Phase 4, we implemented stateless JWT authentication using `python-jose` and secure password hashing using `passlib` with bcrypt. Endpoints for `/register`, `/login`, and `/logout` were added. The `get_current_user` dependency protects secured routes, validating JWTs directly against MongoDB.

## Phase 5: Project Management
In Phase 5, we implemented authenticated CRUD endpoints for projects under `/api/v1/projects`. Users can create, read, update, and delete their own projects. Access control restricts users to only their owned projects using the `get_current_user` dependency and MongoDB ownership checks.

## Phase 6: Task Management
In Phase 6, we implemented Task CRUD endpoints (`/api/v1/tasks`) featuring status ("Todo", "In Progress", "Completed") and priority ("Low", "Medium", "High") fields. Authorization verifies that a user owns the linked project before allowing task creation or reassignment. The listing endpoint also supports filtering and searching by these attributes.
