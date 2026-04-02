import React, { useState } from 'react';

interface TeacherAssignFormProps {
  teacher: any;
  classes: any[];
  onSave: (assignments: string[]) => void;
}

export const TeacherAssignForm = ({ teacher, classes, onSave }: TeacherAssignFormProps) => {
  const [tempAssignments, setTempAssignments] = useState<string[]>(teacher.assignedClasses || []);
  const [selectedBranch, setSelectedBranch] = useState<string>('Scientific');

  // Filter classes based on selected branch
  const filteredClasses = classes.filter(cls => {
    return cls.branch === selectedBranch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(tempAssignments);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">تصفية حسب الشعبة</label>
        <div className="flex gap-2">
          {[
            { id: 'Scientific', label: 'علوم' },
            { id: 'Literary', label: 'آداب' }
          ].map(b => (
            <button
              key={b.id}
              type="button"
              onClick={() => setSelectedBranch(b.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedBranch === b.id 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        {filteredClasses.map(cls => (
          <label key={cls.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-all">
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-slate-900" 
              checked={tempAssignments.includes(cls.name)}
              onChange={(e) => {
                if (e.target.checked) {
                  setTempAssignments([...tempAssignments, cls.name]);
                } else {
                  setTempAssignments(tempAssignments.filter(name => name !== cls.name));
                }
              }}
            />
            <span className="text-sm font-bold text-slate-700">{cls.name}</span>
          </label>
        ))}
        <button type="submit" className="hidden" id="teacher-assign-submit" />
      </form>
    </div>
  );
};
