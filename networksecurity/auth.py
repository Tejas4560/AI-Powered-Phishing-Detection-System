"""
Google OAuth Authentication Module
Handles user authentication via Google OAuth 2.0
"""

import os
from typing import Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv

load_dotenv()

# OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")

# OAuth setup
oauth = OAuth()
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)


def get_current_user(request: Request) -> Optional[dict]:
    """
    Get the current logged-in user from session
    Returns user info dict or None if not logged in
    """
    return request.session.get('user')


def require_auth(request: Request):
    """
    Dependency to require authentication
    Raises HTTPException if user is not logged in
    """
    user = get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please login first.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def login(request: Request):
    """
    Initiate Google OAuth login flow
    """
    # Get the base URL from the request - use full URL instead of url_for
    redirect_uri = str(request.base_url) + "auth/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


async def auth_callback(request: Request):
    """
    Handle OAuth callback from Google
    """
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if user_info:
            # Store user info in session
            request.session['user'] = {
                'email': user_info.get('email'),
                'name': user_info.get('name'),
                'picture': user_info.get('picture'),
            }
            # Redirect to home page
            return RedirectResponse(url='/')
        else:
            raise HTTPException(status_code=400, detail="Failed to get user info")
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")


def logout(request: Request):
    """
    Logout user by clearing session
    """
    request.session.clear()
    return RedirectResponse(url='/')


def get_user_info(request: Request) -> dict:
    """
    Get current user information
    Returns user info or raises 401 if not authenticated
    """
    user = get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user
