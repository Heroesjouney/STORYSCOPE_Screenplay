const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    // Parse the URL
    const parsedUrl = url.parse(req.url);
    let pathname = `.${parsedUrl.pathname}`;

    // Default to index.html if root is requested
    if (pathname === './') {
        pathname = './index.html';
    }

    // Construct the full path
    const filePath = path.join(__dirname, pathname);

    // Get the file extension
    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    // CORS and module support headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Ensure proper module loading
    if (extname === '.js' || extname === '.mjs') {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('X-Content-Type-Options', 'nosniff');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Limit to GET and HEAD methods
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405);
        res.end('Method Not Allowed');
        return;
    }

    // Read the file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                res.writeHead(404);
                res.end('File Not Found');
            } else {
                // Server error
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            // Successful response
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });

            // Only send content for GET requests
            if (req.method === 'GET') {
                res.end(content, 'utf-8');
            } else {
                res.end();
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Ensure you are running this with "node server.js" or "npm start"');
});
