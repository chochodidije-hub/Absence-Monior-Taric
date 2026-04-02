import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Save, CheckCircle2, Search, Filter, Trash2, Edit2 } from 'lucide-react';
import XLSX from 'xlsx-js-style';
import confetti from 'canvas-confetti';
import { fetchGlobalTime, formatVerifiedTime, formatVerifiedDate } from '../lib/timeUtils';

// Sub-components
import { TeacherHeader } from './teacher/TeacherHeader';
import { TeacherControls } from './teacher/TeacherControls';
import { AttendanceTable } from './teacher/AttendanceTable';

interface TeacherInterfaceProps {
  onLogout: () => void;
  teacher: any;
  allStudents: any[];
  setAllStudents: React.Dispatch<React.SetStateAction<any[]>>;
  attendanceRecords: any[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<any[]>>;
  classes: any[];
  verifiedTime: Date | null;
}

export default function TeacherInterface({ 
  onLogout, 
  teacher, 
  allStudents, 
  setAllStudents, 
  attendanceRecords, 
  setAttendanceRecords,
  classes,
  verifiedTime
}: TeacherInterfaceProps) {
  const [selectedBranch, setSelectedBranch] = useState<string>('Scientific');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [attendance, setAttendance] = useState<{[key: string]: 'present' | 'absent' | 'late'}>({});
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'group1' | 'group2'>('all');
  const [showSuccess, setShowSuccess] = useState(false);

  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Enrich assignedClasses with branch info from the global classes list
  const assignedClasses = useMemo(() => {
    const teacherAssignedNames = teacher?.assignedClasses || [];
    return teacherAssignedNames.map((name: string) => {
      const classObj = classes.find(c => c.name === name);
      return {
        name,
        branch: classObj?.branch || 'Scientific',
        id: classObj?.id || name
      };
    });
  }, [teacher, classes]);
  
  // --- Smart Subject Logic ---
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

  const getSubjectsForBranch = (branch: string) => {
    return SUBJECTS_BY_BRANCH[branch] || SUBJECTS_BY_BRANCH['Scientific'];
  };

  const currentClassObj = useMemo(() => assignedClasses.find(c => c.name === selectedClass), [assignedClasses, selectedClass]);
  const effectiveBranch = currentClassObj?.branch || selectedBranch;
  const availableSubjects = useMemo(() => getSubjectsForBranch(effectiveBranch), [effectiveBranch]);

  // Reset subject if it's not valid for the current branch
  useEffect(() => {
    if (selectedSubject && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject('');
    }
  }, [availableSubjects, selectedSubject]);

  const MAX_STUDENTS_CAPACITY = 60;
  
  const studentsInClass = useMemo(() => {
    return allStudents
      .filter(s => {
        const sClass = (s.profile?.class || s.className || '').toLowerCase();
        const selClass = (selectedClass || '').toLowerCase();
        return sClass === selClass;
      })
      .sort((a, b) => {
        const orderA = a.profile?.order_num || a.serialNumber || 999;
        const orderB = b.profile?.order_num || b.serialNumber || 999;
        return orderA - orderB;
      })
      .slice(0, MAX_STUDENTS_CAPACITY);
  }, [allStudents, selectedClass]);
  
  // Apply Group Filtering
  const getGroupedStudents = () => {
    if (selectedGroup === 'all') return studentsInClass;
    
    const N = studentsInClass.length;
    const Midpoint = Math.ceil(N / 2);
    
    if (selectedGroup === 'group1') {
      return studentsInClass.slice(0, Midpoint);
    } else {
      return studentsInClass.slice(Midpoint);
    }
  };

  const currentGroupStudents = getGroupedStudents();

  // Filter by search query (Indexer)
  const filteredStudents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return currentGroupStudents;
    
    return currentGroupStudents.filter(s => {
      const name = (s.profile?.name || s.name || '').toLowerCase();
      const massarId = (s.massar_id || s.massarId || '').toLowerCase();
      return name.includes(query) || massarId.includes(query);
    });
  }, [currentGroupStudents, searchQuery]);

  const totalStudents = studentsInClass.length; 
  const presentCount = filteredStudents.filter(s => {
    const mId = s.massar_id || s.massarId;
    const status = attendance[mId] || 'present';
    return status === 'present';
  }).length;

  // Reset subject if it's not valid for the current branch
  useEffect(() => {
    const currentClassObj = assignedClasses.find(c => c.name === selectedClass);
    const effectiveBranch = currentClassObj?.branch || selectedBranch;
    
    if (selectedSubject === 'الفيزياء والكيمياء' && effectiveBranch === 'Literary') {
      setSelectedSubject('');
    }
  }, [selectedClass, selectedBranch, selectedSubject, assignedClasses]);

  const handleStatusChange = (massarId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [massarId]: status
    }));
  };

  const handleSave = () => {
    if (!selectedClass) {
      alert('يرجى اختيار القسم أولاً');
      return;
    }
    if (!selectedSubject) {
      alert('يرجى اختيار المادة أولاً');
      return;
    }

    const now = new Date(); // Use local device time directly
    const submissionTimestamp = now.toISOString();

    const verifiedTimeStr = formatVerifiedTime(now);
    const verifiedDateStr = formatVerifiedDate(now);
    const fullVerifiedTimestamp = `${verifiedDateStr} ${verifiedTimeStr}`;

    const sessionData = {
      date: verifiedDateStr,
      time: verifiedTimeStr,
      subject: selectedSubject,
      duration: selectedDuration,
      teacher: teacher.name,
      verifiedTimestamp: fullVerifiedTimestamp
    };

    const recordId = Date.now();
    const studentsToSave = studentsInClass.map((s, index) => ({
      serialNumber: s.profile?.order_num || s.serialNumber || (index + 1),
      massarId: s.massar_id || s.massarId,
      name: s.profile?.name || s.name,
      status: attendance[s.massar_id || s.massarId] || 'present',
      is_summoned: s.status_flags?.is_summoned || s.is_summoned || false,
      verifiedTimestamp: fullVerifiedTimestamp
    }));

    // 1. Save to Backend (OWASP - Server-side Timestamp)
    fetch('./api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        className: selectedClass,
        subject: selectedSubject,
        duration: selectedDuration,
        teacherId: teacher.id,
        students: studentsToSave.map(s => ({
          name: s.name,
          status: s.status,
          massarId: s.massarId
        }))
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const record = {
          id: recordId,
          Teacher_Name: teacher.name,
          Subject_Name: selectedSubject,
          Duration: selectedDuration,
          Class_Name: selectedClass,
          Submission_Timestamp: data.timestamp, // Use server-side timestamp
          verifiedTimestamp: fullVerifiedTimestamp,
          Timestamp: data.timestamp,
          Students_List: studentsToSave,
          teacherId: teacher.id,
          date: data.date,
          time: verifiedTimeStr,
          attendance: attendance
        };

        // Update Student History (Append Mode)
        const updatedAllStudents = allStudents.map(s => {
          const mId = s.massar_id || s.massarId;
          const sClass = s.profile?.class || s.className;
          
          if (sClass === selectedClass) {
            const status = attendance[mId] || 'present';
            const historyEntry = { ...sessionData, status, recordId, date: data.date };
            
            return {
              ...s,
              attendance_history: [...(s.attendance_history || []), historyEntry]
            };
          }
          return s;
        });

        setAllStudents(updatedAllStudents);
        setAttendanceRecords(prev => [...prev, record]);
        
        // Trigger Confetti
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert('فشل حفظ البيانات: ' + (data.message || 'خطأ غير معروف'));
      }
    })
    .catch(err => {
      console.error('Save Error:', err);
      alert('حدث خطأ أثناء الاتصال بالسيرفر');
    });
  };

  const handleUpdateStudent = (updatedStudent: any) => {
    const normalized = {
      ...updatedStudent,
      massarId: updatedStudent.massar_id || updatedStudent.massarId,
      massar_id: updatedStudent.massar_id || updatedStudent.massarId
    };
    setAllStudents(prev => prev.map(s => {
      const sId = s.massar_id || s.massarId;
      const uId = normalized.massar_id;
      return sId === uId ? normalized : s;
    }));
    setEditingStudent(null);
  };

  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ message: string; type: 'success' | 'error'; skipped?: any[] } | null>(null);
  const [pendingImport, setPendingImport] = useState<any[] | null>(null);
  const [showSkippedModal, setShowSkippedModal] = useState(false);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClass) return;

    setIsImporting(true);
    setImportFeedback(null);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      if (fileExtension === 'csv') {
        const readAsText = (encoding: string): Promise<string> => {
          return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.onerror = reject;
            r.readAsText(file, encoding);
          });
        };

        // Try UTF-8 first
        let text = await readAsText('utf-8');
        
        // Universal Encoding Detection Heuristic
        // If it contains replacement characters or no Arabic characters when expected, try other encodings
        const hasReplacementChar = text.includes('\uFFFD');
        const hasArabic = /[\u0600-\u06FF]/.test(text);
        
        if (hasReplacementChar || (!hasArabic && /[^\x00-\x7F]/.test(text))) {
          // Try Windows-1256 (Arabic) or ISO-8859-1 (French/Latin)
          // For Massar, Windows-1256 is very common
          text = await readAsText('windows-1256');
          
          // If still no Arabic, maybe it's French ISO-8859-1
          if (!/[\u0600-\u06FF]/.test(text) && hasReplacementChar) {
            text = await readAsText('iso-8859-1');
          }
        }
        
        // Handle semi-colon separated CSVs by replacing them with commas for XLSX parser
        // or just let XLSX handle it (it usually does if the first line has them)
        const workbook = XLSX.read(text, { type: 'string' });
        processWorkbook(workbook);
      } else {
        // Excel files (.xlsx, .xls)
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            processWorkbook(workbook);
          } catch (err) {
            handleImportError();
          }
        };
        reader.readAsArrayBuffer(file);
      }
    } catch (err) {
      handleImportError();
    }
  };

  const handleDownloadExcel = () => {
    if (!verifiedTime) return;

    const headers = [
      'الرقم الترتيبي',
      'الاسم الكامل',
      'رقم مسار',
      'الحالة',
      'التاريخ',
      'المادة',
      'الحصة'
    ];

    const dataRows = filteredStudents.map((s, index) => [
      s.profile?.order_num || s.serialNumber || (index + 1),
      s.profile?.name || s.name,
      s.massar_id || s.massarId,
      attendance[s.massar_id || s.massarId] === 'absent' ? 'غائب' : 
      attendance[s.massar_id || s.massarId] === 'late' ? 'متأخر' : 'حاضر',
      formatVerifiedDate(verifiedTime),
      selectedSubject,
      selectedDuration
    ]);

    // Create worksheet from array of arrays
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);

    // 1. Column Widths (B and C wide)
    ws['!cols'] = [
      { wch: 15 }, // A: الرقم الترتيبي
      { wch: 35 }, // B: الاسم الكامل (Wide)
      { wch: 25 }, // C: رقم مسار (Wide)
      { wch: 15 }, // D: الحالة
      { wch: 15 }, // E: التاريخ
      { wch: 20 }, // F: المادة
      { wch: 15 }  // G: الحصة
    ];

    // 2. RTL Alignment
    ws['!views'] = [{ RTL: true }];

    // 3. Styling
    const headerStyle = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "ADD8E6" } }, // Light Blue
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      }
    };

    const cellStyle = {
      alignment: { horizontal: "right", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      }
    };

    // Apply styles to headers (Row 1)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:G1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (ws[address]) ws[address].s = headerStyle;
    }

    // Apply styles to data cells
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[address]) ws[address].s = cellStyle;
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    
    // Dynamic Filename: Attendance_[class]_[date]_[Time].xlsx
    const dateStr = formatVerifiedDate(verifiedTime).replace(/\//g, '-');
    const timeStr = formatVerifiedTime(verifiedTime).replace(/:/g, '-');
    const filename = `Attendance_${selectedClass}_${dateStr}_${timeStr}.xlsx`;
    
    XLSX.writeFile(wb, filename);
    setImportFeedback({ message: 'تم تصدير التقرير بنجاح (XLSX)', type: 'success' });
  };

  const processWorkbook = (workbook: XLSX.WorkBook) => {
    try {
      setIsImporting(true);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

      if (jsonData.length === 0) throw new Error('الملف فارغ');

      // --- Ultimate Heuristic Header Detection ---
      const keywords = {
        name: ['الاسم', 'name', 'nom', 'كامل', 'téléphone'],
        id: ['مسار', 'massar', 'id', 'code', 'رقم', 'national'],
        class: ['القسم', 'class', 'classe', 'بنية', 'niveau']
      };

      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
        const row = jsonData[i].map(c => String(c || '').toLowerCase().trim());
        const hasName = row.some(c => keywords.name.some(k => c.includes(k)));
        const hasId = row.some(c => keywords.id.some(k => c.includes(k)));
        if (hasName && hasId) {
          headerRowIndex = i;
          break;
        }
      }

      const startRow = headerRowIndex === -1 ? 0 : headerRowIndex + 1;
      const headers = headerRowIndex === -1 ? [] : jsonData[headerRowIndex].map(c => String(c || '').toLowerCase().trim());

      const nameIdx = headers.findIndex(h => keywords.name.some(k => h.includes(k)));
      const idIdx = headers.findIndex(h => keywords.id.some(k => h.includes(k)));
      const classIdx = headers.findIndex(h => keywords.class.some(k => h.includes(k)));

      const finalNameIdx = nameIdx !== -1 ? nameIdx : 0;
      const finalIdIdx = idIdx !== -1 ? idIdx : 1;

      // Class Mismatch Check
      const firstValidRow = jsonData.slice(startRow).find(row => row[finalNameIdx] && row[finalIdIdx]);
      if (firstValidRow && classIdx !== -1) {
        const fileClass = String(firstValidRow[classIdx] || '').trim();
        if (fileClass && fileClass.toLowerCase() !== (selectedClass || '').toLowerCase()) {
          setImportFeedback({ 
            message: `تنبيه: هذا الملف يبدو أنه للقسم [${fileClass}]. يرجى التأكد من اختيار القسم الصحيح.`, 
            type: 'error' 
          });
          return;
        }
      }

      const formattedData = jsonData.slice(startRow)
        .filter(row => String(row[finalNameIdx] || '').trim() && String(row[finalIdIdx] || '').trim())
        .map((row, index) => {
          const rawId = String(row[finalIdIdx] || '').trim();
          const sName = String(row[finalNameIdx] || '').trim();
          const sClass = classIdx !== -1 && String(row[classIdx] || '').trim() ? String(row[classIdx]).trim() : selectedClass;

          return {
            massarId: rawId,
            massar_id: rawId,
            className: sClass,
            profile: {
              name: sName,
              class: sClass,
              branch: selectedBranch,
              order_num: index + 1
            },
            status_flags: { is_summoned: false, is_demo: false },
            attendance_history: []
          };
        });

      if (formattedData.length === 0) {
        setImportFeedback({ message: 'لم يتم العثور على بيانات صالحة', type: 'error' });
        return;
      }

      setAllStudents(prev => {
        const importedClasses = [...new Set(formattedData.map(s => s.className.toLowerCase()))];
        return [...prev.filter(s => !importedClasses.includes((s.className || s.profile?.class || '').toLowerCase())), ...formattedData];
      });

      setImportFeedback({ message: `تم استيراد ${formattedData.length} تلميذ بنجاح`, type: 'success' });
      setPendingImport(null);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

    } catch (err) {
      console.error('❌ Import Failure:', err);
      setImportFeedback({ message: 'فشل الاستيراد: يرجى التحقق من بنية الملف', type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  const confirmImport = (data: any[], skipped?: any[]) => {
    // This function is now a wrapper for the logic already in processWorkbook
    // but kept for compatibility with any existing modal triggers
    setAllStudents(prev => {
      const importedClasses = [...new Set(data.map(s => (s.className || '').toLowerCase()))];
      const filtered = prev.filter(s => {
        const sClass = (s.profile?.class || s.className || '').toLowerCase();
        return !importedClasses.includes(sClass);
      });
      return [...filtered, ...data];
    });
    setPendingImport(null);
  };

  const handleImportError = () => {
    setImportFeedback({ message: 'فشل الاستيراد: يرجى التأكد من صيغة الملف', type: 'error' });
    setIsImporting(false);
  };

  useEffect(() => {
    if (importFeedback) {
      const timer = setTimeout(() => setImportFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [importFeedback]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans" dir="rtl">
      <TeacherHeader 
        teacherName={teacher?.name}
        selectedClass={selectedClass}
        onClassChange={setSelectedClass}
        assignedClasses={assignedClasses}
        totalStudents={totalStudents}
        presentCount={presentCount}
        onLogout={onLogout}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        currentTime={verifiedTime}
      />

      <div className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {!selectedClass ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm"
            >
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                <span className="text-5xl">👋</span>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900">مرحباً بك، {teacher?.name}</h2>
                <p className="text-slate-500 font-medium">يرجى اختيار القسم من القائمة أعلاه للبدء في تسجيل الغياب</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={selectedClass}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <TeacherControls 
                onImport={handleImport}
                selectedGroup={selectedGroup}
                onGroupChange={setSelectedGroup}
                onSave={handleSave}
                showSuccess={showSuccess}
                selectedSubject={selectedSubject}
                onSubjectChange={setSelectedSubject}
                selectedDuration={selectedDuration}
                onDurationChange={setSelectedDuration}
                selectedClass={selectedClass}
                selectedBranch={selectedBranch}
                assignedClasses={assignedClasses}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                currentTime={verifiedTime}
              />

              {/* Quick Stats & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span className="text-sm font-bold text-slate-600">حاضر: {presentCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-sm font-bold text-slate-600">غائب: {totalStudents - presentCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full" />
                    <span className="text-sm font-bold text-slate-600">متأخر: {filteredStudents.filter(s => attendance[s.massar_id || s.massarId] === 'late').length}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleDownloadExcel}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
                  >
                    <span className="text-lg">📊</span>
                    تصدير التقرير
                  </button>
                </div>
              </div>

              {/* Import Feedback */}
              <AnimatePresence>
                {(isImporting || importFeedback) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 rounded-2xl border flex items-center justify-center gap-3 font-bold ${
                      isImporting 
                        ? 'bg-slate-50 border-slate-200 text-slate-600' 
                        : importFeedback?.type === 'success'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                          : 'bg-red-50 border-red-100 text-red-600'
                    }`}
                  >
                    {isImporting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                        جاري استيراد البيانات...
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3">
                          {importFeedback?.type === 'success' ? '✅' : '❌'}
                          {importFeedback?.message}
                        </div>
                        {importFeedback?.skipped && importFeedback.skipped.length > 0 && (
                          <button 
                            onClick={() => setShowSkippedModal(true)}
                            className="text-xs underline hover:text-slate-900 transition-colors"
                          >
                            عرض التفاصيل (الأسطر المتجاوزة)
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AttendanceTable 
                students={filteredStudents}
                attendance={attendance}
                onStatusChange={handleStatusChange}
                onEditStudent={setEditingStudent}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skipped Rows Modal */}
        <AnimatePresence>
          {showSkippedModal && importFeedback?.skipped && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900">تفاصيل الأسطر المتجاوزة</h3>
                  <button onClick={() => setShowSkippedModal(false)} className="text-slate-400 hover:text-slate-600">
                    <AlertCircle className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="max-h-[40vh] overflow-y-auto space-y-2 pr-2">
                  {importFeedback.skipped.map((skip, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-bold text-slate-600">السطر: {skip.row}</span>
                      <span className="text-sm font-black text-red-500">{skip.reason}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowSkippedModal(false)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95"
                >
                  إغلاق
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Student Modal */}
        <AnimatePresence>
          {editingStudent && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-slate-900">تعديل بيانات التلميذ</h3>
                  <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600">
                    <AlertCircle className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500">الاسم الكامل</label>
                    <input 
                      type="text" 
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500">رقم مسار</label>
                    <input 
                      type="text" 
                      value={editingStudent.massarId}
                      onChange={(e) => setEditingStudent({...editingStudent, massarId: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-slate-900 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500">المستوى</label>
                      <input 
                        type="text" 
                        value={editingStudent.level}
                        onChange={(e) => setEditingStudent({...editingStudent, level: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500">المسلك</label>
                      <input 
                        type="text" 
                        value={editingStudent.stream}
                        onChange={(e) => setEditingStudent({...editingStudent, stream: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-slate-900 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => handleUpdateStudent(editingStudent)}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                  >
                    حفظ التعديلات
                  </button>
                  <button
                    onClick={() => setEditingStudent(null)}
                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Confirmation Modal */}
        <AnimatePresence>
          {pendingImport && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6"
              >
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-amber-600" />
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">تأكيد الاستيراد</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    بعض الأقسام في الملف تحتوي بالفعل على بيانات تلاميذ. هل تريد استبدال البيانات الحالية بالبيانات الجديدة؟
                  </p>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-4">
                    <p className="text-sm font-bold text-slate-600">
                      سيتم استيراد <span className="text-slate-900">{pendingImport.length}</span> تلميذ في <span className="text-slate-900">{[...new Set(pendingImport.map(s => s.className))].length}</span> أقسام.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => confirmImport(pendingImport)}
                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                  >
                    نعم، استبدال البيانات
                  </button>
                  <button
                    onClick={() => setPendingImport(null)}
                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
                  >
                    إلغاء
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
