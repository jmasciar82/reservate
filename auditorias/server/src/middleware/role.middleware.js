export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Rol ${req.user ? req.user.role : 'desconocido'} no está autorizado para acceder a esta ruta` });
    }
    next();
  };
};
