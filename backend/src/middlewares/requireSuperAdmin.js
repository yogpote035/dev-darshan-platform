module.exports = (req, res, next) => {
    if (req.admin?.role !== 'super_admin') {
        return res.status(403).send('Super administrator access required.');
    }

    return next();
};
