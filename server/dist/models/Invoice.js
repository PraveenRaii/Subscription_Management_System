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
exports.Invoice = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const InvoiceSchema = new mongoose_1.Schema({
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    subscription: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Subscription', index: true },
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    billingAddress: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        postalCode: { type: String, default: '' },
        country: { type: String, default: 'India' },
    },
    billingPeriodStart: { type: Date, required: true },
    billingPeriodEnd: { type: Date, required: true },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true, index: true },
    paidAt: { type: Date },
    status: {
        type: String,
        enum: ['paid', 'unpaid', 'overdue', 'partially_paid', 'cancelled'],
        default: 'unpaid',
        index: true,
    },
    currency: { type: String, enum: ['INR', 'USD', 'EUR'], default: 'INR' },
    subtotal: { type: Number, required: true, default: 0 },
    taxRate: { type: Number, default: 18 },
    taxAmount: { type: Number, default: 0 },
    isInterstate: { type: Boolean, default: false },
    cgstRate: { type: Number, default: 9 },
    cgstAmount: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 9 },
    sgstAmount: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    sacCode: { type: String, default: '997331' },
    customerGstin: { type: String, default: '' },
    companyGstin: { type: String, default: '29AABCS1429B1Z8' },
    tenantId: { type: String, default: 'subflow-primary', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    discountAmount: { type: Number, default: 0 },
    discountCode: { type: String, default: '' },
    totalAmount: { type: Number, required: true, default: 0 },
    amountPaid: { type: Number, default: 0 },
    amountRemaining: { type: Number, default: 0 },
    pdfUrl: { type: String, default: '' },
    notes: { type: String, default: 'Thank you for your business. Please remit payment on or before the due date.' },
    paymentMethod: { type: String, default: '' },
    idempotencyKey: { type: String, unique: true, sparse: true },
}, { timestamps: true });
exports.Invoice = mongoose_1.default.model('Invoice', InvoiceSchema);
