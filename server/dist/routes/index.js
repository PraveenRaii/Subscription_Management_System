"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_js_1 = __importDefault(require("./authRoutes.js"));
const productRoutes_js_1 = __importDefault(require("./productRoutes.js"));
const planRoutes_js_1 = __importDefault(require("./planRoutes.js"));
const subscriptionRoutes_js_1 = __importDefault(require("./subscriptionRoutes.js"));
const invoiceRoutes_js_1 = __importDefault(require("./invoiceRoutes.js"));
const paymentRoutes_js_1 = __importDefault(require("./paymentRoutes.js"));
const aiRoutes_js_1 = __importDefault(require("./aiRoutes.js"));
const analyticsRoutes_js_1 = __importDefault(require("./analyticsRoutes.js"));
const quotationRoutes_js_1 = __importDefault(require("./quotationRoutes.js"));
const couponRoutes_js_1 = __importDefault(require("./couponRoutes.js"));
const customerRoutes_js_1 = __importDefault(require("./customerRoutes.js"));
const staffRoutes_js_1 = __importDefault(require("./staffRoutes.js"));
const auditLogRoutes_js_1 = __importDefault(require("./auditLogRoutes.js"));
const notificationRoutes_js_1 = __importDefault(require("./notificationRoutes.js"));
const webhookRoutes_js_1 = __importDefault(require("./webhookRoutes.js"));
const billingScheduler_js_1 = require("../services/billingScheduler.js");
const auth_js_1 = require("../middleware/auth.js");
const roleCheck_js_1 = require("../middleware/roleCheck.js");
const router = (0, express_1.Router)();
router.use('/auth', authRoutes_js_1.default);
router.use('/products', productRoutes_js_1.default);
router.use('/plans', planRoutes_js_1.default);
router.use('/subscriptions', subscriptionRoutes_js_1.default);
router.use('/invoices', invoiceRoutes_js_1.default);
router.use('/payments', paymentRoutes_js_1.default);
router.use('/ai', aiRoutes_js_1.default);
router.use('/analytics', analyticsRoutes_js_1.default);
router.use('/quotations', quotationRoutes_js_1.default);
router.use('/coupons', couponRoutes_js_1.default);
router.use('/customers', customerRoutes_js_1.default);
router.use('/staff', staffRoutes_js_1.default);
router.use('/audit-logs', auditLogRoutes_js_1.default);
router.use('/notifications', notificationRoutes_js_1.default);
router.use('/webhooks', webhookRoutes_js_1.default);
// Manual trigger for recurring billing scheduler
router.post('/billing/run-cycle', auth_js_1.authenticate, (0, roleCheck_js_1.authorize)('super_admin', 'staff'), async (req, res) => {
    try {
        const result = await (0, billingScheduler_js_1.runBillingCycleNow)();
        res.json({
            success: true,
            message: 'Automated recurring billing cycle completed successfully.',
            result,
        });
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.default = router;
