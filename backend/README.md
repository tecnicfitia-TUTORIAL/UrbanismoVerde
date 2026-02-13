# UrbanismoVerde AI Backend

Backend API for intelligent rooftop inspection using Google Gemini Vision.

## 🚀 Deployment on Google Cloud Run

### Prerequisites

1. Google Cloud Project with billing enabled
2. APIs enabled:
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API
   - Generative Language API (Gemini)

### Environment Variables

Configure these in Cloud Run:

```bash
GOOGLE_API_KEY=AIzaSy...your-google-api-key
VISION_PROVIDER=gemini
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
PORT=8080
```

### Deploy from GitHub

1. Go to Cloud Run Console
2. Create Service → "Continuously deploy from repository"
3. Connect GitHub repository
4. Configure:
   - Branch: `main`
   - Build Type: Dockerfile
   - Source location: `/backend/Dockerfile`
5. Set environment variables
6. Deploy

### Manual Deploy

```bash
gcloud run deploy urbanismoverde-backend \
  --source ./backend \
  --region europe-west9 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 300 \
  --set-env-vars "GOOGLE_API_KEY=AIza...,VISION_PROVIDER=gemini"
```

## 🧪 Testing

### Health Check
```bash
curl https://your-service.run.app/health
```

### Test Analysis
```bash
curl -X POST https://your-service.run.app/api/inspecciones/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/rooftop.jpg",
    "area_m2": 120,
    "orientacion": "sur"
  }'
```

## 📚 API Documentation

Once deployed, visit:
- Swagger UI: `https://your-service.run.app/docs`
- ReDoc: `https://your-service.run.app/redoc`

## 🔧 Local Development

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GOOGLE_API_KEY=your-key
export VISION_PROVIDER=gemini

# Run locally
uvicorn main:app --reload --port 8080
```

## 🤖 Gemini Vision API

This backend uses Google Gemini Vision API instead of OpenAI for:
- Roof type detection (plana/inclinada/mixta)
- Condition assessment (excelente/bueno/regular/malo)
- Obstruction identification
- Slope estimation
- Confidence scoring

## 📊 Monitoring

View logs in Cloud Run Console:
```bash
gcloud run services logs read urbanismoverde-backend --region europe-west9
```
