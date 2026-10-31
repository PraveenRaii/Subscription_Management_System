export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: 'super_admin' | 'staff' | 'customer';
  avatar?: string;
  phoneNumber?: string;
  status: 'active' | 'suspended' | 'inactive';
  lastLogin?: string;
}

export interface Customer {
  id: string;
  _id: string;
  user: User | string;
  customerId: string;
  companyName: string;
  taxId: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  currency: 'INR' | 'USD' | 'EUR';
  totalSpent: number;
  lifetimeValue: number;
  churnRiskScore: number;
  churnRiskLevel: 'Low' | 'Medium' | 'High';
  churnFactors: string[];
  referralCode: string;
  rewardPoints: number;
  notes?: string;
  status: 'active' | 'churned' | 'inactive';
  createdAt: string;
}

export interface Product {
  _id: string;
  productId: string;
  name: string;
  slug: string;
  description: string;
  category: 'SaaS' | 'API' | 'Analytics' | 'Addon' | 'Support' | 'Custom';
  images: string[];
  isActive: boolean;
  hasVariants: boolean;
  tags: string[];
  variants?: ProductVariant[];
  variantsCount?: number;
  createdAt: string;
}

export interface ProductVariant {
  _id: string;
  product: string;
  variantId: string;
  name: string;
  sku: string;
  basePrice: number;
  currency: 'INR' | 'USD' | 'EUR';
  billingCycle: 'daily' | 'weekly' | 'monthly' | 'yearly';
  minQuantity: number;
  maxQuantity: number;
  isActive: boolean;
}

export interface Plan {
  _id: string;
  planId: string;
  name: string;
  product?: Product;
  variant?: ProductVariant;
  description: string;
  category: 'Starter' | 'Professional' | 'Enterprise' | 'Addon' | 'Custom';
  billingFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priceINR: number;
  priceUSD: number;
  priceEUR: number;
  currency: string;
  trialDays: number;
  features: string[];
  limits: {
    users: number;
    apiCalls: number;
    storageGB: number;
    projects: number;
  };
  isActive: boolean;
  isPopular: boolean;
  gracePeriodDays: number;
  isTeamPlan: boolean;
  seatPrice: number;
  minSeats: number;
}

export interface Subscription {
  _id: string;
  subscriptionId: string;
  customer: Customer;
  plan: Plan;
  status: 'active' | 'paused' | 'past_due' | 'in_grace_period' | 'cancelled' | 'expired' | 'trialing';
  billingFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  currency: 'INR' | 'USD' | 'EUR';
  quantity: number;
  seatCount: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  renewalDate: string;
  pausedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  autoRenew: boolean;
  teamMembers: Array<{
    name: string;
    email: string;
    role: 'admin' | 'member' | 'viewer';
    addedAt: string;
  }>;
  createdAt: string;
}

export interface InvoiceItem {
  _id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  type: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  subscription?: Subscription;
  customer: Customer | string;
  customerName: string;
  customerEmail: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingPeriodStart: string;
  billingPeriodEnd: string;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'partially_paid' | 'cancelled';
  currency: 'INR' | 'USD' | 'EUR';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  discountCode?: string;
  totalAmount: number;
  amountPaid: number;
  amountRemaining: number;
  notes: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  paymentId: string;
  invoice: Invoice;
  subscription?: Subscription;
  customer: Customer;
  amount: number;
  currency: 'INR' | 'USD' | 'EUR';
  paymentMethod: 'razorpay' | 'card' | 'upi' | 'netbanking' | 'bank_transfer' | 'wallet';
  status: 'success' | 'pending' | 'failed' | 'refunded' | 'partially_refunded';
  gatewayTransactionId?: string;
  gatewayOrderId?: string;
  failureReason?: string;
  retryCount: number;
  nextRetryAt?: string;
  refundedAmount: number;
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  name: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  currency: 'INR' | 'USD' | 'EUR';
  minPurchaseAmount: number;
  maxDiscountAmount: number;
  endDate: string;
  maxRedemptions: number;
  redemptionCount: number;
  isActive: boolean;
}

export interface Quotation {
  _id: string;
  quotationNumber: string;
  customerName: string;
  customerEmail: string;
  companyName: string;
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  currency: 'INR' | 'USD' | 'EUR';
  validUntil: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';
  templateName: string;
  termsAndConditions: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: 'billing' | 'subscription' | 'security' | 'renewal' | 'alert' | 'system';
  priority: 'low' | 'normal' | 'high';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  totalCustomers: number;
  activeCustomers: number;
  churnRate: number;
  customerLtv: number;
  failedPaymentsCount: number;
  failedPaymentsAmount: number;
  outstandingRevenue: number;
  collectionRate: number;
}
