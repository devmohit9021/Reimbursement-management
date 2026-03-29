const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/error.middleware');
const { convertCurrency } = require('../utils/currency.util');

const EXPENSE_CATEGORIES = ['Travel', 'Food & Dining', 'Accommodation', 'Office Supplies', 'Equipment', 'Software', 'Training', 'Medical', 'Entertainment', 'Other'];

const createExpense = async (req, res) => {
  const { title, description, amount, currency, category, expenseDate } = req.body;

  if (!title || !amount || !currency || !category || !expenseDate) {
    throw new AppError('title, amount, currency, category and expenseDate are required', 400);
  }
  if (parseFloat(amount) <= 0) throw new AppError('Amount must be greater than 0', 400);

  // Find default workflow for company
  const workflow = await prisma.approvalWorkflow.findFirst({
    where: { companyId: req.user.companyId, isDefault: true },
    include: { steps: { orderBy: { stepOrder: 'asc' } } },
  });

  // Get company default currency for conversion
  const company = await prisma.company.findUnique({ where: { id: req.user.companyId } });
  let convertedAmount = null;
  if (currency !== company.defaultCurrency) {
    convertedAmount = await convertCurrency(parseFloat(amount), currency, company.defaultCurrency);
  } else {
    convertedAmount = parseFloat(amount);
  }

  const receiptUrl = req.file ? `/uploads/${req.file.filename}` : null;
  let ocrData = null;
  if (req.body.ocrData) {
    try { ocrData = JSON.parse(req.body.ocrData); } catch (_) {}
  }

  const expense = await prisma.$transaction(async (tx) => {
    const exp = await tx.expense.create({
      data: {
        companyId: req.user.companyId,
        userId: req.user.id,
        title,
        description,
        amount: parseFloat(amount),
        currency,
        convertedAmount,
        category,
        expenseDate: new Date(expenseDate),
        receiptUrl,
        ocrData,
        status: 'PENDING',
        workflowId: workflow?.id || null,
        currentStepOrder: 1,
      },
    });

    // Create first approval record if workflow exists
    if (workflow && workflow.steps.length > 0) {
      await tx.approvalRecord.create({
        data: {
          expenseId: exp.id,
          stepId: workflow.steps[0].id,
          action: 'PENDING',
        },
      });
    }

    return exp;
  });

  const fullExpense = await prisma.expense.findUnique({
    where: { id: expense.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      approvalRecords: { include: { step: true, approver: { select: { id: true, name: true } } } },
    },
  });
  res.status(201).json(fullExpense);
};

const getExpenses = async (req, res) => {
  const { status, category, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  let where = { companyId: req.user.companyId };
  if (req.user.role === 'EMPLOYEE') where.userId = req.user.id;
  if (req.user.role === 'MANAGER') {
    const teamIds = (await prisma.user.findMany({
      where: { managerId: req.user.id },
      select: { id: true },
    })).map(u => u.id);
    where.userId = { in: [req.user.id, ...teamIds] };
  }
  if (status) where.status = status.toUpperCase();
  if (category) where.category = category;

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        approvalRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { approver: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.expense.count({ where }),
  ]);

  res.json({ expenses, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
};

const getExpenseById = async (req, res) => {
  const expense = await prisma.expense.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      workflow: { include: { steps: { orderBy: { stepOrder: 'asc' } } } },
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
  res.json(expense);
};

const updateExpenseStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['PAID'];
  if (!allowed.includes(status?.toUpperCase())) {
    throw new AppError('Only PAID status can be set via this endpoint', 400);
  }
  const expense = await prisma.expense.findFirst({
    where: { id: req.params.id, companyId: req.user.companyId, status: 'APPROVED' },
  });
  if (!expense) throw new AppError('Expense not found or not yet approved', 404);

  const updated = await prisma.expense.update({
    where: { id: req.params.id },
    data: { status: 'PAID' },
  });
  res.json(updated);
};

const deleteExpense = async (req, res) => {
  const expense = await prisma.expense.findFirst({
    where: { id: req.params.id, userId: req.user.id, status: 'DRAFT' },
  });
  if (!expense) throw new AppError('Expense not found or cannot be deleted', 404);
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.json({ message: 'Expense deleted' });
};

const getPendingForApprover = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Find workflow steps matching approver's role
  const steps = await prisma.workflowStep.findMany({
    where: {
      approverRole: req.user.role,
      workflow: { companyId: req.user.companyId },
    },
    select: { id: true },
  });
  const stepIds = steps.map(s => s.id);

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where: {
        companyId: req.user.companyId,
        status: 'PENDING',
        approvalRecords: {
          some: { stepId: { in: stepIds }, action: 'PENDING' },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        approvalRecords: {
          include: { step: true, approver: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.expense.count({
      where: {
        companyId: req.user.companyId,
        status: 'PENDING',
        approvalRecords: { some: { stepId: { in: stepIds }, action: 'PENDING' } },
      },
    }),
  ]);
  res.json({ expenses, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
};

module.exports = { createExpense, getExpenses, getExpenseById, updateExpenseStatus, deleteExpense, getPendingForApprover };
