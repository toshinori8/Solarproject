import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import fetch from 'node-fetch';

// Get directory name using ES modules approach
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIGS_FILE = join(__dirname, 'public', 'configs.json');

// Parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(join(__dirname, 'public')));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Handle OPTIONS requests
app.options('*', (req, res) => {
  res.sendStatus(200);
});

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// API endpoint for geocoding
app.get('/api/geocode', async (req, res) => {
  try {
    const address = req.query.address;
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'SolarTool/1.0 (contact@example.com)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }
    if(response){
      console.log("Response OK", response);
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ 
      error: 'Error fetching address data',
      details: error.message 
    });
  }
});

// API endpoint for PVGIS data
app.get('/api/pvgis', async (req, res) => {
  try {
    const { lat, lon, loss, angle, aspect } = req.query;

    // Validate required parameters
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const url = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${lat}&lon=${lon}&peakpower=1&loss=${loss || 14}&angle=${angle || 35}&aspect=${aspect || 0}&outputformat=json`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`PVGIS API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || !data.outputs) {
      return res.status(404).json({ error: 'No solar data available for this location' });
    }

    res.json(data);
  } catch (error) {
    console.error('PVGIS error:', error);
    res.status(500).json({ 
      error: 'Error fetching solar data',
      details: error.message 
    });
  }
});

// Save configuration
app.post('/api/configs', async (req, res) => {
  try {
    const { name, data: newConfigData } = req.body; // Oczekujemy nazwy i danych konfiguracji
    if (!name || !newConfigData) {
      return res.status(400).json({ error: 'Nazwa konfiguracji oraz dane są wymagane' });
    }

    let configsArray = [];
    try {
      const fileContent = await fs.readFile(CONFIGS_FILE, 'utf8');
      configsArray = JSON.parse(fileContent);
      if (!Array.isArray(configsArray)) { // Upewnij się, że to tablica
          configsArray = [];
      }
    } catch (error) {
      if (error.code !== 'ENOENT') { // Ignoruj jeśli plik nie istnieje, zostanie utworzony
        throw error;
      }
      // Jeśli ENOENT, configsArray pozostaje []
    }

    const existingConfigIndex = configsArray.findIndex(c => c.name === name);
    if (existingConfigIndex > -1) {
      // Aktualizuj istniejącą konfigurację
      configsArray[existingConfigIndex].data = newConfigData;
    } else {
      // Dodaj nową konfigurację
      configsArray.push({ name, data: newConfigData });
    }

    await fs.writeFile(CONFIGS_FILE, JSON.stringify(configsArray, null, 2));
    res.json({ message: `Konfiguracja '${name}' zapisana pomyślnie`, configs: configsArray });
  } catch (error) {
    console.error('Save config error:', error);
    res.status(500).json({ 
      error: 'Error saving configuration',
      details: error.message 
    });
  }
});

// Load configurations
app.get('/api/configs', async (req, res) => {
  try {
    const data = await fs.readFile(CONFIGS_FILE, 'utf8');
    const configsArray = JSON.parse(data);
    if (!Array.isArray(configsArray)) { // Powinno być tablicą dzięki logice POST
        return res.json([]);
    }
    res.json(configsArray); // Zwraca tablicę obiektów {name, data}
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Jeśli plik nie istnieje, zwróć pustą tablicę
      res.json([]);
    } else {
      console.error('Load config error:', error);
      res.status(500).json({ 
        error: 'Error loading configurations',
        details: error.message 
      });
    }
  }
});

// Delete configuration
app.delete('/api/configs/:name', async (req, res) => {
  try {
    const configName = req.params.name;
    if (!configName) {
      return res.status(400).json({ error: 'Nazwa konfiguracji jest wymagana' });
    }

    let configsArray = [];
    try {
      const fileContent = await fs.readFile(CONFIGS_FILE, 'utf8');
      configsArray = JSON.parse(fileContent);
       if (!Array.isArray(configsArray)) {
          configsArray = [];
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: 'Plik konfiguracji nie znaleziony, nic do usunięcia.' });
      }
      throw error;
    }

    const initialLength = configsArray.length;
    configsArray = configsArray.filter(c => c.name !== configName);

    if (configsArray.length === initialLength) {
      return res.status(404).json({ error: `Konfiguracja '${configName}' nie znaleziona.` });
    }

    await fs.writeFile(CONFIGS_FILE, JSON.stringify(configsArray, null, 2));
    res.json({ message: `Konfiguracja '${configName}' usunięta pomyślnie`, configs: configsArray });
  } catch (error) {
    console.error('Delete config error:', error);
    res.status(500).json({
      error: 'Błąd podczas usuwania konfiguracji',
      details: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message 
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});