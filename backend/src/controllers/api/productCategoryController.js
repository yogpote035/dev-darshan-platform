const { ProductCategory } = require('../../models');

const getActiveProductCategories = async (req, res) => {
    try {
        const categories = await ProductCategory.findAll({
            where: { active: true },
            order: [['name', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            categories: categories.map((category) => ({
                id: category.id,
                name: category.name,
                description: category.description,
                image: category.image
            }))
        });
    } catch (error) {
        console.error('getActiveProductCategories error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error retrieving product categories.'
        });
    }
};

module.exports = {
    getActiveProductCategories
};
