const jsonService = require('../services/jsonService');
const { randomUUID: uuidv4 } = require('crypto');
const classificationService = require('../services/classificationService');
const priorityService = require('../services/priorityService');
const duplicateService = require('../services/duplicateService');
const routingService = require('../services/routingService');

const createIssue = (req, res) => {
  try {
    const { title, description, category, latitude, longitude, address } = req.body;
    
    let media = [];
    if (req.files) {
      media = req.files.map(file => `/uploads/${file.filename}`);
    }

    // Smart Processing Pipeline
    // 1. Classification
    const classification = classificationService.classifyIssue(title, description);
    const finalCategory = category && category !== 'Other' ? category : classification.category;

    // 2. Priority
    const allIssues = jsonService.readData('issues');
    const nearbyCount = allIssues.filter(i => 
      i.latitude && latitude && 
      Math.abs(parseFloat(i.latitude) - parseFloat(latitude)) < 0.01 &&
      Math.abs(parseFloat(i.longitude) - parseFloat(longitude)) < 0.01
    ).length;
    
    const priorityData = priorityService.calculatePriority(finalCategory, description, classification.matchedKeywords, nearbyCount);

    // 3. Routing
    const routing = routingService.routeToDepartment(finalCategory);

    const newIssue = {
      id: uuidv4(),
      citizenId: req.user.id,
      title,
      description,
      category: finalCategory,
      priority: priorityData.priority,
      status: 'SUBMITTED',
      latitude,
      longitude,
      address,
      media,
      
      // Intelligence Data
      classificationResult: classification,
      priorityData: priorityData,
      recommendedDepartmentId: routing.recommendedDepartmentId,
      routingReason: routing.reason,
      
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 4. Duplicate Detection (Requires new issue data)
    const duplicateData = duplicateService.detectDuplicate(newIssue);
    newIssue.duplicateInfo = duplicateData;

    jsonService.insert('issues', newIssue);
    
    // Add status history
    jsonService.insert('status_history', {
      id: uuidv4(),
      issueId: newIssue.id,
      oldStatus: null,
      newStatus: 'SUBMITTED',
      changedBy: req.user.id,
      timestamp: new Date().toISOString(),
      remarks: 'Issue submitted by citizen'
    });

    // Create notification for citizen
    jsonService.insert('notifications', {
      id: uuidv4(),
      userId: req.user.id,
      issueId: newIssue.id,
      message: 'Your complaint has been submitted and is being analyzed.',
      type: 'STATUS_UPDATE',
      read: false,
      createdAt: new Date().toISOString()
    });

    // Create notifications for municipal staff (Admins and recommended department Officers)
    const municipalUsers = jsonService.readData('municipal_users');
    const recipientIds = new Set();
    
    // All Admins
    municipalUsers.filter(u => u.role === 'ADMIN').forEach(u => recipientIds.add(u.id));
    
    // Officers in recommended department
    if (newIssue.recommendedDepartmentId) {
      municipalUsers
        .filter(u => u.role === 'OFFICER' && u.departmentId === newIssue.recommendedDepartmentId)
        .forEach(u => recipientIds.add(u.id));
    }

    let notifMessage = `New complaint submitted: "${title}".`;
    let notifType = 'NEW_COMPLAINT';
    if (priorityData.priority === 'CRITICAL') {
      notifMessage = `[CRITICAL PRIORITY] New critical complaint submitted: "${title}". Immediate review required.`;
      notifType = 'CRITICAL_COMPLAINT';
    } else if (priorityData.priority === 'HIGH') {
      notifMessage = `[HIGH PRIORITY] New high-priority complaint submitted: "${title}".`;
      notifType = 'HIGH_PRIORITY_COMPLAINT';
    }

    recipientIds.forEach(mUserId => {
      jsonService.insert('notifications', {
        id: uuidv4(),
        userId: mUserId,
        issueId: newIssue.id,
        message: notifMessage,
        type: notifType,
        read: false,
        createdAt: new Date().toISOString()
      });
    });

    res.status(201).json(newIssue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getCitizenIssues = (req, res) => {
  try {
    const allIssues = jsonService.readData('issues');
    const citizenIssues = allIssues.filter(issue => issue.citizenId === req.user.id);
    res.json(citizenIssues);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getIssueById = (req, res) => {
  try {
    const issue = jsonService.findById('issues', req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    
    // Authorization check
    if (req.user.role === 'citizen') {
      if (issue.citizenId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied: not your complaint' });
      }
    } else if (req.user.role === 'WORKER') {
      if (issue.assignedWorkerId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied: not assigned to this complaint' });
      }
    } else if (req.user.role === 'OFFICER') {
      const me = jsonService.findById('municipal_users', req.user.id);
      if (me && me.departmentId && issue.assignedDepartmentId && issue.assignedDepartmentId !== me.departmentId && issue.recommendedDepartmentId !== me.departmentId) {
        return res.status(403).json({ message: 'Access denied: complaint belongs to another department' });
      }
    }
    
    // Get status history
    const allHistory = jsonService.readData('status_history');
    const history = allHistory
      .filter(h => h.issueId === issue.id)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Get internal remarks
    const allRemarks = jsonService.readData('remarks');
    const remarks = allRemarks
      .filter(r => r.issueId === issue.id)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    res.json({ ...issue, history, remarks });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getAllIssues = (req, res) => {
  try {
    const me = jsonService.findById('municipal_users', req.user.id);
    if (!me || !['ADMIN', 'OFFICER', 'WORKER'].includes(me.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    let issues = jsonService.readData('issues');
    
    // Role-based filtering
    if (me.role === 'OFFICER') {
      if (me.departmentId) {
        issues = issues.filter(i => i.assignedDepartmentId === me.departmentId || i.recommendedDepartmentId === me.departmentId);
      } else {
        issues = [];
      }
    } else if (me.role === 'WORKER') {
      issues = issues.filter(i => i.assignedWorkerId === me.id);
    }
    
    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMapIssues = (req, res) => {
  try {
    // Validate authenticated municipal user from DB
    const user = jsonService.findById('municipal_users', req.user.id);
    if (!user || !['ADMIN', 'OFFICER', 'WORKER'].includes(user.role)) {
      return res.status(403).json({ message: 'Access denied: municipal map is restricted to municipal staff' });
    }

    let issues = jsonService.readData('issues');

    // Strict Role-based scope enforcement
    if (user.role === 'OFFICER') {
      // Officers are strictly restricted to their authorized department scope
      if (!user.departmentId) {
        issues = [];
      } else {
        issues = issues.filter(i => 
          i.assignedDepartmentId === user.departmentId || 
          i.recommendedDepartmentId === user.departmentId
        );
      }
    } else if (user.role === 'WORKER') {
      // Workers are strictly restricted to complaints assigned to them
      issues = issues.filter(i => i.assignedWorkerId === user.id);
    } else if (user.role === 'ADMIN') {
      // Admins have municipal-wide scope; optional department filter
      if (req.query.departmentId && req.query.departmentId !== 'ALL') {
        issues = issues.filter(i => 
          i.assignedDepartmentId === req.query.departmentId || 
          i.recommendedDepartmentId === req.query.departmentId
        );
      }
    }

    // Optional query filtering within user's authorized scope
    if (req.query.status && req.query.status !== 'ALL') {
      issues = issues.filter(i => i.status === req.query.status);
    }
    if (req.query.priority && req.query.priority !== 'ALL') {
      issues = issues.filter(i => i.priority === req.query.priority);
    }
    if (req.query.category && req.query.category !== 'ALL') {
      issues = issues.filter(i => i.category === req.query.category);
    }

    // Coordinates validation & privacy sanitization
    // Do not invent coordinates; filter out invalid or missing coordinates
    // Do not expose unrelated citizen personal info
    const validMappedIssues = [];
    for (const issue of issues) {
      if (issue.latitude === null || issue.latitude === undefined || issue.longitude === null || issue.longitude === undefined) {
        continue;
      }
      const lat = parseFloat(String(issue.latitude).trim());
      const lng = parseFloat(String(issue.longitude).trim());
      
      // Strict numerical coordinate boundaries check
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        continue;
      }

      validMappedIssues.push({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        category: issue.category,
        priority: issue.priority,
        status: issue.status,
        latitude: lat,
        longitude: lng,
        address: issue.address || '',
        media: issue.media || [],
        assignedDepartmentId: issue.assignedDepartmentId || null,
        recommendedDepartmentId: issue.recommendedDepartmentId || null,
        assignedOfficerId: issue.assignedOfficerId || null,
        assignedWorkerId: issue.assignedWorkerId || null,
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt
      });
    }

    res.json(validMappedIssues);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateIssueStatus = (req, res) => {
  try {
    const { status, remarks } = req.body;
    const issueId = req.params.id;
    const issue = jsonService.findById('issues', issueId);
    
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    
    // RBAC: Worker can only update their assigned complaint
    if (req.user.role === 'WORKER') {
      if (issue.assignedWorkerId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied: not assigned to this complaint' });
      }
      // Workers can only move task to IN_PROGRESS or RESOLVED
      if (!['IN_PROGRESS', 'RESOLVED'].includes(status)) {
        return res.status(400).json({ message: 'Workers can only transition tasks to IN_PROGRESS or RESOLVED' });
      }
    } else if (req.user.role === 'OFFICER') {
      const me = jsonService.findById('municipal_users', req.user.id);
      if (me && me.departmentId && issue.assignedDepartmentId && issue.assignedDepartmentId !== me.departmentId && issue.recommendedDepartmentId !== me.departmentId) {
        return res.status(403).json({ message: 'Access denied: complaint belongs to another department' });
      }
    }
    
    // Add resolution proof if provided
    let resolutionProof = issue.resolutionProof || [];
    if (req.files && req.files.length > 0) {
      const newProof = req.files.map(f => `/uploads/${f.filename}`);
      resolutionProof = [...resolutionProof, ...newProof];
    }

    const oldStatus = issue.status;
    const updated = jsonService.update('issues', issueId, { status, resolutionProof, updatedAt: new Date().toISOString() });
    
    jsonService.insert('status_history', {
      id: uuidv4(),
      issueId,
      oldStatus,
      newStatus: status,
      changedBy: req.user.id,
      timestamp: new Date().toISOString(),
      remarks: remarks || `Status changed to ${status}`
    });

    // Notify citizen
    let citizenMsg = `Your complaint "${issue.title}" status changed to ${status}.`;
    if (status === 'ACKNOWLEDGED') {
      citizenMsg = `Your complaint "${issue.title}" has been acknowledged by the municipal team.`;
    } else if (status === 'IN_PROGRESS') {
      citizenMsg = `Work has started on your complaint "${issue.title}".`;
    } else if (status === 'RESOLVED') {
      citizenMsg = `Your complaint "${issue.title}" has been marked as RESOLVED. Please inspect and verify the resolution.`;
    }

    jsonService.insert('notifications', {
      id: uuidv4(),
      userId: issue.citizenId,
      issueId,
      message: citizenMsg,
      type: 'STATUS_UPDATE',
      read: false,
      createdAt: new Date().toISOString()
    });

    // If resolved, notify Admins and Department Officer
    if (status === 'RESOLVED') {
      const municipalUsers = jsonService.readData('municipal_users');
      municipalUsers.filter(u => u.role === 'ADMIN').forEach(admin => {
        jsonService.insert('notifications', {
          id: uuidv4(),
          userId: admin.id,
          issueId,
          message: `Complaint "${issue.title}" has been marked RESOLVED and is awaiting citizen verification.`,
          type: 'STATUS_UPDATE',
          read: false,
          createdAt: new Date().toISOString()
        });
      });
      if (issue.assignedOfficerId) {
        jsonService.insert('notifications', {
          id: uuidv4(),
          userId: issue.assignedOfficerId,
          issueId,
          message: `Complaint "${issue.title}" has been marked RESOLVED by worker.`,
          type: 'STATUS_UPDATE',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const assignIssue = (req, res) => {
  try {
    const { departmentId, officerId, workerId } = req.body;
    const issueId = req.params.id;
    const issue = jsonService.findById('issues', issueId);
    
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    
    // Officer role scoping: Officer can only assign within their department
    if (req.user.role === 'OFFICER') {
      const me = jsonService.findById('municipal_users', req.user.id);
      if (me && me.departmentId && issue.assignedDepartmentId && issue.assignedDepartmentId !== me.departmentId && issue.recommendedDepartmentId !== me.departmentId) {
        return res.status(403).json({ message: 'Access denied: cannot assign complaint of another department' });
      }
      if (departmentId && me && me.departmentId && departmentId !== me.departmentId) {
        return res.status(403).json({ message: 'Officers can only assign within their own department' });
      }
    }

    const targetDeptId = departmentId || issue.assignedDepartmentId || issue.recommendedDepartmentId;
    
    // Validate target department exists if given
    if (departmentId) {
      const dept = jsonService.findById('departments', departmentId);
      if (!dept) return res.status(400).json({ message: 'Invalid department ID' });
    }

    // Validate assigned officer belongs to target department
    if (officerId) {
      const officer = jsonService.findById('municipal_users', officerId);
      if (!officer || officer.role !== 'OFFICER') {
        return res.status(400).json({ message: 'Assigned officer not found or invalid role' });
      }
      if (targetDeptId && officer.departmentId && officer.departmentId !== targetDeptId) {
        return res.status(400).json({ message: 'Assigned officer does not belong to the selected department' });
      }
    }

    // Validate assigned worker belongs to target department
    if (workerId) {
      const worker = jsonService.findById('municipal_users', workerId);
      if (!worker || worker.role !== 'WORKER') {
        return res.status(400).json({ message: 'Assigned worker not found or invalid role' });
      }
      if (targetDeptId && worker.departmentId && worker.departmentId !== targetDeptId) {
        return res.status(400).json({ message: 'Assigned worker does not belong to the selected department' });
      }
    }

    const oldStatus = issue.status;
    const newStatus = 'ASSIGNED';
    const updates = { status: newStatus, updatedAt: new Date().toISOString() };
    if (departmentId) updates.assignedDepartmentId = departmentId;
    if (officerId) updates.assignedOfficerId = officerId;
    if (workerId) updates.assignedWorkerId = workerId;
    
    const updated = jsonService.update('issues', issueId, updates);
    
    jsonService.insert('assignments', {
      id: uuidv4(),
      issueId,
      departmentId: updates.assignedDepartmentId || issue.assignedDepartmentId,
      officerId: updates.assignedOfficerId || issue.assignedOfficerId,
      workerId: updates.assignedWorkerId || issue.assignedWorkerId,
      assignedAt: new Date().toISOString(),
      assignedBy: req.user.id
    });

    // Status history
    jsonService.insert('status_history', {
      id: uuidv4(),
      issueId,
      oldStatus,
      newStatus,
      changedBy: req.user.id,
      timestamp: new Date().toISOString(),
      remarks: `Assigned by ${req.user.role} (${req.user.name || req.user.employeeId || req.user.id})`
    });

    // Notify citizen
    jsonService.insert('notifications', {
      id: uuidv4(),
      userId: issue.citizenId,
      issueId,
      message: `Your complaint "${issue.title}" has been assigned and is being handled.`,
      type: 'STATUS_UPDATE',
      read: false,
      createdAt: new Date().toISOString()
    });

    // Notify assigned worker if provided
    if (workerId) {
      jsonService.insert('notifications', {
        id: uuidv4(),
        userId: workerId,
        issueId,
        message: `You have been assigned a new task: "${issue.title}". Please review and start work.`,
        type: 'ASSIGNMENT',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    // Notify assigned officer if provided
    if (officerId) {
      jsonService.insert('notifications', {
        id: uuidv4(),
        userId: officerId,
        issueId,
        message: `Issue "${issue.title}" has been assigned to your department for review.`,
        type: 'ASSIGNMENT',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const verifyIssue = (req, res) => {
  try {
    const { isResolved, remarks } = req.body;
    const issueId = req.params.id;
    const issue = jsonService.findById('issues', issueId);
    
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (issue.citizenId !== req.user.id) return res.status(403).json({ message: 'Access denied: not your complaint' });
    if (issue.status !== 'RESOLVED') {
      return res.status(400).json({ message: 'Only RESOLVED complaints can be verified or reopened' });
    }
    if (!isResolved && (!remarks || !remarks.trim())) {
      return res.status(400).json({ message: 'A reason is required to reopen a complaint' });
    }

    const newStatus = isResolved ? 'CLOSED' : 'REOPENED';
    
    jsonService.insert('verifications', {
      id: uuidv4(),
      issueId,
      citizenId: req.user.id,
      result: isResolved,
      remarks: remarks || (isResolved ? 'Verified by citizen' : 'Reopened by citizen'),
      createdAt: new Date().toISOString()
    });

    const updated = jsonService.update('issues', issueId, { status: newStatus, updatedAt: new Date().toISOString() });
    
    jsonService.insert('status_history', {
      id: uuidv4(),
      issueId,
      oldStatus: issue.status,
      newStatus,
      changedBy: req.user.id,
      timestamp: new Date().toISOString(),
      remarks: remarks || (isResolved ? 'Verified and confirmed closed by citizen' : 'Reopened by citizen')
    });

    if (!isResolved) {
      // Reopened: Notify ADMIN, assigned officer, and assigned worker
      const municipalUsers = jsonService.readData('municipal_users');
      const admins = municipalUsers.filter(u => u.role === 'ADMIN');
      admins.forEach(admin => {
        jsonService.insert('notifications', {
          id: uuidv4(),
          userId: admin.id,
          issueId,
          message: `Citizen has REOPENED complaint "${issue.title}". Reason: ${remarks}.`,
          type: 'REOPENED',
          read: false,
          createdAt: new Date().toISOString()
        });
      });
      if (issue.assignedOfficerId) {
        jsonService.insert('notifications', {
          id: uuidv4(),
          userId: issue.assignedOfficerId,
          issueId,
          message: `Citizen has REOPENED complaint "${issue.title}". Reason: ${remarks}.`,
          type: 'REOPENED',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
      if (issue.assignedWorkerId) {
        jsonService.insert('notifications', {
          id: uuidv4(),
          userId: issue.assignedWorkerId,
          issueId,
          message: `Assigned task "${issue.title}" has been REOPENED by citizen. Reason: ${remarks}.`,
          type: 'REOPENED',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    } else {
      // Verified / Closed: Notify citizen confirmation and notify assigned municipal team
      jsonService.insert('notifications', {
        id: uuidv4(),
        userId: req.user.id,
        issueId,
        message: `Your complaint "${issue.title}" has been successfully verified and marked as CLOSED.`,
        type: 'CLOSED',
        read: false,
        createdAt: new Date().toISOString()
      });
      if (issue.assignedWorkerId) {
        jsonService.insert('notifications', {
          id: uuidv4(),
          userId: issue.assignedWorkerId,
          issueId,
          message: `Citizen verified and closed complaint "${issue.title}". Great work!`,
          type: 'CLOSED',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
      if (issue.assignedOfficerId) {
        jsonService.insert('notifications', {
          id: uuidv4(),
          userId: issue.assignedOfficerId,
          issueId,
          message: `Complaint "${issue.title}" has been verified and closed by citizen.`,
          type: 'CLOSED',
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateIssue = (req, res) => {
  try {
    const { category, priority, departmentId, officerId, workerId, remarks } = req.body;
    const issueId = req.params.id;
    const issue = jsonService.findById('issues', issueId);
    
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Only ADMIN can override core fields' });

    const updates = { updatedAt: new Date().toISOString() };
    if (category) updates.category = category;
    if (priority) updates.priority = priority;
    if (departmentId !== undefined) updates.assignedDepartmentId = departmentId;
    if (officerId !== undefined) updates.assignedOfficerId = officerId;
    if (workerId !== undefined) updates.assignedWorkerId = workerId;

    const updated = jsonService.update('issues', issueId, updates);
    
    // Log remark if provided during override
    if (remarks) {
      jsonService.insert('remarks', {
        id: uuidv4(),
        issueId,
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        remark: `[ADMIN OVERRIDE] ${remarks}`,
        timestamp: new Date().toISOString()
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const addRemark = (req, res) => {
  try {
    const { remark } = req.body;
    const issueId = req.params.id;
    const issue = jsonService.findById('issues', issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // RBAC: Worker only on assigned issue; Officer only on department issue
    if (req.user.role === 'WORKER' && issue.assignedWorkerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied: not assigned to this complaint' });
    }
    if (req.user.role === 'OFFICER') {
      const me = jsonService.findById('municipal_users', req.user.id);
      if (me && me.departmentId && issue.assignedDepartmentId && issue.assignedDepartmentId !== me.departmentId && issue.recommendedDepartmentId !== me.departmentId) {
        return res.status(403).json({ message: 'Access denied: complaint belongs to another department' });
      }
    }
    
    const newRemark = {
      id: uuidv4(),
      issueId,
      userId: req.user.id,
      userName: req.user.name || req.user.employeeId,
      role: req.user.role,
      remark,
      timestamp: new Date().toISOString()
    };
    
    jsonService.insert('remarks', newRemark);
    res.json(newRemark);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteIssue = (req, res) => {
  try {
    const issueId = req.params.id;
    const issue = jsonService.findById('issues', issueId);
    if (!issue) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Role-based Authorization: ADMIN and OFFICER only
    if (req.user.role === 'OFFICER') {
      const me = jsonService.findById('municipal_users', req.user.id);
      if (
        me &&
        me.departmentId &&
        issue.assignedDepartmentId &&
        issue.assignedDepartmentId !== me.departmentId &&
        issue.recommendedDepartmentId !== me.departmentId
      ) {
        return res.status(403).json({ message: 'Access denied: complaint belongs to another department' });
      }
    } else if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied: only Administrators and Officers can delete complaints' });
    }

    // 1. Delete main issue record
    jsonService.deleteData('issues', issueId);

    // 2. Cascade delete related records
    const cleanCascade = (collection) => {
      const records = jsonService.readData(collection);
      const filtered = records.filter(item => item.issueId !== issueId);
      if (filtered.length !== records.length) {
        jsonService.writeData(collection, filtered);
      }
    };

    cleanCascade('status_history');
    cleanCascade('remarks');
    cleanCascade('assignments');
    cleanCascade('verifications');
    cleanCascade('notifications');

    // 3. Notify the citizen who registered the complaint
    if (issue.citizenId) {
      jsonService.insert('notifications', {
        id: uuidv4(),
        userId: issue.citizenId,
        message: `Your complaint "${issue.title}" has been deleted by municipal authority (${req.user.role === 'ADMIN' ? 'Administrator' : 'Department Officer'}).`,
        type: 'GENERAL',
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    res.json({ message: 'Complaint deleted successfully', id: issueId });
  } catch (error) {
    console.error('Failed to delete complaint:', error);
    res.status(500).json({ message: 'Server error while deleting complaint' });
  }
};

module.exports = {
  createIssue,
  getCitizenIssues,
  getIssueById,
  getAllIssues,
  getMapIssues,
  updateIssueStatus,
  assignIssue,
  verifyIssue,
  updateIssue,
  addRemark,
  deleteIssue
};
