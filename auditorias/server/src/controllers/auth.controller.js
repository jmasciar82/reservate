import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token de Google requerido' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      user = await User.create({
        googleId,
        email,
        name,
        picture,
        role: 'Auditor' // Default role
      });
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      role: user.role,
      token: jwtToken
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(401).json({ message: 'Autenticación fallida' });
  }
};

import bcrypt from 'bcryptjs';

export const loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email/Usuario y contraseña requeridos' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email: cleanEmail },
        { email: 'demo@auditorias.com' },
        { email: 'admin@auditorias.com' }
      ]
    });

    // Special bootstrapping for Admin with password Dalt@2010
    const isAdminCredentials = (cleanEmail === 'admin' || cleanEmail === 'admin@dalt.com' || cleanEmail === 'demo@auditorias.com' || cleanEmail === 'admin@auditorias.com') && password === 'Dalt@2010';

    if (isAdminCredentials) {
      if (!user) {
        const hashedPassword = await bcrypt.hash('Dalt@2010', 10);
        user = await User.create({
          name: 'Usuario Admin',
          email: 'admin@auditorias.com',
          password: hashedPassword,
          role: 'Admin',
          picture: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        });
      } else {
        const hashedPassword = await bcrypt.hash('Dalt@2010', 10);
        user.password = hashedPassword;
        user.role = 'Admin';
        user.name = 'Usuario Admin';
        await user.save();
      }
    } else {
      if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'secretkey123',
      { expiresIn: '30d' }
    );

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      role: user.role,
      token: jwtToken
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Error en el servidor al iniciar sesión' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor' });
  }
};
