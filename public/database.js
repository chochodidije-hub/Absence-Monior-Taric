/**
 * Unified Database State with robust sync
 */

const initialState = {
  teachers: [],
  classes: [
    { id: 1, name: 'TCS-1', branch: 'علوم' },
    { id: 2, name: 'TCS-2', branch: 'علوم' },
    { id: 3, name: 'TCS-3', branch: 'علوم' },
    { id: 4, name: 'TCS-4', branch: 'علوم' }, // Added TCSF-4 as requested
    { id: 5, name: 'TCLF-1', branch: 'آداب' },
    { id: 6, name: 'TCLF-2', branch: 'آداب' },
    { id: 7, name: 'TCLF-3', branch: 'آداب' },
  ],
  students: [],
  attendanceRecords: [],
  settings: {
    systemName: 'Absence Monitor',
    academicYear: '2025/2026',
    notifications: true,
  }
};

function loadDatabase() {
  try {
    const saved = localStorage.getItem('APP_DATABASE');
    const teachers = localStorage.getItem('TEACHER_ACCOUNTS');
    const classes = localStorage.getItem('CLASS_CONFIG');
    
    let dbObj = { ...initialState };

    if (saved) {
      const parsed = JSON.parse(saved);
      dbObj = { ...dbObj, ...parsed };
    }
    if (teachers) dbObj.teachers = JSON.parse(teachers);
    if (classes) dbObj.classes = JSON.parse(classes);
    
    // Data Integrity: Ensure required fields exist
    if (!dbObj.classes || dbObj.classes.length === 0) dbObj.classes = initialState.classes;
    if (!dbObj.settings) dbObj.settings = initialState.settings;
    
    return dbObj;
  } catch (e) {
    console.error('Failed to load database, resetting to initial state', e);
    return initialState;
  }
}

function saveDatabase(db) {
  try {
    const { teachers, classes, ...rest } = db;
    localStorage.setItem('APP_DATABASE', JSON.stringify(rest));
    localStorage.setItem('TEACHER_ACCOUNTS', JSON.stringify(teachers));
    localStorage.setItem('CLASS_CONFIG', JSON.stringify(classes));
  } catch (e) {
    console.error('Failed to save database', e);
  }
}

// Export for browser
window.dbUtils = { loadDatabase, saveDatabase, initialState };
