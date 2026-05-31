// Daily Sales Report - Frontend Logic
(function() {
    'use strict';

    const elements = {
        reportDate: document.getElementById('reportDate'),
        generateBtn: document.getElementById('generateBtn'),
        exportBtn: document.getElementById('exportBtn'),
        loading: document.getElementById('loading'),
        reportContent: document.getElementById('reportContent'),
        emptyState: document.getElementById('emptyState'),
        errorAlert: document.getElementById('errorAlert'),
        summarySection: document.getElementById('summarySection'),
        reportDateDisplay: document.getElementById('reportDateDisplay'),
        totalSalesValue: document.getElementById('totalSalesValue'),
        totalCostValue: document.getElementById('totalCostValue'),
        profitValue: document.getElementById('profitValue'),
        totalSalesSubtitle: document.getElementById('totalSalesSubtitle'),
        totalCostSubtitle: document.getElementById('totalCostSubtitle'),
        profitSubtitle: document.getElementById('profitSubtitle'),
        summaryText: document.getElementById('summaryText'),
    };

    let currentReportData = null;
    let host = "localhost";
    let port = process.env.PORT;
    let api = "http://" + host + ":" + port + "/api/";

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        initializeDatePicker();
        setupEventListeners();
    });

    /**
     * Set date input to today's date
     */
    function initializeDatePicker() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        elements.reportDate.value = `${year}-${month}-${day}`;
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        elements.generateBtn.addEventListener('click', generateReport);
        elements.exportBtn.addEventListener('click', exportPDF);
        elements.reportDate.addEventListener('change', function() {
            // Reset report when date changes
            resetReport();
        });
    }

    /**
     * Reset report display
     */
    function resetReport() {
        elements.reportContent.style.display = 'none';
        elements.emptyState.style.display = 'block';
        elements.loading.style.display = 'none';
        elements.errorAlert.style.display = 'none';
        elements.exportBtn.disabled = true;
        currentReportData = null;
    }

    /**
     * Generate report for selected date
     */
    async function generateReport() {
        const selectedDate = elements.reportDate.value;

        if (!selectedDate) {
            showError('Please select a date');
            return;
        }

        // Show loading state
        elements.loading.style.display = 'block';
        elements.emptyState.style.display = 'none';
        elements.reportContent.style.display = 'none';
        elements.errorAlert.style.display = 'none';

        try {
            const response = await fetch(`${api}reports/daily?date=${selectedDate}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to generate report');
            }

            const data = await response.json();
            currentReportData = data;

            displayReport(data);
            elements.loading.style.display = 'none';
            elements.reportContent.style.display = 'block';
            elements.emptyState.style.display = 'none';
            elements.exportBtn.disabled = false;

        } catch (error) {
            console.error('Report generation error:', error);
            elements.loading.style.display = 'none';
            showError(error.message || 'An error occurred while generating the report');
        }
    }

    /**
     * Display report data in the UI
     */
    function displayReport(data) {
        const date = new Date(data.date + 'T00:00:00');
        const formattedDate = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        // Update date display
        elements.reportDateDisplay.textContent = formattedDate;

        // Format currency
        const currencyFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        });

        // Update metric values
        elements.totalSalesValue.textContent = currencyFormatter.format(data.totalSales);
        elements.totalCostValue.textContent = currencyFormatter.format(data.totalCost);
        elements.profitValue.textContent = currencyFormatter.format(data.profit);

        // Update subtitles
        const transactionText = data.transactionCount === 1 
            ? 'from 1 transaction' 
            : `from ${data.transactionCount} transactions`;
        elements.totalSalesSubtitle.textContent = transactionText;

        // Calculate profit margin
        const profitMargin = data.totalSales > 0 
            ? ((data.profit / data.totalSales) * 100).toFixed(1)
            : 0;
        elements.profitSubtitle.textContent = `${profitMargin}% margin`;

        // Update summary text
        const costPercentage = data.totalSales > 0 
            ? ((data.totalCost / data.totalSales) * 100).toFixed(1)
            : 0;
        
        const summaryHTML = `
            <strong>${formattedDate}</strong><br>
            • Total Transactions: <strong>${data.transactionCount}</strong><br>
            • Total Sales Revenue: <strong>${currencyFormatter.format(data.totalSales)}</strong><br>
            • Total Cost of Sales: <strong>${currencyFormatter.format(data.totalCost)}</strong> (${costPercentage}% of sales)<br>
            • Net Profit: <strong>${currencyFormatter.format(data.profit)}</strong><br>
            • Profit Margin: <strong>${profitMargin}%</strong><br>
            • Report Generated: <strong>${new Date(data.timestamp).toLocaleString()}</strong>
        `;

        elements.summaryText.innerHTML = summaryHTML;
        elements.summarySection.style.display = 'block';
    }

    /**
     * Show error message
     */
    function showError(message) {
        elements.errorAlert.textContent = message;
        elements.errorAlert.style.display = 'block';
    }

    /**
     * Export report as PDF
     */
    function exportPDF() {
        if (!currentReportData) {
            showError('No report data available. Please generate a report first.');
            return;
        }

        const date = currentReportData.date;
        const dateObj = new Date(date + 'T00:00:00');
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        // Format currency
        const currencyFormatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        });

        const profitMargin = currentReportData.totalSales > 0 
            ? ((currentReportData.profit / currentReportData.totalSales) * 100).toFixed(1)
            : 0;

        const costPercentage = currentReportData.totalSales > 0 
            ? ((currentReportData.totalCost / currentReportData.totalSales) * 100).toFixed(1)
            : 0;

        // Create print-friendly HTML
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Daily Sales Report - ${date}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 40px;
                        color: #333;
                    }
                    h1 {
                        text-align: center;
                        color: #1e293b;
                        margin-bottom: 30px;
                    }
                    .report-date {
                        text-align: center;
                        font-size: 18px;
                        margin-bottom: 40px;
                        color: #64748b;
                    }
                    .metrics {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 40px;
                    }
                    .metric {
                        border: 2px solid #e2e8f0;
                        padding: 20px;
                        text-align: center;
                        border-radius: 8px;
                    }
                    .metric-label {
                        font-size: 12px;
                        color: #64748b;
                        text-transform: uppercase;
                        margin-bottom: 10px;
                        letter-spacing: 1px;
                    }
                    .metric-value {
                        font-size: 28px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .metric-value.sales {
                        color: #10b981;
                    }
                    .metric-value.cost {
                        color: #ef4444;
                    }
                    .metric-value.profit {
                        color: #3b82f6;
                    }
                    .metric-subtitle {
                        font-size: 12px;
                        color: #64748b;
                    }
                    .summary {
                        border: 1px solid #e2e8f0;
                        padding: 20px;
                        background: #f8fafc;
                        border-radius: 8px;
                        line-height: 1.8;
                    }
                    .summary strong {
                        color: #1e293b;
                    }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        font-size: 11px;
                        color: #94a3b8;
                    }
                    @media print {
                        body { margin: 0; }
                    }
                </style>
            </head>
            <body>
                <h1>📊 Daily Sales Report</h1>
                <div class="report-date">${formattedDate}</div>
                
                <div class="metrics">
                    <div class="metric">
                        <div class="metric-label">Total Sales</div>
                        <div class="metric-value sales">${currencyFormatter.format(currentReportData.totalSales)}</div>
                        <div class="metric-subtitle">${currentReportData.transactionCount} transactions</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Cost of Sales</div>
                        <div class="metric-value cost">${currencyFormatter.format(currentReportData.totalCost)}</div>
                        <div class="metric-subtitle">${costPercentage}% of sales</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Profit</div>
                        <div class="metric-value profit">${currencyFormatter.format(currentReportData.profit)}</div>
                        <div class="metric-subtitle">${profitMargin}% margin</div>
                    </div>
                </div>

                <div class="summary">
                    <p><strong>Report Summary</strong></p>
                    <p>
                        • Total Transactions: <strong>${currentReportData.transactionCount}</strong><br>
                        • Total Sales Revenue: <strong>${currencyFormatter.format(currentReportData.totalSales)}</strong><br>
                        • Total Cost of Sales: <strong>${currencyFormatter.format(currentReportData.totalCost)}</strong><br>
                        • Net Profit: <strong>${currencyFormatter.format(currentReportData.profit)}</strong><br>
                        • Profit Margin: <strong>${profitMargin}%</strong>
                    </p>
                </div>

                <div class="footer">
                    Generated on ${new Date(currentReportData.timestamp).toLocaleString()}
                </div>
            </body>
            </html>
        `;

        // Create blob and download
        const blob = new Blob([printContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Daily-Sales-Report-${date}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Alternative: open print dialog
        setTimeout(() => {
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.addEventListener('load', function() {
                    printWindow.print();
                });
            }
        }, 100);
    }

})();
