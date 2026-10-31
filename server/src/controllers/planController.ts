import { Request, Response } from 'express';
import { Plan } from '../models/Plan.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

export const getPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, billingFrequency, isActive } = req.query;
    const filter: any = {};

    if (category) filter.category = category;
    if (billingFrequency) filter.billingFrequency = billingFrequency;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const plans = await Plan.find(filter)
      .populate('product variant')
      .sort({ priceINR: 1 });

    res.json({
      success: true,
      plans,
      count: plans.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPlanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const plan = await Plan.findById(id).populate('product variant allowedUpgrades allowedDowngrades');

    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }

    res.json({
      success: true,
      plan,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      product,
      variant,
      description,
      category,
      billingFrequency,
      priceINR,
      priceUSD,
      priceEUR,
      trialDays,
      features,
      limits,
      isPopular,
      gracePeriodDays,
      isTeamPlan,
      seatPrice,
      minSeats,
      allowedUpgrades,
      allowedDowngrades,
    } = req.body;

    if (!name || priceINR === undefined) {
      res.status(400).json({ success: false, message: 'Plan name and priceINR are required.' });
      return;
    }

    const planId = `PLAN-${name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${Math.floor(100 + Math.random() * 900)}`;

    const plan = await Plan.create({
      planId,
      name,
      product: product || undefined,
      variant: variant || undefined,
      description: description || '',
      category: category || 'Starter',
      billingFrequency: billingFrequency || 'monthly',
      priceINR: Number(priceINR),
      priceUSD: priceUSD !== undefined ? Number(priceUSD) : Math.round(Number(priceINR) / 84),
      priceEUR: priceEUR !== undefined ? Number(priceEUR) : Math.round(Number(priceINR) / 92),
      currency: 'INR',
      trialDays: trialDays !== undefined ? Number(trialDays) : 14,
      features: features || [],
      limits: limits || { users: 1, apiCalls: 10000, storageGB: 10, projects: 5 },
      isPopular: isPopular || false,
      gracePeriodDays: gracePeriodDays !== undefined ? Number(gracePeriodDays) : 7,
      isTeamPlan: isTeamPlan || false,
      seatPrice: seatPrice ? Number(seatPrice) : 0,
      minSeats: minSeats ? Number(minSeats) : 1,
      allowedUpgrades: allowedUpgrades || [],
      allowedDowngrades: allowedDowngrades || [],
    });

    await logAudit({
      user: req.user,
      action: 'PLAN_CREATED',
      entity: 'Plan',
      entityId: plan._id.toString(),
      details: { name: plan.name, priceINR: plan.priceINR, frequency: plan.billingFrequency },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully.',
      plan,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await Plan.findByIdAndUpdate(id, updateData, { new: true });
    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }

    await logAudit({
      user: req.user,
      action: 'PLAN_UPDATED',
      entity: 'Plan',
      entityId: plan._id.toString(),
      details: { name: plan.name },
      req,
    });

    res.json({
      success: true,
      message: 'Plan updated successfully.',
      plan,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deletePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByIdAndDelete(id);

    if (!plan) {
      res.status(404).json({ success: false, message: 'Plan not found.' });
      return;
    }

    await logAudit({
      user: req.user,
      action: 'PLAN_DELETED',
      entity: 'Plan',
      entityId: id,
      details: { name: plan.name },
      req,
    });

    res.json({
      success: true,
      message: 'Plan deleted successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
