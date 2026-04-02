import React, { useRef } from 'react';
import { Plus, AlertCircle, BookOpen, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatVerifiedTime } from '../../lib/timeUtils';

interface TeacherControlsProps {
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  selectedGroup: 'all' | 'group1' | 'group2';
  onGroupChange: (val: 'all' | 'group1' | 'group2') => void;
  onSave: () => void;
  showSuccess: boolean;
  selectedSubject: string;
  onSubjectChange: (val: string) => void;
  selectedDuration: string;
  onDurationChange: (val: string) => void;
  selectedClass: string | null;
  selectedBranch: string;
  assignedClasses: any[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  currentTime: Date;
}

export const TeacherControls = ({
  onImport,
  selectedGroup,
  onGroupChange,
  onSave,
  showSuccess,
  selectedSubject,
  onSubjectChange,
  selectedDuration,
  onDurationChange,
  selectedClass,
  selectedBranch,
  assignedClasses,
  searchQuery,
  onSearchChange,
  currentTime
}: TeacherControlsProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine branch from selectedClass object if possible, otherwise use selectedBranch
  const currentClassObj = assignedClasses.find(c => c.name === selectedClass);
  const effectiveBranch = currentClassObj?.branch || selectedBranch;

  const isLiterary = effectiveBranch === 'Literary';

  const SUBJECTS_BY_BRANCH: Record<string, string[]> = {
    'Scientific': [
      'الرياضيات', 'الفيزياء والكيمياء', 'علوم الحياة والأرض', 'اللغة العربية', 
      'اللغة الفرنسية', 'اللغة الإنجليزية', 'التربية الإسلامية', 'الفلسفة', 
      'الاجتماعيات', 'التربية البدنية', 'المعلوميات'
    ],
    'Literary': [
      'الرياضيات', 'علوم الحياة والأرض', 'اللغة العربية', 'اللغة الفرنسية', 
      'اللغة الإنجليزية', 'الفلسفة', 'الاجتماعيات', 'التربية الإسلامية', 
      'التربية البدنية', 'المعلوميات'
    ]
  };

  const subjects = SUBJECTS_BY_BRANCH[effectiveBranch] || SUBJECTS_BY_BRANCH['Scientific'];

  const isSaveDisabled = !selectedSubject || !selectedDuration;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          {/* Group Selection Buttons */}
          <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button
              onClick={() => onGroupChange('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                selectedGroup === 'all' 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              القسم كامل
            </button>
            <button
              onClick={() => onGroupChange('group1')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                selectedGroup === 'group1' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              الفوج 1
            </button>
            <button
              onClick={() => onGroupChange('group2')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                selectedGroup === 'group2' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              الفوج 2
            </button>
          </div>

          {/* Subject Selection Dropdown */}
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 min-w-[180px]">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSubject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-sm text-slate-700 w-full cursor-pointer appearance-none"
            >
              <option value="">اختر المادة...</option>
              {subjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Duration Selection Dropdown */}
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100 min-w-[130px]">
            <select
              value={selectedDuration}
              onChange={(e) => onDurationChange(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-sm text-slate-700 w-full cursor-pointer appearance-none"
            >
              <option value="">مدة الحصة...</option>
              <option value="1h">ساعة واحدة</option>
              <option value="2h">ساعتان</option>
            </select>
          </div>

          {/* Search Input - Prominent */}
          <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-2xl border-2 border-slate-200 flex-1 min-w-[250px] focus-within:border-slate-900 transition-colors">
            <input 
              type="text"
              placeholder="🔍 بحث سريع عن تلميذ (الاسم أو رقم مسار)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent border-none outline-none font-bold text-slate-700 w-full placeholder:text-slate-400 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence>
            {showSuccess && (
              <motion.span 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-emerald-600 font-bold text-sm flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100"
              >
                <AlertCircle className="w-4 h-4" />
                تم الحفظ والمزامنة بنجاح
              </motion.span>
            )}
          </AnimatePresence>
          <button 
            onClick={onSave}
            disabled={isSaveDisabled}
            className={`px-8 py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95 flex flex-col items-center justify-center leading-tight ${
              isSaveDisabled 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
            }`}
          >
            <span className="text-sm">حفظ ورفع البيانات</span>
            <div className="flex items-center gap-1 mt-0.5 opacity-80">
              <ShieldCheck className="w-3 h-3" />
              <span className="text-[10px] font-mono tracking-tighter">Verified: {formatVerifiedTime(currentTime)}</span>
            </div>
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={onImport} 
          accept=".csv, .xlsx, .xls" 
          className="hidden" 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 w-full max-w-md justify-center"
        >
          <Plus className="w-6 h-6" />
          استيراد بيانات مسار من الجهاز
        </button>
        
        <button 
          onClick={() => {
            const csvContent = "الاسم الكامل,رقم مسار,القسم,المستوى,المسلك\nمحمد أمين,G123456789,TCSF-1,TCSF,Sciences\nفاطمة الزهراء,K987654321,TCSF-1,TCSF,Sciences";
            const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", "sample_students.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors underline"
        >
          تحميل نموذج ملف الاستيراد (CSV)
        </button>
      </div>
    </div>
  );
};
