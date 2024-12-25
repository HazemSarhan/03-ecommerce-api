import { isTokenValid } from "../utils/jwt.js";
import UnauthenticatedError from "../errors/unauthenticated.js";
import UnauthorizedError from "../errors/unauthorized.js";

export const authenticatedUser = async (req, res, next) => {
  const token = req.signedCookies.token;

  if (!token) {
    throw new UnauthenticatedError("Authentication Invalid");
  }
  try {
    const { name, userId, role } = isTokenValid({ token });
    req.user = { name, userId, role };
    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication Invalid");
  }
};

export const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedError("Unauthorized to access this route");
    }
    next();
  };
};

export const checkAuthentication = (req, res, next) => {
  const token = req.signedCookies.token;

  if (!token) {
    res.locals.isAuthenticated = false; // No token, user is not authenticated
    return next(); // Allow public routes to proceed
  }

  try {
    const payload = isTokenValid({ token }); // Validate and decode token
    req.user = payload; // Attach user info to req.user
    res.locals.isAuthenticated = true; // Set isAuthenticated to true
    res.locals.user = payload; // Optionally pass the user object
    next();
  } catch (error) {
    console.error("Invalid token:", error.message);
    res.locals.isAuthenticated = false; // Token invalid, user is not authenticated
    next();
  }
};
