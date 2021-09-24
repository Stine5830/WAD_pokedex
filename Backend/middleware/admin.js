// authorizing the admin role
module.exports = (req, res, next) => {
    if (req.account.userRole.roleName == 'admin') next();

    return res.status(401).send(JSON.stringify({ errorMessage: 'Unauthorised access.' }));

}