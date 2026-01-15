const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-proiect-grup';

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// DATABASE CONNECTION (SQLITE)
// ============================================
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite', // Fișierul va fi creat automat în folderul proiectului
  logging: false
});

// ============================================
// MODELS
// ============================================

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { 
    type: DataTypes.ENUM('admin', 'manager', 'executant'), 
    allowNull: false 
  },
  managerId: { type: DataTypes.INTEGER, allowNull: true }
});

const Task = sequelize.define('Task', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: { 
    type: DataTypes.ENUM('OPEN', 'PENDING', 'COMPLETED', 'CLOSED'), 
    defaultValue: 'OPEN' 
  },
  assignedTo: { type: DataTypes.INTEGER, allowNull: true },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
  assignedAt: { type: DataTypes.DATE },
  completedAt: { type: DataTypes.DATE },
  closedAt: { type: DataTypes.DATE }
});

// Relații (Asocieri)
User.hasMany(User, { as: 'Subordinates', foreignKey: 'managerId' });
User.belongsTo(User, { as: 'Manager', foreignKey: 'managerId' });

Task.belongsTo(User, { as: 'Assignee', foreignKey: 'assignedTo' });
Task.belongsTo(User, { as: 'Creator', foreignKey: 'createdBy' });

// ============================================
// MIDDLEWARE - AUTH
// ============================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized role' });
    }
    next();
  };
};

// ============================================
// ROUTES - AUTH
// ============================================

app.post('/api/auth/register', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { email, password, name, role, managerId } = req.body;
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
      managerId: role === 'executant' ? managerId : null
    });

    res.status(201).json({ message: 'User created', user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ 
        where: { email },
        include: [{ model: User, as: 'Manager', attributes: ['id', 'name'] }] 
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, managerId: user.managerId } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// ROUTES - TASKS
// ============================================

// Creare Task (Manager)
app.post('/api/tasks', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const task = await Task.create({
      title: req.body.title,
      description: req.body.description,
      createdBy: req.user.id
    });
    res.status(201).json(task);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Alocare Task (Manager -> Executant)
app.patch('/api/tasks/:id/assign', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task || task.createdBy !== req.user.id) return res.status(404).json({ error: 'Task not found or unauthorized' });

    task.assignedTo = req.body.assignedTo;
    task.status = 'PENDING';
    task.assignedAt = new Date();
    await task.save();

    res.json(task);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Finalizare Task (Executant)
app.patch('/api/tasks/:id/complete', authenticateToken, authorizeRoles('executant'), async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, assignedTo: req.user.id } });
    if (!task) return res.status(404).json({ error: 'Task not assigned to you' });

    task.status = 'COMPLETED';
    task.completedAt = new Date();
    await task.save();

    res.json(task);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Inchidere Task (Manager)
app.patch('/api/tasks/:id/close', authenticateToken, authorizeRoles('manager'), async (req, res) => {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, createdBy: req.user.id } });
    if (!task || task.status !== 'COMPLETED') return res.status(400).json({ error: 'Task must be COMPLETED to close it' });

    task.status = 'CLOSED';
    task.closedAt = new Date();
    await task.save();

    res.json(task);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Listare Task-uri (cu filtre)
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'executant') filter.assignedTo = req.user.id;
    if (req.user.role === 'manager') filter.createdBy = req.user.id;

    const tasks = await Task.findAll({
      where: filter,
      include: [
        { model: User, as: 'Assignee', attributes: ['name', 'email'] },
        { model: User, as: 'Creator', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(tasks);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// ============================================
// ADMIN & UTILS
// ============================================

app.get('/api/users', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    let where = {};
    if (req.user.role === 'manager') where = { managerId: req.user.id, role: 'executant' };
    const users = await User.findAll({ where, attributes: { exclude: ['password'] } });
    res.json(users);
});

app.get('/api/health', (req, res) => res.json({ status: 'OK', db: 'SQLite' }));

// Start function
async function start() {
  try {
    await sequelize.sync(); // Creează tabelele automat
    console.log('✅ SQLite Database Synced');

    // Creează admin implicit dacă nu există
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      const hash = await bcrypt.hash('admin123', 10);
      await User.create({ email: 'admin@test.com', password: hash, name: 'Admin System', role: 'admin' });
      console.log('👤 Default Admin created: admin@test.com / admin123');
    }

    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('❌ Error starting server:', err);
  }
}

start();