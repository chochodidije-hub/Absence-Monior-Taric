import React, { useState } from 'react';
import { sanitize } from '../../lib/security';

interface TeacherResetFormProps {
  onSave: (password: string) => void;
}

export const TeacherResetForm = ({ onSave }: TeacherResetFormProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword === confirmPassword) {
      onSave(sanitize(newPassword));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">كلمة المرور الجديدة</label>
        <input 
          type="password" 
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" 
          placeholder="أدخل كلمة المرور الجديدة" 
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">إعادة كتابة كلمة المرور</label>
        <input 
          type="password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" 
          placeholder="تأكيد كلمة المرور" 
        />
      </div>
      <button type="submit" className="hidden" id="teacher-reset-submit" />
    </form>
  );
};
