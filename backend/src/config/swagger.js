const swaggerJSDoc = require('swagger-jsdoc');
require('dotenv').config();

const port = process.env.PORT || 5000;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Dev Darshan Live REST API Documentation',
      version: '1.0.0',
      description: 'Production-ready REST APIs for Dev Darshan Live mobile-style frontend, including user authentication, payments via Razorpay, video streaming tracking, advertisements configuration, and push notifications.',
      contact: {
        name: 'Dev Darshan Live Support',
        email: 'support@devdarshanlive.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [
    // Include route files or js documents containing documentation JSDoc tags
    './src/routes/api/*.js',
    './src/config/swagger.js' // We can write schemas here as well
  ]
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, phone, password, confirm_password]
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Gurpreet Beniwal
 *               phone:
 *                 type: string
 *                 example: 9876543210
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Input validation failed
 * 
 * /api/auth/login:
 *   post:
 *     summary: Log in a user and obtain a JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, password]
 *             properties:
 *               phone:
 *                 type: string
 *                 example: 9876543210
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password@123
 *     responses:
 *       200:
 *         description: Login successful, returns token
 *       400:
 *         description: Invalid credentials
 * 
 * /api/auth/profile:
 *   get:
 *     summary: Fetch authenticated user's profile details
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile details retrieved
 *       401:
 *         description: Unauthorized
 * 
 * /api/categories:
 *   get:
 *     summary: Fetch list of active video categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 * 
 * /api/videos:
 *   get:
 *     summary: Fetch list of active videos / streams
 *     tags: [Videos]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: integer
 *         description: Filter by category ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [live, recorded]
 *         description: Filter by video type
 *       - in: query
 *         name: featured
 *         schema:
 *           type: string
 *           enum: ["1", "0"]
 *         description: Filter by featured status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Skip number of records (pagination)
 *     responses:
 *       200:
 *         description: List of videos
 * 
 * /api/videos/{id}:
 *   get:
 *     summary: Get specific video details and increment view counter
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Video detail
 *       404:
 *         description: Video not found
 * 
 * /api/history:
 *   get:
 *     summary: Fetch user's watch history
 *     tags: [Watch History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Watch history log
 *   post:
 *     summary: Add/update a watch history record
 *     tags: [Watch History]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [video_id]
 *             properties:
 *               video_id:
 *                 type: integer
 *                 example: 1
 *               watch_time:
 *                 type: integer
 *                 description: Time watched in seconds
 *                 example: 120
 *     responses:
 *       200:
 *         description: Watch history saved
 * 
 * /api/favorites:
 *   get:
 *     summary: Fetch user's favorite videos
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite videos
 * 
 * /api/favorites/toggle:
 *   post:
 *     summary: Add or remove video from favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [video_id]
 *             properties:
 *               video_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Favorite toggled successfully
 * 
 * /api/payments/create-order:
 *   post:
 *     summary: Initialize a new subscription payment order using Razorpay
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan_id]
 *             properties:
 *               plan_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Razorpay order created
 * 
 * /api/payments/verify:
 *   post:
 *     summary: Verify Razorpay payment signature and activate plan
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, plan_id]
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *                 example: order_HBf78a2hf9a
 *               razorpay_payment_id:
 *                 type: string
 *                 example: pay_HBf9ajf9hsa2
 *               razorpay_signature:
 *                 type: string
 *                 example: 2a9f81a7b...
 *               plan_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Payment verified and subscription activated
 *       400:
 *         description: Verification failed
 * 
 * /api/banners:
 *   get:
 *     summary: Fetch active homepage slider banners
 *     tags: [Banners]
 *     responses:
 *       200:
 *         description: List of banners
 * 
 * /api/ads:
 *   get:
 *     summary: Fetch active advertisement campaign configurations
 *     tags: [Advertisements]
 *     responses:
 *       200:
 *         description: List of advertisements
 * 
 * /api/settings:
 *   get:
 *     summary: Fetch public site branding settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Public settings returned
 * 
 * /api/contact:
 *   post:
 *     summary: Submit a contact support enquiry
 *     tags: [Contact Enquiries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, message]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Gurpreet
 *               phone:
 *                 type: string
 *                 example: 9876543210
 *               message:
 *                 type: string
 *                 example: I am facing issues with live buffering. Please help.
 *     responses:
 *       201:
 *         description: Enquiry submitted
 * 
 * /api/notifications:
 *   get:
 *     summary: Fetch user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user notifications
 * 
 * /api/notifications/{id}/read:
 *   post:
 *     summary: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read
 * 
 * /api/notifications/read-all:
 *   post:
 *     summary: Mark all notifications of user as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
