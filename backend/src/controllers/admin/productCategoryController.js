const path = require('path');
const fs = require('fs');
const { ProductCategory } = require('../../models');

const validateCategoryInput = (data) => {
    const name = String(data.name || '').trim();
    const description = String(data.description || '').trim();
    if (name.length < 2 || name.length > 150) return 'Category name must be 2 to 150 characters.';
    if (!/[A-Za-z\u00C0-\uFFFF]/.test(name)) return 'Category name must contain at least one letter.';
    if (description.length > 2000) return 'Category description must not exceed 2,000 characters.';
    if (!['0', '1', 0, 1, false, true, undefined].includes(data.active)) return 'Choose a valid category status.';
    return null;
};

const getProductCategories = async (req, res) => {
    try {
        const categories = await ProductCategory.findAll({ order: [['created_at', 'DESC']] });
        res.render('product-categories/list', {
            activePage: 'product_categories',
            categories,
            success: req.query.success || null,
            error: req.query.error || null
        });
    } catch (error) {
        console.error('getProductCategories error:', error);
        res.status(500).send('Error loading product categories');
    }
};

const getAddProductCategory = (req, res) => {
    res.render('product-categories/add', { activePage: 'product_categories', error: null });
};

const postAddProductCategory = async (req, res) => {
    try {
        const { name, description, active } = req.body;
        let imagePath = null;

        if (req.file) {
            imagePath = `/uploads/categories/${req.file.filename}`;
        }

        const validationError = validateCategoryInput(req.body);
        if (validationError) {
            return res.render('product-categories/add', {
                activePage: 'product_categories',
                error: validationError
            });
        }

        await ProductCategory.create({
            name,
            description,
            image: imagePath,
            active: active === '1' || active === true
        });

        res.redirect('/admin/product-categories?success=Product+category+added+successfully');
    } catch (error) {
        console.error('postAddProductCategory error:', error);
        res.render('product-categories/add', {
            activePage: 'product_categories',
            error: 'Error creating product category.'
        });
    }
};

const getEditProductCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await ProductCategory.findByPk(id);
        if (!category) {
            return res.redirect('/admin/product-categories?error=Product+category+not+found');
        }
        res.render('product-categories/edit', { activePage: 'product_categories', category, error: null });
    } catch (error) {
        console.error('getEditProductCategory error:', error);
        res.redirect('/admin/product-categories?error=Error+loading+product+category');
    }
};

const postEditProductCategory = async (req, res) => {
    let category;
    try {
        const { id } = req.params;
        const { name, description, active } = req.body;

        category = await ProductCategory.findByPk(id);
        if (!category) {
            return res.redirect('/admin/product-categories?error=Product+category+not+found');
        }

        const validationError = validateCategoryInput(req.body);
        if (validationError) {
            return res.render('product-categories/edit', {
                activePage: 'product_categories',
                category,
                error: validationError
            });
        }

        let imagePath = category.image;
        if (req.file) {
            if (category.image) {
                const oldPath = path.join(__dirname, '..', 'public', category.image);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            imagePath = `/uploads/categories/${req.file.filename}`;
        }

        category.name = name;
        category.description = description;
        category.image = imagePath;
        category.active = active === '1' || active === true;
        await category.save();

        res.redirect('/admin/product-categories?success=Product+category+updated+successfully');
    } catch (error) {
        console.error('postEditProductCategory error:', error);
        res.render('product-categories/edit', {
            activePage: 'product_categories',
            category,
            error: 'Error updating product category.'
        });
    }
};

const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await ProductCategory.findByPk(id);
        if (!category) {
            return res.redirect('/admin/product-categories?error=Product+category+not+found');
        }

        category.active = !category.active;
        await category.save();
        res.redirect('/admin/product-categories?success=Product+category+status+updated');
    } catch (error) {
        console.error('toggleStatus error:', error);
        res.redirect('/admin/product-categories?error=Error+updating+category+status');
    }
};

const deleteProductCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await ProductCategory.findByPk(id);
        if (!category) {
            return res.redirect('/admin/product-categories?error=Product+category+not+found');
        }

        if (category.image) {
            const imgPath = path.join(__dirname, '..', 'public', category.image);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }

        await category.destroy();
        res.redirect('/admin/product-categories?success=Product+category+deleted+successfully');
    } catch (error) {
        console.error('deleteProductCategory error:', error);
        res.redirect('/admin/product-categories?error=Error+deleting+product+category');
    }
};

module.exports = {
    getProductCategories,
    getAddProductCategory,
    postAddProductCategory,
    getEditProductCategory,
    postEditProductCategory,
    toggleStatus,
    deleteProductCategory
};
