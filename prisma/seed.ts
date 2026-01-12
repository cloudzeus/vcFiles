import { PrismaClient, UserRole } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample departments with hierarchy and emails
  const departments = [
    { 
      name: 'Engineering', 
      description: 'Software development and IT',
      email: 'engineering@company.com',
      parentId: null
    },
    { 
      name: 'Marketing', 
      description: 'Brand and product marketing',
      email: 'marketing@company.com',
      parentId: null
    },
    { 
      name: 'Sales', 
      description: 'Customer acquisition and sales',
      email: 'sales@company.com',
      parentId: null
    },
    { 
      name: 'HR', 
      description: 'Human resources and recruitment',
      email: 'hr@company.com',
      parentId: null
    },
    { 
      name: 'Finance', 
      description: 'Financial planning and accounting',
      email: 'finance@company.com',
      parentId: null
    },
    { 
      name: 'Operations', 
      description: 'Business operations and support',
      email: 'operations@company.com',
      parentId: null
    },
    // Sub-departments
    { 
      name: 'Frontend Development', 
      description: 'Frontend web development team',
      email: 'frontend@company.com',
      parentId: null // Will be set after Engineering is created
    },
    { 
      name: 'Backend Development', 
      description: 'Backend API and services team',
      email: 'backend@company.com',
      parentId: null // Will be set after Engineering is created
    },
    { 
      name: 'Digital Marketing', 
      description: 'Online marketing and social media',
      email: 'digital@company.com',
      parentId: null // Will be set after Marketing is created
    },
  ];

  console.log('📁 Creating departments...');
  const createdDepartments: any[] = [];
  
  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: {
        name: dept.name,
        description: dept.description,
        email: dept.email,
      },
    });
    createdDepartments.push(created);
  }

  // Set parent-child relationships
  const engineering = createdDepartments.find(d => d.name === 'Engineering');
  const marketing = createdDepartments.find(d => d.name === 'Marketing');
  const frontend = createdDepartments.find(d => d.name === 'Frontend Development');
  const backend = createdDepartments.find(d => d.name === 'Backend Development');
  const digital = createdDepartments.find(d => d.name === 'Digital Marketing');

  if (engineering && frontend) {
    await prisma.department.update({
      where: { id: frontend.id },
      data: { parentId: engineering.id }
    });
  }

  if (engineering && backend) {
    await prisma.department.update({
      where: { id: backend.id },
      data: { parentId: engineering.id }
    });
  }

  if (marketing && digital) {
    await prisma.department.update({
      where: { id: digital.id },
      data: { parentId: marketing.id }
    });
  }

  // Create admin user first
  console.log('👤 Creating admin user...');
  const adminPassword = await bcrypt.hash('1f1femsk', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'gkozyris@i4ria.com' },
    update: {
      password: adminPassword,
      role: 'ADMINISTRATOR' as UserRole,
    },
    create: {
      email: 'gkozyris@i4ria.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMINISTRATOR' as UserRole,
    },
  });
  console.log('✅ Admin user created/updated:', adminUser.email);

  // Create sample users if they don't exist
  const users = [
    { 
      email: 'admin@example.com', 
      password: 'hashed_password_here', 
      name: 'Admin User', 
      role: 'ADMINISTRATOR' as UserRole,
      phone: '+1-555-0100',
      mobile: '+1-555-0101',
      extension: '100',
      address: '123 Main Street',
      city: 'New York',
      zip: '10001',
      country: 'USA'
    },
    { 
      email: 'engineering.manager@company.com', 
      password: 'hashed_password_here', 
      name: 'Engineering Manager', 
      role: 'MANAGER' as UserRole,
      phone: '+1-555-0200',
      mobile: '+1-555-0201',
      extension: '200',
      address: '456 Tech Avenue',
      city: 'San Francisco',
      zip: '94102',
      country: 'USA'
    },
    { 
      email: 'marketing.manager@company.com', 
      password: 'hashed_password_here', 
      name: 'Marketing Manager', 
      role: 'MANAGER' as UserRole,
      phone: '+1-555-0300',
      mobile: '+1-555-0301',
      extension: '300',
      address: '789 Marketing Blvd',
      city: 'Los Angeles',
      zip: '90210',
      country: 'USA'
    },
    { 
      email: 'frontend.lead@company.com', 
      password: 'hashed_password_here', 
      name: 'Frontend Lead', 
      role: 'EMPLOYEE' as UserRole,
      phone: '+1-555-0400',
      mobile: '+1-555-0401',
      extension: '400',
      address: '321 Frontend Street',
      city: 'Austin',
      zip: '73301',
      country: 'USA'
    },
    { 
      email: 'backend.lead@company.com', 
      password: 'hashed_password_here', 
      name: 'Backend Lead', 
      role: 'EMPLOYEE' as UserRole,
      phone: '+1-555-0500',
      mobile: '+1-555-0501',
      extension: '500',
      address: '654 Backend Road',
      city: 'Seattle',
      zip: '98101',
      country: 'USA'
    },
    { 
      email: 'senior.dev@company.com', 
      password: 'hashed_password_here', 
      name: 'Senior Developer', 
      role: 'EMPLOYEE' as UserRole,
      phone: '+1-555-0600',
      mobile: '+1-555-0601',
      extension: '600',
      address: '987 Developer Lane',
      city: 'Boston',
      zip: '02101',
      country: 'USA'
    },
    { 
      email: 'junior.dev@company.com', 
      password: 'hashed_password_here', 
      name: 'Junior Developer', 
      role: 'EMPLOYEE' as UserRole,
      phone: '+1-555-0700',
      mobile: '+1-555-0701',
      extension: '700',
      address: '147 Junior Court',
      city: 'Denver',
      zip: '80201',
      country: 'USA'
    },
    { 
      email: 'marketing.specialist@company.com', 
      password: 'hashed_password_here', 
      name: 'Marketing Specialist', 
      role: 'EMPLOYEE' as UserRole,
      phone: '+1-555-0800',
      mobile: '+1-555-0801',
      extension: '800',
      address: '258 Marketing Way',
      city: 'Chicago',
      zip: '60601',
      country: 'USA'
    },
  ];

  console.log('👥 Creating users...');
  const createdUsers: any[] = [adminUser]; // Start with admin user
  
  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    createdUsers.push(created);
  }

  // Set department managers
  const engineeringManager = createdUsers.find(u => u.email === 'engineering.manager@company.com');
  const marketingManager = createdUsers.find(u => u.email === 'marketing.manager@company.com');

  if (engineering && engineeringManager) {
    await prisma.department.update({
      where: { id: engineering.id },
      data: { managerId: engineeringManager.id }
    });
  }

  if (marketing && marketingManager) {
    await prisma.department.update({
      where: { id: marketing.id },
      data: { managerId: marketingManager.id }
    });
  }

  // Create user-department relationships with job positions
  console.log('🔗 Creating user-department relationships...');
  
  // Create sample department roles
  console.log('🎭 Creating department roles...');
  
  // Engineering department roles
  if (engineering) {
    const engineeringRoles = [
      { name: 'Software Engineer', description: 'Full-stack software development', level: 2 },
      { name: 'Senior Software Engineer', description: 'Senior-level software development', level: 3 },
      { name: 'Junior Developer', description: 'Entry-level software development', level: 1 },
      { name: 'Team Lead', description: 'Technical team leadership', level: 4 },
      { name: 'Department Manager', description: 'Department management and strategy', level: 5 },
    ];
    
    for (const role of engineeringRoles) {
      await prisma.departmentRole.upsert({
        where: { departmentId_name: { departmentId: engineering.id, name: role.name } },
        update: {},
        create: {
          departmentId: engineering.id,
          name: role.name,
          description: role.description,
          level: role.level,
        },
      });
    }
  }

  // Marketing department roles
  if (marketing) {
    const marketingRoles = [
      { name: 'Marketing Specialist', description: 'General marketing activities', level: 2 },
      { name: 'Senior Marketing Specialist', description: 'Senior marketing activities', level: 3 },
      { name: 'Marketing Coordinator', description: 'Marketing coordination and support', level: 1 },
      { name: 'Team Lead', description: 'Marketing team leadership', level: 4 },
      { name: 'Department Manager', description: 'Department management and strategy', level: 5 },
    ];
    
    for (const role of marketingRoles) {
      await prisma.departmentRole.upsert({
        where: { departmentId_name: { departmentId: marketing.id, name: role.name } },
        update: {},
        create: {
          departmentId: marketing.id,
          name: role.name,
          description: role.description,
          level: role.level,
        },
      });
    }
  }

  // Frontend sub-department roles
  if (frontend) {
    const frontendRoles = [
      { name: 'Frontend Developer', description: 'Frontend web development', level: 2 },
      { name: 'Senior Frontend Developer', description: 'Senior frontend development', level: 3 },
      { name: 'Frontend Team Lead', description: 'Frontend team leadership', level: 4 },
    ];
    
    for (const role of frontendRoles) {
      await prisma.departmentRole.upsert({
        where: { departmentId_name: { departmentId: frontend.id, name: role.name } },
        update: {},
        create: {
          departmentId: frontend.id,
          name: role.name,
          description: role.description,
          level: role.level,
        },
      });
    }
  }

  // Backend sub-department roles
  if (backend) {
    const backendRoles = [
      { name: 'Backend Developer', description: 'Backend API development', level: 2 },
      { name: 'Senior Backend Developer', description: 'Senior backend development', level: 3 },
      { name: 'Backend Team Lead', description: 'Backend team leadership', level: 4 },
    ];
    
    for (const role of backendRoles) {
      await prisma.departmentRole.upsert({
        where: { departmentId_name: { departmentId: backend.id, name: role.name } },
        update: {},
        create: {
          departmentId: backend.id,
          name: role.name,
          description: role.description,
          level: role.level,
        },
      });
    }
  }

  // Sales department roles
  const sales = createdDepartments.find(d => d.name === 'Sales');
  if (sales) {
    const salesRoles = [
      { name: 'Sales Representative', description: 'Customer sales and relationship management', level: 2 },
      { name: 'Senior Sales Representative', description: 'Senior sales activities', level: 3 },
      { name: 'Sales Manager', description: 'Sales team management', level: 5 },
    ];
    
    for (const role of salesRoles) {
      await prisma.departmentRole.upsert({
        where: { departmentId_name: { departmentId: sales.id, name: role.name } },
        update: {},
        create: {
          departmentId: sales.id,
          name: role.name,
          description: role.description,
          level: role.level,
        },
      });
    }
  }

  // HR department roles
  const hr = createdDepartments.find(d => d.name === 'HR');
  if (hr) {
    const hrRoles = [
      { name: 'HR Specialist', description: 'Human resources activities', level: 2 },
      { name: 'Senior HR Specialist', description: 'Senior HR activities', level: 3 },
      { name: 'HR Manager', description: 'HR department management', level: 5 },
    ];
    
    for (const role of hrRoles) {
      await prisma.departmentRole.upsert({
        where: { departmentId_name: { departmentId: hr.id, name: role.name } },
        update: {},
        create: {
          departmentId: hr.id,
          name: role.name,
          description: role.description,
          level: role.level,
        },
      });
    }
  }

  // Finance department roles
  const finance = createdDepartments.find(d => d.name === 'Finance');
  if (finance) {
    const financeRoles = [
      { name: 'Financial Analyst', description: 'Financial analysis and reporting', level: 2 },
      { name: 'Senior Financial Analyst', description: 'Senior financial analysis', level: 3 },
      { name: 'Finance Manager', description: 'Finance department management', level: 5 },
    ];
    
    for (const role of financeRoles) {
      await prisma.departmentRole.upsert({
        where: { departmentId_name: { departmentId: finance.id, name: role.name } },
        update: {},
        create: {
          departmentId: finance.id,
          name: role.name,
          description: role.description,
          level: role.level,
        },
      });
    }
  }

  // Operations department roles
  const operations = createdDepartments.find(d => d.name === 'Operations');
  if (operations) {
    const operationsRoles = [
      { name: 'Operations Specialist', description: 'Business operations support', level: 2 },
      { name: 'Senior Operations Specialist', description: 'Senior operations activities', level: 3 },
      { name: 'Operations Manager', description: 'Operations department management', level: 5 },
    ];
    
    for (const role of operationsRoles) {
      await prisma.departmentRole.upsert({
        where: { departmentId_name: { departmentId: operations.id, name: role.name } },
        update: {},
        create: {
          departmentId: operations.id,
          name: role.name,
          description: role.description,
          level: role.level,
        },
      });
    }
  }

  // Engineering Manager - manages Engineering department
  if (engineering && engineeringManager) {
    await prisma.userDepartment.upsert({
      where: { 
        userId_departmentId_jobPosition: { 
          userId: engineeringManager.id, 
          departmentId: engineering.id, 
          jobPosition: 'Department Manager' 
        } 
      },
      update: { isManager: true },
      create: { 
        userId: engineeringManager.id, 
        departmentId: engineering.id, 
        jobPosition: 'Department Manager',
        isManager: true
      },
    });
  }

  // Marketing Manager - manages Marketing department
  if (marketing && marketingManager) {
    await prisma.userDepartment.upsert({
      where: { 
        userId_departmentId_jobPosition: { 
          userId: marketingManager.id, 
          departmentId: marketing.id, 
          jobPosition: 'Department Manager' 
        } 
      },
      update: { isManager: true },
      create: { 
        userId: marketingManager.id, 
        departmentId: marketing.id, 
        jobPosition: 'Department Manager',
        isManager: true
      },
    });
  }

  // Frontend Lead - manages Frontend sub-department and works in Engineering
  const frontendLead = createdUsers.find(u => u.email === 'frontend.lead@company.com');
  if (frontend && frontendLead && engineering) {
    // Lead role in Frontend sub-department
    await prisma.userDepartment.upsert({
      where: { 
        userId_departmentId_jobPosition: { 
          userId: frontendLead.id, 
          departmentId: frontend.id, 
          jobPosition: 'Team Lead' 
        } 
      },
      update: { isManager: true },
      create: { 
        userId: frontendLead.id, 
        departmentId: frontend.id, 
        jobPosition: 'Team Lead',
        isManager: true
      },
    });

    // Also works in parent Engineering department
    await prisma.userDepartment.upsert({
      where: { 
        userId_departmentId_jobPosition: { 
          userId: frontendLead.id, 
          departmentId: engineering.id, 
          jobPosition: 'Frontend Team Lead' 
        } 
      },
      update: {},
      create: { 
        userId: frontendLead.id, 
        departmentId: engineering.id, 
        jobPosition: 'Frontend Team Lead',
        isManager: false
      },
    });
  }

  // Backend Lead - manages Backend sub-department and works in Engineering
  const backendLead = createdUsers.find(u => u.email === 'backend.lead@company.com');
  if (backend && backendLead && engineering) {
    // Lead role in Backend sub-department
    await prisma.userDepartment.upsert({
      where: { 
        userId_departmentId_jobPosition: { 
          userId: backendLead.id, 
          departmentId: backend.id, 
          jobPosition: 'Team Lead' 
        } 
      },
      update: { isManager: true },
      create: { 
        userId: backendLead.id, 
        departmentId: backend.id, 
        jobPosition: 'Team Lead',
        isManager: true
      },
    });

    // Also works in parent Engineering department
    await prisma.userDepartment.upsert({
      where: { 
        userId_departmentId_jobPosition: { 
          userId: backendLead.id, 
          departmentId: engineering.id, 
          jobPosition: 'Backend Team Lead' 
        } 
      },
      update: {},
      create: { 
        userId: backendLead.id, 
        departmentId: engineering.id, 
        jobPosition: 'Backend Team Lead',
        isManager: false
      },
    });
  }

  // Senior Developer - works in both Engineering and Frontend
  const seniorDev = createdUsers.find(u => u.email === 'senior.dev@company.com');
  if (engineering && frontend && seniorDev) {
    // Senior role in Engineering
    await prisma.userDepartment.upsert({
      where: { 
        userId_departmentId_jobPosition: { 
          userId: seniorDev.id, 
          departmentId: engineering.id, 
          jobPosition: 'Senior Developer' 
        } 
      },
      update: {},
      create: { 
        userId: seniorDev.id, 
        departmentId: engineering.id, 
        jobPosition: 'Senior Developer',
        isManager: false
      },
    });

    // Also works in Frontend sub-department
    await prisma.userDepartment.upsert({
      where: { 
        userId_departmentId_jobPosition: { 
          userId: seniorDev.id, 
          departmentId: frontend.id, 
          jobPosition: 'Senior Frontend Developer' 
        } 
      },
      update: {},
      create: { 
        userId: seniorDev.id, 
        departmentId: frontend.id, 
        jobPosition: 'Senior Frontend Developer',
        isManager: false
      },
    });
  }

  // Junior Developer - works in Engineering
  const juniorDev = createdUsers.find(u => u.email === 'junior.dev@company.com');
  if (engineering && juniorDev) {
    await prisma.userDepartment.upsert({
      where: { 
        userId_departmentId_jobPosition: { 
          userId: juniorDev.id, 
          departmentId: engineering.id, 
          jobPosition: 'Junior Developer' 
        } 
      },
      update: {},
      create: { 
        userId: juniorDev.id, 
        departmentId: engineering.id, 
        jobPosition: 'Junior Developer',
        isManager: false
      },
    });
  }

  // Marketing Specialist - works in Marketing
  const marketingSpecialist = createdUsers.find(u => u.email === 'marketing.specialist@company.com');
  if (marketing && marketingSpecialist) {
    await prisma.userDepartment.upsert({
      where: { 
        userId_departmentId_jobPosition: { 
          userId: marketingSpecialist.id, 
          departmentId: marketing.id, 
          jobPosition: 'Marketing Specialist' 
        } 
      },
      update: {},
      create: { 
        userId: marketingSpecialist.id, 
        departmentId: marketing.id, 
        jobPosition: 'Marketing Specialist',
        isManager: false
      },
    });
  }

  // Admin gets access to all departments (use the newly created admin user)
  const admin = adminUser || createdUsers.find(u => u.email === 'gkozyris@i4ria.com' || u.role === 'ADMINISTRATOR');
  if (admin) {
    for (const dept of createdDepartments) {
      await prisma.userDepartment.upsert({
        where: { 
          userId_departmentId_jobPosition: { 
            userId: admin.id, 
            departmentId: dept.id, 
            jobPosition: 'System Administrator' 
          } 
        },
        update: { isManager: true },
        create: { 
          userId: admin.id, 
          departmentId: dept.id, 
          jobPosition: 'System Administrator',
          isManager: true
        },
      });
    }
  }

  console.log('✅ Database seed completed successfully!');
  console.log(`📊 Created ${createdDepartments.length} departments, ${createdUsers.length} users, and multiple department roles`);
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
