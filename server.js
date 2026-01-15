/**
 * =====================================================
 * BACKEND REST API – Task Management Application
 * Tehnologii: Node.js, Express, Sequelize, SQLite
 * =====================================================
 */

const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-proiect-grup';

/**
 * =====================================================
 * MIDDLEWARE GLOBAL
 * =====================================================
 * - cors: permite accesul din frontend (SPA)
 * - express.json: permite procesarea request-urilor JSON
 */
app.use(cors());
app.use(express.json());

/**
 * =====================================================
 * DATABASE CONNECTION (SQLite)
 * =====================================================
 * Baza de date este stocată local într-un fișier SQLite.
 * ORM folosit: Sequelize.
 */
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

/**
 * =====================================================
 * MODELE
 * =====================================================
 */

/**
 * MODEL: User
 * -----------------------------------------------------
 * Cerințe îndeplinite:
 * - Aplicația are utilizatori
 * - Există administratori, manageri și executanți
 * - Un executant are un manager alocat
 */
const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'executant'),
    allowNull: false
  },
  managerId: { type: DataTypes.INTEGER, allowNull: true }
});

/**
 * MODEL: Task
 * -----------------------------------------------------
 * Cerințe îndeplinite:
 * - Managerul poate crea task-uri
 * - Task-urile au status (OPEN, PENDING, COMPLETED, CLOSED)
 * - Task-urile pot fi alocate executanților
 * - Se păstrează istoricul task-urilor
 */
const Task = sequelize.define('Task', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: {
    type: DataTypes.ENUM('OPEN', 'PENDING', 'COMPLETED', 'CLOSED'),
    defaultValue: 'OPEN'
  },
  assignedTo: { type: DataTypes.INTEGER },
  createdBy: { type: DataTypes.INTEGER, allowNull: false },
  assignedAt: { type: DataTypes.DATE },
  completedAt: { type: DataTypes.DATE },
  closedAt: { type: DataTypes.DATE }
});

/**
 * =====================================================
 * RELAȚII ÎNTRE MODELE
 * =====================================================
 */

// Un manager poate avea mai mulți executanți
User.hasMany(User, { as: 'Subordinates', foreignKey: 'managerId' });
User.belongsTo(User, { as: 'Manager', foreignKey: 'managerId' });

// Un task este creat de un manager și poate fi asignat unui executant
Task.belongsTo(User, { as: 'Assignee', foreignKey: 'assignedTo' });
Task.belongsTo(User, { as: 'Creator', foreignKey: 'createdBy' });

/**
 * =====================================================
 * AUTHENTICATION & AUTHORIZATION
 * =====================================================
 */

/**
 * Middleware de autentificare JWT
 * -----------------------------------------------------
 * Verifică existența și validitatea token-ului
 */
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

/**
 * Middleware de autorizare pe roluri
 * -----------------------------------------------------
 * Restricționează accesul în funcție de rolul utilizatorului
 */
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Unauthorized role' });
  }
  next();
};

/**
 * =====================================================
 * ROUTES – AUTH
 * =====================================================
 */

/**
 * Creare utilizatori (ADMIN)
 * -----------------------------------------------------
 * Cerință:
 * - Administratorul poate crea manageri și executanți
 */
app.post('/api/auth/register',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    const { email, password, name, role, managerId } = req.body;

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hash,
      name,
      role,
      managerId: role === 'executant' ? managerId : null
    });

    res.status(201).json({ message: 'User created', user });
  }
);

/**
 * Login utilizator
 * -----------------------------------------------------
 * Returnează JWT + informații utilizator
 */
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user });
});

/**
 * =====================================================
 * ROUTES – TASKS
 * =====================================================
 */

/**
 * Creare task (MANAGER)
 * -----------------------------------------------------
 * Cerință:
 * - Managerul creează task-uri (status OPEN)
 */
app.post('/api/tasks',
  authenticateToken,
  authorizeRoles('manager'),
  async (req, res) => {
    const task = await Task.create({
      title: req.body.title,
      description: req.body.description,
      createdBy: req.user.id
    });
    res.status(201).json(task);
  }
);

/**
 * Alocare task (MANAGER → EXECUTANT)
 * -----------------------------------------------------
 * Cerință:
 * - Task-ul devine PENDING
 */
app.patch('/api/tasks/:id/assign',
  authenticateToken,
  authorizeRoles('manager'),
  async (req, res) => {
    const task = await Task.findByPk(req.params.id);
    task.assignedTo = req.body.assignedTo;
    task.status = 'PENDING';
    task.assignedAt = new Date();
    await task.save();
    res.json(task);
  }
);

/**
 * Finalizare task (EXECUTANT)
 * -----------------------------------------------------
 * Cerință:
 * - Task-ul devine COMPLETED
 */
app.patch('/api/tasks/:id/complete',
  authenticateToken,
  authorizeRoles('executant'),
  async (req, res) => {
    const task = await Task.findOne({
      where: { id: req.params.id, assignedTo: req.user.id }
    });
    task.status = 'COMPLETED';
    task.completedAt = new Date();
    await task.save();
    res.json(task);
  }
);

/**
 * Închidere task (MANAGER)
 * -----------------------------------------------------
 * Cerință:
 * - Managerul închide task-ul (CLOSED)
 */
app.patch('/api/tasks/:id/close',
  authenticateToken,
  authorizeRoles('manager'),
  async (req, res) => {
    const task = await Task.findByPk(req.params.id);
    task.status = 'CLOSED';
    task.closedAt = new Date();
    await task.save();
    res.json(task);
  }
);

/**
 * Listare task-uri
 * -----------------------------------------------------
 * Cerințe:
 * - Utilizatorul vede istoricul propriu
 * - Managerul vede task-urile create
 */
app.get('/api/tasks', authenticateToken, async (req, res) => {
  let where = {};
  if (req.user.role === 'executant') where.assignedTo = req.user.id;
  if (req.user.role === 'manager') where.createdBy = req.user.id;

  const tasks = await Task.findAll({ where });
  res.json(tasks);
});

/**
 * =====================================================
 * UTILITARE & ADMIN
 * =====================================================
 */

/**
 * Listare utilizatori
 * -----------------------------------------------------
 * Cerință:
 * - Managerul vede executanții săi
 * - Adminul vede toți utilizatorii
 */
app.get('/api/users',
  authenticateToken,
  authorizeRoles('admin', 'manager'),
  async (req, res) => {
    let where = {};
    if (req.user.role === 'manager') {
      where = { managerId: req.user.id };
    }
    const users = await User.findAll({ where });
    res.json(users);
  }
);

/**
 * Endpoint de health-check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

/**
 * =====================================================
 * SERVER START
 * =====================================================
 * - Sincronizează baza de date
 * - Creează un admin implicit dacă nu există
 */
async function start() {
  await sequelize.sync();

  const adminExists = await User.findOne({ where: { role: 'admin' } });
  if (!adminExists) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({
      email: 'admin@test.com',
      password: hash,
      name: 'Admin',
      role: 'admin'
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
