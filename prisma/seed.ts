import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create service-admin role
  const serviceAdminRole = await prisma.role.upsert({
    where: { name: 'service-admin' },
    update: {},
    create: {
      name: 'service-admin',
    },
  });
  console.log('Created role:', serviceAdminRole.name);

  // Create permissions
  const getUserPermission = await prisma.permission.upsert({
    where: { name: 'user:get' },
    update: {},
    create: {
      name: 'user:get',
      description: 'Permission to get user details',
    },
  });
  console.log('Created permission:', getUserPermission.name);

  const createUserPermission = await prisma.permission.upsert({
    where: { name: 'user:create' },
    update: {},
    create: {
      name: 'user:create',
      description: 'Permission to create users',
    },
  });
  console.log('Created permission:', createUserPermission.name);

  const updateUserPermission = await prisma.permission.upsert({
    where: { name: 'user:update' },
    update: {},
    create: {
      name: 'user:update',
      description: 'Permission to update users',
    },
  });
  console.log('Created permission:', updateUserPermission.name);

  const deleteUserPermission = await prisma.permission.upsert({
    where: { name: 'user:delete' },
    update: {},
    create: {
      name: 'user:delete',
      description: 'Permission to delete users',
    },
  });
  console.log('Created permission:', deleteUserPermission.name);

  const listUsersPermission = await prisma.permission.upsert({
    where: { name: 'user:list' },
    update: {},
    create: {
      name: 'user:list',
      description: 'Permission to list users',
    },
  });
  console.log('Created permission:', listUsersPermission.name);

  // Assign permissions to service-admin role
  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: serviceAdminRole.id,
        permissionId: getUserPermission.id,
      },
    },
    update: {},
    create: {
      roleId: serviceAdminRole.id,
      permissionId: getUserPermission.id,
    },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: serviceAdminRole.id,
        permissionId: createUserPermission.id,
      },
    },
    update: {},
    create: {
      roleId: serviceAdminRole.id,
      permissionId: createUserPermission.id,
    },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: serviceAdminRole.id,
        permissionId: updateUserPermission.id,
      },
    },
    update: {},
    create: {
      roleId: serviceAdminRole.id,
      permissionId: updateUserPermission.id,
    },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: serviceAdminRole.id,
        permissionId: deleteUserPermission.id,
      },
    },
    update: {},
    create: {
      roleId: serviceAdminRole.id,
      permissionId: deleteUserPermission.id,
    },
  });

  await prisma.rolePermission.upsert({
    where: {
      roleId_permissionId: {
        roleId: serviceAdminRole.id,
        permissionId: listUsersPermission.id,
      },
    },
    update: {},
    create: {
      roleId: serviceAdminRole.id,
      permissionId: listUsersPermission.id,
    },
  });

  console.log('Assigned permissions to service-admin role');

  // Create api-rest-service
  const apiRestService = await prisma.service.upsert({
    where: { name: 'api-rest-service' },
    update: {},
    create: {
      name: 'api-rest-service',
      roleId: serviceAdminRole.id,
    },
  });
  console.log('Created service:', apiRestService.name);

  // Create service role mapping
  await prisma.serviceRole.upsert({
    where: {
      serviceId_roleId: {
        serviceId: apiRestService.id,
        roleId: serviceAdminRole.id,
      },
    },
    update: {},
    create: {
      serviceId: apiRestService.id,
      roleId: serviceAdminRole.id,
    },
  });
  console.log('Assigned service-admin role to api-rest-service');

  // Create Alice user
  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      name: 'Alice',
      email: 'alice@example.com',
      role: 'user',
    },
  });
  console.log('Created user:', alice.name);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
