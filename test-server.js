// Test the API endpoint directly
const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple HTTP server to test our RSS service
const server = http.createServer(async (req, res) => {
  if (req.url === '/test-rss') {
    try {
      // Load feeds from CSV
      const csvPath = path.join(__dirname, 'crypto_feeds.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n')
        .filter(line => line.trim() && !line.startsWith('Feed') && line.startsWith('http'));
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'RSS Service Test',
        totalFeeds: lines.length,
        sampleFeeds: lines.slice(0, 5),
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📍 Test RSS endpoint: http://localhost:${PORT}/test-rss`);
});
