# UrbanismoVerde AI Backend

Backend API for intelligent rooftop inspection using **Gemini** via **Google Cloud Vertex AI**.

## 🚀 Deployment on Google Cloud Run

### Prerequisites

1. Google Cloud Project with billing enabled
2. APIs enabled:
   - Cloud Run API
   - Cloud Build API
   - Artifact Registry API
   - Vertex AI API (for Gemini)

### Environment Variables

Configure these in Cloud Run:

```bash
GOOGLE_CLOUD_PROJECT=ecourbe-ai
GOOGLE_CLOUD_LOCATION=europe-west9
GEMINI_MODEL_NAME=gemini-1.5-flash-001  # Optional: defaults to gemini-1.5-flash-001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
PORT=8080
```

**Note about Authentication:**
- **No API key needed** - Vertex AI uses the service account attached to Cloud Run
- The service account needs the `roles/aiplatform.user` role

**Available Gemini Models:**
- `gemini-1.5-flash-001` - Fast and efficient (recommended, default)
- `gemini-1.5-flash-002` - Newer version
- `gemini-1.5-pro-001` - More powerful model
- `gemini-1.5-flash-latest` - Always the latest stable version

### Deploy from GitHub

1. Go to Cloud Run Console
2. Create Service → "Continuously deploy from repository"
3. Connect GitHub repository
4. Configure:
   - Branch: `main`
   - Build Type: Dockerfile
   - Source location: `/backend/Dockerfile`
5. Set environment variables (see above)
6. **Grant IAM permissions** to the service account:
   ```bash
   gcloud projects add-iam-policy-binding ecourbe-ai \
     --member="serviceAccount:903228431552-compute@developer.gserviceaccount.com" \
     --role="roles/aiplatform.user"
   ```
7. Deploy

### Manual Deploy

```bash
gcloud run deploy urbanismoverde-backend \
  --source ./backend \
  --region europe-west9 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 300 \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=ecourbe-ai,GOOGLE_CLOUD_LOCATION=europe-west9,GEMINI_MODEL_NAME=gemini-1.5-flash-001"
```

### Required IAM Permissions

The Cloud Run service account needs access to Vertex AI:

```bash
# Enable Vertex AI API
gcloud services enable aiplatform.googleapis.com --project=ecourbe-ai

# Grant permissions to service account
gcloud projects add-iam-policy-binding ecourbe-ai \
  --member="serviceAccount:903228431552-compute@developer.gserviceaccount.com" \
  --role="roles/aiplatform.user"
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
export GOOGLE_CLOUD_PROJECT=ecourbe-ai
export GOOGLE_CLOUD_LOCATION=europe-west9
export GEMINI_MODEL_NAME=gemini-1.5-flash-001

# For local development, authenticate with gcloud
gcloud auth application-default login

# Run locally
uvicorn main:app --reload --port 8080
```

## 🤖 Gemini Vision (via Vertex AI)

This backend uses **Gemini** AI models via **Google Cloud Vertex AI** (`google-cloud-aiplatform` library) for AI-powered rooftop analysis.

### Features

- Roof type detection (plana/inclinada/mixta)
- Condition assessment (excelente/bueno/regular/malo/muy_malo)
- Obstruction identification
- Slope estimation (0-45°)
- Confidence scoring (0-100%)

### Authentication

Vertex AI uses **service account authentication** instead of API keys:
- In Cloud Run: Uses the service account attached to the Cloud Run service
- Local development: Uses `gcloud auth application-default login`

### Benefits vs Google AI Studio (google-generativeai)

- ✅ No API keys needed - uses service account authentication
- ✅ Production-ready and enterprise-grade
- ✅ Better reliability and performance
- ✅ Full Gemini 1.5 and 2.0 model support
- ✅ Native integration with Google Cloud services
- ✅ Better security and access control
- ✅ Supports all Gemini model versions

## 📊 Monitoring

View logs in Cloud Run Console:
```bash
gcloud run services logs read urbanismoverde-backend --region europe-west9
```
