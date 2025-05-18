# Solar System Comparison Tool

A comprehensive web application for comparing different solar system configurations, built with Node.js and modern web technologies. This tool helps users make informed decisions about solar panel installations by providing detailed analysis of various configurations.

## 🌟 Features

### Solar System Analysis
- Calculate and compare solar panel systems based on panel count and battery configurations
- Analyze return on investment (ROI) for different setups
- Visualize energy production vs. consumption with interactive charts
- Input and save location-specific solar production data via PVGIS integration
- Explore scenarios for winter and summer energy production
- Track and compare energy independence with different configurations

### Technical Capabilities
- Real-time calculations and updates
- Server-side API handling for reliable data fetching
- Configuration saving and loading functionality
- Responsive design that works on all devices
- Interactive tooltips with detailed explanations
- Beautiful SVG animations

### Data Analysis
- Detailed ROI calculations
- Energy production forecasting
- Battery capacity optimization
- Seasonal performance analysis
- Cost-benefit comparisons

## 📊 Calculation Methods

### Production Calculations
- **Annual Production**: `panels × panel_power × annual_production_factor`
- **Winter Daily**: `panels × panel_power × winter_production_factor`
- **Summer Daily**: `panels × panel_power × summer_production_factor`

### Battery Analysis
- **Usable Capacity**: `batteries × battery_capacity × depth_of_discharge`
- **Daily Coverage**: `(usable_capacity / daily_consumption) × 100%`

### Financial Metrics
- **Total Cost**: `(panels × panel_price) + (batteries × battery_price) + inverter_price + additional_costs`
- **Annual Savings**: `(solar_production × grid_price) + (battery_capacity × night_savings × 365)`
- **Payback Period**: `total_cost / annual_savings`
- **5-Year ROI**: `((annual_savings × 5 - total_cost) / total_cost) × 100%`

## 🔧 Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/solar-system-comparison-tool.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

For development with auto-restart:
```bash
npm run dev
```

## 🚀 Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Input your parameters:
   - Solar panel specifications
   - Battery configurations
   - Energy consumption patterns
   - Location details for solar production
3. View the generated comparisons and recommendations
4. Save your configurations for future reference

## 🔋 Battery Types and Coefficients

### Lithium Iron Phosphate (LiFePO4)
- Depth of Discharge: 80-90%
- Lifecycle: 3000-7000 cycles
- Efficiency: ~98%

### Lead Acid
- Depth of Discharge: 50-60%
- Lifecycle: 200-300 cycles
- Efficiency: ~80%

### Lithium Ion
- Depth of Discharge: 80-85%
- Lifecycle: 500-1500 cycles
- Efficiency: ~95%

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create a feature branch: `git checkout -b new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin new-feature`
5. Submit a Pull Request

### Areas for Contribution
- Additional battery types and specifications
- Enhanced calculation methods
- UI/UX improvements
- Bug fixes and optimizations
- Documentation improvements
- Translations

## 📝 Bug Reports

Found a bug? Please help us improve by reporting it:

1. Check if the bug has already been reported
2. Create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment details

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- PVGIS for solar radiation data
- OpenStreetMap for geocoding services
- Chart.js for data visualization
- Contributors and users who provide valuable feedback

## 📬 Contact

Questions? Suggestions? Feel free to:
- Open an issue
- Submit a pull request
- Contact us through the repository

Your feedback helps make this tool better for everyone!