import React from 'react';
import './ResultsSection.css';

const ResultsSection = ({ results, onNewAnalysis }) => {
    const handleDownload = () => {
        if (!results) return;

        let csvContent, headers, data;

        if (results.type === 'url') {
            // URL result
            headers = ['URL', 'Prediction', ...Object.keys(results.data.features)];
            data = [{
                'URL': results.data.url,
                'Prediction': results.data.prediction,
                ...results.data.features
            }];
        } else {
            // CSV result
            headers = results.headers;
            data = results.data;
        }

        csvContent = headers.join(',') + '\n';
        data.forEach(row => {
            const rowData = headers.map(header => row[header] || '');
            csvContent += rowData.join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'phishing_detection_results.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const renderStats = () => {
        if (results.type === 'url') {
            const prediction = results.data.prediction_value === 1 ? 'Legitimate' : 'Phishing';
            return (
                <>
                    <div className="stat-card">
                        <div className="stat-label">URL Analyzed</div>
                        <div className="stat-value">1</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Prediction</div>
                        <div className={`stat-value ${results.data.prediction_value === 1 ? 'legitimate' : 'phishing'}`}>
                            {prediction}
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Confidence</div>
                        <div className="stat-value">{results.data.confidence}</div>
                    </div>
                </>
            );
        } else {
            const total = results.data.length;
            const phishingCount = results.data.filter(row => row.predicted_column === '-1').length;
            const legitimateCount = results.data.filter(row => row.predicted_column === '1').length;
            const phishingPercentage = ((phishingCount / total) * 100).toFixed(1);
            const legitimatePercentage = ((legitimateCount / total) * 100).toFixed(1);

            return (
                <>
                    <div className="stat-card">
                        <div className="stat-label">Total Analyzed</div>
                        <div className="stat-value">{total}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Phishing Detected</div>
                        <div className="stat-value phishing">{phishingCount}</div>
                        <div className="stat-label">{phishingPercentage}%</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Legitimate</div>
                        <div className="stat-value legitimate">{legitimateCount}</div>
                        <div className="stat-label">{legitimatePercentage}%</div>
                    </div>
                </>
            );
        }
    };

    const renderTable = () => {
        if (results.type === 'url') {
            const prediction = results.data.prediction_value === 1 ? 'Legitimate' : 'Phishing';
            const badgeClass = results.data.prediction_value === 1 ? 'badge-success' : 'badge-danger';
            const featureEntries = Object.entries(results.data.features).slice(0, 10);

            return (
                <>
                    <div className="url-display">
                        <strong>URL:</strong>
                        <a href={results.data.url} target="_blank" rel="noopener noreferrer">
                            {results.data.url}
                        </a>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {featureEntries.map(([key, value]) => (
                                <tr key={key}>
                                    <td>{key}</td>
                                    <td>{value}</td>
                                </tr>
                            ))}
                            <tr>
                                <td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    ... and {Object.keys(results.data.features).length - 10} more features
                                </td>
                            </tr>
                            <tr style={{ background: 'rgba(102, 126, 234, 0.1)', fontWeight: 'bold' }}>
                                <td>Final Prediction</td>
                                <td>
                                    <span className={`badge ${badgeClass}`}>{prediction}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </>
            );
        } else {
            const displayHeaders = results.headers.slice(0, 5).concat(['...', 'predicted_column']);

            return (
                <table>
                    <thead>
                        <tr>
                            {displayHeaders.map((header, index) => (
                                <th key={index}>{header}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {results.data.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {results.headers.slice(0, 5).map((header, cellIndex) => (
                                    <td key={cellIndex}>{row[header]}</td>
                                ))}
                                <td>...</td>
                                <td>
                                    <span className={`badge ${row.predicted_column === '-1' ? 'badge-danger' : 'badge-success'}`}>
                                        {row.predicted_column === '-1' ? 'Phishing' : 'Legitimate'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }
    };

    return (
        <section className="results-section">
            <div className="results-header">
                <h2>Analysis Results</h2>
                <button className="btn-secondary" onClick={onNewAnalysis}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M14 8H2M8 2V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    New Analysis
                </button>
            </div>

            <div className="stats-grid">
                {renderStats()}
            </div>

            <div className="results-table-container">
                {renderTable()}
            </div>

            <div className="download-section">
                <button className="btn-download" onClick={handleDownload}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2V14M10 14L6 10M10 14L14 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M2 18H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Download Results (CSV)
                </button>
            </div>
        </section>
    );
};

export default ResultsSection;
