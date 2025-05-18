// Solar Panel Animation
document.addEventListener('DOMContentLoaded', function() {
    const solarAnimationContainer = document.getElementById('solarAnimation');
    if (!solarAnimationContainer) return;
    
    // Create SVG
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", "0 0 400 300");
    solarAnimationContainer.appendChild(svg);
    
    // Create sunlight rays
    const sunGroup = document.createElementNS(svgNS, "g");
    svg.appendChild(sunGroup);
    
    // Add the sun
    const sun = document.createElementNS(svgNS, "circle");
    sun.setAttribute("cx", "50");
    sun.setAttribute("cy", "50");
    sun.setAttribute("r", "25");
    sun.setAttribute("fill", "#f39c12");
    sunGroup.appendChild(sun);
    
    // Add sunlight rays
    for (let i = 0; i < 8; i++) {
        const ray = document.createElementNS(svgNS, "line");
        const angle = i * 45 * Math.PI / 180;
        const x1 = 50 + 30 * Math.cos(angle);
        const y1 = 50 + 30 * Math.sin(angle);
        const x2 = 50 + 55 * Math.cos(angle);
        const y2 = 50 + 55 * Math.sin(angle);
        
        ray.setAttribute("x1", x1);
        ray.setAttribute("y1", y1);
        ray.setAttribute("x2", x2);
        ray.setAttribute("y2", y2);
        ray.setAttribute("stroke", "#f39c12");
        ray.setAttribute("stroke-width", "3");
        ray.setAttribute("stroke-linecap", "round");
        ray.setAttribute("class", "sun-ray");
        sunGroup.appendChild(ray);
    }
    
    // Create solar panel group
    const panelGroup = document.createElementNS(svgNS, "g");
    panelGroup.setAttribute("transform", "translate(150, 100)");
    svg.appendChild(panelGroup);
    
    // Create solar panel mount
    const mount = document.createElementNS(svgNS, "polygon");
    mount.setAttribute("points", "100,150 200,150 180,100 120,100");
    mount.setAttribute("fill", "#7f8c8d");
    mount.setAttribute("stroke", "#34495e");
    mount.setAttribute("stroke-width", "2");
    panelGroup.appendChild(mount);
    
    // Create solar panel frame
    const frame = document.createElementNS(svgNS, "rect");
    frame.setAttribute("x", "95");
    frame.setAttribute("y", "40");
    frame.setAttribute("width", "110");
    frame.setAttribute("height", "70");
    frame.setAttribute("fill", "#34495e");
    frame.setAttribute("rx", "3");
    frame.setAttribute("ry", "3");
    panelGroup.appendChild(frame);
    
    // Create individual solar cells
    const cellSize = 20;
    const cellGap = 5;
    const startX = 100;
    const startY = 45;
    const columns = 5;
    const rows = 3;
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const cell = document.createElementNS(svgNS, "rect");
            cell.setAttribute("x", startX + c * (cellSize + cellGap));
            cell.setAttribute("y", startY + r * (cellSize + cellGap));
            cell.setAttribute("width", cellSize);
            cell.setAttribute("height", cellSize);
            cell.setAttribute("fill", "#3498db");
            cell.setAttribute("rx", "2");
            cell.setAttribute("ry", "2");
            cell.setAttribute("class", "solar-cell");
            cell.setAttribute("data-row", r);
            cell.setAttribute("data-col", c);
            panelGroup.appendChild(cell);
        }
    }
    
    // Create electricity path from panel to house
    const electricityPath = document.createElementNS(svgNS, "path");
    electricityPath.setAttribute("d", "M150,110 L150,180 L80,180 L80,220");
    electricityPath.setAttribute("stroke", "#3498db");
    electricityPath.setAttribute("stroke-width", "3");
    electricityPath.setAttribute("fill", "none");
    electricityPath.setAttribute("stroke-dasharray", "5,5");
    electricityPath.setAttribute("id", "electricity-path");
    svg.appendChild(electricityPath);
    
    // Create battery symbol
    const battery = document.createElementNS(svgNS, "g");
    battery.setAttribute("transform", "translate(80, 230)");
    svg.appendChild(battery);
    
    const batteryBody = document.createElementNS(svgNS, "rect");
    batteryBody.setAttribute("x", "-15");
    batteryBody.setAttribute("y", "0");
    batteryBody.setAttribute("width", "30");
    batteryBody.setAttribute("height", "40");
    batteryBody.setAttribute("fill", "#2ecc71");
    batteryBody.setAttribute("rx", "3");
    batteryBody.setAttribute("ry", "3");
    batteryBody.setAttribute("stroke", "#27ae60");
    batteryBody.setAttribute("stroke-width", "2");
    battery.appendChild(batteryBody);
    
    const batteryTop = document.createElementNS(svgNS, "rect");
    batteryTop.setAttribute("x", "-5");
    batteryTop.setAttribute("y", "-5");
    batteryTop.setAttribute("width", "10");
    batteryTop.setAttribute("height", "5");
    batteryTop.setAttribute("fill", "#27ae60");
    battery.appendChild(batteryTop);
    
    const batteryLevel = document.createElementNS(svgNS, "rect");
    batteryLevel.setAttribute("x", "-10");
    batteryLevel.setAttribute("y", "5");
    batteryLevel.setAttribute("width", "20");
    batteryLevel.setAttribute("height", "30");
    batteryLevel.setAttribute("fill", "#2ecc71");
    batteryLevel.setAttribute("id", "battery-level");
    battery.appendChild(batteryLevel);
    
    // Animation functions
    function animateSunRays() {
        const rays = document.querySelectorAll('.sun-ray');
        rays.forEach((ray, index) => {
            const delay = index * 100;
            setTimeout(() => {
                ray.animate([
                    { opacity: 0.3 },
                    { opacity: 1 },
                    { opacity: 0.3 }
                ], {
                    duration: 2000,
                    iterations: Infinity
                });
            }, delay);
        });
    }
    
    function animateSolarCells() {
        const cells = document.querySelectorAll('.solar-cell');
        cells.forEach((cell, index) => {
            const row = parseInt(cell.getAttribute('data-row'));
            const col = parseInt(cell.getAttribute('data-col'));
            const delay = (row * 5 + col) * 100;
            
            setTimeout(() => {
                cell.animate([
                    { fill: '#3498db' },
                    { fill: '#2980b9' },
                    { fill: '#3498db' }
                ], {
                    duration: 3000,
                    iterations: Infinity
                });
            }, delay);
        });
    }
    
    function animateElectricityFlow() {
        const electricityPath = document.getElementById('electricity-path');
        electricityPath.animate([
            { strokeDashoffset: 0 },
            { strokeDashoffset: -20 }
        ], {
            duration: 1000,
            iterations: Infinity
        });
    }
    
    function animateBattery() {
        const batteryLevel = document.getElementById('battery-level');
        batteryLevel.animate([
            { height: '5px', y: '30' },
            { height: '30px', y: '5' }
        ], {
            duration: 8000,
            iterations: Infinity,
            direction: 'alternate',
            easing: 'ease-in-out'
        });
    }
    
    // Start animations
    setTimeout(() => {
        animateSunRays();
        animateSolarCells();
        animateElectricityFlow();
        animateBattery();
    }, 500);
});