"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_js_1 = require("../models/User.js");
const Staff_js_1 = require("../models/Staff.js");
const Customer_js_1 = require("../models/Customer.js");
const Product_js_1 = require("../models/Product.js");
const ProductVariant_js_1 = require("../models/ProductVariant.js");
const Plan_js_1 = require("../models/Plan.js");
const Subscription_js_1 = require("../models/Subscription.js");
const SubscriptionItem_js_1 = require("../models/SubscriptionItem.js");
const Invoice_js_1 = require("../models/Invoice.js");
const InvoiceItem_js_1 = require("../models/InvoiceItem.js");
const Payment_js_1 = require("../models/Payment.js");
const Transaction_js_1 = require("../models/Transaction.js");
const Coupon_js_1 = require("../models/Coupon.js");
const Quotation_js_1 = require("../models/Quotation.js");
const AuditLog_js_1 = require("../models/AuditLog.js");
const UsageRecord_js_1 = require("../models/UsageRecord.js");
const Notification_js_1 = require("../models/Notification.js");
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI ||
    'mongodb+srv://praveen1234202040_db_user:FoUcu8EVjsWpYN1q@managementsystem.805qi91.mongodb.net/subscription_db?retryWrites=true&w=majority';
async function seedDatabase() {
    console.log('Connecting to database for seeding...');
    try {
        await mongoose_1.default.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
        console.log('Connected to MongoDB Atlas!');
    }
    catch (err) {
        console.warn('Atlas connection failed, trying local MongoDB...');
        await mongoose_1.default.connect('mongodb://127.0.0.1:27017/subscription_db');
        console.log('Connected to Local MongoDB!');
    }
    console.log('Clearing old sample collections...');
    await Promise.all([
        User_js_1.User.deleteMany({}),
        Staff_js_1.Staff.deleteMany({}),
        Customer_js_1.Customer.deleteMany({}),
        Product_js_1.Product.deleteMany({}),
        ProductVariant_js_1.ProductVariant.deleteMany({}),
        Plan_js_1.Plan.deleteMany({}),
        Subscription_js_1.Subscription.deleteMany({}),
        SubscriptionItem_js_1.SubscriptionItem.deleteMany({}),
        Invoice_js_1.Invoice.deleteMany({}),
        InvoiceItem_js_1.InvoiceItem.deleteMany({}),
        Payment_js_1.Payment.deleteMany({}),
        Transaction_js_1.Transaction.deleteMany({}),
        Coupon_js_1.Coupon.deleteMany({}),
        Quotation_js_1.Quotation.deleteMany({}),
        AuditLog_js_1.AuditLog.deleteMany({}),
        UsageRecord_js_1.UsageRecord.deleteMany({}),
        Notification_js_1.Notification.deleteMany({}),
    ]);
    console.log('Creating Users with passwords...');
    const commonPassword = 'Password@123';
    // 1. Super Admin
    const adminUser = await User_js_1.User.create({
        name: 'Alexander Vance',
        email: 'admin@subflow.io',
        password: commonPassword,
        role: 'super_admin',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        phoneNumber: '+91 98765 43210',
        status: 'active',
        isEmailVerified: true,
        loginCount: 42,
        lastLogin: new Date(),
    });
    // 2. Staff Member
    const staffUser = await User_js_1.User.create({
        name: 'Priya Sharma',
        email: 'staff@subflow.io',
        password: commonPassword,
        role: 'staff',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        phoneNumber: '+91 98111 22334',
        status: 'active',
        isEmailVerified: true,
        loginCount: 19,
        lastLogin: new Date(),
    });
    const staffDoc = await Staff_js_1.Staff.create({
        user: staffUser._id,
        employeeId: 'STF-1001',
        department: 'Billing',
        designation: 'Senior Billing Operations Analyst',
        permissions: [
            'read:customers',
            'read:subscriptions',
            'write:subscriptions',
            'manage:invoices',
            'read:payments',
            'manage:refunds',
            'view:analytics',
        ],
        createdBy: adminUser._id,
    });
    // 3. Customer 1 (Acme Corp)
    const custUser1 = await User_js_1.User.create({
        name: 'Marcus Sterling',
        email: 'acme@corp.com',
        password: commonPassword,
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        phoneNumber: '+91 97000 11223',
        status: 'active',
        isEmailVerified: true,
        loginCount: 65,
        lastLogin: new Date(),
    });
    const customer1 = await Customer_js_1.Customer.create({
        user: custUser1._id,
        customerId: 'CUST-8001',
        companyName: 'Acme Global Technologies Inc',
        taxId: '29AABCS1429B1Z8',
        billingAddress: {
            street: '404 Silicon Gateway, Embassy Tech Village',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560103',
            country: 'India',
        },
        currency: 'INR',
        totalSpent: 479988,
        lifetimeValue: 520000,
        churnRiskScore: 12,
        churnRiskLevel: 'Low',
        referralCode: 'ACME2026',
        rewardPoints: 1250,
    });
    // 4. Customer 2 (NovaTech)
    const custUser2 = await User_js_1.User.create({
        name: 'Jane Doe',
        email: 'jane@novatech.io',
        password: commonPassword,
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        phoneNumber: '+91 99887 76655',
        status: 'active',
        isEmailVerified: true,
        loginCount: 28,
        lastLogin: new Date(),
    });
    const customer2 = await Customer_js_1.Customer.create({
        user: custUser2._id,
        customerId: 'CUST-8002',
        companyName: 'NovaTech Cloud Systems',
        taxId: '27AAECN9842M1Z2',
        billingAddress: {
            street: '88 Cyber City Tower C',
            city: 'Pune',
            state: 'Maharashtra',
            postalCode: '411028',
            country: 'India',
        },
        currency: 'INR',
        totalSpent: 179988,
        lifetimeValue: 195000,
        churnRiskScore: 28,
        churnRiskLevel: 'Low',
        referralCode: 'NOVA99',
        rewardPoints: 500,
    });
    // 5. Customer 3 (At-risk customer: GrowthScale)
    const custUser3 = await User_js_1.User.create({
        name: 'Ryan Reynolds',
        email: 'ryan@growthscale.co',
        password: commonPassword,
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        phoneNumber: '+91 91234 56789',
        status: 'active',
        isEmailVerified: true,
        loginCount: 6,
        lastLogin: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
    });
    const customer3 = await Customer_js_1.Customer.create({
        user: custUser3._id,
        customerId: 'CUST-8003',
        companyName: 'GrowthScale Labs',
        taxId: '36AADCG2214K1ZP',
        billingAddress: {
            street: '12 Hitech City Main Rd',
            city: 'Hyderabad',
            state: 'Telangana',
            postalCode: '500081',
            country: 'India',
        },
        currency: 'INR',
        totalSpent: 44990,
        lifetimeValue: 50000,
        churnRiskScore: 74,
        churnRiskLevel: 'High',
        churnFactors: [
            'Zero logins in past 18 days',
            'API query traffic decreased by 45%',
            'Single credit card chargeback inquiry logged',
        ],
        referralCode: 'GROWTH77',
        rewardPoints: 100,
    });
    // 6. Customer 4 (Elena Rostova - Apex FinTech, USD)
    const custUser4 = await User_js_1.User.create({
        name: 'Elena Rostova',
        email: 'elena@apexfin.com',
        password: commonPassword,
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
        phoneNumber: '+1 (555) 349-8812',
        status: 'active',
        isEmailVerified: true,
        loginCount: 41,
        lastLogin: new Date(),
    });
    const customer4 = await Customer_js_1.Customer.create({
        user: custUser4._id,
        customerId: 'CUST-8004',
        companyName: 'Apex FinTech Innovations LLC',
        taxId: 'US-EIN-94827110',
        billingAddress: {
            street: '350 5th Avenue, Suite 4400',
            city: 'New York',
            state: 'NY',
            postalCode: '10118',
            country: 'United States',
        },
        currency: 'USD',
        totalSpent: 5652,
        lifetimeValue: 12500,
        churnRiskScore: 8,
        churnRiskLevel: 'Low',
        referralCode: 'APEX2026',
        rewardPoints: 950,
    });
    // 7. Customer 5 (Vikram Singhania - CloudMatrix Solutions)
    const custUser5 = await User_js_1.User.create({
        name: 'Vikram Singhania',
        email: 'vikram@cloudmatrix.dev',
        password: commonPassword,
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
        phoneNumber: '+91 98450 11992',
        status: 'active',
        isEmailVerified: true,
        loginCount: 14,
        lastLogin: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    });
    const customer5 = await Customer_js_1.Customer.create({
        user: custUser5._id,
        customerId: 'CUST-8005',
        companyName: 'CloudMatrix Solutions Pvt Ltd',
        taxId: '29ABCDE1234F1Z5',
        billingAddress: {
            street: '72 Outer Ring Road, Bellandur',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560103',
            country: 'India',
        },
        currency: 'INR',
        totalSpent: 98500,
        lifetimeValue: 110000,
        churnRiskScore: 42,
        churnRiskLevel: 'Medium',
        churnFactors: ['Renewal invoice delayed by 4 days', 'Card token expired on gateway'],
        referralCode: 'CLOUDMAT26',
        rewardPoints: 340,
    });
    // 8. Customer 6 (David Chen - Zephyr Creative Agency, EUR)
    const custUser6 = await User_js_1.User.create({
        name: 'David Chen',
        email: 'david@zephyrstudio.design',
        password: commonPassword,
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
        phoneNumber: '+49 30 12345678',
        status: 'active',
        isEmailVerified: true,
        loginCount: 8,
        lastLogin: new Date(),
    });
    const customer6 = await Customer_js_1.Customer.create({
        user: custUser6._id,
        customerId: 'CUST-8006',
        companyName: 'Zephyr Creative Studio GmbH',
        taxId: 'DE992817264',
        billingAddress: {
            street: 'Friedrichstraße 176',
            city: 'Berlin',
            state: 'Berlin',
            postalCode: '10117',
            country: 'Germany',
        },
        currency: 'EUR',
        totalSpent: 0,
        lifetimeValue: 3200,
        churnRiskScore: 19,
        churnRiskLevel: 'Low',
        referralCode: 'ZEPHYR26',
        rewardPoints: 50,
    });
    console.log('Creating Products & ProductVariants...');
    // Products
    const prodPlatform = await Product_js_1.Product.create({
        productId: 'PROD-101',
        name: 'Billflow Cloud SaaS Core',
        slug: 'billflow-cloud-saas-core',
        description: 'Centralized subscription billing, self-service portals, automated invoices, and tax calculation.',
        category: 'SaaS',
        images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400'],
        tags: ['Core', 'Billing', 'Invoicing', 'SaaS'],
        isActive: true,
    });
    const prodAi = await Product_js_1.Product.create({
        productId: 'PROD-102',
        name: 'Gemini AI Intelligence Engine',
        slug: 'gemini-ai-intelligence-engine',
        description: 'Predictive revenue forecasting, intelligent churn risk scoring, and automated retention bots.',
        category: 'Analytics',
        images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'],
        tags: ['AI', 'Gemini', 'Predictive', 'Revenue'],
        isActive: true,
    });
    const prodApi = await Product_js_1.Product.create({
        productId: 'PROD-103',
        name: 'High-Throughput Webhook & API Mesh',
        slug: 'high-throughput-webhook-api-mesh',
        description: 'Dedicated high-concurrency webhook delivery engine, rate-limited REST endpoints, and HMAC validation.',
        category: 'API',
        images: ['https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400'],
        tags: ['API', 'Webhooks', 'Developer'],
        isActive: true,
    });
    // Variants
    const varStarter = await ProductVariant_js_1.ProductVariant.create({
        product: prodPlatform._id,
        variantId: 'VAR-101-1',
        name: 'Starter Edition',
        sku: 'SKU-CORE-STR',
        basePrice: 4999,
        currency: 'INR',
        billingCycle: 'monthly',
    });
    const varPro = await ProductVariant_js_1.ProductVariant.create({
        product: prodPlatform._id,
        variantId: 'VAR-101-2',
        name: 'Professional Edition',
        sku: 'SKU-CORE-PRO',
        basePrice: 14999,
        currency: 'INR',
        billingCycle: 'monthly',
    });
    const varEnterprise = await ProductVariant_js_1.ProductVariant.create({
        product: prodPlatform._id,
        variantId: 'VAR-101-3',
        name: 'Enterprise Scale Edition',
        sku: 'SKU-CORE-ENT',
        basePrice: 39999,
        currency: 'INR',
        billingCycle: 'monthly',
    });
    console.log('Creating Plans...');
    const planStarterMonthly = await Plan_js_1.Plan.create({
        planId: 'PLAN-STARTER-M',
        name: 'Starter Monthly',
        product: prodPlatform._id,
        variant: varStarter._id,
        description: 'Perfect for startups and emerging projects launching their initial recurring billing operations.',
        category: 'Starter',
        billingFrequency: 'monthly',
        priceINR: 4999,
        priceUSD: 59,
        priceEUR: 54,
        trialDays: 14,
        features: [
            'Up to 500 active subscriptions',
            'Automated Razorpay UPI & Card checkouts',
            'GST tax calculation & PDF invoices',
            'Basic revenue & churn dashboards',
            'Email customer support',
        ],
        limits: { users: 3, apiCalls: 25000, storageGB: 20, projects: 5 },
        isActive: true,
        isPopular: false,
        gracePeriodDays: 7,
    });
    const planProMonthly = await Plan_js_1.Plan.create({
        planId: 'PLAN-PRO-M',
        name: 'Professional Monthly',
        product: prodPlatform._id,
        variant: varPro._id,
        description: 'Designed for fast-growing SaaS businesses requiring automated renewals and AI revenue copilot.',
        category: 'Professional',
        billingFrequency: 'monthly',
        priceINR: 14999,
        priceUSD: 179,
        priceEUR: 165,
        trialDays: 14,
        features: [
            'Up to 5,000 active subscriptions',
            'Google Gemini AI Revenue & Churn Intelligence',
            'Custom Quotations with PDF Generation',
            'Automated payment retry & grace period workflows',
            'Multi-currency billing (INR, USD, EUR)',
            'Webhooks & Developer REST API',
            'Priority 24/7 technical assistance',
        ],
        limits: { users: 10, apiCalls: 150000, storageGB: 100, projects: 25 },
        isActive: true,
        isPopular: true,
        gracePeriodDays: 10,
    });
    const planEnterpriseMonthly = await Plan_js_1.Plan.create({
        planId: 'PLAN-ENT-M',
        name: 'Enterprise Growth Tier',
        product: prodPlatform._id,
        variant: varEnterprise._id,
        description: 'Unlimited capacity, dedicated infrastructure, tailored quotation templates, and custom SLA.',
        category: 'Enterprise',
        billingFrequency: 'monthly',
        priceINR: 39999,
        priceUSD: 479,
        priceEUR: 439,
        trialDays: 30,
        features: [
            'Unlimited subscribers & metered billing',
            'Full Gemini AI Intelligence Suite & Chat Copilot',
            'Multi-tenant seat and team permissions',
            'Enterprise audit log vault & custom webhooks',
            'White-labeled invoices with GST & international taxes',
            'Dedicated Account Manager & 99.99% SLA guarantee',
        ],
        limits: { users: 50, apiCalls: 1000000, storageGB: 500, projects: 100 },
        isActive: true,
        isPopular: false,
        isTeamPlan: true,
        seatPrice: 2000,
        minSeats: 5,
        gracePeriodDays: 15,
    });
    const planStarterYearly = await Plan_js_1.Plan.create({
        planId: 'PLAN-STARTER-Y',
        name: 'Starter Yearly',
        product: prodPlatform._id,
        variant: varStarter._id,
        description: 'Annual commitment with 2 months free included.',
        category: 'Starter',
        billingFrequency: 'yearly',
        priceINR: 49990,
        priceUSD: 590,
        priceEUR: 540,
        trialDays: 14,
        features: [
            'All Starter monthly features',
            '2 Months Free billing discount',
            'Annual tax summary report export',
        ],
        limits: { users: 3, apiCalls: 25000, storageGB: 20, projects: 5 },
        isActive: true,
        isPopular: false,
        gracePeriodDays: 14,
    });
    // Link upgrade paths
    planStarterMonthly.allowedUpgrades = [planProMonthly._id, planEnterpriseMonthly._id];
    await planStarterMonthly.save();
    planProMonthly.allowedUpgrades = [planEnterpriseMonthly._id];
    planProMonthly.allowedDowngrades = [planStarterMonthly._id];
    await planProMonthly.save();
    console.log('Creating Active & Historic Subscriptions...');
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    // Sub 1: Acme Corp Enterprise Plan (Active)
    const subAcme = await Subscription_js_1.Subscription.create({
        subscriptionId: 'SUB-2026-8801',
        customer: customer1._id,
        plan: planEnterpriseMonthly._id,
        status: 'active',
        billingFrequency: 'monthly',
        currency: 'INR',
        quantity: 1,
        seatCount: 8,
        unitPrice: 45999, // 39999 + 3 extra seats * 2000
        taxRate: 18,
        taxAmount: 8280,
        totalAmount: 54279,
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
        renewalDate: nextMonth,
        autoRenew: true,
        teamMembers: [
            { name: 'Marcus Sterling', email: 'acme@corp.com', role: 'admin', addedAt: new Date() },
            { name: 'Sarah Lin', email: 'sarah.lin@acme.com', role: 'member', addedAt: new Date() },
            { name: 'David Kumar', email: 'david.k@acme.com', role: 'viewer', addedAt: new Date() },
        ],
    });
    // Sub 2: NovaTech Professional Plan (Active)
    const subNova = await Subscription_js_1.Subscription.create({
        subscriptionId: 'SUB-2026-8802',
        customer: customer2._id,
        plan: planProMonthly._id,
        status: 'active',
        billingFrequency: 'monthly',
        currency: 'INR',
        quantity: 1,
        seatCount: 5,
        unitPrice: 14999,
        taxRate: 18,
        taxAmount: 2700,
        totalAmount: 17699,
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
        renewalDate: nextMonth,
        autoRenew: true,
        teamMembers: [
            { name: 'Jane Doe', email: 'jane@novatech.io', role: 'admin', addedAt: new Date() },
            { name: 'Alex Cooper', email: 'alex@novatech.io', role: 'member', addedAt: new Date() },
        ],
    });
    // Sub 3: GrowthScale (Paused)
    const subGrowth = await Subscription_js_1.Subscription.create({
        subscriptionId: 'SUB-2026-8803',
        customer: customer3._id,
        plan: planStarterMonthly._id,
        status: 'paused',
        billingFrequency: 'monthly',
        currency: 'INR',
        quantity: 1,
        seatCount: 2,
        unitPrice: 4999,
        taxRate: 18,
        taxAmount: 900,
        totalAmount: 5899,
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: now,
        renewalDate: now,
        pausedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        autoRenew: false,
    });
    // Sub 4: Apex FinTech (Active, Annual, USD, Team Plan with 15 seats)
    const nextYear = new Date(now);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const subApex = await Subscription_js_1.Subscription.create({
        subscriptionId: 'SUB-2026-8804',
        customer: customer4._id,
        plan: planEnterpriseMonthly._id,
        status: 'active',
        billingFrequency: 'yearly',
        currency: 'USD',
        quantity: 1,
        seatCount: 15,
        unitPrice: 4790,
        taxRate: 18,
        taxAmount: 862.2,
        totalAmount: 5652.2,
        startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: nextYear,
        renewalDate: nextYear,
        autoRenew: true,
        teamMembers: [
            { name: 'Elena Rostova', email: 'elena@apexfin.com', role: 'admin', addedAt: new Date() },
            { name: 'Michael Sterling', email: 'michael@apexfin.com', role: 'member', addedAt: new Date() },
            { name: 'Chloe Bennett', email: 'chloe@apexfin.com', role: 'viewer', addedAt: new Date() },
        ],
    });
    // Sub 5: CloudMatrix Solutions (In Grace Period, 4 days remaining)
    const graceEnd = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
    const subCloudMatrix = await Subscription_js_1.Subscription.create({
        subscriptionId: 'SUB-2026-8805',
        customer: customer5._id,
        plan: planStarterYearly._id,
        status: 'in_grace_period',
        billingFrequency: 'yearly',
        currency: 'INR',
        quantity: 1,
        seatCount: 3,
        unitPrice: 49990,
        taxRate: 18,
        taxAmount: 8998,
        totalAmount: 58988,
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        renewalDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        gracePeriodEndsAt: graceEnd,
        autoRenew: true,
        teamMembers: [
            { name: 'Vikram Singhania', email: 'vikram@cloudmatrix.dev', role: 'admin', addedAt: new Date() },
        ],
    });
    // Sub 6: CloudMatrix Gemini AI Intelligence Add-On (Active, Monthly)
    const subCloudMatrixAi = await Subscription_js_1.Subscription.create({
        subscriptionId: 'SUB-2026-8806',
        customer: customer5._id,
        plan: planProMonthly._id,
        status: 'active',
        billingFrequency: 'monthly',
        currency: 'INR',
        quantity: 1,
        seatCount: 1,
        unitPrice: 9999,
        taxRate: 18,
        taxAmount: 1799.82,
        totalAmount: 11798.82,
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        renewalDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        autoRenew: true,
    });
    // Sub 7: Zephyr Studio (Trialing, 7 days remaining, EUR)
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const subZephyr = await Subscription_js_1.Subscription.create({
        subscriptionId: 'SUB-2026-8807',
        customer: customer6._id,
        plan: planProMonthly._id,
        status: 'trialing',
        billingFrequency: 'monthly',
        currency: 'EUR',
        quantity: 1,
        seatCount: 4,
        unitPrice: 149,
        taxRate: 18,
        taxAmount: 26.82,
        totalAmount: 175.82,
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: trialEnd,
        trialEndDate: trialEnd,
        renewalDate: trialEnd,
        autoRenew: true,
        teamMembers: [
            { name: 'David Chen', email: 'david@zephyrstudio.design', role: 'admin', addedAt: new Date() },
        ],
    });
    // Sub 8: Acme Historic Starter Plan (Cancelled - Upgraded to Enterprise)
    const subAcmeHistoric = await Subscription_js_1.Subscription.create({
        subscriptionId: 'SUB-2026-8808',
        customer: customer1._id,
        plan: planStarterMonthly._id,
        status: 'cancelled',
        billingFrequency: 'monthly',
        currency: 'INR',
        quantity: 1,
        seatCount: 2,
        unitPrice: 4999,
        taxRate: 18,
        taxAmount: 900,
        totalAmount: 5899,
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        renewalDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        cancelledAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        cancellationReason: 'Upgraded to Enterprise Growth Tier license',
        autoRenew: false,
    });
    // Sub 9: NovaTech Webhook API Mesh Add-on (Active, Monthly)
    const subNovaWebhook = await Subscription_js_1.Subscription.create({
        subscriptionId: 'SUB-2026-8809',
        customer: customer2._id,
        plan: planStarterMonthly._id,
        status: 'active',
        billingFrequency: 'monthly',
        currency: 'INR',
        quantity: 1,
        seatCount: 1,
        unitPrice: 2499,
        taxRate: 18,
        taxAmount: 449.82,
        totalAmount: 2948.82,
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        renewalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        autoRenew: true,
    });
    // Sub 10: GrowthScale Labs Second Subscription (Past Due / Overdue)
    const subGrowthOverdue = await Subscription_js_1.Subscription.create({
        subscriptionId: 'SUB-2026-8810',
        customer: customer3._id,
        plan: planStarterMonthly._id,
        status: 'past_due',
        billingFrequency: 'monthly',
        currency: 'INR',
        quantity: 1,
        seatCount: 1,
        unitPrice: 4999,
        taxRate: 18,
        taxAmount: 900,
        totalAmount: 5899,
        startDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        renewalDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        autoRenew: true,
    });
    console.log('Creating Invoices, Line Items & Payments...');
    // Invoice 1: Acme Paid
    const inv1 = await Invoice_js_1.Invoice.create({
        invoiceNumber: 'INV-2026-1001',
        subscription: subAcme._id,
        customer: customer1._id,
        customerName: customer1.companyName,
        customerEmail: 'acme@corp.com',
        billingAddress: customer1.billingAddress,
        billingPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        billingPeriodEnd: now,
        issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
        status: 'paid',
        currency: 'INR',
        subtotal: 45999,
        taxRate: 18,
        taxAmount: 8280,
        discountAmount: 0,
        totalAmount: 54279,
        amountPaid: 54279,
        amountRemaining: 0,
        paymentMethod: 'razorpay',
        idempotencyKey: 'INV-REC-SUB-2026-8801-PREV',
        notes: 'Payment processed via Razorpay NetBanking. Thank you!',
    });
    await InvoiceItem_js_1.InvoiceItem.create({
        invoice: inv1._id,
        description: 'Enterprise Growth Tier Monthly License (8 seats)',
        quantity: 1,
        unitPrice: 45999,
        taxRate: 18,
        taxAmount: 8280,
        amount: 54279,
        type: 'subscription',
    });
    const pay1 = await Payment_js_1.Payment.create({
        paymentId: 'PAY-2026-9001',
        invoice: inv1._id,
        subscription: subAcme._id,
        customer: customer1._id,
        amount: 54279,
        currency: 'INR',
        paymentMethod: 'netbanking',
        status: 'success',
        gatewayOrderId: 'order_rzp_acme_001',
        gatewayTransactionId: 'pay_rzp_acme_success_001',
    });
    await Transaction_js_1.Transaction.create({
        transactionId: 'TXN-2026-001',
        type: 'credit',
        amount: 54279,
        currency: 'INR',
        customer: customer1._id,
        payment: pay1._id,
        invoice: inv1._id,
        status: 'completed',
        description: 'Payment for Invoice INV-2026-1001 via Razorpay',
    });
    // Invoice 2: NovaTech Paid
    const inv2 = await Invoice_js_1.Invoice.create({
        invoiceNumber: 'INV-2026-1002',
        subscription: subNova._id,
        customer: customer2._id,
        customerName: customer2.companyName,
        customerEmail: 'jane@novatech.io',
        billingAddress: customer2.billingAddress,
        billingPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        billingPeriodEnd: now,
        issueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
        status: 'paid',
        currency: 'INR',
        subtotal: 14999,
        taxRate: 18,
        taxAmount: 2700,
        discountAmount: 0,
        totalAmount: 17699,
        amountPaid: 17699,
        amountRemaining: 0,
        paymentMethod: 'upi',
        idempotencyKey: 'INV-REC-SUB-2026-8802-PREV',
        notes: 'UPI Instant Settlement Verified.',
    });
    await InvoiceItem_js_1.InvoiceItem.create({
        invoice: inv2._id,
        description: 'Professional Monthly License (5 seats)',
        quantity: 1,
        unitPrice: 14999,
        taxRate: 18,
        taxAmount: 2700,
        amount: 17699,
        type: 'subscription',
    });
    const pay2 = await Payment_js_1.Payment.create({
        paymentId: 'PAY-2026-9002',
        invoice: inv2._id,
        subscription: subNova._id,
        customer: customer2._id,
        amount: 17699,
        currency: 'INR',
        paymentMethod: 'upi',
        status: 'success',
        gatewayOrderId: 'order_rzp_nova_002',
        gatewayTransactionId: 'pay_rzp_nova_upi_002',
    });
    await Transaction_js_1.Transaction.create({
        transactionId: 'TXN-2026-002',
        type: 'credit',
        amount: 17699,
        currency: 'INR',
        customer: customer2._id,
        payment: pay2._id,
        invoice: inv2._id,
        status: 'completed',
        description: 'Payment for Invoice INV-2026-1002 via UPI',
    });
    // Invoice 3: Unpaid Invoice for Acme Corp current renewal
    const inv3 = await Invoice_js_1.Invoice.create({
        invoiceNumber: 'INV-2026-1003',
        subscription: subAcme._id,
        customer: customer1._id,
        customerName: customer1.companyName,
        customerEmail: 'acme@corp.com',
        billingAddress: customer1.billingAddress,
        billingPeriodStart: now,
        billingPeriodEnd: nextMonth,
        issueDate: now,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'unpaid',
        currency: 'INR',
        subtotal: 45999,
        taxRate: 18,
        taxAmount: 8280,
        discountAmount: 0,
        totalAmount: 54279,
        amountPaid: 0,
        amountRemaining: 54279,
        idempotencyKey: 'INV-REC-SUB-2026-8801-CURR',
        notes: 'Upcoming renewal cycle payment.',
    });
    await InvoiceItem_js_1.InvoiceItem.create({
        invoice: inv3._id,
        description: 'Enterprise Growth Tier Monthly Renewal License (8 seats)',
        quantity: 1,
        unitPrice: 45999,
        taxRate: 18,
        taxAmount: 8280,
        amount: 54279,
        type: 'subscription',
    });
    // Invoice 4: Overdue Invoice for GrowthScale
    const inv4 = await Invoice_js_1.Invoice.create({
        invoiceNumber: 'INV-2026-1004',
        subscription: subGrowth._id,
        customer: customer3._id,
        customerName: customer3.companyName,
        customerEmail: 'ryan@growthscale.co',
        billingAddress: customer3.billingAddress,
        billingPeriodStart: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        billingPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        issueDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        status: 'overdue',
        currency: 'INR',
        subtotal: 4999,
        taxRate: 18,
        taxAmount: 900,
        discountAmount: 0,
        totalAmount: 5899,
        amountPaid: 0,
        amountRemaining: 5899,
        notes: 'Payment overdue. Grace period active.',
    });
    await InvoiceItem_js_1.InvoiceItem.create({
        invoice: inv4._id,
        description: 'Starter Monthly Subscription Renewal',
        quantity: 1,
        unitPrice: 4999,
        taxRate: 18,
        taxAmount: 900,
        amount: 5899,
        type: 'subscription',
    });
    // Payment 3: Failed Payment for GrowthScale
    await Payment_js_1.Payment.create({
        paymentId: 'PAY-2026-9003',
        invoice: inv4._id,
        subscription: subGrowth._id,
        customer: customer3._id,
        amount: 5899,
        currency: 'INR',
        paymentMethod: 'card',
        status: 'failed',
        gatewayOrderId: 'order_rzp_growth_fail_003',
        failureReason: 'Insufficient funds / Authorization declined by issuing bank',
        retryCount: 2,
        nextRetryAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    });
    // Invoice 5: Apex FinTech (Paid, USD)
    const inv5 = await Invoice_js_1.Invoice.create({
        invoiceNumber: 'INV-2026-1005',
        subscription: subApex._id,
        customer: customer4._id,
        customerName: customer4.companyName,
        customerEmail: 'elena@apexfin.com',
        billingAddress: customer4.billingAddress,
        billingPeriodStart: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        billingPeriodEnd: nextYear,
        issueDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 118 * 24 * 60 * 60 * 1000),
        status: 'paid',
        currency: 'USD',
        subtotal: 4790,
        taxRate: 18,
        taxAmount: 862.2,
        discountAmount: 0,
        totalAmount: 5652.2,
        amountPaid: 5652.2,
        amountRemaining: 0,
        paymentMethod: 'card',
        idempotencyKey: 'INV-REC-SUB-2026-8804-PREV',
        notes: 'Paid via Corporate Amex Card. Wire confirmation ref #APEX-9921',
    });
    await InvoiceItem_js_1.InvoiceItem.create({
        invoice: inv5._id,
        description: 'Enterprise Scale Edition (Annual Commitment, 15 seats)',
        quantity: 1,
        unitPrice: 4790,
        taxRate: 18,
        taxAmount: 862.2,
        amount: 5652.2,
        type: 'subscription',
    });
    const pay5 = await Payment_js_1.Payment.create({
        paymentId: 'PAY-2026-9005',
        invoice: inv5._id,
        subscription: subApex._id,
        customer: customer4._id,
        amount: 5652.2,
        currency: 'USD',
        paymentMethod: 'card',
        status: 'success',
        gatewayOrderId: 'order_rzp_apex_005',
        gatewayTransactionId: 'pay_rzp_apex_card_005',
    });
    await Transaction_js_1.Transaction.create({
        transactionId: 'TXN-2026-005',
        type: 'credit',
        amount: 5652.2,
        currency: 'USD',
        customer: customer4._id,
        payment: pay5._id,
        invoice: inv5._id,
        status: 'completed',
        description: 'Payment for Invoice INV-2026-1005 via Corporate Card',
    });
    // Invoice 6: CloudMatrix (Overdue / In Grace Period)
    const inv6 = await Invoice_js_1.Invoice.create({
        invoiceNumber: 'INV-2026-1006',
        subscription: subCloudMatrix._id,
        customer: customer5._id,
        customerName: customer5.companyName,
        customerEmail: 'vikram@cloudmatrix.dev',
        billingAddress: customer5.billingAddress,
        billingPeriodStart: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        billingPeriodEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'overdue',
        currency: 'INR',
        subtotal: 49990,
        taxRate: 18,
        taxAmount: 8998.2,
        discountAmount: 0,
        totalAmount: 58988.2,
        amountPaid: 0,
        amountRemaining: 58988.2,
        idempotencyKey: 'INV-REC-SUB-2026-8805-RENEW',
        notes: 'Grace period notice dispatched. Please settle invoice to avoid suspension.',
    });
    await InvoiceItem_js_1.InvoiceItem.create({
        invoice: inv6._id,
        description: 'Starter Yearly Renewal License',
        quantity: 1,
        unitPrice: 49990,
        taxRate: 18,
        taxAmount: 8998.2,
        amount: 58988.2,
        type: 'subscription',
    });
    // Invoice 7: CloudMatrix AI Intelligence Addon (Paid, INR)
    const inv7 = await Invoice_js_1.Invoice.create({
        invoiceNumber: 'INV-2026-1007',
        subscription: subCloudMatrixAi._id,
        customer: customer5._id,
        customerName: customer5.companyName,
        customerEmail: 'vikram@cloudmatrix.dev',
        billingAddress: customer5.billingAddress,
        billingPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        billingPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        issueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        status: 'paid',
        currency: 'INR',
        subtotal: 9999,
        taxRate: 18,
        taxAmount: 1799.82,
        discountAmount: 0,
        totalAmount: 11798.82,
        amountPaid: 11798.82,
        amountRemaining: 0,
        paymentMethod: 'upi',
        notes: 'Paid via Razorpay UPI auto-debit.',
    });
    await InvoiceItem_js_1.InvoiceItem.create({
        invoice: inv7._id,
        description: 'Gemini AI Intelligence Engine Expansion Pack',
        quantity: 1,
        unitPrice: 9999,
        taxRate: 18,
        taxAmount: 1799.82,
        amount: 11798.82,
        type: 'addon',
    });
    const pay7 = await Payment_js_1.Payment.create({
        paymentId: 'PAY-2026-9007',
        invoice: inv7._id,
        subscription: subCloudMatrixAi._id,
        customer: customer5._id,
        amount: 11798.82,
        currency: 'INR',
        paymentMethod: 'upi',
        status: 'success',
        gatewayOrderId: 'order_rzp_cloudm_007',
        gatewayTransactionId: 'pay_rzp_cloudm_upi_007',
    });
    await Transaction_js_1.Transaction.create({
        transactionId: 'TXN-2026-007',
        type: 'credit',
        amount: 11798.82,
        currency: 'INR',
        customer: customer5._id,
        payment: pay7._id,
        invoice: inv7._id,
        status: 'completed',
        description: 'Payment for Invoice INV-2026-1007 via UPI',
    });
    // Invoice 8: Zephyr Studio (Trialing, EUR)
    const inv8 = await Invoice_js_1.Invoice.create({
        invoiceNumber: 'INV-2026-1008',
        subscription: subZephyr._id,
        customer: customer6._id,
        customerName: customer6.companyName,
        customerEmail: 'david@zephyrstudio.design',
        billingAddress: customer6.billingAddress,
        billingPeriodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        billingPeriodEnd: trialEnd,
        issueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dueDate: trialEnd,
        status: 'paid',
        currency: 'EUR',
        subtotal: 0,
        taxRate: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        amountPaid: 0,
        amountRemaining: 0,
        notes: '14-Day Free Trial Initial Activation Invoice (€0.00). Card pre-authorized.',
    });
    await InvoiceItem_js_1.InvoiceItem.create({
        invoice: inv8._id,
        description: 'Professional Monthly 14-Day Free Trial Evaluation',
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        taxAmount: 0,
        amount: 0,
        type: 'subscription',
    });
    // Invoice 9: NovaTech Webhook API Mesh Add-on (Paid, INR)
    const inv9 = await Invoice_js_1.Invoice.create({
        invoiceNumber: 'INV-2026-1009',
        subscription: subNovaWebhook._id,
        customer: customer2._id,
        customerName: customer2.companyName,
        customerEmail: 'jane@novatech.io',
        billingAddress: customer2.billingAddress,
        billingPeriodStart: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        billingPeriodEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        issueDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        paidAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
        status: 'paid',
        currency: 'INR',
        subtotal: 2499,
        taxRate: 18,
        taxAmount: 449.82,
        discountAmount: 0,
        totalAmount: 2948.82,
        amountPaid: 2948.82,
        amountRemaining: 0,
        paymentMethod: 'netbanking',
        notes: 'High-Throughput Webhook Add-on monthly billing.',
    });
    await InvoiceItem_js_1.InvoiceItem.create({
        invoice: inv9._id,
        description: 'High-Throughput Webhook & API Mesh Add-on',
        quantity: 1,
        unitPrice: 2499,
        taxRate: 18,
        taxAmount: 449.82,
        amount: 2948.82,
        type: 'addon',
    });
    console.log('Creating Coupons & Promotions...');
    await Coupon_js_1.Coupon.create([
        {
            code: 'SUBFLOW20',
            name: 'Launch Special 20% Off',
            description: 'Get 20% off any monthly or annual plan for new and existing accounts.',
            discountType: 'percentage',
            discountValue: 20,
            currency: 'INR',
            maxDiscountAmount: 10000,
            endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            maxRedemptions: 250,
            redemptionCount: 38,
            isActive: true,
        },
        {
            code: 'ANNUAL50',
            name: 'Annual Scale Discount',
            description: 'Flat ₹5,000 deduction on yearly enterprise contracts.',
            discountType: 'fixed',
            discountValue: 5000,
            currency: 'INR',
            minPurchaseAmount: 40000,
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            maxRedemptions: 100,
            redemptionCount: 14,
            isActive: true,
        },
        {
            code: 'LOYALTY25',
            name: 'VIP Customer Retention Offer',
            description: 'Exclusive 25% retention incentive for accounts renewing their annual contract.',
            discountType: 'percentage',
            discountValue: 25,
            currency: 'INR',
            maxDiscountAmount: 15000,
            endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            maxRedemptions: 50,
            redemptionCount: 8,
            isActive: true,
        },
        {
            code: 'WELCOME10',
            name: 'Welcome 10% Off',
            description: '10% instant discount on your first subscription invoice.',
            discountType: 'percentage',
            discountValue: 10,
            currency: 'INR',
            endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
            maxRedemptions: 1000,
            redemptionCount: 112,
            isActive: true,
        },
    ]);
    console.log('Creating Custom Quotations...');
    await Quotation_js_1.Quotation.create({
        quotationNumber: 'QT-2026-0042',
        customer: customer1._id,
        customerName: 'Marcus Sterling',
        customerEmail: 'acme@corp.com',
        companyName: 'Acme Global Technologies Inc',
        items: [
            {
                name: 'Enterprise Growth Tier (Annual Commitment)',
                description: 'Includes 25 team seats, dedicated database shard, and priority SLA',
                quantity: 1,
                unitPrice: 420000,
                discount: 20000,
                total: 400000,
            },
            {
                name: 'Gemini AI Financial Intelligence Dedicated Connector',
                description: 'Unlimited inference queries, custom training on historical financial ledgers',
                quantity: 1,
                unitPrice: 80000,
                discount: 0,
                total: 80000,
            },
        ],
        subtotal: 480000,
        taxRate: 18,
        taxAmount: 86400,
        discountAmount: 20000,
        grandTotal: 566400,
        currency: 'INR',
        validUntil: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        status: 'sent',
        templateName: 'Enterprise Bespoke Multi-Year Proposal',
        termsAndConditions: '1. Net-30 payment terms.\n2. SLA guarantee 99.99%.\n3. Dedicated TAM included.',
        createdBy: adminUser._id,
    });
    console.log('Creating Usage Records...');
    await UsageRecord_js_1.UsageRecord.create([
        {
            subscription: subAcme._id,
            customer: customer1._id,
            metric: 'api_calls',
            quantity: 482500,
            unit: 'calls',
            billingPeriodStart: now,
            billingPeriodEnd: nextMonth,
        },
        {
            subscription: subAcme._id,
            customer: customer1._id,
            metric: 'storage_gb',
            quantity: 142,
            unit: 'GB',
            billingPeriodStart: now,
            billingPeriodEnd: nextMonth,
        },
        {
            subscription: subNova._id,
            customer: customer2._id,
            metric: 'api_calls',
            quantity: 84200,
            unit: 'calls',
            billingPeriodStart: now,
            billingPeriodEnd: nextMonth,
        },
    ]);
    console.log('Creating Notifications & Audit Trail...');
    await Notification_js_1.Notification.create([
        {
            recipient: adminUser._id,
            title: 'Monthly Recurring Revenue milestone',
            message: 'Billflow 2.0 has crossed INR 4,85,000 MRR (+14.2% MoM).',
            type: 'billing',
            priority: 'high',
            actionUrl: '/admin/analytics',
        },
        {
            recipient: adminUser._id,
            title: 'Payment retry scheduled',
            message: 'Failed payment PAY-2026-9003 for GrowthScale scheduled for automated retry.',
            type: 'alert',
            priority: 'normal',
            actionUrl: '/admin/payments',
        },
        {
            recipient: custUser1._id,
            title: 'Invoice Ready for Payment',
            message: 'Invoice INV-2026-1003 for INR 54,279 is due on 5 Nov 2026.',
            type: 'billing',
            priority: 'high',
            actionUrl: '/portal/invoices',
        },
    ]);
    await AuditLog_js_1.AuditLog.create([
        {
            user: adminUser._id,
            userName: adminUser.name,
            userRole: adminUser.role,
            action: 'SYSTEM_SEEDED',
            entity: 'Setting',
            details: { environment: 'production-ready', seededRecords: 19 },
            severity: 'info',
        },
        {
            user: adminUser._id,
            userName: adminUser.name,
            userRole: adminUser.role,
            action: 'PLAN_CREATED',
            entity: 'Plan',
            details: { name: 'Enterprise Growth Tier', price: 39999 },
            severity: 'info',
        },
        {
            user: staffUser._id,
            userName: staffUser.name,
            userRole: staffUser.role,
            action: 'INVOICE_GENERATED',
            entity: 'Invoice',
            details: { invoiceNumber: 'INV-2026-1003', amount: 54279 },
            severity: 'info',
        },
    ]);
    console.log('\n======================================================');
    console.log('🎉 SEEDING COMPLETED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('DEMO ACCOUNTS READY TO USE:');
    console.log('1. Super Admin: admin@subflow.io   | Password@123');
    console.log('2. Staff:       staff@subflow.io   | Password@123');
    console.log('3. Customer 1:  acme@corp.com      | Password@123 (Enterprise, active, INR)');
    console.log('4. Customer 2:  jane@novatech.io   | Password@123 (Professional + Addons, active, INR)');
    console.log('5. Customer 3:  ryan@growthscale.co| Password@123 (At-risk, overdue, past_due)');
    console.log('6. Customer 4:  elena@apexfin.com  | Password@123 (Enterprise Annual, USD)');
    console.log('7. Customer 5:  vikram@cloudmatrix.dev | Password@123 (In Grace Period + AI Addon)');
    console.log('8. Customer 6:  david@zephyrstudio.design | Password@123 (14-Day Free Trial, EUR)');
    console.log('======================================================\n');
    process.exit(0);
}
seedDatabase().catch((err) => {
    console.error('CRITICAL SEEDING ERROR:', err);
    process.exit(1);
});
