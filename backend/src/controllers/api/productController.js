const { Op } = require('sequelize');
const { Product, ProductCategory, SubscriptionPlan } = require('../../models');

const resolveMonthlyAmount = (product, planMap = {}) => {
    const plain = product && product.toJSON ? product.toJSON() : product || {};
    const fromField = plain.subscription_amount !== null && plain.subscription_amount !== undefined ? Number(plain.subscription_amount) : null;
    if (fromField !== null && !Number.isNaN(fromField) && fromField > 0) {
        return fromField;
    }

    if (plain.subscription_plan_id) {
        const plan = planMap[plain.subscription_plan_id];
        if (plan && Number(plan.price || 0) > 0) {
            return Number(plan.price);
        }
    }

    return null;
};

const serializeProduct = (product, planMap = {}) => {
    if (!product) return null;
    const plain = product.toJSON ? product.toJSON() : product;
    const monthlyAmount = resolveMonthlyAmount(plain, planMap);

    return {
        ...plain,
        imageUrl: plain.image,
        isOfferAvailable: !!plain.allow_one_rupee_offer && !!plain.subscription_enabled && Number(plain.stock || 0) > 0,
        monthlyAmount,
        trialDays: plain.subscription_trial_days || 7,
        price: Number(plain.price || 0),
        oneRupeePrice: Number(plain.one_rupee_price || 1)
    };
};

const getProducts = async (req, res) => {
    try {
        const { search, category, featured, active, limit = 12, offset = 0 } = req.query;
        const where = {};

        if (active !== undefined) where.active = active === 'true' || active === '1';
        else where.active = true;

        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { short_description: { [Op.like]: `%${search}%` } },
                { brand: { [Op.like]: `%${search}%` } },
                { sku: { [Op.like]: `%${search}%` } }
            ];
        }

        if (category) {
            where.category_id = category;
        }

        if (featured !== undefined) {
            where.featured = featured === 'true' || featured === '1';
        }

        const { count, rows } = await Product.findAndCountAll({
            where,
            include: [{ model: ProductCategory, as: 'category' }],
            order: [['created_at', 'DESC']],
            limit: Number(limit),
            offset: Number(offset)
        });

        const planIds = [...new Set(rows.map((product) => product.subscription_plan_id).filter(Boolean))];
        const plans = planIds.length ? await SubscriptionPlan.findAll({ where: { id: planIds } }) : [];
        const planMap = Object.fromEntries(plans.map((plan) => [String(plan.id), plan]));

        return res.status(200).json({
            success: true,
            products: rows.map((product) => serializeProduct(product, planMap)),
            count,
            totalPages: Math.ceil(count / Number(limit || 12)),
            hasMore: Number(offset) + Number(limit) < count
        });
    } catch (error) {
        console.error('getProducts error:', error);
        return res.status(500).json({ success: false, message: 'Server error loading products.' });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOne({
            where: { id, active: true },
            include: [{ model: ProductCategory, as: 'category' }]
        });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        const planMap = product.subscription_plan_id ? Object.fromEntries([
            [String(product.subscription_plan_id), await SubscriptionPlan.findByPk(product.subscription_plan_id)]
        ].filter(([, plan]) => !!plan)) : {};

        return res.status(200).json({
            success: true,
            product: serializeProduct(product, planMap)
        });
    } catch (error) {
        console.error('getProductById error:', error);
        return res.status(500).json({ success: false, message: 'Server error loading product details.' });
    }
};

module.exports = {
    getProducts,
    getProductById
};
