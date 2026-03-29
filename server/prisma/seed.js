require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create company
  const company = await prisma.company.upsert({
    where: { id: 'demo-company' },
    update: {},
    create: {
      id: 'demo-company',
      name: 'Acme Corporation',
      country: 'India',
      defaultCurrency: 'INR',
    },
  });

  const hash = await bcrypt.hash('password123', 12);

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Alice Admin',
      email: 'admin@acme.com',
      passwordHash: hash,
      role: 'ADMIN',
    },
  });

  // Create Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@acme.com' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Bob Manager',
      email: 'manager@acme.com',
      passwordHash: hash,
      role: 'MANAGER',
      managerId: admin.id,
    },
  });

  // Create Employee
  const employee = await prisma.user.upsert({
    where: { email: 'employee@acme.com' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Carol Employee',
      email: 'employee@acme.com',
      passwordHash: hash,
      role: 'EMPLOYEE',
      managerId: manager.id,
    },
  });

  // Create workflows
  const existing = await prisma.approvalWorkflow.findFirst({ where: { companyId: company.id } });
  if (!existing) {
    const workflow = await prisma.approvalWorkflow.create({
      data: {
        companyId: company.id,
        name: 'Standard Approval',
        description: 'Manager → Admin two-step approval',
        isDefault: true,
        steps: {
          create: [
            { stepOrder: 1, name: 'Manager Review', approverRole: 'MANAGER' },
            { stepOrder: 2, name: 'Admin Final Approval', approverRole: 'ADMIN' },
          ],
        },
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    // Sample expenses
    const categories = ['Travel', 'Food & Dining', 'Office Supplies', 'Equipment', 'Software'];
    const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'PAID'];

    for (let i = 0; i < 12; i++) {
      const status = statuses[i % 4];
      const expense = await prisma.expense.create({
        data: {
          companyId: company.id,
          userId: employee.id,
          title: `${categories[i % 5]} Expense #${i + 1}`,
          description: `Sample description for expense ${i + 1}`,
          amount: (50 + i * 30) * 83, // INR
          currency: 'INR',
          convertedAmount: (50 + i * 30) * 83,
          category: categories[i % 5],
          expenseDate: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000),
          status,
          workflowId: workflow.id,
          currentStepOrder: status === 'PENDING' ? 1 : 2,
        },
      });

      if (status === 'PENDING') {
        await prisma.approvalRecord.create({
          data: { expenseId: expense.id, stepId: workflow.steps[0].id, action: 'PENDING' },
        });
      } else if (status === 'APPROVED' || status === 'PAID') {
        await prisma.approvalRecord.createMany({
          data: [
            { expenseId: expense.id, stepId: workflow.steps[0].id, action: 'APPROVED', approverId: manager.id, comment: 'Looks good' },
            { expenseId: expense.id, stepId: workflow.steps[1].id, action: 'APPROVED', approverId: admin.id, comment: 'Approved' },
          ],
        });
      } else if (status === 'REJECTED') {
        await prisma.approvalRecord.create({
          data: { expenseId: expense.id, stepId: workflow.steps[0].id, action: 'REJECTED', approverId: manager.id, comment: 'Missing receipt' },
        });
      }
    }
  }

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Demo accounts (password: password123):');
  console.log('  Admin:    admin@acme.com');
  console.log('  Manager:  manager@acme.com');
  console.log('  Employee: employee@acme.com');
}

main().catch(console.error).finally(() => prisma.$disconnect());
