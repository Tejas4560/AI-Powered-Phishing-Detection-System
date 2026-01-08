# Network Security Project - Phishing Detection

A complete Machine Learning pipeline for phishing detection with FastAPI deployment and GCP Cloud Run integration.

## 🚀 Features

- **ML Pipeline**: Complete data ingestion, validation, transformation, and model training
- **MongoDB Integration**: Stores and retrieves phishing detection data
- **FastAPI Web Service**: REST API for training and predictions
- **Docker Support**: Containerized application
- **CI/CD**: GitHub Actions workflow for automated deployment to GCP Cloud Run

## 📋 Prerequisites

- Python 3.10+
- MongoDB (local or Atlas)
- Docker (optional)
- Google Cloud Platform account (for deployment)

## 🛠️ Local Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd networksecurity
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
pip install -e .
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
MONGODB_URL_KEY=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB_URL=mongodb+srv://username:password@cluster.mongodb.net/
```

### 4. Push Data to MongoDB

```bash
python push_data.py
```

This will load the phishing dataset from `Network_Data/phisingData.csv` into MongoDB.

### 5. Train the Model

```bash
python main.py
```

This runs the complete ML pipeline:
- Data Ingestion
- Data Validation
- Data Transformation
- Model Training

Artifacts will be saved in the `Artifacts/` directory and final model in `final_model/`.

### 6. Run the FastAPI Application

```bash
python app.py
```

Access the API at:
- API Documentation: http://localhost:8000/docs
- Train endpoint: http://localhost:8000/train
- Predict endpoint: http://localhost:8000/predict

## 🐳 Docker Setup

### Build Docker Image

```bash
docker build -t networksecurity:latest .
```

### Run Container

```bash
docker run -p 8000:8000 --env-file .env networksecurity:latest
```

## ☁️ GCP Cloud Run Deployment

### Prerequisites

1. GCP account with billing enabled
2. GitHub repository with the code

### Setup Steps

See [GCP Setup Guide](docs/gcp_setup_guide.md) for detailed instructions.

**Quick Summary:**

1. **Enable GCP APIs**: Artifact Registry, Cloud Run, Cloud Build
2. **Create Artifact Registry repository**: `networksecurity`
3. **Create Service Account** with permissions:
   - Artifact Registry Writer
   - Cloud Run Admin
   - Service Account User
4. **Configure GitHub Secrets**:
   - `GCP_PROJECT_ID`: Your GCP project ID
   - `GCP_SA_KEY`: Service account JSON key
   - `GCP_REGION`: Deployment region (e.g., `us-central1`)
   - `MONGODB_URL_KEY`: MongoDB connection string

5. **Push to main branch** to trigger deployment

### GitHub Actions Workflow

The CI/CD pipeline automatically:
1. Runs linting and tests
2. Builds Docker image
3. Pushes to Artifact Registry
4. Deploys to Cloud Run

## 📁 Project Structure

```
networksecurity/
├── .github/
│   └── workflows/
│       └── main.yml          # GitHub Actions CI/CD
├── networksecurity/          # Main package
│   ├── components/           # ML pipeline components
│   ├── constant/             # Configuration constants
│   ├── entity/               # Data entities
│   ├── exception/            # Custom exceptions
│   ├── logging/              # Logging utilities
│   ├── pipeline/             # Training pipeline
│   └── utils/                # Utility functions
├── Network_Data/
│   └── phisingData.csv       # Dataset
├── templates/                # HTML templates
├── app.py                    # FastAPI application
├── main.py                   # Training pipeline entry point
├── push_data.py              # Data upload script
├── Dockerfile                # Docker configuration
├── requirements.txt          # Python dependencies
└── setup.py                  # Package setup
```

## 🔧 API Endpoints

### GET /
Redirects to API documentation

### GET /train
Triggers the complete ML training pipeline

**Response:**
```json
"Training is successful"
```

### POST /predict
Accepts CSV file and returns predictions

**Request:**
- File: CSV file with phishing data

**Response:**
- HTML table with predictions

## 🧪 Testing

### Test MongoDB Connection

```bash
python test_mongodb.py
```

### Test Training Pipeline

```bash
python main.py
```

### Test API

```bash
# Start the server
python app.py

# In another terminal, test with curl
curl -X POST "http://localhost:8000/predict" \
  -F "file=@test_data.csv"
```

## 📊 Model Details

- **Task**: Binary classification (phishing detection)
- **Features**: Network security metrics
- **Preprocessing**: KNN Imputer for missing values
- **Expected Score**: > 0.6
- **Overfitting Threshold**: 0.05

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URL_KEY` | MongoDB connection string for app.py | Yes |
| `MONGO_DB_URL` | MongoDB connection string for push_data.py | Yes |
| `PORT` | Port for the application (default: 8000) | No |

## 🚨 Troubleshooting

### MongoDB Connection Issues
- Verify connection string is correct
- Check network access (whitelist IP in MongoDB Atlas)
- Ensure MongoDB is running (if local)

### Import Errors
- Run `pip install -e .` to install the package in editable mode
- Verify all dependencies are installed

### Docker Build Fails
- Check Dockerfile syntax
- Ensure all files are present
- Verify requirements.txt is complete

## 📝 License

[Your License Here]

## 👥 Authors

- Original Author: Krish Naik
- Adapted for GCP by: [Your Name]

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.# AI-Powered-Phishing-Detection-System
