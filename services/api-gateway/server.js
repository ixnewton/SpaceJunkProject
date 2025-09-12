/**
 * @fileoverview This file contains the main server code for the API Gateway.
 *
 * The API Gateway is the single entry point for all client requests. It is responsible
 * for routing incoming requests to the appropriate downstream microservice. This
 * approach simplifies the client-side code and provides a centralized place to
 * handle cross-cutting concerns like authentication, logging, and rate limiting.
 *
 * This implementation uses `express` as the web server and `http-proxy-middleware`
 * to forward requests.
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8000;

/**
 * An array of service configurations. Each object defines a route and the
 * target URL for a downstream microservice.
 *
 * @type {Array<Object>}
 * @property {string} route - The public route prefix for the service (e.g., '/portal').
 * @property {string} target - The internal address of the target service (e.g., 'http://localhost:3000').
 */
const services = [
    {
        route: '/portal',
        target: 'http://localhost:3000' // User Web Portal
    },
    {
        route: '/orbital-engine',
        target: 'http://localhost:8005' // Orbital Calculation Engine
    },
    {
        route: '/collision-analyzer',
        target: 'http://localhost:8002' // Collision Analysis Service
    },
    {
        route: '/data-ingestion',
        target: 'http://localhost:8006' // Data Ingestion Service
    },
    {
        route: '/notifications',
        target: 'http://localhost:8004' // Notification Service
    }
];

// Dynamically set up the proxy middleware for each service defined in the configuration.
services.forEach(({ route, target }) => {
    /**
     * Creates a proxy for a specific microservice. It listens on the specified `route`
     * and forwards all requests to the `target` service.
     *
     * The `changeOrigin` option is set to `true` to ensure the Host header is updated
     * to the target's origin, which is often necessary for virtual hosting environments.
     *
     * The `pathRewrite` option removes the route prefix from the request path before
     * forwarding it to the target service. For example, a request to `/portal/dashboard`
     * will be forwarded to the User Web Portal as `/dashboard`.
     */
    app.use(route, createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite: { [`^${route}`]: '' }
    }));
});

/**
 * Starts the API Gateway server and listens for incoming connections on the specified port.
 */
app.listen(PORT, () => {
    console.log(`API Gateway started on port ${PORT}`);
});
