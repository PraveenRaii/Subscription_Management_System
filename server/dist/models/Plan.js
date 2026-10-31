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
exports.Plan = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PlanSchema = new mongoose_1.Schema({
    planId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    product: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product' },
    variant: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ProductVariant' },
    description: { type: String, default: '' },
    category: {
        type: String,
        enum: ['Starter', 'Professional', 'Enterprise', 'Addon', 'Custom'],
        default: 'Starter',
        index: true,
    },
    billingFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly'],
        default: 'monthly',
        index: true,
    },
    priceINR: { type: Number, required: true, default: 0 },
    priceUSD: { type: Number, required: true, default: 0 },
    priceEUR: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'INR' },
    trialDays: { type: Number, default: 14 },
    features: { type: [String], default: [] },
    limits: {
        users: { type: Number, default: 1 },
        apiCalls: { type: Number, default: 10000 },
        storageGB: { type: Number, default: 10 },
        projects: { type: Number, default: 5 },
    },
    isActive: { type: Boolean, default: true, index: true },
    isPopular: { type: Boolean, default: false },
    activationDate: { type: Date, default: Date.now },
    expirationDate: { type: Date },
    gracePeriodDays: { type: Number, default: 7 },
    allowedUpgrades: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Plan' }],
    allowedDowngrades: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Plan' }],
    isTeamPlan: { type: Boolean, default: false },
    seatPrice: { type: Number, default: 0 },
    minSeats: { type: Number, default: 1 },
}, { timestamps: true });
exports.Plan = mongoose_1.default.model('Plan', PlanSchema);
