const request = require('supertest');
const app = require('../app');
const { Video } = require('../src/models');
const youtubeHelper = require('../src/utils/youtubeHelper');

// Mock Sequelize Models
jest.mock('../src/models', () => {
  const mockVideo = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn()
  };
  const mockSetting = {
    findOne: jest.fn().mockResolvedValue({
      site_name: 'Dev Darshan Live',
      logo: '/images/logo-placeholder.png',
      support_email: 'support@devdarshanlive.com',
      support_phone: '+919876543210',
      razorpay_key_id: 'rzp_test_placeholder_key',
      razorpay_secret: 'rzp_test_placeholder_secret',
      free_user_ads_enabled: 1,
      maintenance_mode: 0
    })
  };
  return {
    Video: mockVideo,
    Setting: mockSetting,
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(),
      sync: jest.fn().mockResolvedValue()
    }
  };
});

describe('Videos API and Helpers', () => {
  describe('YouTube Helper Utility', () => {
    it('should extract YouTube video ID from standard link', () => {
      const id = youtubeHelper.getYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('should extract YouTube video ID from share link (youtu.be)', () => {
      const id = youtubeHelper.getYoutubeId('https://youtu.be/dQw4w9WgXcQ?si=abcdef');
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('should extract YouTube video ID from a live URL', () => {
      const id = youtubeHelper.getYoutubeId('https://www.youtube.com/live/dQw4w9WgXcQ?feature=share');
      expect(id).toBe('dQw4w9WgXcQ');
    });

    it('should reject non-YouTube URLs', () => {
      expect(youtubeHelper.getYoutubeId('https://example.com/live/dQw4w9WgXcQ')).toBeNull();
    });

    it('should generate standard embed URL', () => {
      const url = youtubeHelper.getEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(url).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });
  });

  describe('GET /api/videos', () => {
    it('should return active video listings', async () => {
      const mockVideos = [
        { id: 1, title: 'Kedarnath Aarti Live', is_live: 1, total_views: 120 },
        { id: 2, title: 'Siddhivinayak Morning', is_live: 0, total_views: 45 }
      ];
      Video.findAndCountAll.mockResolvedValue({ count: 2, rows: mockVideos });

      const res = await request(app).get('/api/videos');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.videos).toHaveLength(2);
      expect(res.body.videos[0].title).toBe('Kedarnath Aarti Live');
    });
  });

  describe('GET /api/videos/:id', () => {
    it('should increment views count and return video details', async () => {
      const mockVideo = {
        id: 1,
        title: 'Kedarnath Aarti Live',
        total_views: 10,
        save: jest.fn().mockResolvedValue(),
        toJSON: function () {
          return { id: this.id, title: this.title, total_views: this.total_views };
        }
      };
      Video.findOne.mockResolvedValue(mockVideo);

      const res = await request(app).get('/api/videos/1');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockVideo.total_views).toBe(11); // View count increment check
      expect(mockVideo.save).toHaveBeenCalled();
    });
  });
});
