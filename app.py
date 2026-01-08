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

app = FastAPI()
origins = ["*"]

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
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/train")
async def train_route():
    try:
        train_pipeline=TrainingPipeline()
        train_pipeline.run_pipeline()
        return Response("Training is successful")
    except Exception as e:
        raise NetworkSecurityException(e,sys)
    
@app.post("/predict")
async def predict_route(request: Request,file: UploadFile = File(...)):
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
async def predict_url_route(url: str):
    """
    Predict phishing for a given URL
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

