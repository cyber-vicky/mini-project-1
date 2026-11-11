const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const jsonService = require('./src/services/jsonService');

const seedData = async () => {
  console.log('Seeding demo data...');
  
  // Clear existing
  jsonService.writeData('citizens', []);
  jsonService.writeData('municipal_users', []);
  jsonService.writeData('departments', []);
  jsonService.writeData('issues', []);
  jsonService.writeData('status_history', []);
  jsonService.writeData('assignments', []);
  jsonService.writeData('notifications', []);
  jsonService.writeData('remarks', []);
  jsonService.writeData('verifications', []);
  
  const depts = [
    { id: 'dept_1', name: 'Public Works / Roads', description: 'Handles potholes and road damage' },
    { id: 'dept_2', name: 'Sanitation / Solid Waste', description: 'Handles garbage and waste' },
    { id: 'dept_3', name: 'Electrical / Streetlights', description: 'Handles streetlights' },
    { id: 'dept_4', name: 'Water Supply', description: 'Handles water pipes and leakages' },
    { id: 'dept_5', name: 'Drainage / Sewerage', description: 'Handles drainage and sewage' },
    { id: 'dept_6', name: 'Traffic', description: 'Handles traffic signals' },
    { id: 'dept_7', name: 'Parks / Horticulture', description: 'Handles public parks and fallen trees' },
    { id: 'dept_8', name: 'Animal Control', description: 'Handles stray animals' },
    { id: 'dept_9', name: 'Municipal Control Room', description: 'General control room' }
  ];
  jsonService.writeData('departments', depts);
  
  const citizenId = '480c294e-a51e-44df-a175-d4175b53c265';
  const citizenPass = await bcrypt.hash('Citizen@123', 10);
  jsonService.insert('citizens', {
    id: citizenId,
    name: 'Demo Citizen',
    email: 'citizen@example.com',
    phone: '1234567890',
    passwordHash: citizenPass,
    address: '123 Demo St, Civic City',
    createdAt: new Date().toISOString()
  });

  const adminId = 'c57ef5c2-4f37-404a-9ff6-c8922bd7a0de';
  const adminPass = await bcrypt.hash('Admin@123', 10);
  jsonService.insert('municipal_users', {
    id: adminId,
    employeeId: 'ADMIN001',
    name: 'Admin User',
    email: 'admin@municipal.gov',
    passwordHash: adminPass,
    role: 'ADMIN',
    departmentId: null,
    createdAt: new Date().toISOString()
  });

  const officerId = '2093ece2-a710-4ff6-8668-6b31a477e360';
  const officerPass = await bcrypt.hash('Officer@123', 10);
  jsonService.insert('municipal_users', {
    id: officerId,
    employeeId: 'OFFICER001',
    name: 'Officer User',
    email: 'officer@municipal.gov',
    passwordHash: officerPass,
    role: 'OFFICER',
    departmentId: 'dept_1',
    createdAt: new Date().toISOString()
  });

  const workerId = '502a81e8-e212-4b81-b792-8e77506a0e5f';
  const workerPass = await bcrypt.hash('Worker@123', 10);
  jsonService.insert('municipal_users', {
    id: workerId,
    employeeId: 'WORKER001',
    name: 'Worker User',
    email: 'worker@municipal.gov',
    passwordHash: workerPass,
    role: 'WORKER',
    departmentId: 'dept_1',
    createdAt: new Date().toISOString()
  });

  // Create 12 demo complaints covering all categories, priorities, and all workflow statuses
  const demoIssues = [
    { title: 'Massive Pothole on 5th Cross', desc: 'Deep crater on Main St creating major hazard for two-wheelers.', cat: 'POTHOLE', pri: 'CRITICAL', status: 'SUBMITTED', lat: '12.9716', lon: '77.5946', dept: 'dept_1' },
    { title: 'Garbage Overflow near Market', desc: 'Central waste bin is overflowing onto pedestrian walkway.', cat: 'GARBAGE_OVERFLOW', pri: 'HIGH', status: 'ACKNOWLEDGED', lat: '12.9720', lon: '77.5950', dept: 'dept_2' },
    { title: 'Broken Streetlight on Elm St', desc: 'Streetlight pole unlit for three consecutive nights, dark corner.', cat: 'STREETLIGHT', pri: 'MEDIUM', status: 'ASSIGNED', lat: '12.9730', lon: '77.5960', dept: 'dept_3', workerId },
    { title: 'Major Water Pipe Leakage', desc: 'Pressurized water pipe cracked, flooding residential driveway.', cat: 'WATER_LEAKAGE', pri: 'CRITICAL', status: 'IN_PROGRESS', lat: '12.9740', lon: '77.5970', dept: 'dept_4', workerId },
    { title: 'Drainage Channel Clogged', desc: 'Storm drain clogged with silt, rainwater pooling during showers.', cat: 'DRAINAGE_SEWERAGE', pri: 'HIGH', status: 'ASSIGNED', lat: '12.9750', lon: '77.5980', dept: 'dept_5', workerId },
    { title: 'Traffic Signal Controller Failure', desc: 'Main junction signal lights blinking amber erratically.', cat: 'TRAFFIC_SIGNAL', pri: 'CRITICAL', status: 'SUBMITTED', lat: '12.9760', lon: '77.5990', dept: 'dept_6' },
    { title: 'Fallen Bough on Promenade', desc: 'Heavy tree branch detached and obstructing pedestrian sidewalk.', cat: 'FALLEN_TREE', pri: 'MEDIUM', status: 'ACKNOWLEDGED', lat: '12.9770', lon: '77.6000', dept: 'dept_7' },
    { title: 'Stray Cattle Impeding Road', desc: 'Unattended cattle wandering into highway feeder road.', cat: 'STRAY_ANIMAL', pri: 'HIGH', status: 'SUBMITTED', lat: '12.9780', lon: '77.6010', dept: 'dept_8' },
    { title: 'Asphalt Subsidence Repaired', desc: 'Severe trench subsidence on arterial road.', cat: 'POTHOLE', pri: 'HIGH', status: 'RESOLVED', lat: '12.9790', lon: '77.6020', dept: 'dept_1', workerId, resolutionDetails: 'Subsidence filled with base gravel, cold bituminous mix compacted with roller.', resolutionProof: ['/uploads/sample-proof.jpg'] },
    { title: 'Patchwork Quality Unsatisfactory', desc: 'Pothole patch broke open again after heavy rainfall.', cat: 'POTHOLE', pri: 'HIGH', status: 'REOPENED', lat: '12.9800', lon: '77.6030', dept: 'dept_1', workerId, resolutionDetails: 'Initial surface patch applied.', reopenedReason: 'Patch disintegrated in first shower. Loose stones dangerous for motorists.' },
    { title: 'Damaged Kerbstone Replaced', desc: 'Kerbstone knocked out of place near bus shelter.', cat: 'POTHOLE', pri: 'MEDIUM', status: 'VERIFIED', lat: '12.9805', lon: '77.6035', dept: 'dept_1', workerId, resolutionDetails: 'Precast kerb re-anchored with concrete mortar.' },
    { title: 'Broken Pavement Slab Closed', desc: 'Broken paving slab repaired, leveled, and verified by citizen.', cat: 'POTHOLE', pri: 'LOW', status: 'CLOSED', lat: '12.9810', lon: '77.6040', dept: 'dept_1', workerId, resolutionDetails: 'Slab replaced with new interlocking paver and grouted.' }
  ];

  demoIssues.forEach((issue, index) => {
    const issueDate = new Date(Date.now() - (index * 86400000 * 1.5));
    const isAssigned = ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED', 'REOPENED'].includes(issue.status);
    
    const issueObj = {
      id: `CC-DEMO-${1000 + index}`,
      citizenId: citizenId,
      title: issue.title,
      description: issue.desc,
      category: issue.cat,
      priority: issue.pri,
      status: issue.status,
      latitude: issue.lat,
      longitude: issue.lon,
      address: `${100 + index * 12} Civic Avenue, Sector ${index + 1}`,
      media: [],
      recommendedDepartmentId: issue.dept,
      assignedDepartmentId: isAssigned ? issue.dept : (issue.status === 'ACKNOWLEDGED' ? issue.dept : null),
      assignedOfficerId: isAssigned ? officerId : null,
      assignedWorkerId: (isAssigned && issue.workerId) ? issue.workerId : null,
      resolutionDetails: issue.resolutionDetails || null,
      resolutionProof: issue.resolutionProof || [],
      resolvedAt: ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(issue.status) ? new Date(Date.now() - 3600000 * 12).toISOString() : null,
      createdAt: issueDate.toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    jsonService.insert('issues', issueObj);
    
    // Status history sequence
    jsonService.insert('status_history', {
      id: uuidv4(),
      issueId: issueObj.id,
      oldStatus: null,
      newStatus: 'SUBMITTED',
      changedBy: citizenId,
      timestamp: issueObj.createdAt,
      remarks: 'Issue submitted by citizen'
    });

    if (issue.status !== 'SUBMITTED') {
      jsonService.insert('status_history', {
        id: uuidv4(),
        issueId: issueObj.id,
        oldStatus: 'SUBMITTED',
        newStatus: 'ACKNOWLEDGED',
        changedBy: officerId,
        timestamp: new Date(issueDate.getTime() + 3600000 * 2).toISOString(),
        remarks: 'Acknowledged and validated by department officer'
      });
    }

    if (isAssigned) {
      jsonService.insert('status_history', {
        id: uuidv4(),
        issueId: issueObj.id,
        oldStatus: 'ACKNOWLEDGED',
        newStatus: 'ASSIGNED',
        changedBy: officerId,
        timestamp: new Date(issueDate.getTime() + 3600000 * 4).toISOString(),
        remarks: 'Assigned to field worker'
      });

      // Assignment record
      jsonService.insert('assignments', {
        id: uuidv4(),
        issueId: issueObj.id,
        departmentId: issue.dept,
        officerId: officerId,
        workerId: issue.workerId || null,
        assignedBy: officerId,
        timestamp: new Date(issueDate.getTime() + 3600000 * 4).toISOString()
      });
    }

    if (['IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED'].includes(issue.status)) {
      jsonService.insert('status_history', {
        id: uuidv4(),
        issueId: issueObj.id,
        oldStatus: 'ASSIGNED',
        newStatus: 'IN_PROGRESS',
        changedBy: workerId,
        timestamp: new Date(issueDate.getTime() + 3600000 * 8).toISOString(),
        remarks: 'Field work commenced on-site'
      });
    }

    if (['RESOLVED', 'VERIFIED', 'CLOSED'].includes(issue.status)) {
      jsonService.insert('status_history', {
        id: uuidv4(),
        issueId: issueObj.id,
        oldStatus: 'IN_PROGRESS',
        newStatus: 'RESOLVED',
        changedBy: workerId,
        timestamp: issueObj.resolvedAt || new Date().toISOString(),
        remarks: issue.resolutionDetails || 'Work completed on-site'
      });
    }

    if (issue.status === 'VERIFIED') {
      jsonService.insert('verifications', {
        id: uuidv4(),
        issueId: issueObj.id,
        citizenId: citizenId,
        result: true,
        remarks: 'Work confirmed satisfactory by citizen',
        createdAt: new Date().toISOString()
      });
      jsonService.insert('status_history', {
        id: uuidv4(),
        issueId: issueObj.id,
        oldStatus: 'RESOLVED',
        newStatus: 'VERIFIED',
        changedBy: citizenId,
        timestamp: new Date().toISOString(),
        remarks: 'Citizen confirmed resolution'
      });
    }

    if (issue.status === 'CLOSED') {
      jsonService.insert('verifications', {
        id: uuidv4(),
        issueId: issueObj.id,
        citizenId: citizenId,
        result: true,
        remarks: 'Confirmed completed and closed',
        createdAt: new Date().toISOString()
      });
      jsonService.insert('status_history', {
        id: uuidv4(),
        issueId: issueObj.id,
        oldStatus: 'RESOLVED',
        newStatus: 'CLOSED',
        changedBy: citizenId,
        timestamp: new Date().toISOString(),
        remarks: 'Closed following citizen verification'
      });
    }

    if (issue.status === 'REOPENED') {
      jsonService.insert('verifications', {
        id: uuidv4(),
        issueId: issueObj.id,
        citizenId: citizenId,
        result: false,
        remarks: issue.reopenedReason || 'Resolution rejected',
        createdAt: new Date().toISOString()
      });
      jsonService.insert('status_history', {
        id: uuidv4(),
        issueId: issueObj.id,
        oldStatus: 'RESOLVED',
        newStatus: 'REOPENED',
        changedBy: citizenId,
        timestamp: new Date().toISOString(),
        remarks: `Reopened: ${issue.reopenedReason}`
      });
    }
  });

  // Seed Realistic Notifications for Citizen
  jsonService.insert('notifications', {
    id: uuidv4(),
    userId: citizenId,
    issueId: 'CC-DEMO-1008',
    message: 'Your complaint "Asphalt Subsidence Repaired" has been marked RESOLVED. Please inspect and verify.',
    type: 'RESOLUTION_READY',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  });

  jsonService.insert('notifications', {
    id: uuidv4(),
    userId: citizenId,
    issueId: 'CC-DEMO-1003',
    message: 'Work has begun on your reported issue: "Major Water Pipe Leakage".',
    type: 'STATUS_UPDATE',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString()
  });

  jsonService.insert('notifications', {
    id: uuidv4(),
    userId: citizenId,
    issueId: 'CC-DEMO-1000',
    message: 'Your complaint "Massive Pothole on 5th Cross" was received and routed to Public Works / Roads.',
    type: 'STATUS_UPDATE',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString()
  });

  // Seed Notifications for Municipal Admin
  jsonService.insert('notifications', {
    id: uuidv4(),
    userId: adminId,
    issueId: 'CC-DEMO-1000',
    message: 'CRITICAL priority complaint submitted: "Massive Pothole on 5th Cross"',
    type: 'CRITICAL_COMPLAINT',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  });

  jsonService.insert('notifications', {
    id: uuidv4(),
    userId: adminId,
    issueId: 'CC-DEMO-1009',
    message: 'Citizen has REOPENED complaint "Patchwork Quality Unsatisfactory". Reason: Patch disintegrated in first shower.',
    type: 'REOPENED',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString()
  });

  // Seed Notifications for Municipal Officer
  jsonService.insert('notifications', {
    id: uuidv4(),
    userId: officerId,
    issueId: 'CC-DEMO-1002',
    message: 'New complaint routed to your department: "Broken Streetlight on Elm St"',
    type: 'DEPARTMENT_ASSIGNED',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString()
  });

  // Seed Notifications for Field Worker
  jsonService.insert('notifications', {
    id: uuidv4(),
    userId: workerId,
    issueId: 'CC-DEMO-1002',
    message: 'You have been assigned to task: "Broken Streetlight on Elm St"',
    type: 'TASK_ASSIGNED',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  });

  jsonService.insert('notifications', {
    id: uuidv4(),
    userId: workerId,
    issueId: 'CC-DEMO-1003',
    message: 'You have been assigned to task: "Major Water Pipe Leakage"',
    type: 'TASK_ASSIGNED',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  });

  console.log('Seeding completed successfully with rich demo data!');
};

seedData().catch(console.error);
