import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, BookOpen, GraduationCap, Settings
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { Modal } from './Modal';

// Sub-components
import { Header } from './admin/Header';
import { Sidebar } from './admin/Sidebar';
import { DashboardTab } from './admin/DashboardTab';
import { TeachersTab } from './admin/TeachersTab';
import { ClassesTab } from './admin/ClassesTab';
import { StudentsTab } from './admin/StudentsTab';
import { SettingsTab } from './admin/SettingsTab';

// Forms
import { TeacherAddForm } from './admin/TeacherAddForm';
import { TeacherAssignForm } from './admin/TeacherAssignForm';
import { TeacherResetForm } from './admin/TeacherResetForm';
import { ClassAddForm } from './admin/ClassAddForm';
import { StudentAddForm } from './admin/StudentAddForm';

interface AdminDashboardProps {
  onLogout: () => void;
  teachers: any[];
  setTeachers: any;
  classes: any[];
  setClasses: any;
  students: any[];
  setStudents: any;
  attendanceRecords: any[];
  setAttendanceRecords: any;
  settings: any;
  setSettings: any;
  onFactoryReset: () => void;
  onSelectiveWipe: () => void;
  verifiedTime: Date | null;
}

export default function AdminDashboard({ 
  onLogout, 
  teachers, 
  setTeachers, 
  classes, 
  setClasses, 
  students, 
  setStudents, 
  attendanceRecords,
  setAttendanceRecords,
  settings, 
  setSettings,
  onFactoryReset,
  onSelectiveWipe,
  verifiedTime
}: AdminDashboardProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  
  // Modal States
  const [activeModal, setActiveModal] = useState<null | 'add' | 'assign' | 'reset' | 'addClass' | 'addStudent'>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Users, label: 'Teachers' },
    { icon: BookOpen, label: 'Classes' },
    { icon: GraduationCap, label: 'Students' },
    { icon: Settings, label: 'Settings' },
  ];

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleAddTeacher = async (data: any) => {
    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setTeachers([...teachers, result]);
        setActiveModal(null);
      } else {
        alert(result.message || 'Failed to add teacher');
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert('An error occurred while adding the teacher');
    }
  };

  const handleAssignClasses = async (assignments: string[]) => {
    if (selectedTeacher) {
      try {
        const response = await fetch(`/api/teachers/${selectedTeacher.id}/classes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedClasses: assignments }),
        });
        if (response.ok) {
          setTeachers(teachers.map(t => 
            t.id === selectedTeacher.id 
              ? { ...t, assignedClasses: assignments } 
              : t
          ));
          setActiveModal(null);
        } else {
          alert('Failed to assign classes');
        }
      } catch (error) {
        console.error('Error assigning classes:', error);
      }
    }
  };

  const handleResetPassword = async (password: string) => {
    if (selectedTeacher) {
      try {
        const response = await fetch(`/api/teachers/${selectedTeacher.id}/password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        if (response.ok) {
          setActiveModal(null);
          alert('Password reset successfully');
        } else {
          alert('Failed to reset password');
        }
      } catch (error) {
        console.error('Error resetting password:', error);
      }
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الأستاذ؟')) {
      try {
        const response = await fetch(`/api/teachers/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setTeachers(teachers.filter((t: any) => t.id !== id));
        }
      } catch (error) {
        console.error('Error deleting teacher:', error);
      }
    }
  };

  const handleAddClass = (data: any) => {
    setClasses([...classes, { id: Date.now(), ...data }]);
    setActiveModal(null);
  };

  const handleDeleteClass = (id: number) => {
    setClasses(classes.filter((c: any) => c.id !== id));
  };

  const handleAddStudent = (data: any) => {
    const newStudent = {
      massar_id: data.massarId,
      profile: {
        name: data.name,
        class: data.className,
        order_num: data.serialNumber || (students.length + 1)
      },
      status_flags: {
        is_summoned: false,
        is_demo: false
      },
      attendance_history: []
    };
    setStudents([...students, newStudent]);
    setActiveModal(null);
  };

  const handleDeleteStudent = (massarId: string) => {
    setStudents(students.filter((s: any) => (s.massar_id || s.massarId) !== massarId));
  };

  const handleSummonToggle = (massarId: string, recordId?: number) => {
    // Update global students list
    setStudents(students.map((s: any) => {
      const mId = s.massar_id || s.massarId;
      if (mId === massarId) {
        if (s.status_flags) {
          return { ...s, status_flags: { ...s.status_flags, is_summoned: !s.status_flags.is_summoned } };
        }
        return { ...s, is_summoned: !s.is_summoned };
      }
      return s;
    }));

    // Update attendance records if a recordId is provided
    if (recordId) {
      setAttendanceRecords(attendanceRecords.map((record: any) => {
        if (record.id === recordId) {
          const studentsList = record.Students_List || record.students || [];
          const updatedList = studentsList.map((s: any) => {
            const mId = s.massar_id || s.massarId;
            if (mId === massarId) {
              return { ...s, is_summoned: !s.is_summoned };
            }
            return s;
          });
          return {
            ...record,
            [record.Students_List ? 'Students_List' : 'students']: updatedList
          };
        }
        return record;
      }));
    }
  };

  const handlePardon = (massarId: string) => {
    let recordIdToUpdate: number | null = null;

    setStudents((prev: any[]) => prev.map((s: any) => {
      const mId = s.massar_id || s.massarId;
      if (mId === massarId && s.attendance_history && s.attendance_history.length > 0) {
        const newHistory = [...s.attendance_history];
        const lastIndex = newHistory.length - 1;
        // Only pardon if the last status was absent or late and not already pardoned
        if ((newHistory[lastIndex].status === 'absent' || newHistory[lastIndex].status === 'late') && !newHistory[lastIndex].is_pardoned) {
          newHistory[lastIndex] = { ...newHistory[lastIndex], is_pardoned: true };
          recordIdToUpdate = newHistory[lastIndex].recordId;
          return { ...s, attendance_history: newHistory };
        }
      }
      return s;
    }));

    // Update attendance records if a recordId was found in the student's history
    if (recordIdToUpdate) {
      setAttendanceRecords((prev: any[]) => prev.map((record: any) => {
        if (record.id === recordIdToUpdate) {
          const studentsList = record.Students_List || record.students || [];
          const updatedList = studentsList.map((s: any) => {
            const mId = s.massar_id || s.massarId;
            if (mId === massarId) {
              return { ...s, is_pardoned: true };
            }
            return s;
          });
          return {
            ...record,
            [record.Students_List ? 'Students_List' : 'students']: updatedList
          };
        }
        return record;
      }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header 
        onLogout={onLogout} 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />

      <div className="flex flex-1 pt-16">
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          menuItems={menuItems}
        />

        <main className="flex-1 md:ml-64 p-6 md:p-10 bg-slate-50 min-h-[calc(100vh-64px)]">
          <AnimatePresence mode="wait">
            {activeTab === 'Dashboard' && (
              <DashboardTab 
                teachersCount={teachers.length}
                classesCount={classes.length}
                studentsCount={students.length}
                attendanceRecords={attendanceRecords}
                onSummonToggle={handleSummonToggle}
                verifiedTime={verifiedTime}
                students={students}
                classes={classes}
              />
            )}
            {activeTab === 'Teachers' && (
              <TeachersTab 
                teachers={teachers}
                onAddClick={() => setActiveModal('add')}
                onAssignClick={(teacher) => {
                  setSelectedTeacher(teacher);
                  setActiveModal('assign');
                }}
                onResetClick={(teacher) => {
                  setSelectedTeacher(teacher);
                  setActiveModal('reset');
                }}
                onDeleteClick={handleDeleteTeacher}
              />
            )}
            {activeTab === 'Classes' && (
              <ClassesTab 
                classes={classes}
                onAddClick={() => setActiveModal('addClass')}
                onDeleteClick={handleDeleteClass}
              />
            )}
            {activeTab === 'Students' && (
              <StudentsTab 
                students={students}
                classes={classes}
                onDeleteClick={handleDeleteStudent}
                onSummonToggle={handleSummonToggle}
                onPardon={handlePardon}
              />
            )}
            {activeTab === 'Settings' && (
              <SettingsTab 
                settings={settings}
                setSettings={setSettings}
                onFactoryReset={onSelectiveWipe}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {activeModal === 'add' && (
          <Modal 
            title="إضافة أستاذ جديد" 
            onClose={() => setActiveModal(null)} 
            onSave={() => document.getElementById('teacher-add-submit')?.click()}
          >
            <TeacherAddForm onSave={handleAddTeacher} />
          </Modal>
        )}

        {activeModal === 'assign' && (
          <Modal 
            title={`تحديد أقسام الأستاذ: ${selectedTeacher?.name}`} 
            onClose={() => setActiveModal(null)} 
            onSave={() => document.getElementById('teacher-assign-submit')?.click()}
          >
            <TeacherAssignForm 
              teacher={selectedTeacher} 
              classes={classes} 
              onSave={handleAssignClasses} 
            />
          </Modal>
        )}

        {activeModal === 'addClass' && (
          <Modal 
            title="إضافة قسم جديد" 
            onClose={() => setActiveModal(null)} 
            onSave={() => document.getElementById('class-add-submit')?.click()}
          >
            <ClassAddForm onSave={handleAddClass} />
          </Modal>
        )}

        {activeModal === 'reset' && (
          <Modal 
            title={`إعادة تعيين كلمة المرور: ${selectedTeacher?.username}`} 
            onClose={() => setActiveModal(null)} 
            onSave={() => document.getElementById('teacher-reset-submit')?.click()}
          >
            <TeacherResetForm onSave={handleResetPassword} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
