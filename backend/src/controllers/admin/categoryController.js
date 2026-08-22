const path = require('path');
const fs = require('fs');
const { Category } = require('../../models');

const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['created_at', 'DESC']] });
    res.render('categories/list', {
      activePage: 'categories',
      categories,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).send('Error loading categories');
  }
};

const getAddCategory = (req, res) => {
  res.render('categories/add', { activePage: 'categories', error: null });
};

const postAddCategory = async (req, res) => {
  try {
    const { category_name, status } = req.body;
    let imagePath = null;

    if (req.file) {
      imagePath = `/uploads/categories/${req.file.filename}`;
    }

    if (!category_name) {
      return res.render('categories/add', { activePage: 'categories', error: 'Category Name is required.' });
    }

    await Category.create({
      category_name,
      image: imagePath,
      status: status === '1' ? 1 : 0
    });

    res.redirect('/admin/categories?success=Category+added+successfully');
  } catch (error) {
    console.error('postAddCategory error:', error);
    res.render('categories/add', { activePage: 'categories', error: 'Error creating category.' });
  }
};

const getEditCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) {
      return res.redirect('/admin/categories?error=Category+not+found');
    }
    res.render('categories/edit', { activePage: 'categories', category, error: null });
  } catch (error) {
    console.error('getEditCategory error:', error);
    res.redirect('/admin/categories?error=Error+loading+edit+page');
  }
};

const postEditCategory = async (req, res) => {
  let category;
  try {
    const { id } = req.params;
    const { category_name, status } = req.body;

    category = await Category.findByPk(id);
    if (!category) {
      return res.redirect('/admin/categories?error=Category+not+found');
    }

    if (!category_name) {
      return res.render('categories/edit', { activePage: 'categories', category, error: 'Category Name is required.' });
    }

    let imagePath = category.image;
    if (req.file) {
      // Delete old image if it exists
      if (category.image) {
        const oldPath = path.join(__dirname, '..', 'public', category.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      imagePath = `/uploads/categories/${req.file.filename}`;
    }

    category.category_name = category_name;
    category.image = imagePath;
    category.status = status === '1' ? 1 : 0;
    await category.save();

    res.redirect('/admin/categories?success=Category+updated+successfully');
  } catch (error) {
    console.error('postEditCategory error:', error);
    res.render('categories/edit', { activePage: 'categories', category, error: 'Error updating category.' });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) {
      return res.redirect('/admin/categories?error=Category+not+found');
    }
    category.status = category.status === 1 ? 0 : 1;
    await category.save();
    res.redirect('/admin/categories?success=Category+status+updated');
  } catch (error) {
    console.error('toggleStatus error:', error);
    res.redirect('/admin/categories?error=Error+updating+category+status');
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) {
      return res.redirect('/admin/categories?error=Category+not+found');
    }

    // Delete image file
    if (category.image) {
      const imgPath = path.join(__dirname, '..', 'public', category.image);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await category.destroy();
    res.redirect('/admin/categories?success=Category+deleted+successfully');
  } catch (error) {
    console.error('deleteCategory error:', error);
    res.redirect('/admin/categories?error=Error+deleting+category');
  }
};

module.exports = {
  getCategories,
  getAddCategory,
  postAddCategory,
  getEditCategory,
  postEditCategory,
  toggleStatus,
  deleteCategory
};
