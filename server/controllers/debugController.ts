
import { Request, Response } from "express";

/**
 * Simple echo endpoint for debugging SSE connections
 */
export async function debugSse(req: Request, res: Response) {
  try {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Flush headers to establish connection
    res.flushHeaders();
    
    // Send initial ping
    res.write(': ping\n\n');
    
    // Log connection info
    console.log('Debug SSE connection established:', {
      url: req.url,
      headers: req.headers,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
    
    // Send a series of messages to test the connection
    let counter = 0;
    const interval = setInterval(() => {
      if (counter < 5) {
        const message = `Test message ${counter + 1}`;
        res.write(`data: ${JSON.stringify({ content: message })}\n\n`);
        console.log(`Sent test message ${counter + 1}`);
        counter++;
      } else {
        clearInterval(interval);
        res.write('data: [DONE]\n\n');
        res.end();
        console.log('Debug SSE connection closed successfully');
      }
    }, 1000);
    
    // Handle connection close
    req.on('close', () => {
      clearInterval(interval);
      console.log('Debug SSE connection closed by client');
    });
    
  } catch (error) {
    console.error('Error in debug SSE endpoint:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'SSE debug error' });
    } else {
      try {
        res.write(`data: ${JSON.stringify({ error: 'SSE debug error' })}\n\n`);
        res.end();
      } catch (e) {
        console.error('Error sending error response:', e);
      }
    }
  }
}

/**
 * Test endpoint that returns connection information
 */
export async function connectionInfo(req: Request, res: Response) {
  try {
    // Gather connection details
    const connectionDetails = {
      headers: req.headers,
      ip: req.ip,
      protocol: req.protocol,
      secure: req.secure,
      xhr: req.xhr,
      authenticated: req.isAuthenticated ? req.isAuthenticated() : 'Function not available',
      method: req.method,
      originalUrl: req.originalUrl,
      timestamp: new Date().toISOString()
    };
    
    console.log('Connection info requested:', connectionDetails);
    
    res.json({
      success: true,
      connectionDetails,
      serverInfo: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        nodeVersion: process.version
      }
    });
  } catch (error) {
    console.error('Error in connection info endpoint:', error);
    res.status(500).json({ error: 'Failed to retrieve connection info' });
  }
}
