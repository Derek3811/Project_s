/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import IntakeForm from './components/IntakeForm';
import MeetingRoom from './components/MeetingRoom';
import Dashboard from './components/Dashboard';
import { useLanguage } from './i18n/LanguageContext';

export default function App() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0B0E14] text-slate-200 font-sans flex flex-col">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0F1219]/80 backdrop-blur-sm">
          <Link to="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
            <div className="w-3 h-3 bg-cyan-500 rounded-sm shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
            <h1 className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 transition-colors">{t.appTitle}</h1>
          </Link>
          <div className="flex items-center gap-4">
             <select 
               className="bg-[#161B22] border border-slate-700 text-slate-300 text-xs rounded px-2 py-1 outline-none focus:border-cyan-500 transition-colors"
               value={language}
               onChange={(e) => setLanguage(e.target.value as 'en' | 'zh')}
             >
               <option value="en">English</option>
               <option value="zh">中文</option>
             </select>
          </div>
        </header>
        <main className="flex-1 overflow-auto mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<IntakeForm />} />
            <Route path="/project/:id" element={<MeetingRoom />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
