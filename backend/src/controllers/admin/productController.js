const fs = require('fs');
const path = require('path');
const { Product, ProductCategory, SubscriptionPlan } = require('../../models');

const isPositiveDecimal = (value, allowZero = false) => {
    const number = Number(value);
    return Number.isFinite(number) && (allowZero ? number >= 0 : number > 0);
};

const validateProductInput = async (data) => {
    const name = String(data.name || '').trim();
    const slug = String(data.slug || '').trim();
    const brand = String(data.brand || '').trim();
    const sku = String(data.sku || '').trim();
    const shortDescription = String(data.short_description || '').trim();
    const description = String(data.description || '').trim();
    const razorpayPlanId = String(data.razorpay_plan_id || '').trim();

    if (name.length < 2 || name.length > 255) return 'Product name must be 2 to 255 characters.';
    if (slug && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 255)) return 'Slug must use lowercase letters, numbers and single hyphens only.';
    if (brand.length > 150) return 'Brand must not exceed 150 characters.';
    if (sku && (!/^[A-Za-z0-9_-]+$/.test(sku) || sku.length > 100)) return 'SKU may contain only letters, numbers, hyphens and underscores (maximum 100 characters).';
    if (shortDescription.length > 500) return 'Short description must not exceed 500 characters.';
    if (description.length > 5000) return 'Description must not exceed 5,000 characters.';
    if (!/^\d+(?:\.\d{1,2})?$/.test(String(data.price || '')) || !isPositiveDecimal(data.price, true) || Number(data.price) > 99999999.99) return 'Price must be a valid amount from ₹0 to ₹99,999,999.99.';
    if (!/^\d+$/.test(String(data.stock ?? '')) || !Number.isInteger(Number(data.stock)) || Number(data.stock) > 2147483647) return 'Stock must be a whole number from 0 to 2,147,483,647.';
    if (data.category_id && !await ProductCategory.findOne({ where: { id: data.category_id, active: true } })) return 'Select a valid active product category.';
    if (razorpayPlanId && !/^plan_[A-Za-z0-9]+$/.test(razorpayPlanId)) return 'Razorpay Plan ID must start with plan_ and contain letters and numbers only.';

    const isOfferEnabled = data.allow_one_rupee_offer === '1' || data.allow_one_rupee_offer === true;
    const subscriptionEnabled = data.subscription_enabled === '1' || data.subscription_enabled === true;
    if (isOfferEnabled) {
        if (!subscriptionEnabled) return 'Enable subscriptions when enabling the ₹1 offer.';
        if (!/^\d+(?:\.\d{1,2})?$/.test(String(data.one_rupee_price || '')) || !isPositiveDecimal(data.one_rupee_price)) return 'Offer price must be a valid amount of at least ₹0.01.';
        if (!/^\d+(?:\.\d{1,2})?$/.test(String(data.subscription_amount || '')) || !isPositiveDecimal(data.subscription_amount)) return 'Recurring monthly amount must be a valid amount greater than ₹0.';
        if (!/^\d+$/.test(String(data.subscription_trial_days ?? '')) || !Number.isInteger(Number(data.subscription_trial_days)) || Number(data.subscription_trial_days) > 3650) return 'Trial days must be a whole number from 0 to 3,650.';
        if (!data.subscription_plan_id) return 'Select a Razorpay-ready subscription plan for the ₹1 offer.';
        const selectedPlan = await SubscriptionPlan.findOne({ where: { id: data.subscription_plan_id, status: 1 } });
        if (!selectedPlan) return 'Select a valid active subscription plan.';
        if (![30, 90, 365, 366].includes(Number(selectedPlan.duration_days))) return 'The selected app plan must be Monthly (30 days), Quarterly (90 days), or Yearly (365 days).';
        if (Number(selectedPlan.price || 0) <= 0) return 'The selected app plan must have a recurring price greater than ₹0.';
        if (Math.abs(Number(data.subscription_amount) - Number(selectedPlan.price)) > 0.001) return `Recurring amount must match the selected ${selectedPlan.plan_name} plan price (₹${Number(selectedPlan.price).toFixed(2)}).`;
    }
    return null;
};

