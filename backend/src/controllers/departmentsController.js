const jsonService = require('../services/jsonService');

const getDepartments = (req, res) => {
  try {
    const departments = jsonService.readData('departments');
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getDepartmentMembers = (req, res) => {
  try {
    const { id } = req.params;
    const allUsers = jsonService.readData('municipal_users');
    const members = allUsers
      .filter(u => u.departmentId === id && (u.role === 'OFFICER' || u.role === 'WORKER'))
      .map(u => ({ id: u.id, name: u.name, employeeId: u.employeeId, role: u.role, departmentId: u.departmentId }));
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDepartments, getDepartmentMembers };
