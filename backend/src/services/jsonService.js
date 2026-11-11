const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../../data');

const getFilePath = (filename) => path.join(DATA_DIR, `${filename}.json`);

const ensureDirExists = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const readData = (filename) => {
  ensureDirExists();
  const filePath = getFilePath(filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    if (!rawData || !rawData.trim()) {
      return [];
    }
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`Error reading/parsing JSON file ${filename}.json:`, err.message);
    // If a backup file exists, attempt reading from it
    const backupPath = `${filePath}.bak`;
    if (fs.existsSync(backupPath)) {
      try {
        const bakData = fs.readFileSync(backupPath, 'utf-8');
        return JSON.parse(bakData);
      } catch {}
    }
    return [];
  }
};

const writeData = (filename, data) => {
  ensureDirExists();
  const filePath = getFilePath(filename);
  const tempPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 7)}`;
  const backupPath = `${filePath}.bak`;
  const jsonString = JSON.stringify(data, null, 2);

  try {
    // Write to temp file first
    fs.writeFileSync(tempPath, jsonString, 'utf-8');
    
    // Create backup of current file if it exists
    if (fs.existsSync(filePath)) {
      try {
        fs.copyFileSync(filePath, backupPath);
      } catch {}
    }

    // Atomically replace file with temp file
    try {
      fs.renameSync(tempPath, filePath);
    } catch (renameErr) {
      // Windows file lock fallback: copy and unlink
      fs.copyFileSync(tempPath, filePath);
      try { fs.unlinkSync(tempPath); } catch {}
    }
  } catch (err) {
    console.error(`Failed atomic write for ${filename}.json:`, err.message);
    // Fallback direct write
    try {
      fs.writeFileSync(filePath, jsonString, 'utf-8');
    } catch (directErr) {
      console.error(`Direct write also failed for ${filename}.json:`, directErr.message);
    }
    if (fs.existsSync(tempPath)) {
      try { fs.unlinkSync(tempPath); } catch {}
    }
  }
};

const findById = (filename, id) => {
  const data = readData(filename);
  return data.find((item) => item.id === id);
};

const findOne = (filename, condition) => {
  const data = readData(filename);
  return data.find((item) => {
    return Object.keys(condition).every((key) => item[key] === condition[key]);
  });
};

const insert = (filename, item) => {
  const data = readData(filename);
  data.push(item);
  writeData(filename, data);
  return item;
};

const update = (filename, id, updates) => {
  const data = readData(filename);
  const index = data.findIndex((item) => item.id === id);
  if (index !== -1) {
    data[index] = { ...data[index], ...updates };
    writeData(filename, data);
    return data[index];
  }
  return null;
};

const deleteData = (filename, id) => {
  const data = readData(filename);
  const filtered = data.filter((item) => item.id !== id);
  writeData(filename, filtered);
};

module.exports = {
  readData,
  writeData,
  findById,
  findOne,
  insert,
  update,
  deleteData
};
