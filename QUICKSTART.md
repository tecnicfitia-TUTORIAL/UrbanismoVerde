# 🚀 Quick Start Guide

## Installation (3 steps)

```bash
# 1. Clone repository
git clone https://github.com/tecnicfitia-TUTORIAL/UrbanismoVerde.git
cd UrbanismoVerde

# 2. Configure environment
cp .env.example .env

# 3. Start with Docker
docker compose up --build
```

## Access Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React app with interactive map |
| Backend | http://localhost:4000 | Express API |
| AI Service | http://localhost:8000 | FastAPI ML service |
| AI Docs | http://localhost:8000/docs | Interactive API docs |
| PostgreSQL | localhost:5432 | PostGIS database |

## Common Commands

### Development

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f [service-name]

# Rebuild specific service
docker compose up --build [service-name]
```

### Database

```bash
# Connect to PostgreSQL
docker compose exec postgres psql -U ecourbe_user -d ecourbe_db

# Reset database
docker compose down -v
docker compose up --build postgres
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev     # Start dev server
npm run build   # Build for production
```

### Backend Development

```bash
cd backend
npm install
npm run dev     # Start with auto-reload
npm run build   # Compile TypeScript
```

### AI Service Development

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload  # Start with auto-reload
```

## Project Structure

```
UrbanismoVerde/
├── frontend/           # React + TypeScript + Leaflet
├── backend/            # Node.js + Express + TypeScript
├── ai-service/         # Python + FastAPI + TensorFlow
├── database/           # PostgreSQL schema
├── docker-compose.yml  # Docker orchestration
└── .github/workflows/  # CI/CD pipelines
```

## Tech Stack Summary

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Leaflet |
| Backend | Node.js 18, Express, TypeScript, Prisma |
| AI Service | Python 3.10, FastAPI, TensorFlow, OpenCV |
| Database | PostgreSQL 15, PostGIS |
| DevOps | Docker, Docker Compose, GitHub Actions |

## Key Features

✅ **10+ PostgreSQL tables** with PostGIS spatial extensions  
✅ **Automatic triggers** for centroid and area calculations  
✅ **Interactive map** with drawing tools  
✅ **3 base layers** (OSM, Satellite, Topo)  
✅ **AI analysis endpoint** for zone viability  
✅ **Clean Architecture** with domain-driven design  
✅ **Full TypeScript** strict mode  
✅ **Docker containers** for all services  
✅ **CI/CD pipeline** with GitHub Actions  

## Environment Variables

Key variables in `.env`:

```env
# Database
DATABASE_URL=postgresql://ecourbe_user:ecourbe_pass@localhost:5432/ecourbe_db

# Backend
PORT=4000
JWT_SECRET=change_in_production

# Frontend
VITE_API_URL=http://localhost:4000
```

## Troubleshooting

### Port already in use
```bash
# Change port in docker-compose.yml or stop conflicting service
lsof -ti:3000 | xargs kill -9  # macOS/Linux
```

### Database initialization failed
```bash
docker compose down -v  # Remove volumes
docker compose up postgres  # Start only PostgreSQL
```

### npm install fails
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. ✅ **Basic setup** - You're here!
2. 📖 Read [USAGE.md](USAGE.md) for detailed usage
3. 🔧 Start developing your features
4. 🧪 Write tests for your code
5. 🚀 Deploy to production

## Documentation

- [README.md](README.md) - Project overview
- [USAGE.md](USAGE.md) - Detailed usage guide
- [LICENSE](LICENSE) - MIT License

## Support

- 🐛 [Report Issues](https://github.com/tecnicfitia-TUTORIAL/UrbanismoVerde/issues)
- 📖 [Documentation](https://github.com/tecnicfitia-TUTORIAL/UrbanismoVerde/wiki)

---

Made with 💚 by EcoUrbe Team
