const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const jsonService = require('../services/jsonService');
const { isEmailConfigured, sendPasswordResetEmail } = require('../services/emailService');
const { randomUUID: uuidv4 } = require('crypto');

const registerCitizen = async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    if (!name || !name.trim() || !email || !email.trim() || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    const existing = jsonService.findOne('citizens', { email: email.trim().toLowerCase() });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    
    const passwordHash = await bcrypt.hash(password, 10);
    const newCitizen = {
      id: uuidv4(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone || '').trim(),
      passwordHash,
      address: (address || '').trim(),
      createdAt: new Date().toISOString()
    };
    
    jsonService.insert('citizens', newCitizen);
    
    const token = jwt.sign({ id: newCitizen.id, role: 'citizen', authTime: Date.now() }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: newCitizen.id, name: newCitizen.name, email: newCitizen.email, role: 'citizen' } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const loginCitizen = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !email.trim() || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const citizen = jsonService.findOne('citizens', { email: email.trim().toLowerCase() });
    if (!citizen) return res.status(400).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, citizen.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: citizen.id, role: 'citizen', authTime: Date.now() }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: citizen.id, name: citizen.name, email: citizen.email, role: 'citizen' } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const loginMunicipal = async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    if (!employeeId || !employeeId.trim() || !password) {
      return res.status(400).json({ message: 'Employee ID or email, and password are required' });
    }
    const trimmedInput = employeeId.trim();
    const municipalUsers = jsonService.readData('municipal_users');
    const user = municipalUsers.find(u =>
      (u.employeeId && u.employeeId.toUpperCase() === trimmedInput.toUpperCase()) ||
      (u.email && u.email.toLowerCase() === trimmedInput.toLowerCase())
    );
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, role: user.role, departmentId: user.departmentId, authTime: Date.now() }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = (req, res) => {
  if (req.user.role === 'citizen') {
    const user = jsonService.findById('citizens', req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: 'citizen',
      createdAt: user.createdAt
    });
  } else {
    const user = jsonService.findById('municipal_users', req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    let deptName = null;
    if (user.departmentId) {
      const dept = jsonService.findById('departments', user.departmentId);
      if (dept) deptName = dept.name;
    }
    
    res.json({
      id: user.id,
      name: user.name,
      employeeId: user.employeeId,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: deptName,
      createdAt: user.createdAt
    });
  }
};

