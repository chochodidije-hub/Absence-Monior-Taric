import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, BookOpen, GraduationCap, Clock, Eye, X, ShieldCheck, 
  Search, Filter, Calendar as CalendarIcon, ChevronRight, 
  TrendingUp, AlertCircle, CheckCircle2, SearchX
} from 'lucide-react';
import { formatVerifiedDate, formatVerifiedTime } from '../../lib/timeUtils';

interface DashboardTabProps {
  teachersCount: number;
  classesCount: number;
  studentsCount: number;
  attendanceRecords: any[];
  onSummonToggle: (massarId: string, recordId?: number) => void;
  verifiedTime: Date | null;
  students: any[];
  classes: any[];
}

export const DashboardTab = ({ 
  teachersCount, 
  classesCount, 
  studentsCount,
  attendanceRecords,
  onSummonToggle,
  verifiedTime,
  students,
  classes
}: DashboardTabProps) => {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterDate, setFilterDate] = useState('all');

  const todayStr = verifiedTime ? formatVerifiedDate(verifiedTime) : '';

  // Intelligence: Daily Snapshot
  const dailySnapshot = useMemo(() => {
    if (!todayStr) return { present: 0, absent: 0, late: 0, total: 0 };
    const todayRecords = attendanceRecords.filter(r => r.date === todayStr);
    let present = 0;
    let absent = 0;
    let late = 0;

    todayRecords.forEach(record => {
      const sList = record.Students_List || record.students || [];
      sList.forEach((s: any) => {
        if (s.status === 'present') present++;
        else if (s.status === 'absent') absent++;
        else if (s.status === 'late') late++;
      });
    });

    return { present, absent, late, total: present + absent + late };
  }, [attendanceRecords, todayStr]);

  // Data Organization: Categorized & Filtered Records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      const matchesSearch = 
        (record.Teacher_Name || record.teacherName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.Class_Name || record.className || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (record.Subject_Name || record.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const classObj = classes.find(c => c.name === (record.Class_Name || record.className));
      const matchesBranch = filterBranch === 'all' || classObj?.branch === filterBranch;
      const matchesDate = filterDate === 'all' || record.date === filterDate;

      return matchesSearch && matchesBranch && matchesDate;
    }).sort((a, b) => 
      new Date(b.Timestamp || b.timestamp || b.id).getTime() - new Date(a.Timestamp || a.timestamp || a.id).getTime()
    );
  }, [attendanceRecords, searchQuery, filterBranch, filterDate, classes]);

  const uniqueDates = useMemo(() => {
    const dates = new Set(attendanceRecords.map(r => r.date));
    return Array.from(dates).sort().reverse();
  }, [attendanceRecords]);

  const branches = useMemo(() => {
    const b = new Set(classes.map(c => c.branch).filter(Boolean));
    return Array.from(b);
  }, [classes]);

  const getAbsentees = (record: any) => {
    const students = record.Students_List || record.students || [];
    return students.filter((s: any) => (s.status === 'absent' || s.status === 'late') && !s.is_pardoned);
  };

  return (
    <motion.div
      key="Dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-8 pb-12"
    >
      {/* Header & Verified Time */}
      <div dir="rtl" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">لوحة التحكم الذكية</h2>
          <p className="text-slate-500 mt-1 text-lg font-medium">نظرة شاملة على حالة الغياب والحضور اليوم</p>
        </div>
        <div className="bg-white border border-slate-200 p-1.5 rounded-2xl flex items-center gap-1 shadow-sm self-start md:self-center">
          <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-wider">Verified Network Time</span>
          </div>
          <div className="px-4 py-2 text-right">
            <p className="text-lg font-black text-slate-900 leading-none">
              {verifiedTime ? (
                <>
                  {todayStr} <span className="text-emerald-600 ml-2">{formatVerifiedTime(verifiedTime)}</span>
                </>
              ) : (
                <span className="text-slate-400"></span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6" dir="rtl">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-slate-500 font-bold text-sm">إجمالي التلاميذ</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{studentsCount}</p>
            <div className="flex items-center gap-1 mt-2 text-blue-600 text-xs font-bold">
              <TrendingUp className="w-3 h-3" />
              <span>قاعدة البيانات كاملة</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-slate-500 font-bold text-sm">حاضرون اليوم</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{dailySnapshot.present}</p>
            <p className="text-xs text-slate-400 font-bold mt-2">بتاريخ {todayStr}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-slate-500 font-bold text-sm">غائبون اليوم</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{dailySnapshot.absent}</p>
            <p className="text-xs text-slate-400 font-bold mt-2">يحتاج لمتابعة</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-slate-500 font-bold text-sm">متأخرون اليوم</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{dailySnapshot.late}</p>
            <p className="text-xs text-slate-400 font-bold mt-2">تأخر غير مبرر</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-6" dir="rtl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text"
              placeholder="بحث عن أستاذ، قسم، أو مادة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-bold text-slate-900"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative min-w-[160px]">
              <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="w-full pr-10 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-bold text-slate-900 appearance-none"
              >
                <option value="all">جميع الشعب</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="relative min-w-[160px]">
              <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pr-10 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all font-bold text-slate-900 appearance-none"
              >
                <option value="all">جميع التواريخ</option>
                {uniqueDates.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed / Records List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden" dir="rtl">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900">سجل النشاط (Activity Feed)</h3>
            <p className="text-slate-500 font-medium mt-1">عرض آخر عمليات تسجيل الغياب الموثقة</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full">
            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-ping" />
            <span className="text-xs font-black">تحديث مباشر</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => {
              const absentees = getAbsentees(record);
              const classObj = classes.find(c => c.name === (record.Class_Name || record.className));
              
              return (
                <div key={record.id} className="p-6 hover:bg-slate-50 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${absentees.length > 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-black text-slate-900">
                          {record.Teacher_Name || record.teacherName}
                        </p>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-md uppercase">
                          {classObj?.branch || 'عام'}
                        </span>
                      </div>
                      <p className="text-slate-600 font-bold">
                        سجل الغياب للقسم <span className="text-slate-900">{record.Class_Name || record.className}</span> في مادة <span className="text-slate-900">{record.Subject_Name || record.subject}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-1">
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{record.verifiedTimestamp?.split(' ')[1] || record.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span>{record.date}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs font-black ${absentees.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${absentees.length > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                          <span>{absentees.length} غيابات/تأخرات</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedRecord(record)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm group-hover:shadow-md active:scale-95"
                  >
                    عرض التفاصيل الكاملة
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <SearchX className="w-10 h-10 text-slate-300" />
              </div>
              <div>
                <p className="text-slate-900 font-black text-xl">لم يتم العثور على نتائج</p>
                <p className="text-slate-400 font-bold mt-1">جرب تغيير معايير البحث أو الفلاتر</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Absentees Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] p-10 max-w-3xl w-full shadow-2xl border border-slate-100 space-y-8 relative overflow-hidden"
              dir="rtl"
            >
              <div className="absolute top-0 right-0 w-full h-2 bg-slate-900" />
              
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-black text-slate-900">تفاصيل الحصة</h3>
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase tracking-wider">
                      ID: #{selectedRecord.id.toString().slice(-4)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-500 font-bold">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <span>القسم: {selectedRecord.Class_Name || selectedRecord.className}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <span>المادة: {selectedRecord.Subject_Name || selectedRecord.subject}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-black">
                      <ShieldCheck className="w-4 h-4" />
                      <span>وقت موثق: {selectedRecord.verifiedTimestamp || selectedRecord.time}</span>
                    </div>
                    <p className="text-slate-400 text-xs font-bold">
                      تاريخ الإرسال: {selectedRecord.date}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="border border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50/30">
                <div className="max-h-[45vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-white sticky top-0 z-10 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">ر.ت</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">رقم مسار</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">الاسم الكامل</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">الحالة</th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white/50">
                      {(selectedRecord.Students_List || selectedRecord.students || []).map((student: any, idx: number) => {
                        const mId = student.massar_id || student.massarId;
                        const name = student.name || student.profile?.name;
                        const orderNum = student.profile?.order_num || student.serialNumber || (idx + 1);
                        const isSummoned = student.status_flags?.is_summoned || student.is_summoned;
                        const isPardoned = student.is_pardoned;

                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-xs font-black text-slate-400">{orderNum}</td>
                            <td className="px-6 py-4 text-xs font-mono font-black text-slate-600">{mId}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-900">{name}</span>
                                {isPardoned && (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full">
                                    تمت التسوية
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 ${
                                isPardoned ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                student.status === 'absent' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                student.status === 'late' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              }`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${
                                  isPardoned ? 'bg-emerald-600' :
                                  student.status === 'absent' ? 'bg-red-600' : 
                                  student.status === 'late' ? 'bg-amber-600' : 
                                  'bg-emerald-600'
                                }`} />
                                {isPardoned ? 'تمت التسوية' : (student.status === 'absent' ? 'غائب' : student.status === 'late' ? 'متأخر' : 'حاضر')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {!isPardoned && (student.status === 'absent' || student.status === 'late') && (
                                <button
                                  onClick={() => onSummonToggle(mId, selectedRecord.id)}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-sm active:scale-95 ${
                                    isSummoned 
                                      ? 'bg-red-600 text-white hover:bg-red-700' 
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {isSummoned ? 'تم الاستدعاء' : 'استدعاء'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="flex-1 bg-slate-900 text-white py-5 rounded-[1.5rem] font-black hover:bg-slate-800 transition-all shadow-xl active:scale-95 text-lg"
                >
                  إغلاق التفاصيل
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
