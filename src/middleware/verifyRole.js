const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden access',
      });
    }

    next();
  };
};

export const verifyCustomer = verifyRole('customer');
export const verifyTechnician = verifyRole('technician');
export const verifyAdmin = verifyRole('admin');

export default verifyRole;
