const { Product, CartItem } = require('../../models');
const { Op } = require('sequelize');

const safeDecimal = (value) => Number(value || 0);

const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await CartItem.findAll({
            where: { user_id: userId },
            include: [{ model: Product }],
            order: [['created_at', 'DESC']]
        });

        const mapped = items.map((entry) => {
            const product = entry.Product;
            const price = safeDecimal(product.price);
            const quantity = Number(entry.quantity || 0);
            const itemTotal = price * quantity;

            return {
                id: entry.id,
                productId: product.id,
                quantity,
                price,
                itemTotal,
                product: {
                    id: product.id,
                    name: product.name,
                    image: product.image,
                    price,
                    stock: Number(product.stock || 0),
                    active: !!product.active,
                    allowOneRupeeOffer: !!product.allow_one_rupee_offer,
                    oneRupeePrice: Number(product.one_rupee_price || 1),
                    subscriptionEnabled: !!product.subscription_enabled,
                    subscriptionAmount: product.subscription_amount ? Number(product.subscription_amount) : null
                }
            };
        });

        const subtotal = mapped.reduce((sum, item) => sum + item.itemTotal, 0);

        return res.status(200).json({
            success: true,
            items: mapped,
            subtotal,
            totalQuantity: mapped.reduce((sum, item) => sum + item.quantity, 0),
            totalItems: mapped.length
        });
    } catch (error) {
        console.error('getCart error:', error);
        return res.status(500).json({ success: false, message: 'Server error loading cart.' });
    }
};

const addToCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required.' });
        }

        const product = await Product.findByPk(productId);
        if (!product || !product.active) {
            return res.status(404).json({ success: false, message: 'Product is currently unavailable.' });
        }

        const qty = Number(quantity || 1);
        if (!Number.isInteger(qty) || qty <= 0) {
            return res.status(400).json({ success: false, message: 'Quantity must be a positive number.' });
        }

        if (qty > Number(product.stock || 0)) {
            return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock.' });
        }

        const existing = await CartItem.findOne({ where: { user_id: userId, product_id: productId } });

        if (existing) {
            const nextQty = Number(existing.quantity || 0) + qty;
            if (nextQty > Number(product.stock || 0)) {
                return res.status(400).json({ success: false, message: 'Cart quantity exceeds available stock.' });
            }
            existing.quantity = nextQty;
            await existing.save();

            return res.status(200).json({ success: true, message: 'Cart updated.', item: existing });
        }

        const item = await CartItem.create({
            user_id: userId,
            product_id: productId,
            quantity: qty
        });

        return res.status(200).json({ success: true, message: 'Product added to cart.', item });
    } catch (error) {
        console.error('addToCart error:', error);
        return res.status(500).json({ success: false, message: 'Server error adding product to cart.' });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;
        const { quantity } = req.body;

        const item = await CartItem.findOne({ where: { id: itemId, user_id: userId }, include: [{ model: Product }] });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Cart item not found.' });
        }

        const qty = Number(quantity);
        if (!Number.isInteger(qty) || qty <= 0) {
            return res.status(400).json({ success: false, message: 'Quantity must be a positive integer.' });
        }

        if (qty > Number(item.Product.stock || 0)) {
            return res.status(400).json({ success: false, message: 'Requested quantity exceeds available stock.' });
        }

        item.quantity = qty;
        await item.save();
        return res.status(200).json({ success: true, message: 'Cart item updated.', item });
    } catch (error) {
        console.error('updateCartItem error:', error);
        return res.status(500).json({ success: false, message: 'Server error updating cart item.' });
    }
};

const removeCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;

        const item = await CartItem.findOne({ where: { id: itemId, user_id: userId } });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Cart item not found.' });
        }

        await item.destroy();
        return res.status(200).json({ success: true, message: 'Item removed from cart.' });
    } catch (error) {
        console.error('removeCartItem error:', error);
        return res.status(500).json({ success: false, message: 'Server error removing cart item.' });
    }
};

const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        await CartItem.destroy({ where: { user_id: userId } });
        return res.status(200).json({ success: true, message: 'Cart cleared.' });
    } catch (error) {
        console.error('clearCart error:', error);
        return res.status(500).json({ success: false, message: 'Server error clearing cart.' });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCart
};
