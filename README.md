# Amrita Community Forum - Sprint 2

Sprint 2 upgrades the project from a static SPA into a full-stack web platform using the requested stack.

## Tech stack

### Frontend
- React.js
- Tailwind CSS
- Axios
- React Router DOM

### Backend
- Node.js
- Express.js

### Database
- PostgreSQL

### Auth and security
- bcrypt
- JSON Web Token (JWT)

### Tools
- Git
- GitHub
- Postman
- npm

## Project structure

```
Software_Engineering/
├─ client/                  # React + Tailwind frontend
│  ├─ src/
│  │  ├─ components/
│  │  ├─ context/
│  │  ├─ lib/
│  │  └─ pages/
│  └─ package.json
├─ server/                  # Express + PostgreSQL backend
│  ├─ db/schema.sql
│  ├─ src/
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ routes/
│  │  ├─ app.js
│  │  └─ server.js
│  └─ package.json
├─ index.html               # Sprint 1 static legacy
├─ app.js                   # Sprint 1 static legacy
└─ styles.css               # Sprint 1 static legacy
```

## Sprint 2 implemented modules

- Authentication
	- Register and login
	- JWT-based protected routes
	- Password hashing via bcrypt
- Task marketplace
	- Create tasks (creator side)
	- Browse/filter open tasks (solver side)
	- Submit proposals
	- Task status lifecycle fields prepared
- Discussions
	- Create community posts by category
	- Upvote/downvote posts
	- Add comments to posts
- Profile analytics
	- Tasks created/completed/disputed
	- Proposals submitted/accepted
	- Reputation display

## Sprint 1 modules now on full-stack pipeline

- Header and navigation management via routed React layout
- Login and register management using Express + JWT auth
- Profile and skill tag management (`PUT /profile/me/skills`)
- My Tasks creator workspace with status lanes and proposal inbox
- Browse Tasks solver workflow with filters, detail panel, proposal submission, and proposal tracking
- Tech News feed with category filtering and trending discussions
- Reputation and analytics summary integrated into profile

## API summary

Base URL: `http://localhost:5000/api`

- Auth
	- `POST /auth/register`
	- `POST /auth/login`
	- `GET /auth/me`
- Tasks
	- `GET /tasks`
	- `GET /tasks/:id`
	- `POST /tasks`
	- `PATCH /tasks/:id`
	- `DELETE /tasks/:id`
	- `POST /tasks/:id/proposals`
	- `GET /tasks/mine/created`
	- `GET /tasks/mine/proposals`
	- `GET /tasks/mine/received-proposals`
	- `PATCH /tasks/proposals/:proposalId`
- Discussions
	- `GET /posts`
	- `GET /posts/trending`
	- `GET /posts/:id`
	- `POST /posts`
	- `POST /posts/:id/comments`
	- `POST /posts/:id/vote`
- Profile
	- `GET /profile/me`
	- `PUT /profile/me/skills`

## Setup instructions

## 1) Database

Create a PostgreSQL database (example name: `acf_db`) and run:

```sql
-- From psql
\i server/db/schema.sql
```

## 2) Backend

```bash
cd server
cp .env.example .env
# Update DATABASE_URL and JWT_SECRET in .env
npm install
npm run dev
```

Backend runs at `http://localhost:5000`.

## 3) Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Postman testing flow (recommended)

1. Register user: `POST /api/auth/register`
2. Login user: `POST /api/auth/login`
3. Copy JWT token from login response.
4. Set header in protected requests:
	 - `Authorization: Bearer <token>`
5. Test tasks, posts, comments, and profile analytics endpoints.

## Sprint status

- Sprint 1: Implemented in the same full-stack pipeline and static legacy files preserved in root.
- Sprint 2: Full-stack baseline completed and connected to Sprint 1 workflows.
- Sprint 3+: Not implemented in this delivery.
