const { Category } = require('../../models');

const getActiveCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { status: 1 },
      order: [['category_name', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('getActiveCategories error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving categories.'
    });
  }
};

module.exports = {
  getActiveCategories
};
