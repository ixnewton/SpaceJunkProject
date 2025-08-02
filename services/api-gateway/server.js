const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8000;

// Configuration for the services
const services = [
    {
        route: '/portal',
        target: 'http://localhost:3000'
    },
    {
        route: '/orbital-engine',
        target: 'http://localhost:8001' // Assuming orbital engine runs on 8001
    },
    {
        route: '/collision-analyzer',
        target: 'http://localhost:8002' // Assuming collision analyzer runs on 8002
    }
    // Add other services here
];

// Set up the proxy for each service
services.forEach(({ route, target }) => {
    app.use(route, createProxyMiddleware({ target, changeOrigin: true, pathRewrite: { [`^${route}`]: '' } }));
});

app.listen(PORT, () => {
    console.log(`API Gateway started on port ${PORT}`);
});
