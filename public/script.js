let chart;
let batteryDetails = { volts: 12, capacity: 1.005, unit: 'kWh', manufacturer: 'VOLT Polska', offerLink: '' };
let addressDetails = { address: '', lat: null, lon: null, angle: 30, aspect: 0, loss: 14 };
let configData = []; // Global configData variable declaration

// Functions for address modal
function openAddressModal() {
    const modal = document.getElementById('addressModal');
    document.getElementById('address').value = addressDetails.address;
    document.getElementById('panelAngle').value = addressDetails.angle;
    document.getElementById('panelAspect').value = addressDetails.aspect;
    document.getElementById('systemLoss').value = addressDetails.loss;
    document.getElementById('addressStatus').textContent = '';
    modal.showModal();
}

function closeAddressModal() {
    document.getElementById('addressModal').close();
}

async function geocodeAddress(address) {
    //  to jest w pliku index.js serwera  taki jest endpoint na serwerze http://localhost:3000   app.get('/api/geocode', async (req, res) => {
    // Używamy endpointu na naszym serwerze
    const url = `/api/geocode?address=${encodeURIComponent(address)}`;
    try {
        const response = await fetch(url); // Nagłówek User-Agent jest dodawany przez serwer

        if (!response.ok) {
            let errorMsg = `Błąd serwera (${response.status}): ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorData.message || errorMsg;
            } catch (e) {
                // Nie udało się sparsować JSON z błędem, użyj statusText
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        // Serwer backendowy powinien już obsłużyć przypadek, gdy adres nie został znaleziony (np. zwracając 404)
        // ale dodatkowe sprawdzenie po stronie klienta nie zaszkodzi.
        if (!data || data.length === 0) {
            throw new Error('Nie znaleziono adresu lub serwer zwrócił pustą odpowiedź.');
        }
        return {
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
        };
    } catch (error) {
        throw new Error(`Błąd geokodowania: ${error.message}`);
    }
}

async function fetchPVGISData() {
    const address = document.getElementById('address').value.trim();
    const angle = parseFloat(document.getElementById('panelAngle').value);
    const aspect = parseFloat(document.getElementById('panelAspect').value);
    const loss = parseFloat(document.getElementById('systemLoss').value);
    const statusDiv = document.getElementById('addressStatus');

    if (!address) {
        statusDiv.textContent = 'Proszę wpisać adres.';
        return;
    }
    if (isNaN(angle) || angle < 0 || angle > 90) {
        statusDiv.textContent = 'Proszę wpisać prawidłowy kąt nachylenia (0-90°).';
        return;
    }
    if (isNaN(aspect) || aspect < -180 || aspect > 180) {
        statusDiv.textContent = 'Proszę wpisać prawidłową orientację (-180° do 180°).';
        return;
    }
    if (isNaN(loss) || loss < 0 || loss > 50) {
        statusDiv.textContent = 'Proszę wpisać prawidłowe straty systemu (0-50%).';
        return;
    }

    statusDiv.textContent = 'Ładowanie danych...';

    try {
        const coords = await geocodeAddress(address);
        // Używamy endpointu /api/pvgis na naszym serwerze
        const pvgisUrl = `/api/pvgis?lat=${coords.lat}&lon=${coords.lon}&loss=${loss}&angle=${angle}&aspect=${aspect}`;
        // peakpower=1 i outputformat=json są ustawiane przez serwer backendowy

        const response = await fetch(pvgisUrl);

        if (!response.ok) {
            let errorMsg = `Błąd pobierania danych PVGIS (${response.status}): ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error || errorData.message || errorMsg;
            } catch (e) {
                // Nie udało się sparsować JSON z błędem
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        if (!data || !data.outputs) {
            throw new Error('Nieprawidłowa odpowiedź z serwera PVGIS (brak danych wyjściowych).');
        }

        const annualProd = data.outputs.totals.fixed.E_y;
        const monthlyData = data.outputs.monthly.fixed;
        const winterMonths = monthlyData.filter(m => [12, 1, 2].includes(m.month));
        const summerMonths = monthlyData.filter(m => [6, 7, 8].includes(m.month));
        const winterProd = winterMonths.reduce((sum, m) => sum + m.E_d, 0) / winterMonths.length;
        const summerProd = summerMonths.reduce((sum, m) => sum + m.E_d, 0) / summerMonths.length;

        document.getElementById('annualProdFactor').value = annualProd.toFixed(0);
        document.getElementById('winterProdFactor').value = winterProd.toFixed(3);
        document.getElementById('summerProdFactor').value = summerProd.toFixed(3);

        addressDetails = { address, lat: coords.lat, lon: coords.lon, angle, aspect, loss };
        document.getElementById('addressDetails').textContent = `Adres: ${address} (lat: ${coords.lat.toFixed(2)}, lon: ${coords.lon.toFixed(2)})`;

        closeAddressModal();
        updateResults();
        saveData();
        statusDiv.textContent = 'Dane pomyślnie zaktualizowane!';
    } catch (error) {
        statusDiv.textContent = `Błąd: ${error.message}`;
    }
}

function openBatteryModal() {
    const modal = document.getElementById('batteryModal');
    document.getElementById('batteryVolts').value = batteryDetails.volts;
    document.getElementById('batteryCapacityInput').value = batteryDetails.unit === 'Ah' ? batteryDetails.capacity * 1000 / batteryDetails.volts : batteryDetails.capacity;
    document.getElementById('capacityUnit').value = batteryDetails.unit;
    document.getElementById('batteryManufacturer').value = batteryDetails.manufacturer;
    document.getElementById('batteryOfferLink').value = batteryDetails.offerLink;
    modal.showModal();
}

function closeBatteryModal() {
    document.getElementById('batteryModal').close();
}

function submitBatteryDetails() {
    const volts = parseFloat(document.getElementById('batteryVolts').value);
    let capacity = parseFloat(document.getElementById('batteryCapacityInput').value);
    const unit = document.getElementById('capacityUnit').value;
    const manufacturer = document.getElementById('batteryManufacturer').value;
    const offerLink = document.getElementById('batteryOfferLink').value;

    if (isNaN(volts) || volts <= 0) {
        alert('Proszę podać prawidłowe napięcie (V).');
        return;
    }
    if (isNaN(capacity) || capacity <= 0) {
        alert('Proszę podać prawidłową pojemność.');
        return;
    }

    if (unit === 'Ah') {
        capacity = (capacity * volts) / 1000;
    }

    document.getElementById('batteryCapacity').value = capacity.toFixed(3);
    batteryDetails = { volts, capacity, unit, manufacturer, offerLink };

    const detailsDiv = document.getElementById('batteryDetails');
    detailsDiv.innerHTML = `Szczegóły baterii: ${volts}V, ${manufacturer}${offerLink ? `, <a href="${offerLink}" target="_blank">Oferta</a>` : ''}`;

    closeBatteryModal();
    updateResults();
}

function addDevice() {
    const table = document.getElementById('deviceTable');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" value="Nowe urządzenie" class="device-name" oninput="updateResults()"></td>
        <td><input type="number" value="0.5" step="0.1" class="device-power" oninput="updateResults()"></td>
        <td><input type="number" value="1" step="0.1" class="device-hours" oninput="updateResults()"></td>
        <td><button class="remove-btn" onclick="removeDevice(this)">Usuń</button></td>
    `;
    table.appendChild(row);
    updateResults();
}

function removeDevice(button) {
    button.parentElement.parentElement.remove();
    updateResults();
}

function addCost() {
    const table = document.getElementById('costTable');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" value="Nowy koszt" class="cost-name" oninput="updateResults()"></td>
        <td><input type="number" value="100" class="cost-amount" oninput="updateResults()"></td>
        <td><button class="remove-btn" onclick="removeCost(this)">Usuń</button></td>
    `;
    table.appendChild(row);
    updateResults();
}

function removeCost(button) {
    button.parentElement.parentElement.remove();
    updateResults();
}

function getConfigs() {
    const maxPanelCount = parseInt(document.getElementById('panelCount').value) || 8;
    const batteryOptions = [];
    if (document.getElementById('battery4').checked) batteryOptions.push(4);
    if (document.getElementById('battery8').checked) batteryOptions.push(8);
    if (document.getElementById('battery10').checked) batteryOptions.push(10);

    const configs = [];
    for (let panels = 4; panels <= maxPanelCount; panels += 2) {
        batteryOptions.forEach(batteries => {
            configs.push({
                panels,
                batteries,
                id: `${panels}p${batteries}b`
            });
        });
    }
    return configs;
}

function updateResults() {
    const maxPanelCount = parseInt(document.getElementById('panelCount').value) || 8;
    const panelPower = parseFloat(document.getElementById('panelPower').value) / 1000;
    const batteryCapacity = parseFloat(document.getElementById('batteryCapacity').value);
    const dod = parseFloat(document.getElementById('dod').value) / 100;
    const annualProdFactor = parseFloat(document.getElementById('annualProdFactor').value);
    const winterProdFactor = parseFloat(document.getElementById('winterProdFactor').value);
    const summerProdFactor = parseFloat(document.getElementById('summerProdFactor').value);
    const gridPrice = parseFloat(document.getElementById('gridPrice').value);
    const nightChargeSavings = parseFloat(document.getElementById('nightChargeSavings').value);
    const bimonthlyConsumption = parseFloat(document.getElementById('bimonthlyConsumption').value);
    const waterHeatingPower = parseFloat(document.getElementById('waterHeatingPower').value);
    const waterHeatingHours = parseFloat(document.getElementById('waterHeatingHours').value);
    const bathroomHeatingPower = parseFloat(document.getElementById('bathroomHeatingPower').value);
    const bathroomHeatingHours = parseFloat(document.getElementById('bathroomHeatingHours').value);
    const panelPrice = parseFloat(document.getElementById('panelPrice').value);
    const batteryPrice = parseFloat(document.getElementById('batteryPrice').value);
    const inverterPrice = parseFloat(document.getElementById('inverterPrice').value);

    const deviceRows = document.getElementById('deviceTable').getElementsByTagName('tr');
    let deviceConsumption = 0;
    for (let i = 1; i < deviceRows.length; i++) {
        const inputs = deviceRows[i].getElementsByTagName('input');
        const power = parseFloat(inputs[1].value) || 0;
        const hours = parseFloat(inputs[2].value) || 0;
        deviceConsumption += power * hours;
    }
    const dailyConsumption = (bimonthlyConsumption / 60) + (waterHeatingPower * waterHeatingHours) + (bathroomHeatingPower * bathroomHeatingHours) + deviceConsumption;
    const annualConsumption = dailyConsumption * 365;
    const currentDailyConsumption = bimonthlyConsumption / 60;
    const currentAnnualConsumption = currentDailyConsumption * 365;

    const costRows = document.getElementById('costTable').getElementsByTagName('tr');
    let additionalCosts = 0;
    for (let i = 1; i < costRows.length; i++) {
        const inputs = costRows[i].getElementsByTagName('input');
        additionalCosts += parseFloat(inputs[1].value) || 0;
    }

    const configs = getConfigs();
    if (configs.length === 0) {
        document.getElementById('productionTable').innerHTML = '<tr><td colspan="6">Wybierz co najmniej jedną opcję baterii.</td></tr>';
        document.getElementById('batteryTable').innerHTML = '<tr><td colspan="4">Wybierz co najmniej jedną opcję baterii.</td></tr>';
        document.getElementById('winterTable').innerHTML = '<tr><td colspan="4">Wybierz co najmniej jedną opcję baterii.</td></tr>';
        document.getElementById('summerTable').innerHTML = '<tr><td colspan="4">Wybierz co najmniej jedną opcję baterii.</td></tr>';
        document.getElementById('roiTable').innerHTML = '<tr><td colspan="5">Wybierz co najmniej jedną opcję baterii.</td></tr>';
        document.getElementById('recommendedConfig').textContent = 'Brak konfiguracji';
        document.getElementById('recommendedDetails').innerHTML = '';
        if (chart) chart.destroy();
        configData = []; // Reset configData
        return;
    }

    let productionTable = `
        <tr>
            <th>Konfiguracja</th>
            <th>Roczna produkcja (kWh)</th>
            <th>% obecnych potrzeb</th>
            <th>% prognozowanych potrzeb</th>
            <th>Zima dzienna (kWh/dzień)</th>
            <th>Lato dzienne (kWh/dzień)</th>
        </tr>`;
    let batteryTable = `
        <tr>
            <th>Konfiguracja</th>
            <th>Użyteczna pojemność (kWh)</th>
            <th>% obecnych dziennych potrzeb</th>
            <th>% prognozowanych dziennych potrzeb</th>
        </tr>`;
    let winterTable = `
        <tr>
            <th>Konfiguracja</th>
            <th>Produkcja solarna (kWh/dzień)</th>
            <th>Pojemność baterii (kWh)</th>
            <th>Zależność od sieci (kWh/dzień)</th>
        </tr>`;
    let summerTable = `
        <tr>
            <th>Konfiguracja</th>
            <th>Produkcja solarna (kWh/dzień)</th>
            <th>Pojemność baterii (kWh)</th>
            <th>Zależność od sieci/Nadwyżka (kWh/dzień)</th>
        </tr>`;
    let roiTable = `
        <tr>
            <th>Konfiguracja</th>
            <th>Całkowity koszt (PLN)</th>
            <th>Roczne oszczędności (PLN)</th>
            <th>Okres zwrotu (lata)</th>
            <th>ROI po 5 latach</th>
        </tr>`;

    let bestConfig = null;
    let bestScore = -Infinity;
    configData = []; // Reset and update global variable

    configs.forEach(config => {
        const kWp = config.panels * panelPower;
        const annualProduction = kWp * annualProdFactor;
        const winterDailyProduction = kWp * winterProdFactor;
        const summerDailyProduction = kWp * summerProdFactor;
        const currentNeedsPercent = (annualProduction / currentAnnualConsumption) * 100;
        const projectedNeedsPercent = (annualProduction / annualConsumption) * 100;

        const usableBatteryCapacity = config.batteries * batteryCapacity * dod;
        const currentDailyNeedsPercent = (usableBatteryCapacity / currentDailyConsumption) * 100;
        const projectedDailyNeedsPercent = (usableBatteryCapacity / dailyConsumption) * 100;

        const winterAvailableEnergy = winterDailyProduction + usableBatteryCapacity;
        const winterGridDependency = Math.max(0, dailyConsumption - winterAvailableEnergy);
        const summerExcess = summerDailyProduction + usableBatteryCapacity - dailyConsumption;
        const summerStatus = summerExcess >= 0 ? `${summerExcess.toFixed(1)} nadwyżka` : `${Math.abs(summerExcess).toFixed(1)} deficyt`;
        const summerStored = summerExcess >= 0 && summerExcess <= usableBatteryCapacity ? ' (w pełni zmagazynowana)' : '';

        const totalCost = (config.panels * panelPrice) + (config.batteries * batteryPrice) + inverterPrice + additionalCosts;
        const annualSolarSavings = Math.min(annualProduction, annualConsumption) * gridPrice;
        const annualNightSavings = usableBatteryCapacity * nightChargeSavings * 365;
        const annualSavings = annualSolarSavings + annualNightSavings;
        const paybackPeriod = totalCost / annualSavings;
        const roi5Years = ((annualSavings * 5 - totalCost) / totalCost) * 100;

        const configDetails = {
            id: config.id,
            annualProduction,
            projectedNeedsPercent,
            winterDailyProduction,
            summerDailyProduction,
            usableBatteryCapacity,
            winterGridDependency,
            summerExcess,
            totalCost,
            annualSavings,
            paybackPeriod,
            roi5Years
        };
        configData.push(configDetails);

        productionTable += `<tr class="clickable" onclick="showSelectedConfig('${config.id}')"><td>${config.id}</td><td>${annualProduction.toFixed(0)}</td><td>${currentNeedsPercent.toFixed(0)}%</td><td>${projectedNeedsPercent.toFixed(0)}%</td><td>${winterDailyProduction.toFixed(1)}</td><td>${summerDailyProduction.toFixed(1)}</td></tr>`;
        batteryTable += `<tr><td>${config.id}</td><td>${usableBatteryCapacity.toFixed(1)}</td><td>${currentDailyNeedsPercent.toFixed(0)}%</td><td>${projectedDailyNeedsPercent.toFixed(0)}%</td></tr>`;
        winterTable += `<tr><td>${config.id}</td><td>${winterDailyProduction.toFixed(1)}</td><td>${usableBatteryCapacity.toFixed(1)}</td><td>${winterGridDependency.toFixed(1)}</td></tr>`;
        summerTable += `<tr><td>${config.id}</td><td>${summerDailyProduction.toFixed(1)}</td><td>${usableBatteryCapacity.toFixed(1)}</td><td>${summerStatus}${summerStored}</td></tr>`;
        roiTable += `<tr class="clickable" onclick="showSelectedConfig('${config.id}')"><td>${config.id}</td><td>${totalCost.toFixed(0)}</td><td>${annualSavings.toFixed(0)}</td><td>${paybackPeriod.toFixed(1)}</td><td>${roi5Years.toFixed(0)}%</td></tr>`;

        const score = roi5Years - (winterGridDependency * 50);
        if (score > bestScore) {
            bestScore = score;
            bestConfig = configDetails;
        }
    });

    document.getElementById('productionTable').innerHTML = productionTable;
    document.getElementById('batteryTable').innerHTML = batteryTable;
    document.getElementById('winterTable').innerHTML = winterTable;
    document.getElementById('summerTable').innerHTML = summerTable;
    document.getElementById('roiTable').innerHTML = roiTable;

    if (bestConfig) {
        document.getElementById('recommendedConfig').textContent = `Rekomendowana konfiguracja: ${bestConfig.id}`;
        document.getElementById('recommendedDetails').innerHTML = `
            <li>Roczna produkcja: ${bestConfig.annualProduction.toFixed(0)} kWh</li>
            <li>Procent prognozowanych rocznych potrzeb: ${bestConfig.projectedNeedsPercent.toFixed(0)}%</li>
            <li>Zimowa produkcja dzienna: ${bestConfig.winterDailyProduction.toFixed(1)} kWh/dzień</li>
            <li>Letnia produkcja dzienna: ${bestConfig.summerDailyProduction.toFixed(1)} kWh/dzień</li>
            <li>Użyteczna pojemność baterii: ${bestConfig.usableBatteryCapacity.toFixed(1)} kWh</li>
            <li>Zimowa zależność od sieci: ${bestConfig.winterGridDependency.toFixed(1)} kWh/dzień</li>
            <li>Letnia nadwyżka: ${bestConfig.summerExcess >= 0 ? bestConfig.summerExcess.toFixed(1) + ' kWh/dzień' : 'Brak'}</li>
            <li>Całkowity koszt: ${bestConfig.totalCost.toFixed(0)} PLN</li>
            <li>Roczne oszczędności: ${bestConfig.annualSavings.toFixed(0)} PLN</li>
            <li>Okres zwrotu: ${bestConfig.paybackPeriod.toFixed(1)} lat</li>
            <li>ROI po 5 latach: ${bestConfig.roi5Years.toFixed(0)}%</li>
        `;
    }

    updateChart(annualConsumption, configs.map(c => c.panels * panelPower * annualProdFactor));
    saveData();
}

function updateChart(consumption, productions) {
    const ctx = document.getElementById('energyChart').getContext('2d');
    
    if (chart) chart.destroy();
    
    const chartLabels = ['Zużycie'].concat(getConfigs().map(c => c.id));
    const chartData = [consumption].concat(productions);
    const chartColors = ['#e74c3c'].concat(getConfigs().map(() => '#2ecc71'));
    
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Energia (kWh/rok)',
                data: chartData,
                backgroundColor: chartColors,
                borderColor: chartColors.map(color => {
                    const rgb = hexToRgb(color);
                    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
                }),
                borderWidth: 2,
                borderRadius: 4,
                hoverBackgroundColor: chartColors.map(color => {
                    const rgb = hexToRgb(color);
                    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;
                }),
                hoverBorderColor: chartColors.map(color => {
                    const rgb = hexToRgb(color);
                    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`;
                }),
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    padding: 12,
                    cornerRadius: 6,
                    displayColors: true
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.2)'
                    },
                    title: {
                        display: true,
                        text: 'kWh/rok',
                        font: {
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Helper function to convert hex to RGB for chart colors
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
}

function saveData() {
    const data = {
        panelCount: document.getElementById('panelCount').value,
        addressDetails: addressDetails,
        panelPower: document.getElementById('panelPower').value,
        batteryCapacity: document.getElementById('batteryCapacity').value,
        batteryDetails: batteryDetails,
        dod: document.getElementById('dod').value,
        annualProdFactor: document.getElementById('annualProdFactor').value,
        winterProdFactor: document.getElementById('winterProdFactor').value,
        summerProdFactor: document.getElementById('summerProdFactor').value,
        gridPrice: document.getElementById('gridPrice').value,
        nightChargeSavings: document.getElementById('nightChargeSavings').value,
        bimonthlyConsumption: document.getElementById('bimonthlyConsumption').value,
        waterHeatingPower: document.getElementById('waterHeatingPower').value,
        waterHeatingHours: document.getElementById('waterHeatingHours').value,
        bathroomHeatingPower: document.getElementById('bathroomHeatingPower').value,
        bathroomHeatingHours: document.getElementById('bathroomHeatingHours').value,
        panelPrice: document.getElementById('panelPrice').value,
        batteryPrice: document.getElementById('batteryPrice').value,
        inverterPrice: document.getElementById('inverterPrice').value,
        batteryOptions: {
            battery4: document.getElementById('battery4').checked,
            battery8: document.getElementById('battery8').checked,
            battery10: document.getElementById('battery10').checked
        },
        devices: Array.from(document.getElementById('deviceTable').getElementsByTagName('tr')).slice(1).map(row => {
            const inputs = row.getElementsByTagName('input');
            return { name: inputs[0].value, power: inputs[1].value, hours: inputs[2].value };
        }),
        costs: Array.from(document.getElementById('costTable').getElementsByTagName('tr')).slice(1).map(row => {
            const inputs = row.getElementsByTagName('input');
            return { name: inputs[0].value, amount: inputs[1].value };
        })
    };
    localStorage.setItem('solarToolData', JSON.stringify(data));
}

function loadData() {
    const data = JSON.parse(localStorage.getItem('solarToolData'));
    if (!data) return;

    document.getElementById('panelCount').value = data.panelCount || 8;
    if (data.addressDetails) {
        addressDetails = data.addressDetails;
        document.getElementById('addressDetails').textContent = addressDetails.address ? `Adres: ${addressDetails.address} (lat: ${addressDetails.lat.toFixed(2)}, lon: ${addressDetails.lon.toFixed(2)})` : '';
    }
    document.getElementById('panelPower').value = data.panelPower || 425;
    document.getElementById('batteryCapacity').value = data.batteryCapacity || 1.005;
    if (data.batteryDetails) {
        batteryDetails = data.batteryDetails;
        const detailsDiv = document.getElementById('batteryDetails');
        detailsDiv.innerHTML = `Szczegóły baterii: ${batteryDetails.volts}V, ${batteryDetails.manufacturer}${batteryDetails.offerLink ? `, <a href="${batteryDetails.offerLink}" target="_blank">Oferta</a>` : ''}`;
    }
    document.getElementById('dod').value = data.dod || 80;
    document.getElementById('annualProdFactor').value = data.annualProdFactor || 900;
    document.getElementById('winterProdFactor').value = data.winterProdFactor || 1.176;
    document.getElementById('summerProdFactor').value = data.summerProdFactor || 3.588;
    document.getElementById('gridPrice').value = data.gridPrice || 0.9;
    document.getElementById('nightChargeSavings').value = data.nightChargeSavings || 0.55;
    document.getElementById('bimonthlyConsumption').value = data.bimonthlyConsumption || 300;
    document.getElementById('waterHeatingPower').value = data.waterHeatingPower || 2;
    document.getElementById('waterHeatingHours').value = data.waterHeatingHours || 2;
    document.getElementById('bathroomHeatingPower').value = data.bathroomHeatingPower || 1.5;
    document.getElementById('bathroomHeatingHours').value = data.bathroomHeatingHours || 3;
    document.getElementById('panelPrice').value = data.panelPrice || 500;
    document.getElementById('batteryPrice').value = data.batteryPrice || 300;
    document.getElementById('inverterPrice').value = data.inverterPrice || 1000;

    if (data.batteryOptions) {
        document.getElementById('battery4').checked = data.batteryOptions.battery4;
        document.getElementById('battery8').checked = data.batteryOptions.battery8;
        document.getElementById('battery10').checked = data.batteryOptions.battery10;
    }

    if (data.devices) {
        const table = document.getElementById('deviceTable');
        table.innerHTML = `
            <tr>
                <th>Nazwa</th>
                <th>Moc (kW)</th>
                <th>Użycie (godz/dzień)</th>
                <th>Akcje</th>
            </tr>`;
        data.devices.forEach(device => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" value="${device.name}" class="device-name" oninput="updateResults()"></td>
                <td><input type="number" value="${device.power}" step="0.1" class="device-power" oninput="updateResults()"></td>
                <td><input type="number" value="${device.hours}" step="0.1" class="device-hours" oninput="updateResults()"></td>
                <td><button class="remove-btn" onclick="removeDevice(this)">Usuń</button></td>
            `;
            table.appendChild(row);
        });
    }

    if (data.costs) {
        const table = document.getElementById('costTable');
        table.innerHTML = `
            <tr>
                <th>Nazwa</th>
                <th>Koszt (PLN)</th>
                <th>Akcje</th>
            </tr>`;
        data.costs.forEach(cost => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="text" value="${cost.name}" class="cost-name" oninput="updateResults()"></td>
                <td><input type="number" value="${cost.amount}" class="cost-amount" oninput="updateResults()"></td>
                <td><button class="remove-btn" onclick="removeCost(this)">Usuń</button></td>
            `;
            table.appendChild(row);
        });
    }

    updateResults();
}

window.showSelectedConfig = function(configId) {
    const config = configData.find(c => c.id === configId);
    if (config) {
        document.getElementById('selectedConfig').textContent = `Wybrana konfiguracja: ${config.id}`;
        document.getElementById('selectedDetails').innerHTML = `
            <li>Roczna produkcja: ${config.annualProduction.toFixed(0)} kWh</li>
            <li>Procent prognozowanych rocznych potrzeb: ${config.projectedNeedsPercent.toFixed(0)}%</li>
            <li>Zimowa produkcja dzienna: ${config.winterDailyProduction.toFixed(1)} kWh/dzień</li>
            <li>Letnia produkcja dzienna: ${config.summerDailyProduction.toFixed(1)} kWh/dzień</li>
            <li>Użyteczna pojemność baterii: ${config.usableBatteryCapacity.toFixed(1)} kWh</li>
            <li>Zimowa zależność od sieci: ${config.winterGridDependency.toFixed(1)} kWh/dzień</li>
            <li>Letnia nadwyżka: ${config.summerExcess >= 0 ? config.summerExcess.toFixed(1) + ' kWh/dzień' : 'Brak'}</li>
            <li>Całkowity koszt: ${config.totalCost.toFixed(0)} PLN</li>
            <li>Roczne oszczędności: ${config.annualSavings.toFixed(0)} PLN</li>
            <li>Okres zwrotu: ${config.paybackPeriod.toFixed(1)} lat</li>
            <li>ROI po 5 latach: ${config.roi5Years.toFixed(0)}%</li>
        `;
    } else {
        document.getElementById('selectedConfig').textContent = 'Konfiguracja nie znaleziona';
        document.getElementById('selectedDetails').innerHTML = '';
    }
};

// Add smooth reveal animation on page load
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('.section');
    sections.forEach((section, index) => {
        // Set initial state
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        
        // Stagger the animations
        setTimeout(() => {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }, 100 * index);
    });
    
    // Load data after slight delay to ensure smooth animation
    setTimeout(loadData, 300);
});