const getProducts = async (req, res) => {
    try {
        const products = await Product.findAll({
            include: [{ model: ProductCategory, as: 'category' }],
            order: [['created_at', 'DESC']]
        });

        res.render('products/list', {
            activePage: 'products',
            products,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (error) {
        console.error('getProducts error:', error);
        res.status(500).send('Error loading products');
    }
};

const getAddProduct = async (req, res) => {
    try {
        const categories = await ProductCategory.findAll({ where: { active: true }, order: [['name', 'ASC']] });
        const plans = await SubscriptionPlan.findAll({ where: { status: 1 }, order: [['price', 'ASC']] });
        res.render('products/add', { activePage: 'products', categories, plans, error: null });
    } catch (error) {
        console.error('getAddProduct error:', error);
        res.status(500).send('Error loading add product form');
    }
};

const postAddProduct = async (req, res) => {
    try {
        const { name, slug, short_description, description, price, category_id, brand, sku, stock, featured, active, allow_one_rupee_offer, one_rupee_price, subscription_amount, subscription_trial_days, subscription_plan_id, subscription_enabled, razorpay_plan_id } = req.body;

        const validationError = await validateProductInput(req.body);
        if (validationError) {
            return res.status(400).render('products/add', {
                activePage: 'products',
                categories: await ProductCategory.findAll({ where: { active: true } }),
                plans: await SubscriptionPlan.findAll({ where: { status: 1 }, order: [['price', 'ASC']] }),
                error: validationError
            });
        }

        const isOfferEnabled = allow_one_rupee_offer === '1' || allow_one_rupee_offer === true;
        const selectedPlan = isOfferEnabled ? await SubscriptionPlan.findByPk(subscription_plan_id) : null;

        const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        let imagePath = null;
        if (req.file) {
            imagePath = `/uploads/products/${req.file.filename}`;
        }

        await Product.create({
            name,
            slug: finalSlug,
            short_description,
            description,
            price,
            image: imagePath,
            category_id: category_id || null,
            brand,
            sku,
            stock: stock || 0,
            featured: featured === '1' || featured === true,
            active: active === '1' || active === true,
            allow_one_rupee_offer: isOfferEnabled,
            one_rupee_price: isOfferEnabled ? one_rupee_price : null,
            subscription_plan_id: subscription_plan_id || null,
            razorpay_plan_id: razorpay_plan_id?.trim() || null,
            // The app plan is the source of truth for future Premium billing.
            subscription_amount: isOfferEnabled ? selectedPlan.price : null,
            subscription_trial_days: subscription_trial_days || 7,
            subscription_enabled: subscription_enabled === '1' || subscription_enabled === true
        });

        res.redirect('/admin/products?success=Product+added+successfully');
    } catch (error) {
        console.error('postAddProduct error:', error);
        const categories = await ProductCategory.findAll({ where: { active: true } });
        const plans = await SubscriptionPlan.findAll({ where: { status: 1 }, order: [['price', 'ASC']] });
        res.render('products/add', { activePage: 'products', categories, plans, error: 'Error creating product.' });
    }
};

const getEditProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) {
            return res.redirect('/admin/products?error=Product+not+found');
        }
        const categories = await ProductCategory.findAll({ where: { active: true }, order: [['name', 'ASC']] });
        const plans = await SubscriptionPlan.findAll({ where: { status: 1 }, order: [['price', 'ASC']] });
        res.render('products/edit', { activePage: 'products', product, categories, plans, error: null });
    } catch (error) {
        console.error('getEditProduct error:', error);
        res.redirect('/admin/products?error=Error+loading+product');
    }
};

const postEditProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) {
            return res.redirect('/admin/products?error=Product+not+found');
        }

        const { name, slug, short_description, description, price, category_id, brand, sku, stock, featured, active, allow_one_rupee_offer, one_rupee_price, subscription_amount, subscription_trial_days, subscription_plan_id, subscription_enabled, razorpay_plan_id } = req.body;
        const validationError = await validateProductInput(req.body);
        if (validationError) {
            const categories = await ProductCategory.findAll({ where: { active: true } });
            const plans = await SubscriptionPlan.findAll({ where: { status: 1 }, order: [['price', 'ASC']] });
            return res.render('products/edit', { activePage: 'products', product, categories, plans, error: validationError });
        }

        const isOfferEnabled = allow_one_rupee_offer === '1' || allow_one_rupee_offer === true;
        const selectedPlan = isOfferEnabled ? await SubscriptionPlan.findByPk(subscription_plan_id) : null;
        const planChanged = String(product.subscription_plan_id) !== String(subscription_plan_id);

        let imagePath = product.image;
        if (req.file) {
            if (product.image) {
                const oldPath = path.join(__dirname, '..', 'public', product.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            imagePath = `/uploads/products/${req.file.filename}`;
        }

        product.name = name;
        product.slug = slug || product.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        product.short_description = short_description;
        product.description = description;
        product.price = price;
        product.image = imagePath;
        product.category_id = category_id || null;
        product.brand = brand;
        product.sku = sku;
        product.stock = stock || 0;
        product.featured = featured === '1' || featured === true;
        product.active = active === '1' || active === true;
        product.allow_one_rupee_offer = isOfferEnabled;
        product.one_rupee_price = isOfferEnabled ? one_rupee_price : null;
        product.subscription_plan_id = subscription_plan_id || null;
        // Clear an auto-created plan when the configured monthly amount changes;
        // Razorpay plans are immutable, so the next checkout creates one matching the new amount.
        product.razorpay_plan_id = razorpay_plan_id?.trim() || (
            planChanged || Number(product.subscription_amount || 0) !== Number(selectedPlan?.price || 0)
                ? null
                : product.razorpay_plan_id
        );
        product.subscription_amount = isOfferEnabled ? selectedPlan.price : null;
        product.subscription_trial_days = subscription_trial_days || 7;
        product.subscription_enabled = subscription_enabled === '1' || subscription_enabled === true;
        await product.save();

        res.redirect('/admin/products?success=Product+updated+successfully');
    } catch (error) {
        console.error('postEditProduct error:', error);
        res.redirect('/admin/products?error=Error+updating+product');
    }
};

const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) {
            return res.redirect('/admin/products?error=Product+not+found');
        }

        product.active = !product.active;
        await product.save();
        res.redirect('/admin/products?success=Product+status+updated');
    } catch (error) {
        console.error('toggleStatus error:', error);
        res.redirect('/admin/products?error=Error+updating+status');
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByPk(id);
        if (!product) {
            return res.redirect('/admin/products?error=Product+not+found');
        }
        if (product.image) {
            const imgPath = path.join(__dirname, '..', 'public', product.image);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }
        await product.destroy();
        res.redirect('/admin/products?success=Product+deleted+successfully');
    } catch (error) {
        console.error('deleteProduct error:', error);
        res.redirect('/admin/products?error=Error+deleting+product');
    }
};

module.exports = {
    getProducts,
    getAddProduct,
    postAddProduct,
    getEditProduct,
    postEditProduct,
    toggleStatus,
    deleteProduct
};
