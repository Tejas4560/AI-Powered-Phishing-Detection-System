import sys
import os

import certifi
ca = certifi.where()

from dotenv import load_dotenv
load_dotenv()

from networksecurity.exception.exception import NetworkSecurityException
from networksecurity.logging.logger import logging
from networksecurity.pipeline.training_pipeline import TrainingPipeline

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, UploadFile,Request
from uvicorn import run as app_run
from fastapi.responses import Response
from starlette.responses import RedirectResponse
import pandas as pd

from networksecurity.utils.main_utils.utils import load_object

from networksecurity.utils.ml_utils.model.estimator import NetworkModel
from networksecurity.auth import (
    oauth, login, auth_callback, logout, get_user_info, require_auth, SECRET_KEY
)
from starlette.middleware.sessions import SessionMiddleware

app = FastAPI()
origins = ["*"]

# Add session middleware for OAuth
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
templates = Jinja2Templates(directory="./templates")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", tags=["authentication"])
async def index(request: Request):
    user = request.session.get('user')
    if not user:
        # Redirect to login if not authenticated
        return RedirectResponse(url='/login')
    return templates.TemplateResponse("index.html", {"request": request, "user": user})

@app.get("/login")
async def login_route(request: Request):
    """Initiate Google OAuth login"""
    return await login(request)

@app.get("/auth/callback")
async def auth_callback_route(request: Request):
    """Handle OAuth callback"""
    return await auth_callback(request)

@app.get("/logout")
async def logout_route(request: Request):
    """Logout user"""
    return logout(request)

@app.get("/api/user")
async def get_user_route(request: Request):
    """Get current user info"""
    return get_user_info(request)

@app.get("/train")
async def train_route(request: Request, user: dict = require_auth):
    """Train model - requires authentication"""
    try:
        train_pipeline=TrainingPipeline()
        train_pipeline.run_pipeline()
        return Response("Training is successful")
    except Exception as e:
        raise NetworkSecurityException(e,sys)
    
@app.post("/predict")
async def predict_route(request: Request, file: UploadFile = File(...), user: dict = require_auth):
    """Predict from CSV - requires authentication"""
    try:
        df=pd.read_csv(file.file)
        #print(df)
        preprocesor=load_object("final_model/preprocessor.pkl")
        final_model=load_object("final_model/model.pkl")
        network_model = NetworkModel(preprocessor=preprocesor,model=final_model)
        print(df.iloc[0])
        y_pred = network_model.predict(df)
        print(y_pred)
        df['predicted_column'] = y_pred
        print(df['predicted_column'])
        #df['predicted_column'].replace(-1, 0)
        #return df.to_json()
        df.to_csv('prediction_output/output.csv')
        table_html = df.to_html(classes='table table-striped')
        #print(table_html)
        return templates.TemplateResponse("table.html", {"request": request, "table": table_html})
        
    except Exception as e:
            raise NetworkSecurityException(e,sys)

@app.post("/predict-url")
async def predict_url_route(request: Request, url: str, user: dict = require_auth):
    """
    Predict phishing for a given URL - requires authentication
    Automatically extracts all 30 features from the URL
    """
    try:
        from networksecurity.utils.url_feature_extractor import URLFeatureExtractor
        
        # Extract features from URL
        extractor = URLFeatureExtractor(url)
        features = extractor.extract_all_features()
        
        # Convert to DataFrame
        df = pd.DataFrame([features])
        
        # Load model and make prediction
        preprocessor = load_object("final_model/preprocessor.pkl")
        final_model = load_object("final_model/model.pkl")
        network_model = NetworkModel(preprocessor=preprocessor, model=final_model)
        
        y_pred = network_model.predict(df)
        prediction = int(y_pred[0])
        
        # Prepare response
        result = {
            "url": url,
            "prediction": "Legitimate" if prediction == 1 else "Phishing",
            "prediction_value": prediction,
            "confidence": "High" if abs(prediction) == 1 else "Medium",
            "features": features
        }
        
        return result
        
    except Exception as e:
        raise NetworkSecurityException(e, sys)

    
if __name__=="__main__":
    # Cloud Run provides PORT environment variable
    port = int(os.getenv("PORT", 8000))
    app_run(app,host="0.0.0.0",port=port)

