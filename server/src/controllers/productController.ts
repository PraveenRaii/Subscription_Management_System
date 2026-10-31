import { Request, Response } from 'express';
import { Product } from '../models/Product.js';
import { ProductVariant } from '../models/ProductVariant.js';
import { AuthRequest } from '../middleware/auth.js';
import { logAudit } from '../middleware/auditLogger.js';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, isActive, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } },
        { tags: { $in: [new RegExp(String(search), 'i')] } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    // Fetch variants count for each product
    const productIds = products.map((p) => p._id);
    const variants = await ProductVariant.find({ product: { $in: productIds } });

    const productsWithVariants = products.map((prod) => {
      const prodVariants = variants.filter((v) => v.product.toString() === prod._id.toString());
      return {
        ...prod.toObject(),
        variants: prodVariants,
        variantsCount: prodVariants.length,
      };
    });

    res.json({
      success: true,
      products: productsWithVariants,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    const variants = await ProductVariant.find({ product: product._id });

    res.json({
      success: true,
      product: {
        ...product.toObject(),
        variants,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, category, images, tags, hasVariants, variants } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Product name is required.' });
      return;
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const productId = `PROD-${Math.floor(100 + Math.random() * 900)}`;

    const product = await Product.create({
      productId,
      name,
      slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
      description: description || '',
      category: category || 'SaaS',
      images: images || [],
      tags: tags || [],
      hasVariants: hasVariants !== undefined ? hasVariants : true,
    });

    let createdVariants: any[] = [];
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const variantDocs = variants.map((v, i) => ({
        product: product._id,
        variantId: `VAR-${Math.floor(1000 + Math.random() * 9000)}-${i + 1}`,
        name: v.name || `${name} Standard`,
        sku: v.sku || `SKU-${slug.toUpperCase().substring(0, 4)}-${i + 1}`,
        basePrice: v.basePrice || 0,
        currency: v.currency || 'INR',
        billingCycle: v.billingCycle || 'monthly',
        minQuantity: v.minQuantity || 1,
        maxQuantity: v.maxQuantity || 500,
        attributes: v.attributes || {},
      }));
      createdVariants = await ProductVariant.insertMany(variantDocs);
    }

    await logAudit({
      user: req.user,
      action: 'PRODUCT_CREATED',
      entity: 'Product',
      entityId: product._id.toString(),
      details: { name: product.name, category: product.category },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      product: {
        ...product.toObject(),
        variants: createdVariants,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, category, images, tags, isActive } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    if (category) product.category = category;
    if (images) product.images = images;
    if (tags) product.tags = tags;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    await logAudit({
      user: req.user,
      action: 'PRODUCT_UPDATED',
      entity: 'Product',
      entityId: product._id.toString(),
      details: { name: product.name },
      req,
    });

    res.json({
      success: true,
      message: 'Product updated successfully.',
      product,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    await ProductVariant.deleteMany({ product: product._id });
    await product.deleteOne();

    await logAudit({
      user: req.user,
      action: 'PRODUCT_DELETED',
      entity: 'Product',
      entityId: id,
      details: { name: product.name },
      req,
    });

    res.json({
      success: true,
      message: 'Product and associated variants removed successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create Product Variant
export const createProductVariant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { name, sku, basePrice, currency, billingCycle, minQuantity, maxQuantity, attributes } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Parent product not found.' });
      return;
    }

    const variantId = `VAR-${Math.floor(1000 + Math.random() * 9000)}`;
    const variant = await ProductVariant.create({
      product: product._id,
      variantId,
      name,
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      basePrice: basePrice || 0,
      currency: currency || 'INR',
      billingCycle: billingCycle || 'monthly',
      minQuantity: minQuantity || 1,
      maxQuantity: maxQuantity || 1000,
      attributes: attributes || {},
    });

    res.status(201).json({
      success: true,
      message: 'Product variant created.',
      variant,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
