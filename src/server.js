const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 3001; // Puedes cambiar el puerto si es necesario

// Configuración del proxy para Buda.com
app.use('/api', createProxyMiddleware({
  target: 'https://www.buda.com',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api/v2', // Puedes ajustar la ruta según la estructura de la API
  },
}));


app.listen(port, () => {
  console.log(`Servidor proxy en http://localhost:${port}`);
});
