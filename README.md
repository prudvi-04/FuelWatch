# FuelWatch — Generator Tank Level Monitor

Multi-user web app for tracking generator fuel levels and getting alerts when tanks run low.

## Tech Stack
- **Backend**: Java 17 + Spring Boot 3.2 + Spring Security + JWT + Spring Data JPA
- **Database**: MySQL 8
- **Frontend**: React 18 + Chart.js + Axios

---

## Setup

### 1. MySQL — drop and recreate

Because we added the `users` table and a `userId` column on generators, drop the old DB:

```sql
DROP DATABASE IF EXISTS fuelwatch;
CREATE DATABASE fuelwatch;
```

Hibernate auto-creates all 5 tables on first startup.

### 2. Backend — IntelliJ

1. Open `backend/pom.xml` in IntelliJ
2. Right-click pom → **Maven → Reload Project** (downloads Spring Security + JJWT)
3. Update DB password in `src/main/resources/application.properties` if different from `root`
4. Run `FuelWatchApplication`
5. Server starts on **http://localhost:8089**

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Opens **http://localhost:3000** with the login page.

---

## How it works

- Each user signs up with username + password
- Passwords hashed with BCrypt
- JWT token issued on login (24-hour expiry)
- Token sent in `Authorization: Bearer ...` header on every API call
- Each generator owned by one user — users only see their own data
- Alert rules are global (shared by all users)

## API Endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST   | /api/auth/register | No | Create account, get JWT |
| POST   | /api/auth/login    | No | Get JWT |
| GET    | /api/generators    | Yes | My generators only |
| POST   | /api/generators    | Yes | Add generator (auto-linked to me) |
| DELETE | /api/generators/{id} | Yes | Delete (must be mine) |
| GET    | /api/generators/{id}/readings | Yes | Get level history |
| POST   | /api/generators/{id}/readings | Yes | Log a reading |
| GET    | /api/alerts | Yes | Active alerts for my generators |
| PUT    | /api/alerts/{id}/resolve | Yes | Permanently delete alert |
| GET    | /api/rules | Yes | Get global alert rules |
| PUT    | /api/rules | Yes | Update global rules |

## Database Tables

- `users` — username, bcrypt password
- `generators` — id, location, capacity, **user_id**
- `level_readings` — generator readings over time
- `alerts` — fired alerts
- `alert_rules` — global thresholds (one row only)
