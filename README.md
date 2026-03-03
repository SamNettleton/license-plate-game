# License Plate Game

**Website:** https://licenseplate.radrabbit.xyz/

## Objective
Find words that contain the three letters shown on the license plate in the **exact same order**.

**Example:** If the letters are **L P G**:
- ✅ Correct: **L**ea**p**fro**g**, **L**im**p**in**g**, or S**l**ee**p**in**g**
- ❌ Incorrect: Goalpost (The 'G' appears before 'L' and 'P')

Longer words earn more points. Reach the goal to win the daily challenge!

## Tech Stack

### Frontend Frameworks & Libraries
- **Core Frameworks:** React with TypeScript, Vite (build tool)
- **Routing & State:** React Router DOM, TanStack React Query
- **UI & Design:** Material UI (MUI), Emotion, MUI Icons
- **Testing:** Vitest, React Testing Library, Jest DOM

### Backend Frameworks & Libraries
- **Language:** Python
- **Core Framework:** FastAPI
- **Database / ORM:** SQLAlchemy (PostgreSQL via psycopg2)
- **ASGI Server:** Uvicorn
- **Data Validation:** Pydantic
