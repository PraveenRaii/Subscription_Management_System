"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhookController_js_1 = require("../controllers/webhookController.js");
const auth_js_1 = require("../middleware/auth.js");
const roleCheck_js_1 = require("../middleware/roleCheck.js");
const router = (0, express_1.Router)();
// Public webhook endpoint for payment gateway
router.post('/razorpay', webhookController_js_1.handleRazorpayWebhook);
// Admin inspection of webhook deliveries
router.get('/events', auth_js_1.authenticate, (0, roleCheck_js_1.authorize)('super_admin'), webhookController_js_1.getWebhookEvents);
exports.default = router;
