const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/error.middleware');

const getRules = async (req, res) => {
  const rules = await prisma.rule.findMany({
    where: { companyId: req.user.companyId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(rules);
};

const createRule = async (req, res) => {
  const { name, description, type, config } = req.body;
  if (!name || !type || !config) throw new AppError('name, type, and config are required', 400);
  const validTypes = ['PERCENTAGE', 'SPECIFIC', 'HYBRID'];
  if (!validTypes.includes(type.toUpperCase())) {
    throw new AppError(`type must be one of: ${validTypes.join(', ')}`, 400);
  }
  const rule = await prisma.rule.create({
    data: {
      companyId: req.user.companyId,
      name, description,
      type: type.toUpperCase(),
      config,
    },
  });
  res.status(201).json(rule);
};

const updateRule = async (req, res) => {
  const rule = await prisma.rule.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId },
  });
  if (!rule) throw new AppError('Rule not found', 404);
  const { name, description, type, config, isActive } = req.body;
  const updated = await prisma.rule.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(type && { type: type.toUpperCase() }),
      ...(config && { config }),
      ...(isActive !== undefined && { isActive }),
    },
  });
  res.json(updated);
};

const deleteRule = async (req, res) => {
  const rule = await prisma.rule.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId },
  });
  if (!rule) throw new AppError('Rule not found', 404);
  await prisma.rule.delete({ where: { id: req.params.id } });
  res.json({ message: 'Rule deleted' });
};

module.exports = { getRules, createRule, updateRule, deleteRule };
