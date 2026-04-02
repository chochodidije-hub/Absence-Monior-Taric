import React from 'react';
import { LogOut, GraduationCap, ChevronDown, Clock as ClockIcon, Calendar } from 'lucide-react';
import { formatVerifiedTime, formatVerifiedDate } from '../../lib/timeUtils';

interface TeacherHeaderProps {
  teacherName: string;
  selectedClass: string | null;
  onClassChange: (className: string | null) => void;
  assignedClasses: any[];
  totalStudents: number;
  presentCount: number;
  onLogout: () => void;
  selectedBranch: string;
  onBranchChange: (branch: string) => void;
  currentTime: Date | null;
}

export const TeacherHeader = ({
  teacherName,
  selectedClass,
  onClassChange,
  assignedClasses,
  totalStudents,
  presentCount,
  onLogout,
  selectedBranch,
  onBranchChange,
  currentTime
}: TeacherHeaderProps) => {
  const getClassesByBranch = (branchName: string) => {
    return assignedClasses
      .filter(cls => cls.branch === branchName)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
  };

  const filteredClasses = getClassesByBranch(selectedBranch);

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
      <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 p-2.5 rounded-2xl shadow-lg shadow-slate-200 transform hover:rotate-3 transition-transform">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black text-slate-900 leading-tight">ثانوية طارق بن زياد التأهيلية</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-slate-500 font-bold">الأستاذ: <span className="text-slate-900">{teacherName}</span></p>
              <div className="w-1 h-1 bg-slate-300 rounded-full" />
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                <Calendar className="w-3 h-3" />
                <span>{currentTime ? formatVerifiedDate(currentTime) : ''}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden xl:flex items-center gap-6 bg-slate-50 px-6 py-2.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500">
              <ClockIcon className="w-4 h-4" />
              <span className="text-sm font-black font-mono">{currentTime ? formatVerifiedTime(currentTime) : ''}</span>
            </div>
            {selectedClass && (
              <>
                <div className="h-4 w-px bg-slate-200" />
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">المجموع:</span>
                    <span className="text-sm font-black text-slate-900">{totalStudents}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">الحضور:</span>
                    <span className="text-sm font-black text-emerald-600">{presentCount}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <select 
                value={selectedBranch} 
                onChange={(e) => onBranchChange(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-200 px-6 py-2.5 pr-10 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer transition-all hover:bg-white"
              >
                <option value="Scientific">علوم</option>
                <option value="Literary">آداب</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative group">
              <select 
                value={selectedClass || ''} 
                onChange={(e) => onClassChange(e.target.value || null)}
                className="appearance-none bg-slate-50 border border-slate-200 px-6 py-2.5 pr-10 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer transition-all hover:bg-white min-w-[140px]"
              >
                <option value="">اختر القسم...</option>
                {filteredClasses.map((cls) => (
                  <option key={cls.id || cls.name} value={cls.name}>{cls.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button 
              onClick={onLogout}
              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95 group"
              title="تسجيل الخروج"
            >
              <LogOut className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
