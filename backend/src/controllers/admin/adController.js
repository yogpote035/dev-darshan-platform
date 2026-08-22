const path = require('path');
const fs = require('fs');
const { Advertisement } = require('../../models');

const getAds = async (req, res) => {
  try {
    const ads = await Advertisement.findAll({ order: [['created_at', 'DESC']] });
    res.render('ads/list', {
      activePage: 'ads',
      ads,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('getAds error:', error);
    res.status(500).send('Error loading advertisements');
  }
};

const getAddAd = (req, res) => {
  res.render('ads/add', { activePage: 'ads', error: null });
};

const postAddAd = async (req, res) => {
  try {
    const { title, redirect_url, display_after_minutes, display_after_videos, status } = req.body;
    let imagePath = null;

    if (req.file) {
      imagePath = `/uploads/ads/${req.file.filename}`;
    }

    if (!title) {
      return res.render('ads/add', { activePage: 'ads', error: 'Ad Title is required.' });
    }

    await Advertisement.create({
      title,
      image: imagePath,
      redirect_url,
      display_after_minutes: display_after_minutes ? parseInt(display_after_minutes) : 5,
      display_after_videos: display_after_videos ? parseInt(display_after_videos) : 2,
      status: status === '1' ? 1 : 0
    });

    res.redirect('/admin/ads?success=Advertisement+created+successfully');
  } catch (error) {
    console.error('postAddAd error:', error);
    res.render('ads/add', { activePage: 'ads', error: 'Error creating advertisement.' });
  }
};

const getEditAd = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Advertisement.findByPk(id);
    if (!ad) {
      return res.redirect('/admin/ads?error=Advertisement+not+found');
    }
    res.render('ads/edit', { activePage: 'ads', ad, error: null });
  } catch (error) {
    console.error('getEditAd error:', error);
    res.redirect('/admin/ads?error=Error+loading+edit+page');
  }
};

const postEditAd = async (req, res) => {
  let ad;
  try {
    const { id } = req.params;
    const { title, redirect_url, display_after_minutes, display_after_videos, status } = req.body;

    ad = await Advertisement.findByPk(id);
    if (!ad) {
      return res.redirect('/admin/ads?error=Advertisement+not+found');
    }

    if (!title) {
      return res.render('ads/edit', { activePage: 'ads', ad, error: 'Ad Title is required.' });
    }

    let imagePath = ad.image;
    if (req.file) {
      // Delete old image if exists
      if (ad.image) {
        const oldPath = path.join(__dirname, '..', 'public', ad.image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      imagePath = `/uploads/ads/${req.file.filename}`;
    }

    ad.title = title;
    ad.image = imagePath;
    ad.redirect_url = redirect_url;
    ad.display_after_minutes = display_after_minutes ? parseInt(display_after_minutes) : 5;
    ad.display_after_videos = display_after_videos ? parseInt(display_after_videos) : 2;
    ad.status = status === '1' ? 1 : 0;
    await ad.save();

    res.redirect('/admin/ads?success=Advertisement+updated+successfully');
  } catch (error) {
    console.error('postEditAd error:', error);
    res.render('ads/edit', { activePage: 'ads', ad, error: 'Error updating advertisement.' });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Advertisement.findByPk(id);
    if (!ad) {
      return res.redirect('/admin/ads?error=Advertisement+not+found');
    }
    ad.status = ad.status === 1 ? 0 : 1;
    await ad.save();
    res.redirect('/admin/ads?success=Ad+status+updated');
  } catch (error) {
    console.error('toggleStatus error:', error);
    res.redirect('/admin/ads?error=Error+updating+ad+status');
  }
};

const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Advertisement.findByPk(id);
    if (!ad) {
      return res.redirect('/admin/ads?error=Advertisement+not+found');
    }

    // Delete image file
    if (ad.image) {
      const imgPath = path.join(__dirname, '..', 'public', ad.image);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await ad.destroy();
    res.redirect('/admin/ads?success=Advertisement+deleted+successfully');
  } catch (error) {
    console.error('deleteAd error:', error);
    res.redirect('/admin/ads?error=Error+deleting+advertisement');
  }
};

module.exports = {
  getAds,
  getAddAd,
  postAddAd,
  getEditAd,
  postEditAd,
  toggleStatus,
  deleteAd
};
