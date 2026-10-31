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
exports.Customer = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CustomerSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    customerId: { type: String, required: true, unique: true, index: true },
    companyName: { type: String, default: '' },
    taxId: { type: String, default: '' },
    billingAddress: {
        street: { type: String, default: '100 Innovation Blvd' },
        city: { type: String, default: 'Bengaluru' },
        state: { type: String, default: 'Karnataka' },
        postalCode: { type: String, default: '560001' },
        country: { type: String, default: 'India' },
    },
    currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'INR' },
    totalSpent: { type: Number, default: 0 },
    lifetimeValue: { type: Number, default: 0 },
    churnRiskScore: { type: Number, default: 15 },
    churnRiskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
    churnFactors: { type: [String], default: [] },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String, default: null },
    rewardPoints: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['active', 'churned', 'inactive'], default: 'active' },
}, { timestamps: true });
exports.Customer = mongoose_1.default.model('Customer', CustomerSchema);
