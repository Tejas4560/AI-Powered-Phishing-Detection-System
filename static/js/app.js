// DOM Elements
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const analyzeBtn = document.getElementById('analyzeBtn');
const uploadSection = document.getElementById('uploadSection');
const resultsSection = document.getElementById('resultsSection');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statsGrid = document.getElementById('statsGrid');
const resultsTable = document.getElementById('resultsTable');

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

// Form submit handler
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

// Display results
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
        const rowData = headers.map(header => row[header]);
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
