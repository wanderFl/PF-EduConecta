const { PrismaClient } = require('../generated/prisma');
(async () => {
  const prisma = new PrismaClient();
  const u = await prisma.user.findUnique({ where: { email: 'testdocente@example.com' } });
  if (!u) return console.error('User not found');
  console.log('USER_ID::', u.id);
  process.exit(0);
})();