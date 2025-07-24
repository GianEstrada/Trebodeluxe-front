const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static('.'));

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Proxy to backend for testing
app.get('/api/test-backend', async (req, res) => {
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://trebodeluxe-backend.onrender.com/api/site-settings/index-images');
        const data = await response.json();
        res.json({ success: true, backend_status: response.status, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Test server running at http://localhost:${PORT}`);
    console.log(`📄 Open http://localhost:${PORT}/test-api-simple.html to test APIs`);
});
