import React, { useState } from 'react';
import { sanitize } from '../../lib/security';

interface TeacherAddFormProps {
  onSave: (data: any) => void;
}

export const TeacherAddForm = ({ onSave }: TeacherAddFormProps) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && username && password) {
      onSave({ 
        name: sanitize(name), 
        username: sanitize(username), 
        password: sanitize(password) 
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
          placeholder="أدخل الاسم الكامل" 
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">اسم المستخدم</label>
        <input 
          type="text" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" 
          placeholder="أدخل اسم المستخدم" 
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">كلمة المرور</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none" 
          placeholder="أدخل كلمة المرور" 
        />
      </div>
      <button type="submit" className="hidden" id="teacher-add-submit" />
    </form>
  );
};
