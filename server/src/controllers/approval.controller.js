const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/error.middleware');

const approveExpense = async (req, res) => {
  const { comment } = req.body;
  const expense = await prisma.expense.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId, status: 'PENDING' },
    include: {
      workflow: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
      approvalRecords: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!expense) throw new AppError('Expense not found or not pending', 404);

  // Find the pending approval record for this approver's role
  const currentStep = expense.workflow?.steps.find(s => s.stepOrder === expense.currentStepOrder);
  if (!currentStep) throw new AppError('No current approval step found', 400);

  const canApprove =
    currentStep.approverRole === req.user.role ||
    currentStep.specificUserId === req.user.id;

  if (!canApprove) throw new AppError('You are not authorized to approve this expense at the current step', 403);

  // Find the pending approval record for this step
  const pendingRecord = expense.approvalRecords.find(
    r => r.stepId === currentStep.id && r.action === 'PENDING'
  );
  if (!pendingRecord) throw new AppError('No pending approval record found for this step', 400);

  await prisma.$transaction(async (tx) => {
    // Update current approval record
    await tx.approvalRecord.update({
      where: { id: pendingRecord.id },
      data: { action: 'APPROVED', approverId: req.user.id, comment: comment || null },
    });

    // Check if there is a next step
    const nextStep = expense.workflow?.steps.find(s => s.stepOrder === expense.currentStepOrder + 1);
    if (nextStep) {
      // Create next approval record and advance step
      await tx.approvalRecord.create({
        data: { expenseId: expense.id, stepId: nextStep.id, action: 'PENDING' },
      });
      await tx.expense.update({
        where: { id: expense.id },
        data: { currentStepOrder: expense.currentStepOrder + 1 },
      });
    } else {
      // Final step — mark as approved
      await tx.expense.update({
        where: { id: expense.id },
        data: { status: 'APPROVED' },
      });
    }
  });

  const updated = await prisma.expense.findUnique({
    where: { id: expense.id },
    include: {
      approvalRecords: { include: { step: true, approver: { select: { id: true, name: true } } } },
    },
  });
  res.json(updated);
};

const rejectExpense = async (req, res) => {
  const { comment } = req.body;
  const expense = await prisma.expense.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId, status: 'PENDING' },
    include: {
      workflow: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
      approvalRecords: true,
    },
  });
  if (!expense) throw new AppError('Expense not found or not pending', 404);

  const currentStep = expense.workflow?.steps.find(s => s.stepOrder === expense.currentStepOrder);
  if (!currentStep) throw new AppError('No current step found', 400);

  const canReject =
    currentStep.approverRole === req.user.role ||
    currentStep.specificUserId === req.user.id ||
    req.user.role === 'ADMIN';

  if (!canReject) throw new AppError('You are not authorized to reject this expense', 403);

  const pendingRecord = expense.approvalRecords.find(
    r => r.stepId === currentStep.id && r.action === 'PENDING'
  );

  await prisma.$transaction(async (tx) => {
    if (pendingRecord) {
      await tx.approvalRecord.update({
        where: { id: pendingRecord.id },
        data: { action: 'REJECTED', approverId: req.user.id, comment: comment || null },
      });
    }
    await tx.expense.update({
      where: { id: expense.id },
      data: { status: 'REJECTED' },
    });
  });

  res.json({ message: 'Expense rejected' });
};

const getApprovalHistory = async (req, res) => {
  const expense = await prisma.expense.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId },
    include: {
      approvalRecords: {
        orderBy: { createdAt: 'asc' },
        include: {
          step: true,
          approver: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!expense) throw new AppError('Expense not found', 404);
  res.json(expense.approvalRecords);
};

module.exports = { approveExpense, rejectExpense, getApprovalHistory };
