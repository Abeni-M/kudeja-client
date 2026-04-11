const rolePermissions = {
  user: ['products:read', 'orders:read', 'orders:write'],
  sales: [
    'orders:read',
    'orders:write',
    'revenue:read',
  ],
  'sub-admin': [
    'products:read',
    'products:write',
    'categories:read',
    'categories:write',
    'messages:read',
    'messages:write',
    'tasks:read',
    'tasks:write',
    'users:read',
    'ads:read',
    'ads:write'
  ],
  admin: [
    'products:read',
    'products:write',
    'orders:read',
    'orders:write',
    'users:read',
    'users:write',
    'revenue:read',
    'categories:read',
    'categories:write',
    'messages:read',
    'messages:write',
    'tasks:read',
    'tasks:write',
    'ads:read',
    'ads:write',
    'settings:read',
    'settings:write'
  ],
};

function hasPermission(user, permission) {
  const role = user?.role;
  if (!role) return false;

  const perms = rolePermissions[role] || [];
  if (perms.includes(permission)) return true;

  const [resource] = String(permission).split(':');
  if (perms.includes(`${resource}:*`)) return true;

  return false;
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return next();
  };
}

module.exports = { rolePermissions, hasPermission, requirePermission };

