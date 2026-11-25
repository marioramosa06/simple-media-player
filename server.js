const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(
  express.static(__dirname, {
    setHeaders: (res, filePath) => {
      if (/\.(html|js|css)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