const updateProfile = (req, res) => {
  try {
    if (req.user.role === 'citizen') {
      const { name, phone, address } = req.body;
      const updates = {};
      if (name) updates.name = name;
      if (phone) updates.phone = phone;
      if (address) updates.address = address;
      const updated = jsonService.update('citizens', req.user.id, updates);
      if (!updated) return res.status(404).json({ message: 'User not found' });
      return res.json({ id: updated.id, name: updated.name, email: updated.email, phone: updated.phone, address: updated.address, role: 'citizen' });
    } else {
      const { name, email } = req.body;
      const updates = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      const updated = jsonService.update('municipal_users', req.user.id, updates);
      if (!updated) return res.status(404).json({ message: 'User not found' });
      return res.json({ id: updated.id, name: updated.name, employeeId: updated.employeeId, email: updated.email, role: updated.role, departmentId: updated.departmentId });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, portal } = req.body;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'A valid email address is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email format' });
    }

    // Always use generic response to prevent email enumeration
    const genericResponse = {
      message: 'If an account exists for this email, password reset instructions will be sent.',
      emailConfigured: isEmailConfigured()
    };

    const citizens = jsonService.readData('citizens');
    const municipalUsers = jsonService.readData('municipal_users');

    let user = null;
    let userType = null;

    if (portal === 'citizen') {
      user = citizens.find(c => c.email && c.email.toLowerCase() === trimmedEmail);
      if (user) userType = 'citizen';
    } else if (portal === 'municipal') {
      user = municipalUsers.find(u => u.email && u.email.toLowerCase() === trimmedEmail);
      if (user) userType = 'municipal';
    }

    if (!user) {
      user = citizens.find(c => c.email && c.email.toLowerCase() === trimmedEmail);
      if (user) {
        userType = 'citizen';
      } else {
        user = municipalUsers.find(u => u.email && u.email.toLowerCase() === trimmedEmail);
        if (user) userType = 'municipal';
      }
    }

    if (!user) {
      return res.json(genericResponse);
    }

    // Generate secure single-use time-limited reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresInMinutes = 60;
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    // Invalidate existing unused reset tokens for this user
    const existingResets = jsonService.readData('password_resets');
    const nowIso = new Date().toISOString();
    const updatedResets = existingResets.map(item => {
      if (item.userId === user.id && !item.used) {
        return { ...item, used: true, invalidatedAt: nowIso };
      }
      return item;
    });

    const newResetRecord = {
      id: uuidv4(),
      userId: user.id,
      userType,
      email: user.email,
      tokenHash,
      expiresAt,
      used: false,
      createdAt: nowIso
    };
    updatedResets.push(newResetRecord);
    jsonService.writeData('password_resets', updatedResets);

    // Build reset URL
    const forwardedProto = req.headers['x-forwarded-proto'];
    const proto = forwardedProto ? String(forwardedProto).split(',')[0].trim() : req.protocol;
    const host = req.get('host');
    const originFromReq = host ? `${proto}://${host}` : null;
    const rawFrontendUrl = process.env.FRONTEND_URL || (process.env.VERCEL && originFromReq) || 'http://localhost:5173';
    const frontendUrl = rawFrontendUrl.replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    // Send email or log link safely
    await sendPasswordResetEmail({
      toEmail: user.email,
      recipientName: user.name,
      resetUrl,
      expiresInMinutes
    });

    // In dev/test environments without SMTP, provide devResetUrl for testing
    if (process.env.NODE_ENV !== 'production' && !isEmailConfigured()) {
      return res.json({
        ...genericResponse,
        devResetUrl: resetUrl
      });
    }

    return res.json(genericResponse);
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ message: 'Server error processing request' });
  }
};

const verifyResetToken = (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ valid: false, message: 'Reset token is required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = jsonService.findOne('password_resets', { tokenHash });

    if (!resetRecord) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired password reset link' });
    }

    if (resetRecord.used) {
      return res.status(400).json({ valid: false, message: 'This password reset link has already been used' });
    }

    if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ valid: false, message: 'This password reset link has expired' });
    }

    const [local, domain] = resetRecord.email.split('@');
    const maskedEmail = local.length > 2
      ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`
      : `${local[0]}*@${domain}`;

    return res.json({
      valid: true,
      maskedEmail,
      userType: resetRecord.userType
    });
  } catch (error) {
    res.status(500).json({ valid: false, message: 'Server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = jsonService.findOne('password_resets', { tokenHash });

    if (!resetRecord) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (resetRecord.used) {
      return res.status(400).json({ message: 'This reset token has already been used' });
    }

    if (new Date(resetRecord.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ message: 'This reset token has expired' });
    }

    const collection = resetRecord.userType === 'citizen' ? 'citizens' : 'municipal_users';
    const user = jsonService.findById(collection, resetRecord.userId);
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    // Hash new password using bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const nowIso = new Date().toISOString();

    // Update password and record passwordChangedAt for session invalidation
    jsonService.update(collection, user.id, {
      passwordHash,
      passwordChangedAt: nowIso
    });

    // Invalidate this token and all other tokens for this user
    const allResets = jsonService.readData('password_resets');
    const updatedResets = allResets.map(item => {
      if (item.id === resetRecord.id) {
        return { ...item, used: true, usedAt: nowIso };
      }
      if (item.userId === user.id && !item.used) {
        return { ...item, used: true, invalidatedAt: nowIso };
      }
      return item;
    });
    jsonService.writeData('password_resets', updatedResets);

    return res.json({
      message: 'Password has been successfully reset. You can now log in with your new password.',
      userType: resetRecord.userType
    });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: 'Server error resetting password' });
  }
};

module.exports = {
  registerCitizen,
  loginCitizen,
  loginMunicipal,
  getMe,
  updateProfile,
  forgotPassword,
  verifyResetToken,
  resetPassword
};
