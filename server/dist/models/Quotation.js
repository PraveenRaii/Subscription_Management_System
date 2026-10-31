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
exports.Quotation = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const QuotationItemSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
}, { _id: false });
const QuotationSchema = new mongoose_1.Schema({
    quotationNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    companyName: { type: String, default: '' },
    items: { type: [QuotationItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'INR' },
    validUntil: { type: Date, required: true },
    status: {
        type: String,
        enum: ['draft', 'sent', 'accepted', 'rejected', 'converted'],
        default: 'draft',
        index: true,
    },
    templateName: { type: String, default: 'Standard SaaS Enterprise Quotation' },
    termsAndConditions: {
        type: String,
        default: '1. Quotation valid for 30 days.\n2. Invoicing begins upon customer onboarding.\n3. Net-15 payment terms apply.\n4. Standard 99.9% uptime SLA included.',
    },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
exports.Quotation = mongoose_1.default.model('Quotation', QuotationSchema);
