import React, { useState, useEffect } from 'react';
import { sanitize } from '../../lib/security';

interface StudentAddFormProps {
  classes: any[];
  onSave: (data: any) => void;
}

export const StudentAddForm = ({ classes, onSave }: StudentAddFormProps) => {
  const [name, setName] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('Scientific');
  const [className, setClassName] = useState('');

  // Filter classes based on selected branch
  const filteredClasses = classes.filter(cls => {
    return cls.branch === selectedBranch;
  });

  // Reset class selection when branch changes
  useEffect(() => {
    if (filteredClasses.length > 0) {
      setClassName(filteredClasses[0].name);
    } else {
      setClassName('');
    }
  }, [selectedBranch, filteredClasses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && className) {
      onSave({ 
        name: sanitize(name), 
        className: sanitize(className) 
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">الاسم الكامل</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" 
          placeholder="أدخل اسم التلميذ" 
          autoFocus
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">الشعبة</label>
          <select 
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold"
          >
            <option value="Scientific">علوم</option>
            <option value="Literary">آداب</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700">القسم</label>
          <select 
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold"
          >
            {filteredClasses.length === 0 && <option value="">لا توجد أقسام</option>}
            {filteredClasses.map(cls => (
              <option key={cls.id} value={cls.name}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className="hidden" id="student-add-submit" />
    </form>
  );
};
