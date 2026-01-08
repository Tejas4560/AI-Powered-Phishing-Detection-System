"""
Test script to verify GCP Cloud Storage connection
"""

import os
from dotenv import load_dotenv
from google.cloud import storage

load_dotenv()

GCS_BUCKET_NAME = os.getenv("GCS_BUCKET_NAME", "networksecurity-data")
GCS_DATA_FILE = os.getenv("GCS_DATA_FILE", "phisingData.csv")


def test_gcs_connection():
    """Test connection to GCP Cloud Storage"""
    try:
        print(f"Testing connection to GCS bucket: {GCS_BUCKET_NAME}")
        
        # Initialize GCS client
        storage_client = storage.Client()
        bucket = storage_client.bucket(GCS_BUCKET_NAME)
        
        # Check if bucket exists
        if bucket.exists():
            print(f"✓ Bucket '{GCS_BUCKET_NAME}' exists")
        else:
            print(f"✗ Bucket '{GCS_BUCKET_NAME}' not found")
            return False
        
        # Check if file exists
        blob = bucket.blob(GCS_DATA_FILE)
        if blob.exists():
            print(f"✓ File '{GCS_DATA_FILE}' found in bucket")
            print(f"✓ File size: {blob.size} bytes")
            print(f"✓ Last modified: {blob.updated}")
        else:
            print(f"✗ File '{GCS_DATA_FILE}' not found in bucket")
            print(f"  Upload it using: python upload_to_gcs.py")
            return False
        
        print("\n✓ Cloud Storage connection successful!")
        return True
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        print("\nTroubleshooting:")
        print("1. Authenticate: gcloud auth application-default login")
        print("2. Check project: gcloud config get-value project")
        print("3. Set GOOGLE_APPLICATION_CREDENTIALS if using service account")
        return False


if __name__ == '__main__':
    test_gcs_connection()
