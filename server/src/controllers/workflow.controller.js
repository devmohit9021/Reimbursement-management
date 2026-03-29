const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/error.middleware');

const getWorkflows = async (req, res) => {
  const workflows = await prisma.approvalWorkflow.findMany({
    where: { companyId: req.user.companyId },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(workflows);
};

const getWorkflowById = async (req, res) => {
  const workflow = await prisma.approvalWorkflow.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });
  if (!workflow) throw new AppError('Workflow not found', 404);
  res.json(workflow);
};

const createWorkflow = async (req, res) => {
  const { name, description, isDefault, steps } = req.body;
  if (!name || !steps || !Array.isArray(steps) || steps.length === 0) {
    throw new AppError('name and at least one step are required', 400);
  }

  if (isDefault) {
    await prisma.approvalWorkflow.updateMany({
      where: { companyId: req.user.companyId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const workflow = await prisma.approvalWorkflow.create({
    data: {
      companyId: req.user.companyId,
      name, description, isDefault: isDefault || false,
      steps: {
        create: steps.map((s, i) => ({
          stepOrder: i + 1,
          name: s.name,
          approverRole: s.approverRole.toUpperCase(),
          specificUserId: s.specificUserId || null,
        })),
      },
    },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });
  res.status(201).json(workflow);
};

const updateWorkflow = async (req, res) => {
  const { name, description, isDefault, steps } = req.body;
  const workflow = await prisma.approvalWorkflow.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId },
  });
  if (!workflow) throw new AppError('Workflow not found', 404);

  if (isDefault) {
    await prisma.approvalWorkflow.updateMany({
      where: { companyId: req.user.companyId, isDefault: true },
      data: { isDefault: false },
    });
  }

  await prisma.$transaction(async (tx) => {
    if (steps) {
      await tx.workflowStep.deleteMany({ where: { workflowId: req.params.id } });
      await tx.workflowStep.createMany({
        data: steps.map((s, i) => ({
          workflowId: req.params.id,
          stepOrder: i + 1,
          name: s.name,
          approverRole: s.approverRole.toUpperCase(),
          specificUserId: s.specificUserId || null,
        })),
      });
    }
    await tx.approvalWorkflow.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });
  });

  const updated = await prisma.approvalWorkflow.findUnique({
    where: { id: req.params.id },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });
  res.json(updated);
};

const deleteWorkflow = async (req, res) => {
  const workflow = await prisma.approvalWorkflow.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId },
  });
  if (!workflow) throw new AppError('Workflow not found', 404);
  if (workflow.isDefault) throw new AppError('Cannot delete the default workflow', 400);
  await prisma.approvalWorkflow.delete({ where: { id: req.params.id } });
  res.json({ message: 'Workflow deleted' });
};

const setDefault = async (req, res) => {
  const workflow = await prisma.approvalWorkflow.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId },
  });
  if (!workflow) throw new AppError('Workflow not found', 404);

  await prisma.approvalWorkflow.updateMany({
    where: { companyId: req.user.companyId },
    data: { isDefault: false },
  });
  await prisma.approvalWorkflow.update({
    where: { id: req.params.id },
    data: { isDefault: true },
  });
  res.json({ message: 'Default workflow updated' });
};

module.exports = { getWorkflows, getWorkflowById, createWorkflow, updateWorkflow, deleteWorkflow, setDefault };
