import React, { useState } from 'react';
import { sanitize } from '../../lib/security';

interface ClassAddFormProps {
  onSave: (data: any) => void;
}

export const ClassAddForm = ({ onSave }: ClassAddFormProps) => {
  const [name, setName] = useState('');
  const [branch, setBranch] = useState<'Scientific' | 'Literary'>('Scientific');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      onSave({ 
        name: sanitize(name), 
        branch: sanitize(branch) as 'Scientific' | 'Literary'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">اسم القسم</label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" 
          placeholder="مثال: TCSF-1" 
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">الشعبة</label>
        <select 
          value={branch}
          onChange={(e) => setBranch(e.target.value as 'Scientific' | 'Literary')}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none font-bold"
        >
          <option value="Scientific">Scientific</option>
          <option value="Literary">Literary</option>
        </select>
      </div>
      <button type="submit" className="hidden" id="class-add-submit" />
    </form>
  );
};
