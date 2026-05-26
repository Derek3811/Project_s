import React, { useState } from 'react';
import { ProjectState } from '../types';
import { generateCodeSnippets } from '../server/CodeGenerator';
import { Code, Copy, Check } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface CodeExportPanelProps {
  project: ProjectState;
}

export default function CodeExportPanel({ project }: CodeExportPanelProps) {
  const [copied, setCopied] = useState(false);
  const { language } = useLanguage();

  const generatedCode = generateCodeSnippets(project);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-[#0F1219] border border-slate-700/50 rounded-xl p-5 shadow-2xl mt-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Code size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            {language === 'zh' ? '战术研发：代码闭环引擎' : 'Code Closure Engine'}
          </h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded text-[10px] font-bold uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied 
            ? (language === 'zh' ? '已复制！' : 'COPIED!') 
            : (language === 'zh' ? '一键复制代码' : 'COPY CODE')}
        </button>
      </div>

      <div className="bg-[#05070A] rounded-lg border border-slate-850 p-4 overflow-x-auto">
        <pre className="text-[10px] sm:text-xs font-mono text-slate-300 leading-relaxed">
          {generatedCode}
        </pre>
      </div>
      
      <p className="text-[10px] text-slate-500 mt-4 leading-relaxed">
        {language === 'zh' 
          ? 'ℹ️ 使用说明：此为系统自动生成的 TypeScript 框架代码，它反映了多方智能体现已锁定的架构共识，您可以直接复制该代码并粘贴至目标开发环境中使用。' 
          : 'ℹ️ Usage: This is the auto-generated TypeScript framework code reflecting the synchronized architectural constraints. You may directly copy and paste this into your project.'}
      </p>
    </div>
  );
}
