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
exports.UsageRecord = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const UsageRecordSchema = new mongoose_1.Schema({
    subscription: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true },
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    metric: {
        type: String,
        enum: ['api_calls', 'storage_gb', 'active_seats', 'compute_hours', 'bandwidth_gb'],
        required: true,
        index: true,
    },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, default: 'count' },
    unitRate: { type: Number, default: 0 },
    billingPeriodStart: { type: Date, required: true },
    billingPeriodEnd: { type: Date, required: true },
    isBilled: { type: Boolean, default: false, index: true },
    recordedAt: { type: Date, default: Date.now },
}, { timestamps: true });
exports.UsageRecord = mongoose_1.default.model('UsageRecord', UsageRecordSchema);
