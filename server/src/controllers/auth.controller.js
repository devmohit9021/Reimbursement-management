const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/error.middleware');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  const { name, email, password, companyName, country, defaultCurrency } = req.body;

  if (!name || !email || !password || !companyName || !country) {
    throw new AppError('All fields are required', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, 12);

  // Create company + admin user + default workflow in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: companyName,
        country,
        defaultCurrency: defaultCurrency || 'USD',
      },
    });

    const user = await tx.user.create({
      data: {
        companyId: company.id,
        name,
        email,
        passwordHash,
        role: 'ADMIN',
      },
    });

    // Create a default 1-step approval workflow
    const workflow = await tx.approvalWorkflow.create({
      data: {
        companyId: company.id,
        name: 'Default Approval',
        description: 'Single-level manager approval',
        isDefault: true,
        steps: {
          create: {
            stepOrder: 1,
            name: 'Manager Approval',
            approverRole: 'MANAGER',
          },
        },
      },
    });

    return { company, user, workflow };
  });

  const { accessToken, refreshToken } = generateTokens(result.user.id);

  res.status(201).json({
    message: 'Company and admin account created successfully',
    accessToken,
    refreshToken,
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      companyId: result.company.id,
      companyName: result.company.name,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: { select: { id: true, name: true, defaultCurrency: true } } },
  });
  if (!user) throw new AppError('Invalid email or password', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid email or password', 401);

  const { accessToken, refreshToken } = generateTokens(user.id);

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
      defaultCurrency: user.company.defaultCurrency,
    },
  });
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required', 400);

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) throw new AppError('User not found', 401);

  const tokens = generateTokens(user.id);
  res.json(tokens);
};

const me = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { company: { select: { id: true, name: true, defaultCurrency: true, country: true } } },
  });
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    companyName: user.company.name,
    defaultCurrency: user.company.defaultCurrency,
    country: user.company.country,
  });
};

module.exports = { register, login, refresh, me };
