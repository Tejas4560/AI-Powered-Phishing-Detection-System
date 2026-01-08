import React from 'react';
import './Header.css';

const Header = () => {
    return (
        <header className="header">
            <div className="logo">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path
                        d="M20 5L5 12.5V20C5 28.75 11.25 36.75 20 38.75C28.75 36.75 35 28.75 35 20V12.5L20 5Z"
                        stroke="url(#gradient)"
                        strokeWidth="2"
                        fill="none"
                    />
                    <path
                        d="M20 15V25M15 20H25"
                        stroke="url(#gradient)"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="gradient" x1="5" y1="5" x2="35" y2="38.75">
                            <stop offset="0%" stopColor="#667eea" />
                            <stop offset="100%" stopColor="#764ba2" />
                        </linearGradient>
                    </defs>
                </svg>
                <h1>Network Security</h1>
            </div>
            <p className="subtitle">AI-Powered Phishing Detection System</p>
        </header>
    );
};

export default Header;
