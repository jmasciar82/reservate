import User from '../models/User.js';
import bcrypt from 'bcryptjs';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Ya existe un usuario registrado con ese email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      googleId: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: role || 'Auditor',
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json(userObj);
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya existe un usuario registrado con ese email' });
    }
    res.status(500).json({ message: error.message || 'Error al crear el usuario' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!['Admin', 'Supervisor', 'Auditor'].includes(role)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'Rol actualizado exitosamente', user });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar rol' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (targetUser.email === 'admin@auditorias.com') {
      return res.status(400).json({ message: 'No se puede eliminar el usuario administrador principal' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};
