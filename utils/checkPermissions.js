import UnauthorizedError from '../errors/unauthorized.js';

const checkPermission = (requestUser, resourceUserId) => {
  if (requestUser.role === 'ADMIN') return;
  if (requestUser.userId === resourceUserId.toString()) return;
  throw new UnauthorizedError('Not authorized to access this route');
};

export default checkPermission;
