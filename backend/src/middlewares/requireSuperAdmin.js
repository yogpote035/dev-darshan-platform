module.exports = (req, res, next) => {
    if (req.session?.admin?.role !== 'super_admin') {
        return res.status(403).send('Super administrator access required.');
    }

    return next();
};
