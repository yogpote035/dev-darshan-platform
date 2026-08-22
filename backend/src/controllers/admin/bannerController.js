const path = require('path');
const fs = require('fs');
const { Banner } = require('../../models');

const getBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({ order: [['created_at', 'DESC']] });
    res.render('banners/list', {
      activePage: 'banners',
      banners,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('getBanners error:', error);
    res.status(500).send('Error loading banners');
  }
};

const getAddBanner = (req, res) => {
  res.render('banners/add', { activePage: 'banners', error: null });
};

const postAddBanner = async (req, res) => {
  try {
    const { title, link, status } = req.body;
    let imagePath = null;

    if (req.file) {
      imagePath = `/uploads/banners/${req.file.filename}`;
    }

    if (!title || !imagePath) {
      return res.render('banners/add', {
        activePage: 'banners',
        error: 'Title and Banner Image are required.'
      });
    }

    await Banner.create({
      title,
      image: imagePath,
      link,
      status: status === '1' ? 1 : 0
    });

    res.redirect('/admin/banners?success=Banner+created+successfully');
  } catch (error) {
    console.error('postAddBanner error:', error);
    res.render('banners/add', { activePage: 'banners', error: 'Error creating banner.' });
  }
};

const getEditBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.redirect('/admin/banners?error=Banner+not+found');
    }
    res.render('banners/edit', { activePage: 'banners', banner, error: null });
  } catch (error) {
    console.error('getEditBanner error:', error);
    res.redirect('/admin/banners?error=Error+loading+edit+page');
  }
};

const postEditBanner = async (req, res) => {
  let banner;
  try {
    const { id } = req.params;
    const { title, link, status } = req.body;

    banner = await Banner.findByPk(id);
    if (!banner) {
      return res.redirect('/admin/banners?error=Banner+not+found');
    }

    if (!title) {
      return res.render('banners/edit', { activePage: 'banners', banner, error: 'Title is required.' });
    }

    let imagePath = banner.image;
    if (req.file) {
      // Delete old banner image
      if (banner.image) {
        const oldPath = path.join(__dirname, '..', 'public', banner.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      imagePath = `/uploads/banners/${req.file.filename}`;
    }

    banner.title = title;
    banner.image = imagePath;
    banner.link = link;
    banner.status = status === '1' ? 1 : 0;
    await banner.save();

    res.redirect('/admin/banners?success=Banner+updated+successfully');
  } catch (error) {
    console.error('postEditBanner error:', error);
    res.render('banners/edit', { activePage: 'banners', banner, error: 'Error updating banner.' });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.redirect('/admin/banners?error=Banner+not+found');
    }
    banner.status = banner.status === 1 ? 0 : 1;
    await banner.save();
    res.redirect('/admin/banners?success=Banner+status+updated');
  } catch (error) {
    console.error('toggleStatus error:', error);
    res.redirect('/admin/banners?error=Error+updating+banner+status');
  }
};

const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByPk(id);
    if (!banner) {
      return res.redirect('/admin/banners?error=Banner+not+found');
    }

    // Delete image file
    if (banner.image) {
      const imgPath = path.join(__dirname, '..', 'public', banner.image);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await banner.destroy();
    res.redirect('/admin/banners?success=Banner+deleted+successfully');
  } catch (error) {
    console.error('deleteBanner error:', error);
    res.redirect('/admin/banners?error=Error+deleting+banner');
  }
};

module.exports = {
  getBanners,
  getAddBanner,
  postAddBanner,
  getEditBanner,
  postEditBanner,
  toggleStatus,
  deleteBanner
};
