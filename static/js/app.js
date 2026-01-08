// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const urlForm = document.getElementById('urlForm');
const fileInput = document.getElementById('fileInput');
const urlInput = document.getElementById('urlInput');
const fileName = document.getElementById('fileName');
const analyzeBtn = document.getElementById('analyzeBtn');
const analyzeUrlBtn = document.getElementById('analyzeUrlBtn');
const uploadSection = document.getElementById('uploadSection');
const resultsSection = document.getElementById('resultsSection');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statsGrid = document.getElementById('statsGrid');
const resultsTable = document.getElementById('resultsTable');

// Tab switching
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');

        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update active tab content
        tabContents.forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName + 'Tab').classList.add('active');
    });
});

let currentResults = null;

// File input change handler
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileName.textContent = file.name;
    } else {
        fileName.textContent = 'No file chosen';
    }
});

// URL Form submit handler
urlForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const url = urlInput.value.trim();
    if (!url) {
        alert('Please enter a URL');
        return;
    }

    // Show loading state
    const btnText = analyzeUrlBtn.querySelector('.btn-text');
    const btnLoader = analyzeUrlBtn.querySelector('.btn-loader');
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    analyzeUrlBtn.disabled = true;

    try {
        // Send request to backend
        const response = await fetch(`/predict-url?url=${encodeURIComponent(url)}`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        // Display URL prediction result
        displayURLResult(result);

    } catch (error) {
        console.error('Error:', error);
        alert(`Error analyzing URL: ${error.message}`);
    } finally {
        // Reset button state
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        analyzeUrlBtn.disabled = false;
    }
});

// CSV Form submit handler
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a CSV file');
        return;
    }

    // Show loading state
    const btnText = analyzeBtn.querySelector('.btn-text');
    const btnLoader = analyzeBtn.querySelector('.btn-loader');
    btnText.style.display = 'none';
    btnLoader.style.display = 'flex';
    analyzeBtn.disabled = true;

    try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        // Send request to backend
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Get HTML response
        const htmlText = await response.text();

        // Parse the HTML to extract table data
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const table = doc.querySelector('table');

        if (table) {
            // Extract data from table
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

            currentResults = { headers, data };
            displayResults(currentResults);
        } else {
            throw new Error('No table found in response');
        }

    } catch (error) {
        console.error('Error:', error);
        alert(`Error analyzing file: ${error.message}`);
    } finally {
        // Reset button state
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
        analyzeBtn.disabled = false;
    }
});

// Display URL prediction result
function displayURLResult(result) {
    // Create single-row result
    const prediction = result.prediction_value === 1 ? 'Legitimate' : 'Phishing';
    const badgeClass = result.prediction_value === 1 ? 'badge-success' : 'badge-danger';

    // Display stats
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">URL Analyzed</div>
            <div class="stat-value">1</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Prediction</div>
            <div class="stat-value ${result.prediction_value === 1 ? 'legitimate' : 'phishing'}">${prediction}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Confidence</div>
            <div class="stat-value">${result.confidence}</div>
        </div>
    `;

    // Display URL and prediction
    let tableHTML = `
        <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(102, 126, 234, 0.1); border-radius: 12px;">
            <strong>URL:</strong> <a href="${result.url}" target="_blank" style="color: #667eea;">${result.url}</a>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Feature</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Show first 10 features
    const featureEntries = Object.entries(result.features).slice(0, 10);
    featureEntries.forEach(([key, value]) => {
        tableHTML += `<tr><td>${key}</td><td>${value}</td></tr>`;
    });

    tableHTML += `
            <tr><td colspan="2" style="text-align: center; color: var(--text-secondary);">... and ${Object.keys(result.features).length - 10} more features</td></tr>
            <tr style="background: rgba(102, 126, 234, 0.1); font-weight: bold;">
                <td>Final Prediction</td>
                <td><span class="badge ${badgeClass}">${prediction}</span></td>
            </tr>
        </tbody>
    </table>
    `;

    resultsTable.innerHTML = tableHTML;

    // Store for download
    currentResults = {
        headers: ['URL', 'Prediction', ...Object.keys(result.features)],
        data: [{
            'URL': result.url,
            'Prediction': prediction,
            ...result.features
        }]
    };

    // Show results section, hide upload section
    uploadSection.style.display = 'none';
    resultsSection.style.display = 'block';
}

// Display CSV results
function displayResults(results) {
    const { headers, data } = results;

    // Calculate statistics
    const total = data.length;
    const phishingCount = data.filter(row => row.predicted_column === '-1').length;
    const legitimateCount = data.filter(row => row.predicted_column === '1').length;
    const phishingPercentage = ((phishingCount / total) * 100).toFixed(1);
    const legitimatePercentage = ((legitimateCount / total) * 100).toFixed(1);

    // Display stats
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Total Analyzed</div>
            <div class="stat-value">${total}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Phishing Detected</div>
            <div class="stat-value phishing">${phishingCount}</div>
            <div class="stat-label">${phishingPercentage}%</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Legitimate</div>
            <div class="stat-value legitimate">${legitimateCount}</div>
            <div class="stat-label">${legitimatePercentage}%</div>
        </div>
    `;

    // Create simplified table (show only first few features + prediction)
    const displayHeaders = headers.slice(0, 5).concat(['...', 'predicted_column']);

    let tableHTML = '<table><thead><tr>';
    displayHeaders.forEach(header => {
        tableHTML += `<th>${header}</th>`;
    });
    tableHTML += '</tr></thead><tbody>';

    data.forEach(row => {
        tableHTML += '<tr>';
        headers.slice(0, 5).forEach(header => {
            tableHTML += `<td>${row[header]}</td>`;
        });
        tableHTML += '<td>...</td>';

        const prediction = row.predicted_column;
        const predictionText = prediction === '-1' ? 'Phishing' : 'Legitimate';
        const badgeClass = prediction === '-1' ? 'badge-danger' : 'badge-success';
        tableHTML += `<td><span class="badge ${badgeClass}">${predictionText}</span></td>`;
        tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    resultsTable.innerHTML = tableHTML;

    // Show results section, hide upload section
    uploadSection.style.display = 'none';
    resultsSection.style.display = 'block';
}

// New analysis button
newAnalysisBtn.addEventListener('click', () => {
    resultsSection.style.display = 'none';
    uploadSection.style.display = 'block';
    uploadForm.reset();
    urlForm.reset();
    fileName.textContent = 'No file chosen';
    currentResults = null;
});

// Download results
downloadBtn.addEventListener('click', () => {
    if (!currentResults) return;

    const { headers, data } = currentResults;

    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    data.forEach(row => {
        const rowData = headers.map(header => row[header] || '');
        csvContent += rowData.join(',') + '\n';
    });

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'phishing_detection_results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
});
