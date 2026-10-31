import { Request, Response } from 'express';
import { Coupon } from '../models/Coupon.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

export const getCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive, search } = req.query;
    const filter: any = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { code: { $regex: String(search), $options: 'i' } },
        { name: { $regex: String(search), $options: 'i' } },
      ];
    }

    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      coupons,
      count: coupons.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      code,
      name,
      description,
      discountType,
      discountValue,
      currency,
      minPurchaseAmount,
      maxDiscountAmount,
      endDate,
      maxRedemptions,
    } = req.body;

    if (!code || !name || discountValue === undefined) {
      res.status(400).json({ success: false, message: 'Code, name, and discount value are required.' });
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      res.status(409).json({ success: false, message: 'A coupon with this code already exists.' });
      return;
    }

    const expiry = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const coupon = await Coupon.create({
      code: cleanCode,
      name,
      description: description || '',
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      currency: currency || 'INR',
      minPurchaseAmount: Number(minPurchaseAmount) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      endDate: expiry,
      maxRedemptions: Number(maxRedemptions) || 100,
      isActive: true,
    });

    await logAudit({
      user: req.user,
      action: 'COUPON_CREATED',
      entity: 'Coupon',
      entityId: coupon._id.toString(),
      details: { code: coupon.code, discountValue: coupon.discountValue, type: coupon.discountType },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Coupon code ${coupon.code} created successfully.`,
      coupon,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, amount } = req.body;

    if (!code) {
      res.status(400).json({ success: false, message: 'Coupon code is required.' });
      return;
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
      endDate: { $gt: new Date() },
    });

    if (!coupon) {
      res.status(404).json({ success: false, message: 'Invalid, inactive, or expired coupon code.' });
      return;
    }

    if (coupon.redemptionCount >= coupon.maxRedemptions) {
      res.status(400).json({ success: false, message: 'Coupon maximum redemption limit reached.' });
      return;
    }

    const purchaseAmount = Number(amount) || 0;
    if (coupon.minPurchaseAmount > 0 && purchaseAmount < coupon.minPurchaseAmount) {
      res.status(400).json({
        success: false,
        message: `Minimum purchase of ${coupon.currency} ${coupon.minPurchaseAmount} required for this coupon.`,
      });
      return;
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === 'percentage') {
      calculatedDiscount = (purchaseAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount > 0 && calculatedDiscount > coupon.maxDiscountAmount) {
        calculatedDiscount = coupon.maxDiscountAmount;
      }
    } else {
      calculatedDiscount = coupon.discountValue;
    }

    res.json({
      success: true,
      valid: true,
      coupon: {
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        calculatedDiscount: Math.min(calculatedDiscount, purchaseAmount),
        currency: coupon.currency,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleCouponStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found.' });
      return;
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      success: true,
      message: `Coupon ${coupon.code} is now ${coupon.isActive ? 'Active' : 'Disabled'}.`,
      coupon,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
