import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);

const verifyToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access',
      });
    }

    const token = authorization.split(' ')[1];

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.CLIENT_URL,
      audience: process.env.CLIENT_URL,
    });

    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export default verifyToken;
