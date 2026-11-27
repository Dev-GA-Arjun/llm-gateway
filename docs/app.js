const metricsContainer = document.getElementById("metrics");
const resultsTable = document.getElementById("resultsTable");
const resultCount = document.getElementById("resultCount");

let records = [];
let latencyChart;
let throughputChart;

async function loadResults() {
    try {
        const response = await fetch("./data/results.jsonl");

        if (!response.ok) {
            throw new Error(`Could not load results: HTTP ${response.status}`);
        }

        const rawData = await response.text();

        records = rawData
            .split(/\r?\n/)
            .filter(line => line.trim())
            .map(line => JSON.parse(line))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        renderMetrics();
        renderCharts();
        renderTable();
    } catch (error) {
        metricsContainer.textContent = error.message;
        resultsTable.innerHTML =
            `<tr><td colspan="6">${error.message}. Run the site through a local web server.</td></tr>`;
    }
}

function getSuccessfulRecords() {
    return records.filter(record =>
        record.status === 200 &&
        Number.isFinite(record.totalLatencyMs)
    );
}

function average(values) {
    return values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0;
}

function renderMetrics() {
    const successful = getSuccessfulRecords();
    const latencies = successful.map(r => r.totalLatencyMs);
    const throughput = successful
        .map(r => r.tokensPerSecond)
        .filter(Number.isFinite);

    const successRate = records.length
        ? (successful.length / records.length) * 100
        : 0;

    const metrics = [
        {
            label: "Total requests",
            value: records.length,
            note: "All recorded requests"
        },
        {
            label: "Success rate",
            value: `${successRate.toFixed(1)}%`,
            note: `${successful.length} successful requests`
        },
        {
            label: "Average latency",
            value: `${(average(latencies) / 1000).toFixed(2)} s`,
            note: "Successful requests only"
        },
        {
            label: "Average throughput",
            value: `${average(throughput).toFixed(2)}`,
            note: "Tokens per second, successful requests"
        }
    ];

    metricsContainer.innerHTML = metrics.map(metric => `
        <article class="metric-card">
            <div class="metric-label">${metric.label}</div>
            <div class="metric-value">${metric.value}</div>
            <div class="metric-note">${metric.note}</div>
        </article>
    `).join("");
}

function renderCharts() {
    const successful = getSuccessfulRecords();

    const labels = successful.map((record, index) =>
        `${index + 1}. ${new Date(record.timestamp).toLocaleTimeString()}`
    );

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: "#aab5c5" }
            }
        },
        scales: {
            x: {
                ticks: { color: "#929daf", maxRotation: 45 },
                grid: { color: "#242d3b" }
            },
            y: {
                beginAtZero: true,
                ticks: { color: "#929daf" },
                grid: { color: "#242d3b" }
            }
        }
    };

    if (latencyChart) latencyChart.destroy();
    if (throughputChart) throughputChart.destroy();

    latencyChart = new Chart(document.getElementById("latencyChart"), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Latency (seconds)",
                data: successful.map(r => r.totalLatencyMs / 1000),
                borderColor: "#82aaff",
                backgroundColor: "#82aaff22",
                fill: true,
                tension: 0.3
            }]
        },
        options: chartOptions
    });

    throughputChart = new Chart(document.getElementById("throughputChart"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Tokens per second",
                data: successful.map(r => r.tokensPerSecond),
                backgroundColor: "#72c9a0"
            }]
        },
        options: chartOptions
    });
}

function renderTable() {
    const search = document.getElementById("searchInput")
        .value.toLowerCase();

    const provider = document.getElementById("providerFilter").value;
    const status = document.getElementById("statusFilter").value;

    const filtered = records.filter(record => {
        const matchesSearch =
            record.provider.toLowerCase().includes(search) ||
            record.model.toLowerCase().includes(search);

        const matchesProvider =
            provider === "all" || record.provider === provider;

        const matchesStatus =
            status === "all" ||
            (status === "success" && record.status === 200) ||
            (status === "failed" && record.status !== 200);

        return matchesSearch && matchesProvider && matchesStatus;
    });

    resultsTable.innerHTML = filtered.map(record => {
        const successful = record.status === 200;

        return `
            <tr>
                <td>${new Date(record.timestamp).toLocaleString()}</td>
                <td>${record.provider}</td>
                <td>${record.model}</td>
                <td>${(record.totalLatencyMs / 1000).toFixed(2)} s</td>
                <td>${Number.isFinite(record.tokensPerSecond)
                    ? record.tokensPerSecond.toFixed(2)
                    : "N/A"}</td>
                <td>
                    <span class="status ${successful ? "success" : "failed"}">
                        ${record.status}
                    </span>
                </td>
            </tr>
        `;
    }).join("") || `<tr><td colspan="6">No matching records found.</td></tr>`;

    resultCount.textContent =
        `Showing ${filtered.length} of ${records.length} records`;
}

document.getElementById("searchInput")
    .addEventListener("input", renderTable);

document.getElementById("providerFilter")
    .addEventListener("change", renderTable);

document.getElementById("statusFilter")
    .addEventListener("change", renderTable);

loadResults();
