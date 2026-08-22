const path = require('path');
const fs = require('fs');
const { Video, Category } = require('../../models');
const youtubeHelper = require('../../utils/youtubeHelper');

const getVideos = async (req, res) => {
  try {
    const videos = await Video.findAll({
      order: [['created_at', 'DESC']],
      include: [{ model: Category, attributes: ['category_name'] }]
    });

    res.render('videos/list', {
      activePage: 'videos',
      videos,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('getVideos error:', error);
    res.status(500).send('Error retrieving videos');
  }
};

const getAddVideo = async (req, res) => {
  try {
    const categories = await Category.findAll({ where: { status: 1 } });
    res.render('videos/add', { activePage: 'videos', categories, error: null });
  } catch (error) {
    console.error('getAddVideo error:', error);
    res.redirect('/admin/videos?error=Error+loading+categories');
  }
};

const postAddVideo = async (req, res) => {
  let categories = [];
  try {
    categories = await Category.findAll({ where: { status: 1 } });
    const { title, description, category_id, youtube_url, is_live, featured, status } = req.body;

    if (!title || !youtube_url) {
      return res.render('videos/add', {
        activePage: 'videos',
        categories,
        error: 'Title and YouTube URL are required.'
      });
    }

    const youtubeId = youtubeHelper.getYoutubeId(youtube_url);
    const embedUrl = youtubeHelper.getEmbedUrl(youtube_url);

    if (!youtubeId) {
      return res.render('videos/add', {
        activePage: 'videos',
        categories,
        error: 'Invalid YouTube URL.'
      });
    }

    let thumbnailPath = null;
    if (req.file) {
      thumbnailPath = `/uploads/videos/${req.file.filename}`;
    } else {
      // Premium detail: auto-generate standard high-quality YouTube thumbnail
      thumbnailPath = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
    }

    await Video.create({
      title,
      description,
      category_id: category_id ? parseInt(category_id) : null,
      youtube_url,
      youtube_id: youtubeId,
      embed_url: embedUrl,
      thumbnail: thumbnailPath,
      is_live: is_live === '1' ? 1 : 0,
      featured: featured === '1' ? 1 : 0,
      status: status === '1' ? 1 : 0,
      total_views: 0
    });

    res.redirect('/admin/videos?success=Video+added+successfully');
  } catch (error) {
    console.error('postAddVideo error:', error);
    res.render('videos/add', { activePage: 'videos', categories, error: 'Error creating video.' });
  }
};

const getEditVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findByPk(id);
    if (!video) {
      return res.redirect('/admin/videos?error=Video+not+found');
    }
    const categories = await Category.findAll({ where: { status: 1 } });
    res.render('videos/edit', { activePage: 'videos', video, categories, error: null });
  } catch (error) {
    console.error('getEditVideo error:', error);
    res.redirect('/admin/videos?error=Error+loading+edit+page');
  }
};

const postEditVideo = async (req, res) => {
  let video;
  let categories = [];
  try {
    const { id } = req.params;
    categories = await Category.findAll({ where: { status: 1 } });
    video = await Video.findByPk(id);
    if (!video) {
      return res.redirect('/admin/videos?error=Video+not+found');
    }

    const { title, description, category_id, youtube_url, is_live, featured, status } = req.body;

    if (!title || !youtube_url) {
      return res.render('videos/edit', {
        activePage: 'videos',
        video,
        categories,
        error: 'Title and YouTube URL are required.'
      });
    }

    const youtubeId = youtubeHelper.getYoutubeId(youtube_url);
    const embedUrl = youtubeHelper.getEmbedUrl(youtube_url);

    if (!youtubeId) {
      return res.render('videos/edit', {
        activePage: 'videos',
        video,
        categories,
        error: 'Invalid YouTube URL.'
      });
    }

    let thumbnailPath = video.thumbnail;
    if (req.file) {
      // Delete old thumbnail if it's local
      if (video.thumbnail && video.thumbnail.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', 'public', video.thumbnail);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      thumbnailPath = `/uploads/videos/${req.file.filename}`;
    } else if (video.youtube_url !== youtube_url && (!video.thumbnail || video.thumbnail.includes('img.youtube.com'))) {
      // YouTube URL changed and we are using a YouTube thumbnail, update it
      thumbnailPath = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
    }

    video.title = title;
    video.description = description;
    video.category_id = category_id ? parseInt(category_id) : null;
    video.youtube_url = youtube_url;
    video.youtube_id = youtubeId;
    video.embed_url = embedUrl;
    video.thumbnail = thumbnailPath;
    video.is_live = is_live === '1' ? 1 : 0;
    video.featured = featured === '1' ? 1 : 0;
    video.status = status === '1' ? 1 : 0;
    await video.save();

    res.redirect('/admin/videos?success=Video+updated+successfully');
  } catch (error) {
    console.error('postEditVideo error:', error);
    res.render('videos/edit', { activePage: 'videos', video, categories, error: 'Error updating video.' });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findByPk(id);
    if (!video) {
      return res.redirect('/admin/videos?error=Video+not+found');
    }
    video.status = video.status === 1 ? 0 : 1;
    await video.save();
    res.redirect('/admin/videos?success=Video+status+updated');
  } catch (error) {
    console.error('toggleStatus error:', error);
    res.redirect('/admin/videos?error=Error+updating+video+status');
  }
};

const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await Video.findByPk(id);
    if (!video) {
      return res.redirect('/admin/videos?error=Video+not+found');
    }

    // Delete thumbnail file if local
    if (video.thumbnail && video.thumbnail.startsWith('/uploads/')) {
      const imgPath = path.join(__dirname, '..', 'public', video.thumbnail);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await video.destroy();
    res.redirect('/admin/videos?success=Video+deleted+successfully');
  } catch (error) {
    console.error('deleteVideo error:', error);
    res.redirect('/admin/videos?error=Error+deleting+video');
  }
};

module.exports = {
  getVideos,
  getAddVideo,
  postAddVideo,
  getEditVideo,
  postEditVideo,
  toggleStatus,
  deleteVideo
};
