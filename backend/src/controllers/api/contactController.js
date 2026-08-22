const { ContactEnquiry } = require('../../models');

const submitEnquiry = async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone number, and message are required.'
      });
    }

    const enquiry = await ContactEnquiry.create({
      name,
      phone,
      message
    });

    return res.status(201).json({
      success: true,
      message: 'Your enquiry has been submitted successfully. Our support team will contact you soon.',
      enquiry
    });
  } catch (error) {
    console.error('submitEnquiry error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error submitting enquiry.'
    });
  }
};

module.exports = {
  submitEnquiry
};
