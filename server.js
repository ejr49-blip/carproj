const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const root = path.resolve(__dirname);
const port = process.env.PORT || 8000;

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  const map = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  return map[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  try {
    const parsed = url.parse(req.url);
    let pathname = decodeURIComponent(parsed.pathname);
    if (pathname === '/') pathname = '/index.html';
    const filePath = path.join(root, pathname);
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Not found');
        return;
      }
      const ct = contentType(filePath);
      const addCharset = /^(text\/+|application\/(javascript|json))/;
      res.setHeader('Content-Type', ct + (addCharset.test(ct) ? '; charset=utf-8' : ''));
      const stream = fs.createReadStream(filePath);
      stream.on('error', () => {
        res.statusCode = 500;
        res.end('Server error');
      });
      stream.pipe(res);
    });
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Server error');
  }
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
