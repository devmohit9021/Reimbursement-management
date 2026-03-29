const prisma = require('../lib/prisma');

const getSummary = async (req, res) => {
  const companyId = req.user.companyId;

  const [total, pending, approved, rejected, paid, totalAmount] = await Promise.all([
    prisma.expense.count({ where: { companyId } }),
    prisma.expense.count({ where: { companyId, status: 'PENDING' } }),
    prisma.expense.count({ where: { companyId, status: 'APPROVED' } }),
    prisma.expense.count({ where: { companyId, status: 'REJECTED' } }),
    prisma.expense.count({ where: { companyId, status: 'PAID' } }),
    prisma.expense.aggregate({ where: { companyId, status: { in: ['APPROVED', 'PAID'] } }, _sum: { convertedAmount: true } }),
  ]);

  // Pending for this approver
  let pendingForMe = 0;
  if (req.user.role !== 'EMPLOYEE') {
    const steps = await prisma.workflowStep.findMany({
      where: { approverRole: req.user.role, workflow: { companyId } },
      select: { id: true },
    });
    pendingForMe = await prisma.expense.count({
      where: {
        companyId, status: 'PENDING',
        approvalRecords: { some: { stepId: { in: steps.map(s => s.id) }, action: 'PENDING' } },
      },
    });
  }

  res.json({
    total, pending, approved, rejected, paid,
    totalApprovedAmount: totalAmount._sum.convertedAmount || 0,
    pendingForMe,
  });
};

const getByCategory = async (req, res) => {
  const companyId = req.user.companyId;
  const result = await prisma.expense.groupBy({
    by: ['category'],
    where: { companyId },
    _count: { id: true },
    _sum: { convertedAmount: true },
  });
  res.json(result.map(r => ({
    category: r.category,
    count: r._count.id,
    total: r._sum.convertedAmount || 0,
  })));
};

const getByStatus = async (req, res) => {
  const companyId = req.user.companyId;
  const result = await prisma.expense.groupBy({
    by: ['status'],
    where: { companyId },
    _count: { id: true },
    _sum: { convertedAmount: true },
  });
  res.json(result.map(r => ({
    status: r.status,
    count: r._count.id,
    total: r._sum.convertedAmount || 0,
  })));
};

const getTrends = async (req, res) => {
  const companyId = req.user.companyId;
  // Last 6 months of expense data grouped by month
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const expenses = await prisma.expense.findMany({
    where: { companyId, createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true, convertedAmount: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  const monthlyMap = {};
  expenses.forEach(e => {
    const key = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyMap[key]) monthlyMap[key] = { month: key, submitted: 0, approved: 0, amount: 0 };
    monthlyMap[key].submitted++;
    if (e.status === 'APPROVED' || e.status === 'PAID') {
      monthlyMap[key].approved++;
      monthlyMap[key].amount += parseFloat(e.convertedAmount || 0);
    }
  });

  res.json(Object.values(monthlyMap));
};

const getTopExpenses = async (req, res) => {
  const companyId = req.user.companyId;
  const expenses = await prisma.expense.findMany({
    where: { companyId },
    orderBy: { convertedAmount: 'desc' },
    take: 10,
    include: { user: { select: { id: true, name: true } } },
  });
  res.json(expenses);
};

module.exports = { getSummary, getByCategory, getByStatus, getTrends, getTopExpenses };
