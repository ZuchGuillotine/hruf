#!/usr/bin/env node

const http = require('http');

// Simple test to verify health check endpoints are working
async function testHealthCheck() {
  const options = {
    hostname: '0.0.0.0',
    port: 5000,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('Health check response:', {
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
        resolve({ statusCode: res.statusCode, body: data });
      });
    });

    req.on('error', (err) => {
      console.error('Health check failed:', err.message);
      reject(err);
    });

    req.on('timeout', () => {
      console.error('Health check timed out');
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.setTimeout(5000);
    req.end();
  });
}

if (require.main === module) {
  testHealthCheck().catch(console.error);
}

module.exports = { testHealthCheck };