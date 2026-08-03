import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (token !== 'demo-token') {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
      }
    } catch (error) {
      console.error("JWT verify error:", error.message);
    }
  }

  // Fallback a usuario demo si no hay token o es token demo
  if (!req.user) {
    try {
      let demoUser = await User.findOne({ email: 'demo@auditorias.com' });
      if (!demoUser) {
        demoUser = await User.create({
          googleId: 'demo-google-id-12345',
          name: 'Usuario Admin',
          email: 'demo@auditorias.com',
          picture: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
          role: 'Admin'
        });
      } else if (demoUser.name && demoUser.name.includes('(Demo)')) {
        demoUser.name = 'Usuario Admin';
        await demoUser.save();
      }
      req.user = demoUser;
    } catch (err) {
      console.error("Error creating demo user:", err);
    }
  }

  if (req.user) {
    next();
  } else {
    res.status(401).json({ message: 'No autorizado' });
  }
};
