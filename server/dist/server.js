"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_js_1 = require("./config/db.js");
const index_js_1 = __importDefault(require("./routes/index.js"));
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const rateLimiter_js_1 = require("./middleware/rateLimiter.js");
const billingScheduler_js_1 = require("./services/billingScheduler.js");
const swaggerDocs_js_1 = require("./docs/swaggerDocs.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security & Parsing Middleware
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Interactive API Documentation (Swagger / OpenAPI Explorer)
app.use('/api/docs', swaggerDocs_js_1.swaggerRouter);
// Apply rate limiting to all standard API routes
app.use('/api', rateLimiter_js_1.apiLimiter);
// Healthcheck Route
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        name: 'Billflow 2.0 API',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        theme: 'orange',
    });
});
// Mount API Routes
app.use('/api', index_js_1.default);
// Serve Frontend Static Files in Production (Full-Stack Render Deploy)
const clientDistPath = path_1.default.resolve(process.cwd(), '../client/dist');
const altClientDistPath = path_1.default.resolve(process.cwd(), 'client/dist');
const activeDist = fs_1.default.existsSync(clientDistPath)
    ? clientDistPath
    : fs_1.default.existsSync(altClientDistPath)
        ? altClientDistPath
        : null;
if (activeDist) {
    app.use(express_1.default.static(activeDist));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path_1.default.join(activeDist, 'index.html'));
    });
}
// Error Handling Middleware
app.use(errorHandler_js_1.errorHandler);
// Start Server
async function startServer() {
    await (0, db_js_1.connectDB)();
    (0, billingScheduler_js_1.initBillingScheduler)();
    app.listen(PORT, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 Billflow 2.0 Backend Server Running on Port ${PORT}`);
        console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
        console.log(`🎨 UI Accent: Orange (#f97316)`);
        console.log(`======================================================\n`);
    });
}
startServer();
