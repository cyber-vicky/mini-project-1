const http = require('http');

// Helper to make HTTP requests
const request = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch {}
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });
    req.on('error', reject);
    if (postData) {
      if (typeof postData === 'object') {
        req.write(JSON.stringify(postData));
      } else {
        req.write(postData);
      }
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('--- STARTING CIVICCONNECT END-TO-END VALIDATION ---');
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  };

  const BASE = { hostname: 'localhost', port: 5000 };

  // 1. Citizen Login
  const citLogin = await request({
    ...BASE, path: '/api/auth/citizen/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'citizen@example.com', password: 'Citizen@123' });
  assert(citLogin.status === 200 && citLogin.data.token, '1. Citizen Login succeeds with JWT');
  const citizenToken = citLogin.data.token;
  const citizenId = citLogin.data.user.id;

  // 2. Admin Login
  const admLogin = await request({
    ...BASE, path: '/api/auth/municipal/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { employeeId: 'ADMIN001', password: 'Admin@123' });
  assert(admLogin.status === 200 && admLogin.data.user.role === 'ADMIN', '2. Admin Login succeeds as ADMIN');
  const adminToken = admLogin.data.token;

  // 3. Officer Login
  const offLogin = await request({
    ...BASE, path: '/api/auth/municipal/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { employeeId: 'OFFICER001', password: 'Officer@123' });
  assert(offLogin.status === 200 && offLogin.data.user.role === 'OFFICER', '3. Officer Login succeeds as OFFICER');
  const officerToken = offLogin.data.token;
  const officerId = offLogin.data.user.id;

  // 4. Worker Login
  const wrkLogin = await request({
    ...BASE, path: '/api/auth/municipal/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { employeeId: 'WORKER001', password: 'Worker@123' });
  assert(wrkLogin.status === 200 && wrkLogin.data.user.role === 'WORKER', '4. Worker Login succeeds as WORKER');
  const workerToken = wrkLogin.data.token;
  const workerId = wrkLogin.data.user.id;

  // TEST A: Citizen reports issue (Pothole on Main St)
  const newIssueRes = await request({
    ...BASE, path: '/api/issues', method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${citizenToken}`
    }
  }, {
    title: 'Severe road pothole danger',
    description: 'There is a dangerous crater and pothole on the main road near school.',
    category: 'Other',
    latitude: '12.9716',
    longitude: '77.5946',
    address: 'Near City School, Main St'
  });
  assert(newIssueRes.status === 201, 'TEST A.1: Citizen issue creation succeeds');
  const createdIssue = newIssueRes.data;
  assert(createdIssue.category === 'POTHOLE', 'TEST A.2: Automatic rule-based classification categorized as POTHOLE');
  assert(createdIssue.priority === 'CRITICAL' || createdIssue.priority === 'HIGH', 'TEST A.3: Priority weighted scoring calculated high/critical priority');
  assert(createdIssue.recommendedDepartmentId === 'dept_1', 'TEST A.4: Routed to Public Works / Roads (dept_1)');

  // Verify notifications created for citizen and municipal admin
  const citNotifs = await request({
    ...BASE, path: '/api/notifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${citizenToken}` }
  });
  assert(citNotifs.data.some(n => n.issueId === createdIssue.id), 'TEST A.5: Citizen received submission notification');

  const admNotifs = await request({
    ...BASE, path: '/api/notifications', method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(admNotifs.data.some(n => n.issueId === createdIssue.id), 'TEST A.6: Municipal Admin received new complaint notification');

  // TEST B: Admin reviews and assigns issue
  const assignRes = await request({
    ...BASE, path: `/api/issues/${createdIssue.id}/assign`, method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    departmentId: 'dept_1',
    officerId: officerId,
    workerId: workerId
  });
  assert(assignRes.status === 200 && assignRes.data.status === 'ASSIGNED', 'TEST B.1: Admin successfully assigns issue, status changed to ASSIGNED');

  // Verify status history
  const issueDetails = await request({
    ...BASE, path: `/api/issues/${createdIssue.id}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(issueDetails.data.history.some(h => h.newStatus === 'ASSIGNED'), 'TEST B.2: Status history contains ASSIGNED transition');

  // TEST C: Officer adds remark and acknowledges
  const remarkRes = await request({
    ...BASE, path: `/api/issues/${createdIssue.id}/remarks`, method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${officerToken}`
    }
  }, { remark: 'Officer inspected location. Proceed with road patch.' });
  assert(remarkRes.status === 200, 'TEST C.1: Officer successfully adds internal remark');

  // TEST D: Worker starts work (ASSIGNED -> IN_PROGRESS) and resolves (IN_PROGRESS -> RESOLVED)
  const startWorkRes = await request({
    ...BASE, path: `/api/issues/${createdIssue.id}/status`, method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${workerToken}`
    }
  }, { status: 'IN_PROGRESS', remarks: 'Worker on site, excavation begun.' });
  assert(startWorkRes.status === 200 && startWorkRes.data.status === 'IN_PROGRESS', 'TEST D.1: Worker starts work, status is IN_PROGRESS');

  const resolveRes = await request({
    ...BASE, path: `/api/issues/${createdIssue.id}/status`, method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${workerToken}`
    }
  }, { status: 'RESOLVED', remarks: 'Asphalt laid and leveled. Pothole completely repaired.' });
  assert(resolveRes.status === 200 && resolveRes.data.status === 'RESOLVED', 'TEST D.2: Worker resolves issue, status is RESOLVED');

  // TEST F: Citizen Reopens first
  const reopenRes = await request({
    ...BASE, path: `/api/issues/${createdIssue.id}/verify`, method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${citizenToken}`
    }
  }, { isResolved: false, remarks: 'Surface is still uneven and bitumen is loose.' });
  assert(reopenRes.status === 200 && reopenRes.data.status === 'REOPENED', 'TEST F.1: Citizen reopens complaint, status becomes REOPENED');

  // Municipal re-resolves
  await request({
    ...BASE, path: `/api/issues/${createdIssue.id}/status`, method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${workerToken}`
    }
  }, { status: 'IN_PROGRESS', remarks: 'Worker returned for final compaction.' });

  await request({
    ...BASE, path: `/api/issues/${createdIssue.id}/status`, method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${workerToken}`
    }
  }, { status: 'RESOLVED', remarks: 'Compacted with heavy roller. Smooth surface verified.' });

  // TEST E: Citizen Verifies Resolution
  const verifyRes = await request({
    ...BASE, path: `/api/issues/${createdIssue.id}/verify`, method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${citizenToken}`
    }
  }, { isResolved: true, remarks: 'Confirmed fully fixed. Thank you!' });
  assert(verifyRes.status === 200 && verifyRes.data.status === 'CLOSED', 'TEST E.1: Citizen verifies resolution, status becomes CLOSED');

  // SECURITY & RBAC TESTS
  console.log('\n--- SECURITY & ACCESS CONTROL TESTS ---');
  
  // S1: Citizen cannot access /api/issues/all
  const s1 = await request({
    ...BASE, path: '/api/issues/all', method: 'GET',
    headers: { 'Authorization': `Bearer ${citizenToken}` }
  });
  assert(s1.status === 403, 'SECURITY 1: Citizen accessing municipal /api/issues/all returns 403 Forbidden');

  // S2: Worker cannot access /api/departments
  const s2 = await request({
    ...BASE, path: '/api/departments', method: 'GET',
    headers: { 'Authorization': `Bearer ${workerToken}` }
  });
  assert(s2.status === 403, 'SECURITY 2: Worker accessing admin /api/departments returns 403 Forbidden');

  // S3: Unauthenticated request
  const s3 = await request({
    ...BASE, path: '/api/issues/my-issues', method: 'GET'
  });
  assert(s3.status === 401, 'SECURITY 3: Unauthenticated request returns 401 Unauthorized');

  // S4: Reopening without reason is rejected
  const s4 = await request({
    ...BASE, path: `/api/issues/CC-DEMO-1008/verify`, method: 'POST', // Demo 1008 is RESOLVED
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${citizenToken}`
    }
  }, { isResolved: false, remarks: '' });
  assert(s4.status === 400, 'SECURITY 4: Reopening without reason returns 400 Bad Request');

  // S5: Worker cannot update status of an issue assigned to someone else or unassigned
  const s5 = await request({
    ...BASE, path: `/api/issues/CC-DEMO-1000/status`, method: 'POST', // Demo 1000 has no assigned worker
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${workerToken}`
    }
  }, { status: 'IN_PROGRESS', remarks: 'Unauthorized worker attempt' });
  assert(s5.status === 403, 'SECURITY 5: Worker updating another issue returns 403 Forbidden');

  // S6: Officer cannot update status of an issue outside their department
  const s6 = await request({
    ...BASE, path: `/api/issues/CC-DEMO-1001/status`, method: 'POST', // Demo 1001 is Sanitation (dept_2), officer is Roads (dept_1)
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${officerToken}`
    }
  }, { status: 'IN_PROGRESS', remarks: 'Unauthorized officer cross-department attempt' });
  assert(s6.status === 403, 'SECURITY 6: Officer updating another department issue returns 403 Forbidden');

  // S7: Verify /api/analytics returns department and avg resolution calculations
  const analyticsRes = await request({
    ...BASE, path: '/api/analytics', method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(
    analyticsRes.status === 200 &&
    analyticsRes.data.byDepartment &&
    analyticsRes.data.byDate &&
    typeof analyticsRes.data.avgResolutionHours === 'number',
    'ANALYTICS: Backend returns real byDepartment, byDate, and avgResolutionHours'
  );

  // --- MAP ACCESS CONTROL & SCOPING TESTS ---
  console.log('\n--- MAP ACCESS CONTROL & SCOPING TESTS ---');

  // M1: Citizen requests to municipal map API are rejected with 403 Forbidden
  const m1 = await request({
    ...BASE, path: '/api/issues/map', method: 'GET',
    headers: { 'Authorization': `Bearer ${citizenToken}` }
  });
  assert(m1.status === 403, 'MAP 1: Citizen request to /api/issues/map is rejected with 403 Forbidden');

  // M2: Unauthenticated request to /api/issues/map returns 401 Unauthorized
  const m2 = await request({
    ...BASE, path: '/api/issues/map', method: 'GET'
  });
  assert(m2.status === 401, 'MAP 2: Unauthenticated request to /api/issues/map returns 401 Unauthorized');

  // M3: Admin can access complete municipal map with all authorized complaint locations
  const m3 = await request({
    ...BASE, path: '/api/issues/map', method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminMapIssues = m3.data;
  assert(
    m3.status === 200 && Array.isArray(adminMapIssues) && adminMapIssues.length > 0,
    'MAP 3.1: Admin successfully retrieves municipal map issues'
  );
  const allHaveCoords = adminMapIssues.every(i => typeof i.latitude === 'number' && typeof i.longitude === 'number' && !isNaN(i.latitude) && !isNaN(i.longitude));
  assert(allHaveCoords, 'MAP 3.2: All returned map issues have valid numerical coordinates');
  const noCitizenPII = adminMapIssues.every(i => !i.citizenId && !i.passwordHash && !i.phone && !i.email);
  assert(noCitizenPII, 'MAP 3.3: Citizen personal information (phone, email, citizenId) is NOT exposed in map markers');

  // M4: Officer can access municipal map within authorized department scope only (dept_1)
  const m4 = await request({
    ...BASE, path: '/api/issues/map', method: 'GET',
    headers: { 'Authorization': `Bearer ${officerToken}` }
  });
  const officerMapIssues = m4.data;
  assert(
    m4.status === 200 && Array.isArray(officerMapIssues),
    'MAP 4.1: Officer successfully retrieves map issues'
  );
  const officerInScope = officerMapIssues.every(i => i.assignedDepartmentId === 'dept_1' || i.recommendedDepartmentId === 'dept_1');
  assert(officerInScope, 'MAP 4.2: Officer map issues are strictly within their authorized department scope (dept_1)');

  // M5: Officer CANNOT access complaints outside their authorized scope by changing request parameters
  const m5 = await request({
    ...BASE, path: '/api/issues/map?departmentId=dept_2', method: 'GET',
    headers: { 'Authorization': `Bearer ${officerToken}` }
  });
  const officerTamperIssues = m5.data;
  const officerTamperContainedDept2 = officerTamperIssues.some(i => i.assignedDepartmentId === 'dept_2');
  assert(
    m5.status === 200 && !officerTamperContainedDept2,
    'MAP 5: Officer cannot retrieve other department (dept_2) complaints by changing query parameters'
  );

  // M6: Worker can access municipal map and see assigned work locations only
  const m6 = await request({
    ...BASE, path: '/api/issues/map', method: 'GET',
    headers: { 'Authorization': `Bearer ${workerToken}` }
  });
  const workerMapIssues = m6.data;
  assert(
    m6.status === 200 && Array.isArray(workerMapIssues),
    'MAP 6.1: Worker successfully retrieves map issues'
  );
  const workerAllAssigned = workerMapIssues.every(i => i.assignedWorkerId === workerId);
  assert(workerAllAssigned, 'MAP 6.2: Worker map issues are strictly complaints assigned to this worker');

  // M7: Worker CANNOT retrieve unassigned or others complaints by changing request parameters
  const m7 = await request({
    ...BASE, path: '/api/issues/map?workerId=ADMIN001&all=true&status=ALL', method: 'GET',
    headers: { 'Authorization': `Bearer ${workerToken}` }
  });
  const workerTamperIssues = m7.data;
  const workerTamperUnassigned = workerTamperIssues.some(i => i.assignedWorkerId !== workerId);
  assert(
    m7.status === 200 && !workerTamperUnassigned,
    'MAP 7: Worker cannot retrieve unassigned or other worker complaint locations by changing request parameters'
  );

  console.log('\n--- PASSWORD RECOVERY & SECURITY TESTS ---');

  // P1: Non-existent email receives generic message (no user enumeration)
  const p1 = await request({
    ...BASE, path: '/api/auth/forgot-password', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'nonexistent_account@example.com' });
  assert(
    p1.status === 200 && p1.data.message === 'If an account exists for this email, password reset instructions will be sent.',
    'PASSWORD 1: Forgot password returns generic message for non-existent email'
  );

  // P2: Existing Citizen email receives identical generic message
  const p2 = await request({
    ...BASE, path: '/api/auth/forgot-password', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'citizen@example.com' });
  assert(
    p2.status === 200 && p2.data.message === 'If an account exists for this email, password reset instructions will be sent.',
    'PASSWORD 2: Forgot password returns identical generic response for existing citizen'
  );
  const rawResetToken = p2.data.devResetUrl ? p2.data.devResetUrl.split('/reset-password/')[1] : null;

  // P3: Invalid reset token rejected
  const p3 = await request({
    ...BASE, path: '/api/auth/verify-reset-token/invalid_token_123', method: 'GET'
  });
  assert(
    p3.status === 400 && p3.data.valid === false,
    'PASSWORD 3: Invalid reset token verification is rejected with 400'
  );

  if (rawResetToken) {
    // P4: Valid reset token verification succeeds
    const p4 = await request({
      ...BASE, path: `/api/auth/verify-reset-token/${rawResetToken}`, method: 'GET'
    });
    assert(
      p4.status === 200 && p4.data.valid === true && p4.data.userType === 'citizen',
      'PASSWORD 4: Valid reset token is verified with masked email and userType'
    );

    // P5: Reset password with short password rejected
    const p5 = await request({
      ...BASE, path: '/api/auth/reset-password', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { token: rawResetToken, newPassword: '123' });
    assert(
      p5.status === 400,
      'PASSWORD 5: Password under 6 characters is rejected'
    );

    // P6: Reset password successfully
    const p6 = await request({
      ...BASE, path: '/api/auth/reset-password', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { token: rawResetToken, newPassword: 'CitizenUpdated@123' });
    assert(
      p6.status === 200,
      'PASSWORD 6: Reset password with valid token succeeds'
    );

    // P7: Reusing single-use reset token fails
    const p7 = await request({
      ...BASE, path: '/api/auth/reset-password', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { token: rawResetToken, newPassword: 'AnotherPassword@123' });
    assert(
      p7.status === 400,
      'PASSWORD 7: Reusing single-use reset token is rejected with 400'
    );

    // P8: Login with old password fails
    const p8Old = await request({
      ...BASE, path: '/api/auth/citizen/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'citizen@example.com', password: 'Citizen@123' });
    assert(
      p8Old.status === 400,
      'PASSWORD 8: Login with old password fails after reset'
    );

    // P9: Login with new password succeeds
    const p9New = await request({
      ...BASE, path: '/api/auth/citizen/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'citizen@example.com', password: 'CitizenUpdated@123' });
    assert(
      p9New.status === 200 && p9New.data.token,
      'PASSWORD 9: Login with newly reset password succeeds'
    );

    // P10: Previous session token before password change is invalidated
    const p10OldSession = await request({
      ...BASE, path: '/api/auth/me', method: 'GET',
      headers: { 'Authorization': `Bearer ${citizenToken}` }
    });
    assert(
      p10OldSession.status === 401,
      'PASSWORD 10: Previous session token is invalidated after password change'
    );

    // Reset password back to Citizen@123 for repeatability
    const pRestoreForgot = await request({
      ...BASE, path: '/api/auth/forgot-password', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'citizen@example.com' });
    const restoreToken = pRestoreForgot.data.devResetUrl?.split('/reset-password/')[1];
    if (restoreToken) {
      await request({
        ...BASE, path: '/api/auth/reset-password', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { token: restoreToken, newPassword: 'Citizen@123' });
    }
  }

  // P11: Municipal staff password recovery works similarly
  const p11 = await request({
    ...BASE, path: '/api/auth/forgot-password', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'officer@municipal.gov', portal: 'municipal' });
  assert(
    p11.status === 200 && p11.data.message.includes('password reset instructions will be sent'),
    'PASSWORD 11: Municipal staff password recovery request succeeds'
  );

  console.log(`\n--- TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed === 0) {
    console.log('ALL TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
};

runTests().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
