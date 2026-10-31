"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SubscriptionSchema = new mongoose_1.Schema({
    subscriptionId: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    plan: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Plan', required: true, index: true },
    status: {
        type: String,
        enum: ['active', 'paused', 'past_due', 'in_grace_period', 'cancelled', 'expired', 'trialing', 'pending_approval'],
        default: 'active',
        index: true,
    },
    billingFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        default: 'monthly',
        index: true,
    },
    currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'INR' },
    quantity: { type: Number, default: 1, min: 1 },
    seatCount: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    startDate: { type: Date, default: Date.now },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, required: true },
    renewalDate: { type: Date, required: true, index: true },
    trialEndsAt: { type: Date },
    pausedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, default: '' },
    gracePeriodEndsAt: { type: Date },
    autoRenew: { type: Boolean, default: true },
    teamMembers: [
        {
            name: { type: String, required: true },
            email: { type: String, required: true },
            role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
            addedAt: { type: Date, default: Date.now },
        },
    ],
    quotation: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Quotation' },
    prorationCreditBalance: { type: Number, default: 0 },
    tenantId: { type: String, default: 'subflow-primary', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    activityTimeline: [
        {
            event: { type: String, required: true },
            description: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            actor: { type: String, default: 'System' },
            metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
        },
    ],
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
exports.Subscription = mongoose_1.default.model('Subscription', SubscriptionSchema);
