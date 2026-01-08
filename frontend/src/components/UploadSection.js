import React, { useState } from 'react';
import axios from 'axios';
import './UploadSection.css';

const UploadSection = ({ onAnalysisComplete }) => {
    const [activeTab, setActiveTab] = useState('url');
    const [urlInput, setUrlInput] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setSelectedFile(file);
    };

    const handleUrlSubmit = async (e) => {
        e.preventDefault();
        if (!urlInput.trim()) {
            alert('Please enter a URL');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(`/predict-url?url=${encodeURIComponent(urlInput)}`);
            onAnalysisComplete({
                type: 'url',
                data: response.data
            });
        } catch (error) {
            console.error('Error:', error);
            alert(`Error analyzing URL: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCsvSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            alert('Please select a CSV file');
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await axios.post('/predict', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Parse HTML response to extract table data
            const parser = new DOMParser();
            const doc = parser.parseFromString(response.data, 'text/html');
            const table = doc.querySelector('table');

            if (table) {
                const rows = Array.from(table.querySelectorAll('tr'));
                const headers = Array.from(rows[0].querySelectorAll('th')).map(th => th.textContent.trim());
                const data = rows.slice(1).map(row => {
                    const cells = Array.from(row.querySelectorAll('td'));
                    const rowData = {};
                    cells.forEach((cell, index) => {
                        rowData[headers[index]] = cell.textContent.trim();
                    });
                    return rowData;
                });

                onAnalysisComplete({
                    type: 'csv',
                    headers,
                    data
                });
            } else {
                throw new Error('No table found in response');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(`Error analyzing file: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="upload-section">
            <div className="upload-card">
                <div className="upload-icon">
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="30" stroke="url(#uploadGradient)" strokeWidth="2" fill="none" />
                        <path d="M32 20V44M20 32H44" stroke="url(#uploadGradient)" strokeWidth="3" strokeLinecap="round" />
                        <defs>
                            <linearGradient id="uploadGradient" x1="2" y1="2" x2="62" y2="62">
                                <stop offset="0%" stopColor="#667eea" />
                                <stop offset="100%" stopColor="#764ba2" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <h2>Analyze Website for Phishing</h2>
                <p className="upload-description">Enter a URL or upload a CSV file to detect phishing websites</p>

                {/* Tab Switcher */}
                <div className="tab-switcher">
                    <button
                        className={`tab-btn ${activeTab === 'url' ? 'active' : ''}`}
                        onClick={() => setActiveTab('url')}
                    >
                        🔗 URL Input
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'csv' ? 'active' : ''}`}
                        onClick={() => setActiveTab('csv')}
                    >
                        📄 CSV Upload
                    </button>
                </div>

                {/* URL Input Tab */}
                {activeTab === 'url' && (
                    <div className="tab-content">
                        <form onSubmit={handleUrlSubmit}>
                            <div className="url-input-wrapper">
                                <input
                                    type="url"
                                    placeholder="https://example.com"
                                    value={urlInput}
                                    onChange={(e) => setUrlInput(e.target.value)}
                                    required
                                />
                                <button type="submit" className="btn-primary" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <span className="spinner"></span>
                                            Analyzing...
                                        </>
                                    ) : (
                                        'Analyze URL'
                                    )}
                                </button>
                            </div>
                        </form>
                        <div className="info-box">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="9" stroke="#667eea" strokeWidth="1.5" />
                                <path d="M10 6V10M10 14H10.01" stroke="#667eea" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span>Enter any website URL to check if it's safe or phishing</span>
                        </div>
                    </div>
                )}

                {/* CSV Upload Tab */}
                {activeTab === 'csv' && (
                    <div className="tab-content">
                        <form onSubmit={handleCsvSubmit}>
                            <div className="file-input-wrapper">
                                <input
                                    type="file"
                                    id="fileInput"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    required
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="fileInput" className="file-label">
                                    <span className="file-label-text">Choose CSV File</span>
                                    <span className="file-name">
                                        {selectedFile ? selectedFile.name : 'No file chosen'}
                                    </span>
                                </label>
                            </div>

                            <button type="submit" className="btn-primary" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Analyzing...
                                    </>
                                ) : (
                                    'Analyze File'
                                )}
                            </button>
                        </form>

                        <div className="info-box">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="9" stroke="#667eea" strokeWidth="1.5" />
                                <path d="M10 6V10M10 14H10.01" stroke="#667eea" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span>CSV file must contain 30 network security features</span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default UploadSection;
