import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import ResultsSection from './components/ResultsSection';
import Footer from './components/Footer';

function App() {
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState(null);

    const handleAnalysisComplete = (data) => {
        setResults(data);
        setShowResults(true);
    };

    const handleNewAnalysis = () => {
        setShowResults(false);
        setResults(null);
    };

    return (
        <div className="container">
            <Header />
            <main className="main-content">
                {!showResults ? (
                    <UploadSection onAnalysisComplete={handleAnalysisComplete} />
                ) : (
                    <ResultsSection results={results} onNewAnalysis={handleNewAnalysis} />
                )}
            </main>
            <Footer />
        </div>
    );
}

export default App;
