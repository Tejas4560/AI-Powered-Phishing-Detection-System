"""
Script to upload phishing data to GCP Cloud Storage
This replaces the push_data.py script that was used for MongoDB
"""

import os
import sys
from dotenv import load_dotenv
from google.cloud import storage

load_dotenv()

GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "networksecurity-data")
GCS_DATA_FILE = os.getenv("GCS_DATA_FILE", "phisingData.csv")
LOCAL_DATA_PATH = "Network_Data/phisingData.csv"


def upload_to_gcs():
    """Upload phishing data CSV to Google Cloud Storage"""
    try:
        print(f"Uploading {LOCAL_DATA_PATH} to gs://{GCS_BUCKET_NAME}/{GCS_DATA_FILE}")
        
        # Initialize GCS client
        storage_client = storage.Client()
        bucket = storage_client.bucket(GCS_BUCKET_NAME)
        blob = bucket.blob(GCS_DATA_FILE)
        
        # Upload file
        blob.upload_from_filename(LOCAL_DATA_PATH)
        
        print(f"✓ Successfully uploaded {LOCAL_DATA_PATH}")
        print(f"✓ File available at: gs://{GCS_BUCKET_NAME}/{GCS_DATA_FILE}")
        print(f"✓ File size: {blob.size} bytes")
        
        return True
        
    except Exception as e:
        print(f"✗ Error uploading file: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Ensure bucket exists: gsutil ls")
        print(f"2. Create bucket: gsutil mb gs://{GCS_BUCKET_NAME}/")
        print("3. Check authentication: gcloud auth application-default login")
        return False


if __name__ == '__main__':
    # Check if local file exists
    if not os.path.exists(LOCAL_DATA_PATH):
        print(f"✗ Error: Local file not found: {LOCAL_DATA_PATH}")
        sys.exit(1)
    
    # Upload to GCS
    success = upload_to_gcs()
    
    if success:
        print("\n✓ Data upload complete! You can now run the training pipeline.")
    else:
        print("\n✗ Upload failed. Please check the error messages above.")
        sys.exit(1)
