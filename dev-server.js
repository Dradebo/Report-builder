const express = require('express');
const proxy = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const app = express();
const PORT = 3001;
const DHIS2_INSTANCE = 'https://dev.emisuganda.org/emisdev';

// Get DHIS2 credentials from environment
const DHIS2_USERNAME = process.env.DHIS2_USERNAME;
const DHIS2_PASSWORD = process.env.DHIS2_PASSWORD;

if (!DHIS2_USERNAME || !DHIS2_PASSWORD) {
  console.error('\n⚠ Warning: DHIS2_USERNAME and DHIS2_PASSWORD not found in .env.local');
  console.error('⚠ Create .env.local file with your DHIS2 credentials for authentication\n');
}

// Proxy API requests to DHIS2 instance
app.use('/api', proxy({
  target: DHIS2_INSTANCE,
  changeOrigin: true,
  secure: false,
  logLevel: 'debug',
  cookieDomainRewrite: 'localhost',
  cookiePathRewrite: '/',
  onProxyReq: (proxyReq, req, res) => {
    // Add Basic Authentication if credentials are available
    if (DHIS2_USERNAME && DHIS2_PASSWORD) {
      const auth = Buffer.from(`${DHIS2_USERNAME}:${DHIS2_PASSWORD}`).toString('base64');
      proxyReq.setHeader('Authorization', `Basic ${auth}`);
      console.log(`[Proxy] Using Basic Authentication for ${req.url}`);
    } else {
      // Fallback to forwarding existing auth headers
      if (req.headers.cookie) {
        proxyReq.setHeader('Cookie', req.headers.cookie);
      }
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
    }
    console.log(`[Proxy] ${req.method} ${req.url} → ${DHIS2_INSTANCE}${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Proxy Response] ${proxyRes.statusCode} ${req.url}`);
    // Log if Set-Cookie headers are present
    if (proxyRes.headers['set-cookie']) {
      console.log(`[Proxy] Setting cookies from DHIS2`);
    }
  },
  onError: (err, req, res) => {
    console.error('[Proxy Error]', err.message);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Proxy error: ' + err.message);
  }
}));

// Proxy DHIS2 static resources (dhis-web-commons-security, etc.)
app.use('/dhis-web-commons-security', proxy({
  target: DHIS2_INSTANCE,
  changeOrigin: true,
  secure: false,
  cookieDomainRewrite: 'localhost',
  cookiePathRewrite: '/'
}));

// Serve static files from build/app
app.use(express.static(path.join(__dirname, 'build/app')));

// Fallback to index.html for SPA routing (catch-all for non-API, non-static routes)
app.use((req, res) => {
  // Only serve index.html for GET requests that aren't API calls
  if (req.method === 'GET' && !req.url.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'build/app/index.html'));
  } else {
    res.status(404).send('Not Found');
  }
});

app.listen(PORT, () => {
  console.log(`\n✓ Development server running on http://localhost:${PORT}`);
  console.log(`✓ Proxying API requests to: ${DHIS2_INSTANCE}\n`);
});
