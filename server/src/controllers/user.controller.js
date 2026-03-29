const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/error.middleware');

const getAllUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    where: { companyId: req.user.companyId },
    select: {
      id: true, name: true, email: true, role: true, managerId: true, createdAt: true,
      manager: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
};

const getUserById = async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId },
    select: {
      id: true, name: true, email: true, role: true, managerId: true, createdAt: true,
      manager: { select: { id: true, name: true } },
      subordinates: { select: { id: true, name: true, role: true } },
    },
  });
  if (!user) throw new AppError('User not found', 404);
  res.json(user);
};

const createUser = async (req, res) => {
  const { name, email, password, role, managerId } = req.body;
  if (!name || !email || !password || !role) {
    throw new AppError('name, email, password and role are required', 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already in use', 409);

  if (managerId) {
    const mgr = await prisma.user.findFirst({
      where: { id: managerId, companyId: req.user.companyId },
    });
    if (!mgr) throw new AppError('Manager not found', 404);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      companyId: req.user.companyId,
      name, email, passwordHash,
      role: role.toUpperCase(),
      managerId: managerId || null,
    },
    select: { id: true, name: true, email: true, role: true, managerId: true, createdAt: true },
  });
  res.status(201).json(user);
};

const updateUser = async (req, res) => {
  const { name, role, managerId } = req.body;
  const user = await prisma.user.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId },
  });
  if (!user) throw new AppError('User not found', 404);

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(role && { role: role.toUpperCase() }),
      ...(managerId !== undefined && { managerId: managerId || null }),
    },
    select: { id: true, name: true, email: true, role: true, managerId: true },
  });
  res.json(updated);
};

const deleteUser = async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId },
  });
  if (!user) throw new AppError('User not found', 404);
  if (user.id === req.user.id) throw new AppError('Cannot delete your own account', 400);

  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'User deleted' });
};

const getTeam = async (req, res) => {
  const subordinates = await prisma.user.findMany({
    where: { managerId: req.user.id },
    select: { id: true, name: true, email: true, role: true },
  });
  res.json(subordinates);
};

const updateProfile = async (req, res) => {
  const { name } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { ...(name && { name }) },
    select: { id: true, name: true, email: true, role: true },
  });
  res.json(user);
};

const getManagers = async (req, res) => {
  const managers = await prisma.user.findMany({
    where: {
      companyId: req.user.companyId,
      role: { in: ['MANAGER', 'ADMIN'] },
    },
    select: { id: true, name: true, email: true, role: true },
  });
  res.json(managers);
};

module.exports = { getAllUsers, getUserById, createUser, updateUser, deleteUser, getTeam, updateProfile, getManagers };
