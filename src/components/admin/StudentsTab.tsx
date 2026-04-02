import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Search, ShieldCheck } from 'lucide-react';

interface StudentsTabProps {
  students: any[];
  classes: any[];
  onDeleteClick: (massarId: string) => void;
  onSummonToggle: (massarId: string) => void;
  onPardon: (massarId: string) => void;
}

export const StudentsTab = ({ students, classes, onDeleteClick, onSummonToggle, onPardon }: StudentsTabProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  // Filter classes based on selected branch
  const filteredClasses = useMemo(() => {
    if (!selectedBranch) return [];
    return classes.filter(cls => {
      return cls.branch === selectedBranch;
    });
  }, [classes, selectedBranch]);

  const filteredStudents = useMemo(() => {
    // ADMIN VIEW: The "Manage Students" table must remain EMPTY until a Branch and Class are selected.
    if (!selectedBranch || !selectedClass) return [];

    const query = searchQuery.toLowerCase().trim();
    
    return students.filter(s => {
      const sClass = s.profile?.class || s.className;
      if (sClass !== selectedClass) return false;

      if (!query) return true;
      const name = (s.profile?.name || s.name || '').toLowerCase();
      const mId = (s.massar_id || s.massarId || '').toLowerCase();
      return name.includes(query) || mId.includes(query);
    });
  }, [students, searchQuery, selectedBranch, selectedClass]);

  return (
    <motion.div
      key="Students"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div dir="rtl">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">إدارة التلاميذ</h2>
          <p className="text-slate-500 mt-1 text-lg">قائمة التلاميذ وتوزيعهم على الأقسام</p>
        </div>
      </div>

      {/* Hierarchical Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" dir="rtl">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">الشعبة</label>
          <select 
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setSelectedClass('');
            }}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold shadow-sm"
          >
            <option value="">اختر الشعبة</option>
            <option value="Scientific">علوم</option>
            <option value="Literary">آداب</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">القسم</label>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={!selectedBranch}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold shadow-sm disabled:opacity-50"
          >
            <option value="">اختر القسم</option>
            {filteredClasses.map(cls => (
              <option key={cls.id} value={cls.name}>{cls.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">بحث</label>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="بحث بالاسم أو المسار..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={!selectedClass}
              className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 outline-none shadow-sm disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" dir="rtl">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider text-right">الاسم الكامل</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider text-right">القسم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700 uppercase tracking-wider text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const mId = student.massar_id || student.massarId;
                const name = student.profile?.name || student.name;
                const className = student.profile?.class || student.className;
                const isSummoned = student.status_flags?.is_summoned || student.is_summoned;
                
                // Check if last status was absent or late and not already pardoned
                const lastHistory = student.attendance_history?.[student.attendance_history.length - 1];
                const isPardoned = lastHistory?.is_pardoned;
                const canPardon = lastHistory && (lastHistory.status === 'absent' || lastHistory.status === 'late') && !isPardoned;

                return (
                  <tr key={mId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                      <div className="flex items-center gap-2">
                        <div>
                          <p>{name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{mId}</p>
                        </div>
                        {isPardoned && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">
                            تمت التسوية
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 text-right font-bold">{className}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        {canPardon && (
                          <button 
                            onClick={() => onPardon(mId)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
                            title="تسوية وضعية الغياب"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            إلغاء الغياب (تسوية)
                          </button>
                        )}
                        <button 
                          onClick={() => onSummonToggle(mId)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSummoned 
                              ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isSummoned ? 'إلغاء التوجيه' : 'توجيه للإدارة'}
                        </button>
                        <button 
                          onClick={() => onDeleteClick(mId)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!selectedBranch || !selectedClass) && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                    يرجى اختيار الشعبة والقسم لعرض التلاميذ
                  </td>
                </tr>
              )}
              {selectedBranch && selectedClass && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                    لا يوجد تلاميذ يطابقون بحثك في هذا القسم
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
