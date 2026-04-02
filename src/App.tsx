/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Lock, User, AlertCircle, Clock as ClockIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import AdminDashboard from './components/AdminDashboard';
import TeacherInterface from './components/TeacherInterface';
import { fetchGlobalTime, formatVerifiedDate, formatVerifiedTime } from './lib/timeUtils';
import { sanitize, schemas } from './lib/security';

// Initialize Global Flag
(window as any).pendingSystemWipe = false;

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [verifiedTime, setVerifiedTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Global Time Polling (Local Device Time)
  useEffect(() => {
    const updateTime = () => {
      setVerifiedTime(new Date());
    };
    updateTime();
    const timer = setInterval(updateTime, 1000); // Update every second for smooth UI
    return () => clearInterval(timer);
  }, []);

  const initialState = {
    teachers: [],
    classes: [
      { id: 1, name: 'TCSF-1', branch: 'Scientific' },
      { id: 2, name: 'TCSF-2', branch: 'Scientific' },
      { id: 3, name: 'TCSF-3', branch: 'Scientific' },
      { id: 4, name: 'TCSF-4', branch: 'Scientific' },
      { id: 5, name: 'TCLF-1', branch: 'Literary' },
      { id: 6, name: 'TCLF-2', branch: 'Literary' },
      { id: 7, name: 'TCLF-3', branch: 'Literary' },
    ],
    students: [],
    attendanceRecords: [],
    settings: {
      systemName: 'Absence Monitor',
      academicYear: '2025/2026',
      notifications: true,
    }
  };

  // Unified Database State
  const [db, setDb] = useState<any>(initialState);

  // Fetch initial data from backend if needed, or use local for now but with API patterns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendanceRes, teachersRes] = await Promise.all([
          fetch('/api/attendance'),
          fetch('/api/teachers')
        ]);
        
        if (attendanceRes.ok) {
          const data = await attendanceRes.json();
          setDb((prev: any) => ({ ...prev, attendanceRecords: data }));
        }
        
        if (teachersRes.ok) {
          const data = await teachersRes.json();
          setDb((prev: any) => ({ ...prev, teachers: data }));
        }
      } catch (e) {
        console.error('Failed to fetch data', e);
      }
    };
    fetchData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Frontend Validation (OWASP)
      schemas.username.parse(username);
      schemas.password.parse(password);

      // 2. Frontend Sanitization (OWASP)
      const cleanUsername = sanitize(username);
      const cleanPassword = sanitize(password);

      // 3. Backend Call (OWASP - Rate Limiting & Parameterized Queries on Server)
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUserRole(data.user.role);
        setCurrentUser(data.user);
      } else {
        setError(data.message || 'Invalid username or password');
      }
    } catch (err: any) {
      if (err.errors) {
        setError(err.errors[0].message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFactoryReset = () => {
    // Force a complete wipe
    localStorage.clear();
    setDb(initialState);
    (window as any).pendingSystemWipe = false;
    window.location.reload();
  };

  const selectiveWipe = () => {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذه العملية.')) {
      handleFactoryReset();
    }
  };

  // Expose system_clear_all_data and factoryReset to window for developer access
  useEffect(() => {
    (window as any).system_clear_all_data = selectiveWipe;
    (window as any).factoryReset = selectiveWipe;
    (window as any).finalFactoryReset = selectiveWipe;
    (window as any).selectiveWipe = selectiveWipe;
  }, []);

  const setTeachers = (val: any) => setDb((prev: any) => ({ ...prev, teachers: typeof val === 'function' ? val(prev.teachers) : val }));
  const setClasses = (val: any) => setDb((prev: any) => ({ ...prev, classes: typeof val === 'function' ? val(prev.classes) : val }));
  const setStudents = (val: any) => setDb((prev: any) => ({ ...prev, students: typeof val === 'function' ? val(prev.students) : val }));
  const setAttendanceRecords = (val: any) => setDb((prev: any) => ({ ...prev, attendanceRecords: typeof val === 'function' ? val(prev.attendanceRecords) : val }));
  const setSettings = (val: any) => setDb((prev: any) => ({ ...prev, settings: typeof val === 'function' ? val(prev.settings) : val }));

  const { teachers, classes, students, attendanceRecords, settings } = db;

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUser(null);
    setUsername('');
    setPassword('');
  };

  if (userRole === 'admin') {
    return (
      <AdminDashboard 
        onLogout={handleLogout} 
        teachers={teachers}
        setTeachers={setTeachers}
        classes={classes}
        setClasses={setClasses}
        students={students}
        setStudents={setStudents}
        attendanceRecords={attendanceRecords}
        setAttendanceRecords={setAttendanceRecords}
        settings={settings}
        setSettings={setSettings}
        onFactoryReset={selectiveWipe}
        onSelectiveWipe={selectiveWipe}
        verifiedTime={verifiedTime}
      />
    );
  }

  if (userRole === 'teacher') {
    const currentTeacherData = teachers.find(t => t.id === currentUser?.id);
    return (
      <TeacherInterface 
        onLogout={handleLogout} 
        teacher={currentTeacherData || currentUser} 
        allStudents={students} 
        setAllStudents={setStudents}
        attendanceRecords={attendanceRecords}
        setAttendanceRecords={setAttendanceRecords}
        classes={classes}
        verifiedTime={verifiedTime}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Absence Monitor</h1>
          <p className="text-slate-500 mt-2">Please enter your credentials to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all outline-none text-slate-900 placeholder:text-slate-400"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 ml-1" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all outline-none text-slate-900 placeholder:text-slate-400"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Login
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">
            Secure Access Control
          </p>
        </div>
      </motion.div>
    </div>
  );
}
