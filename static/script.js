document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    const btnBaseline = document.getElementById('btn-baseline');
    const btnCheck = document.getElementById('btn-check');
    const alertsContainer = document.getElementById('alerts-container');
    const statusDot = document.getElementById('system-status');
    const statusText = document.getElementById('status-text');
    const eventCount = document.getElementById('event-count');

    // Function to re-render icons if we dynamically add HTML containing <i data-lucide="...">
    const renderIcons = () => {
        lucide.createIcons();
    };

    // Initialize baseline
    btnBaseline.addEventListener('click', async () => {
        btnBaseline.disabled = true;
        const originalHTML = btnBaseline.innerHTML;
        btnBaseline.innerHTML = '<i data-lucide="loader" class="spin"></i> Processing...';
        renderIcons();
        
        try {
            const response = await fetch('/api/baseline', { method: 'POST' });
            const data = await response.json();
            
            alertsContainer.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--status-success); padding: 2rem;">
                        <i data-lucide="check-circle" style="vertical-align: middle; margin-right: 8px;"></i>
                        ${data.message} Tracking ${data.count} file(s).
                    </td>
                </tr>
            `;
            
            statusDot.classList.add('active');
            statusText.innerText = 'Monitoring Active (Baseline Generated)';
            eventCount.innerText = '0 Events';
            renderIcons();
        } catch (error) {
            alert('System Error: Unable to initialize baseline.');
        } finally {
            btnBaseline.innerHTML = originalHTML;
            btnBaseline.disabled = false;
            renderIcons();
        }
    });

    // Check Integrity
    btnCheck.addEventListener('click', async () => {
        btnCheck.disabled = true;
        const originalHTML = btnCheck.innerHTML;
        btnCheck.innerHTML = '<i data-lucide="loader" class="spin"></i> Scanning...';
        renderIcons();
        
        try {
            const response = await fetch('/api/check');
            if (response.status === 400) {
                alert('Configuration Error: No baseline found. Please initialize baseline first.');
                return;
            }
            
            const data = await response.json();
            
            alertsContainer.innerHTML = '';
            
            if (data.alerts.length === 0) {
                alertsContainer.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; color: var(--status-success); padding: 2rem;">
                            <i data-lucide="shield-check" style="vertical-align: middle; margin-right: 8px;"></i>
                            Integrity verified. No unauthorized modifications detected.
                        </td>
                    </tr>
                `;
                eventCount.innerText = '0 Events';
            } else {
                eventCount.innerText = `${data.alerts.length} Event(s)`;
                data.alerts.forEach(alert => {
                    const tr = document.createElement('tr');
                    
                    let eventType = 'MODIFICATION';
                    let severityClass = 'sev-medium';
                    let iconName = 'alert-triangle';
                    
                    if (alert.type === 'new') {
                        eventType = 'CREATION';
                        severityClass = 'sev-low';
                        iconName = 'file-plus';
                    }
                    if (alert.type === 'deleted') {
                        eventType = 'DELETION';
                        severityClass = 'sev-high';
                        iconName = 'trash-2';
                    }
                    if (alert.type === 'modified') {
                        eventType = 'MODIFICATION';
                        severityClass = 'sev-high';
                        iconName = 'alert-circle';
                    }
                    
                    tr.innerHTML = `
                        <td>${alert.time}</td>
                        <td style="font-weight: 500;">${eventType}</td>
                        <td class="alert-file-path">${alert.file}</td>
                        <td>
                            <span class="severity-pill ${severityClass}">
                                <i data-lucide="${iconName}"></i>
                                ${alert.type === 'new' ? 'Low' : 'Critical'}
                            </span>
                        </td>
                    `;
                    alertsContainer.appendChild(tr);
                });
            }
            renderIcons();
        } catch (error) {
            alert('System Error: Unable to perform integrity scan.');
        } finally {
            btnCheck.innerHTML = originalHTML;
            btnCheck.disabled = false;
            renderIcons();
        }
    });

    // Add a spin animation class for loading icons
    const style = document.createElement('style');
    style.innerHTML = `
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
});
