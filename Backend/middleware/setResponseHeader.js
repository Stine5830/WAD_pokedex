// Setting a header to make json content
module.exports = (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
}