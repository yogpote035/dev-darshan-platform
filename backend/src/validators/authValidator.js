const { body } = require('express-validator');
const { User } = require('../models');

const registerValidator = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full Name is required'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone Number is required')
    .isNumeric()
    .withMessage('Phone Number must contain digits only')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone Number must be between 10 and 15 digits')
    .custom(async (value) => {
      const user = await User.findOne({ where: { phone: value } });
      if (user) {
        throw new Error('Phone Number is already registered');
      }
      return true;
    }),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),

  body('confirm_password')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

const loginValidator = [
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone Number is required')
    .isNumeric()
    .withMessage('Phone Number must contain digits only')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone Number must be between 10 and 15 digits'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

module.exports = {
  registerValidator,
  loginValidator
};
