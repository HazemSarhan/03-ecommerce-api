import { UnauthenticatedError, UnauthorizedError } from "../errors/index.js";
import { isTokenValid } from "../utils/jwt.js";

export const authenticateUser = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  console.log("Extracted Token:", token);

  if (!token) {
    console.log("Token missing!");
    throw new UnauthenticatedError("Authentication invalid");
  }

  try {
    const payload = isTokenValid(token);
    console.log("Token Payload:", payload);
    req.user = {
      userId: payload.user.userId,
      role: payload.user.role,
    };
    console.log("Authenticated User:", req.user);
    next();
  } catch (error) {
    console.error("Token Validation Error:", error);
    throw new UnauthenticatedError("Authentication invalid");
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new UnauthorizedError("Unauthorized to access this route");
    }
    next();
  };
};
