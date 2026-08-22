const { ContactEnquiry } = require('../../models');

const getEnquiries = async (req, res) => {
  try {
    const enquiries = await ContactEnquiry.findAll({ order: [['created_at', 'DESC']] });
    res.render('enquiries/list', {
      activePage: 'enquiries',
      enquiries,
      success: req.query.success || null,
      error: req.query.error || null
    });
  } catch (error) {
    console.error('getEnquiries error:', error);
    res.status(500).send('Error loading enquiries');
  }
};

const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await ContactEnquiry.findByPk(id);
    if (!enquiry) {
      return res.redirect('/admin/enquiries?error=Enquiry+not+found');
    }
    await enquiry.destroy();
    res.redirect('/admin/enquiries?success=Enquiry+deleted+successfully');
  } catch (error) {
    console.error('deleteEnquiry error:', error);
    res.redirect('/admin/enquiries?error=Error+deleting+enquiry');
  }
};

module.exports = {
  getEnquiries,
  deleteEnquiry
};
