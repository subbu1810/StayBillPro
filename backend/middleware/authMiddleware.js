const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Split 'Bearer <token>'
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // decoded contains: id, businessId, role, branchId
        req.user = {
            id: decoded.id,                       // The actual user's ID (primary admin ID)
            businessId: decoded.businessId || decoded.id, // Business/parent admin ID
            role: decoded.role || 'SUPERADMIN',   // Fallback for legacy tokens
            branchId: decoded.branchId || null
        };
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
