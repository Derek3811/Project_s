import { useState, FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Target, ShieldAlert, ArrowRight, UserCog, Sparkles, Cpu, CpuIcon, Upload, FileJson, Check, Copy, Key, Palette } from 'lucide-react';
import { cn } from '../lib/utils';
import { AgentRole } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import AgentAvatar from './AgentAvatar';

const defaultAgents: AgentRole[] = [
  { id: '1', name: 'Product Manager', description: 'Focuses on user needs, market fit, and feature prioritization.' },
  { id: '2', name: 'System Architect', description: 'Focuses on scalability, database schema, and technical robustness.' },
  { id: '3', name: 'Security Analyst', description: 'Identifies vulnerabilities, compliance gaps, and access control issues.' },
  { id: '4', name: 'UX Lead', description: 'Advocates for usability, minimal friction, and clear user journeys.' },
  { id: '5', name: 'QA Specialist', description: 'Focuses on testing paradigms, continuous integration, regression risks, and robust code validation.' },
  { id: '6', name: 'Data Analyst', description: 'Leverages telemetry, funnel data, usage metrics, and analytics to steer features with evidence.' },
  { id: '7', name: 'Marketing & Growth Lead', description: 'Fosters organic user acquisition, localized growth campaigns, market position, and launch reach.' },
  { id: '8', name: 'DevOps & SRE Engineer', description: 'Prioritizes robust pipelines, automated deployments, container scalability, and uptime latency.' },
  { id: '9', name: 'Legal & Compliance Officer', description: 'Ensures strict alignment with regulatory compliance, GDPR, accessibility laws, and data licenses.' }
];

export default function IntakeForm() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'import'>('create');
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [importWishlist, setImportWishlist] = useState('');
  
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showPromptHelper, setShowPromptHelper] = useState(true);

  const [customApiKey, setCustomApiKey] = useState(() => localStorage.getItem('user_gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    localStorage.setItem('user_gemini_api_key', key);
  };

  const englishPromptText = `Please generate a concise, highly detailed summary of our project's current state so I can import it into an AI Strategic board meeting. Organize it precisely like this:

# Project Core Idea
[Describe the core idea of what the app or logic is, what it does, and the current design/code implementation]

# Primary Goals
[List the key business, experience, or functional goals established so far]

# Technical Stack & Current Architecture
[Summarize the current technical stack, files, databases, constraints, and any files we created already]

# Immediate Next Challenge / Agenda
[State the exact upcoming design challenge, feature addition, or roadblock we need to debate and solve in this meeting]`;

  const chinesePromptText = `请为我们当前正在开发的项目生成一份精简而极为详细的现状总结，以便我将其导入到 AI 战略董事会中进行会商。请严格按照以下格式输出：

# 项目核心创意
[描述该应用/逻辑的核心创意、用途以及当前已实现的代码模块与设计思路]

# 主要目标
[列出迄今为止确定的关键业务、体验或功能目标]

# 技术栈与当前架构
[总结当前的技术栈、数据库、限制条件及当前已创建的关键物理资产或文件结构]

# 紧迫的下一步挑战 / 核心议题
[说明我们在本轮战略研讨会议中需要辩论、分析并立即解决的具体设计难题、新增功能或技术瓶颈]`;

  const handleCopyPrompt = () => {
    const text = language === 'zh' ? chinesePromptText : englishPromptText;
    navigator.clipboard.writeText(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const [isDragActive, setIsDragActive] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: number } | null>(null);

  const handleFileProcess = (file: File) => {
    if (!file) return;
    setFileDetails({ name: file.name, size: file.size });
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setImportJson(content);
        setImportError('');
      }
    };
    reader.onerror = () => {
      setImportError(language === 'zh' ? '读取文件失败。' : 'Failed to read file.');
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const tryFlexibleParse = (input: string): any => {
    let str = input.trim();
    
    // 1. Strip markdown code blocks if the user copy-pasted directly from markdown
    const mdBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const match = str.match(mdBlockRegex);
    if (match) {
      str = match[1].trim();
    }
    
    // 2. Remove comments (like // and /* */) that might break standard parse
    str = str.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');

    // 3. Extract the first outer bracket { ... } block
    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      str = str.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(str);
  };

  const [form, setForm] = useState({
    idea: '',
    goals: '',
    constraints: '',
    model: 'gemini-flash-lite-latest',
    uiStyle: 'interactive-neon'
  });
  
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set(['1', '2']));

  const toggleAgent = (id: string) => {
    const next = new Set(selectedAgents);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAgents(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.idea.trim() || selectedAgents.size === 0) return;
    
    setLoading(true);
    
    const agents = defaultAgents.filter(a => selectedAgents.has(a.id));
    
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, agents, language })
      });
      const data = await res.json();
      if (data.success) {
        navigate(`/project/${data.data.id}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!importJson.trim()) return;
    
    setLoading(true);
    setImportError('');
    
    try {
      let parsed: any = null;
      let isPlaintextProject = false;
      
      try {
        parsed = tryFlexibleParse(importJson);
      } catch (err) {
        isPlaintextProject = true;
      }
      
      if (parsed && (!parsed.id || !parsed.idea)) {
        isPlaintextProject = true;
      }

      if (isPlaintextProject) {
        let finalIdea = importJson.trim();
        let finalGoals = language === 'zh' ? '基于导入的项目现状会商' : 'Debate based on imported project outline';
        
        if (importWishlist.trim()) {
          finalIdea += language === 'zh'
            ? `\n\n# 💡 期望导入的愿望清单 (Wish List / Action Targets)\n${importWishlist.trim()}`
            : `\n\n# 💡 Imported Project Wish List (Immediate Targets & Feature Aspirations)\n${importWishlist.trim()}`;
            
          finalGoals = language === 'zh'
            ? `基于现状，聚焦实现客户额外愿望：${importWishlist.trim()}`
            : `Debate based on project outline and focus on wishlist targets: ${importWishlist.trim()}`;
        }

        // Automatically create a new strategic board meeting using the pasted text notes or outline!
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idea: finalIdea.substring(0, 6000),
            goals: finalGoals,
            constraints: language === 'zh' ? '遵循导入中的初始约束条件与用户额外期望' : 'Adhere to imported constraints and custom user goals',
            agents: defaultAgents.slice(0, 3), // PM, System Architect, UX Lead
            language,
            model: form.model || 'gemini-flash-lite-latest'
          })
        });
        const data = await res.json();
        if (data.success) {
          navigate(`/project/${data.data.id}`);
        } else {
          setImportError(data.error || 'Failed to initialize session from project notes.');
        }
        return;
      }

      // If they specify a custom wish list on top of JSON restore, we append and reset meeting status
      if (parsed && importWishlist.trim()) {
        parsed.idea = (parsed.idea || "") + (language === 'zh'
          ? `\n\n# 💡 补录的核心期望与额外功能诉求\n${importWishlist.trim()}`
          : `\n\n# 💡 Addendum: Supplemental Feature Goals & Wishes\n${importWishlist.trim()}`);
        
        parsed.goals = (parsed.goals || "") + (language === 'zh'
          ? ` | 新聚焦愿景: ${importWishlist.trim()}`
          : ` | Focusing on wishlist: ${importWishlist.trim()}`);
          
        parsed.status = 'meeting'; // Unlock completed meeting state so they can instantly start a new debate round with these options!
      }

      const res = await fetch('/api/projects/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectData: parsed })
      });
      
      const data = await res.json();
      if (data.success) {
        navigate(`/project/${data.data.id}`);
      } else {
        setImportError(data.error || 'Failed to restore project.');
      }
    } catch (err: any) {
      setImportError(err.message || 'Formatting error. Please upload or paste a valid work state JSON dossier.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white tracking-tight">
          {activeTab === 'create' ? t.newInitiative : (t as any).importSession || 'Import Session / 导入已有会商'}
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {activeTab === 'create' ? t.ideaPlaceholder : (t as any).importSessionDesc || 'Paste an exported JSON state to resume the debate.'}
        </p>
      </div>

      {/* Primary Tab Selector */}
      <div className="flex gap-2 bg-[#0F1219] p-1.5 rounded-xl border border-slate-800/80 mb-6 max-w-md">
        <button
          type="button"
          onClick={() => {
            setActiveTab('create');
            setImportError('');
          }}
          className={cn(
            "flex-1 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
            activeTab === 'create'
              ? "bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          {t.newInitiative}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('import');
            setImportError('');
          }}
          className={cn(
            "flex-1 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
            activeTab === 'import'
              ? "bg-slate-800 text-cyan-400 border border-slate-700/60 shadow-lg"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          {(t as any).importSession || 'Import Session State'}
        </button>
      </div>

      {activeTab === 'create' ? (
        <form onSubmit={handleSubmit} className="space-y-8 bg-[#161B22] border border-slate-800 rounded-xl p-8 shadow-2xl animate-in fade-in duration-300">
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Brain size={18} className="text-cyan-400" /> {t.coreIdea}
              </label>
              <textarea 
                required
                rows={4}
                className="w-full rounded border border-slate-800 bg-slate-900/50 p-3 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600"
                placeholder={t.ideaPlaceholder}
                value={form.idea}
                onChange={e => setForm({...form, idea: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Target size={18} className="text-green-500" /> {t.primaryGoals}
                </label>
                <textarea 
                  rows={3}
                  className="w-full rounded border border-slate-800 bg-slate-900/50 p-3 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder={t.goalsPlaceholder}
                  value={form.goals}
                  onChange={e => setForm({...form, goals: e.target.value})}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <ShieldAlert size={18} className="text-amber-500" /> {t.constraints}
                </label>
                <textarea 
                  rows={3}
                  className="w-full rounded border border-slate-800 bg-slate-900/50 p-3 text-slate-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder={t.constraintsPlaceholder}
                  value={form.constraints}
                  onChange={e => setForm({...form, constraints: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Aesthetic & Frontend Design Preset Selector */}
          <div className="pt-6 border-t border-slate-800">
            <div className="flex flex-col mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 font-bold matches-theme">
                <Palette size={18} className="text-cyan-400" /> 
                {language === 'zh' ? '产品美术设计与前端开发风格预设' : 'Frontend Aesthetic & Design System Preset'}
              </label>
              <span className="text-xs text-slate-500 mt-1 leading-normal">
                {language === 'zh' 
                  ? '指定下游编译提示词的极致视觉细节，彻底规避 AI 默认生成的 1990 年代简陋复古排版，强制输出极具质感的现代 UI：'
                  : 'Force downstream AI build models to use heavy, eye-catching premium styling guidelines instead of lazy 1990-style retro mockups.'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {[
                {
                  id: 'interactive-neon',
                  titleEn: '⚡ Sleek Neo-Cyber Arcade Vibe (Anti-1990 Lazy Vibe)',
                  titleZh: '⚡ 高亮赛博幻影霓虹 & 游戏动美学 (极致规避 1990 简陋感)',
                  descEn: 'Mandates high-contrast absolute black backgrounds with radiant cyan/emerald border glows, rounded-2xl modern glassmorphic panels, CSS keyframe floating loops, and tactile arcade response animations. Absolutely solves raw, unstyled game screen fallback.',
                  descZh: '强制使用纯色电竞暗背景配搭放射性蓝绿霓虹边框、大圆角现代毛玻璃面板、柔缓呼吸与微光粒子 CSS 效果，以及带有高度交互节奏的按键。彻底杜绝普通 1990 像素年代未上色般的低质 Canvas 或 Div 布局。',
                  vibeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                },
                {
                  id: 'modern-minimalist',
                  titleEn: '💼 Obsidian Premium Minimalist (Modern SaaS / Vercel-Style)',
                  titleZh: '💼 极客高端机能深色 (SaaS & 现代多维控制区格式)',
                  descEn: 'Instructs the coding AI to build premium dark slate dashboard components, crisp hairline silver guidelines, Inter typography pairings with JetBrains Mono numbers, micro-animations, and balanced negative airspace. Sophisticated and distraction-free layout.',
                  descZh: '指引 AI 构建富有“空气感”的暗色机能控制舱。配备极细腻的银灰色微边框、Inter 与等宽字体结合的科技化数字表格。专为商业工具、后台面板和个人技术原型量身打造的高级灰度色表。',
                  vibeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                },
                {
                  id: 'warm-editorial',
                  titleEn: '🎨 Earthy Warm Cozy Editorial (Luxurious Soft Paper Vibe)',
                  titleZh: '🎨 暖意经典书卷风纸张美学 (高级质感/文艺视觉)',
                  descEn: 'Replaces generic dark modes with clean off-white cream (#FAF9F5), elegant classic serif headline typography (Georgia / Playfair Display), earthy natural amber/apricot highlight chips, and spacious reading margins. Exquisite editorial card-shadow feel.',
                  descZh: '抛弃落俗套的黑白灰色阶，赋予系统自然米白暖眼底色、庄重高雅的古典衬线大标题、和煦自然的暖阳琥珀高亮。创造出宛如高档实体杂志般的视觉空旷和自然触觉，极其新颖优雅。',
                  vibeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }
              ].map(v => {
                const isActive = form.uiStyle === v.id;
                const title = language === 'zh' ? v.titleZh : v.titleEn;
                const desc = language === 'zh' ? v.descZh : v.descEn;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setForm({ ...form, uiStyle: v.id })}
                    className={cn(
                      "p-4.5 text-left border rounded-xl flex flex-col justify-between transition-all relative overflow-hidden cursor-pointer",
                      isActive
                        ? "border-cyan-500 bg-cyan-400/10 ring-1 ring-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.1)] animate-in fade-in zoom-in-95 duration-100"
                        : "border-slate-800 bg-[#0F1219] hover:border-slate-700 hover:bg-slate-800 text-slate-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 w-full mb-1">
                      <div className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
                        {title}
                      </div>
                      <span className={cn("text-[8px] tracking-widest uppercase px-2 py-0.5 rounded border leading-none font-bold", v.vibeColor)}>
                        {v.id === 'interactive-neon' ? (language === 'zh' ? '最推荐·强设计' : 'RECOMMENDED FOR GAMES') : (v.id === 'modern-minimalist' ? (language === 'zh' ? '高端办公' : 'HIGH-END SAAS') : (language === 'zh' ? '治愈米黄' : 'CREATIVE CLASSIC'))}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed font-sans mt-0.5">
                      {desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Model Selector Segment */}
          <div className="pt-6 border-t border-slate-800">
            <div className="flex flex-col mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Cpu size={18} className="text-violet-400" /> {t.modelLabel}
              </label>
              <span className="text-xs text-slate-500 mt-1">{t.modelDesc}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'gemini-flash-lite-latest',
                  title: 'Gemini 3.5 Flash Lite',
                  badgeEn: 'FAST & ECONOMICAL',
                  badgeZh: '推荐·极速节能',
                  descEn: 'Default. Extremely rapid, fully structured responses with low latency.',
                  descZh: '默认推荐。响应极速，能有效规避高并发频次限制，提供强类型数据。',
                  badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                },
                {
                  id: 'gemini-2.1-flash',
                  title: 'Gemini 2.1 Flash',
                  badgeEn: 'CONSISTENT',
                  badgeZh: '稳定·下一代平衡',
                  descEn: 'Outstanding extraction metrics and robust structured debate outputs.',
                  descZh: '出色的方案抽取能力，输出结构极其严谨稳定。',
                  badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                },
                {
                  id: 'gemini-2.5-flash',
                  title: 'Gemini 2.5 Flash',
                  badgeEn: 'MODERN INTELLIGENCE',
                  badgeZh: '卓越·全面升级',
                  descEn: 'Superior comprehension stability across broad multi-agent interactions.',
                  descZh: '全能升级版 Flash 模型，对多角色战略辩论有极其稳定的洞察力。',
                  badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                },
                {
                  id: 'gemini-2.5-pro',
                  title: 'Gemini 2.5 Pro',
                  badgeEn: 'DEEP COGNITION',
                  badgeZh: '高阶·深度推理',
                  descEn: 'Deep reasoning expert. Ideal for highly intricate user strategies.',
                  descZh: '专业级深度推理。逻辑最强，适合极其复杂的产业宏观及微观博弈。',
                  badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                }
              ].map(m => {
                const isActive = form.model === m.id;
                const hasBadge = language === 'zh' ? m.badgeZh : m.badgeEn;
                const hasDesc = language === 'zh' ? m.descZh : m.descEn;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setForm({ ...form, model: m.id })}
                    className={cn(
                      "p-4 text-left border rounded-xl flex flex-col justify-between transition-all relative overflow-hidden cursor-pointer",
                      isActive
                        ? "border-violet-500 bg-violet-500/10 ring-1 ring-violet-500 text-white"
                        : "border-slate-800 bg-[#0F1219] hover:border-slate-700 hover:bg-slate-800 text-slate-300"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 w-full mb-2">
                      <div className="font-semibold text-sm flex items-center gap-1.5">
                        <Sparkles size={13} className={isActive ? "text-violet-400 animate-pulse" : "text-slate-500"} />
                        {m.title}
                      </div>
                      <span className={cn("text-[8px] tracking-widest uppercase px-1.5 py-0.5 rounded border leading-none font-bold", m.badgeColor)}>
                        {hasBadge}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed mt-1">
                      {hasDesc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <UserCog size={18} className="text-slate-500" /> {t.assembleBoard}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAgents(new Set(defaultAgents.map((a) => a.id)))}
                  className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  {language === 'zh' ? '全部选择' : 'Select All'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAgents(new Set(['1', '2']))}
                  className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
                >
                  {language === 'zh' ? '重置默认' : 'Reset'}
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {defaultAgents.map(rawAgent => {
                const agentId = rawAgent.id as keyof typeof t.agentNames;
                const name = t.agentNames[agentId] || rawAgent.name;
                const description = t.agentDescriptions[agentId] || rawAgent.description;
                
                return (
                  <button
                    key={rawAgent.id}
                    type="button"
                    onClick={() => toggleAgent(rawAgent.id)}
                    className={cn(
                      "p-4 text-left border rounded-xl flex items-start gap-3.5 transition-all cursor-pointer",
                      selectedAgents.has(rawAgent.id) 
                        ? "border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500 text-white" 
                        : "border-slate-800 bg-[#0F1219] hover:border-slate-700 hover:bg-slate-800 text-slate-300"
                    )}
                  >
                    <AgentAvatar id={rawAgent.id} name={rawAgent.name} size="sm" className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm leading-snug">{name}</div>
                      <div className="text-xs text-slate-500 mt-1 leading-normal">{description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom API Key Override Block */}
          <div className="pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="inline-flex items-center gap-2 hover:text-slate-200 text-slate-400 transition text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                <Key size={14} className={cn(customApiKey ? "text-emerald-400" : "text-slate-500")} />
                {customApiKey ? (language === 'zh' ? '● 已配置自定义 API Key' : '● Custom API Key Configured') : (language === 'zh' ? '选项：使用自己的 Gemini API Key 避免限频限制' : 'Optional: Specify customized Gemini API Key')}
              </button>
            </div>
            
            {showKeyInput && (
              <div className="mt-3 p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-mono text-slate-500 font-bold">
                    {language === 'zh' ? '本地 Gemini API 密匙控制' : 'LOCAL GEMINI API KEY OVERRIDE'}
                  </span>
                  {customApiKey && (
                    <button
                      type="button"
                      onClick={() => handleSaveApiKey('')}
                      className="text-[9px] uppercase tracking-wider font-bold text-rose-450 hover:text-rose-450 cursor-pointer"
                    >
                      {language === 'zh' ? '清除密钥' : 'Clear key'}
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  placeholder={language === 'zh' ? '输入以 AIzaSy 开头的 Gemini API Key...' : 'Enter your Gemini API key (AIzaSy)...'}
                  value={customApiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  className="w-full bg-[#0F1219] border border-slate-800 focus:border-violet-500 rounded px-3 py-2 text-xs text-slate-200 outline-none font-mono tracking-wider focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600"
                />
                <p className="text-[10px] text-slate-500 leading-normal">
                  {language === 'zh' 
                    ? '此密钥仅保存在本地 LocalStorage 中，不会泄露给第三方，可以直接在会商中绕过公共 API 限频。' 
                    : 'Your key stays secure in your LocalStorage, used strictly for bypassing public API rate limits.'}
                </p>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <button 
              disabled={loading || !form.idea.trim() || selectedAgents.size === 0}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded text-[10px] uppercase font-bold tracking-widest hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? t.initializing : t.startMeeting}
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleImportSubmit} className="space-y-6 bg-[#161B22] border border-slate-800 rounded-xl p-8 shadow-2xl animate-in fade-in duration-300 text-left">
          {/* STEP 1: AI EXPORT GUIDE / PROMPT COPIER */}
          <div className="border border-slate-800 bg-[#0F1219]/90 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-cyan-400 animate-pulse" />
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {language === 'zh' ? '💡 第一步：复制提取提示词发给您的 AI 助手' : '💡 Step 1: Copy extract prompt for your AI assistant'}
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border",
                  copiedPrompt 
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 animate-pulse" 
                    : "bg-slate-900 hover:bg-slate-800 border-slate-800 hover:border-slate-700 text-cyan-400"
                )}
              >
                {copiedPrompt ? (
                  <>
                    <Check size={12} className="text-emerald-400 font-bold" />
                    <span>{language === 'zh' ? '提示词已复制！' : 'Prompt Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    <span>{language === 'zh' ? '复制提取提示词' : 'Copy AI Prompt'}</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-xs text-slate-400 leading-normal">
              {language === 'zh' 
                ? '复制下面的提示词并直接发送到您当前的对话 AI 窗口（ChatGPT、Claude、Cursor、Bolt等）。它将为您将复杂的开发记录与未完逻辑整理成一份纯文本或大纲。随后您直接将它粘贴在下方即可开始顶级智囊辩论！'
                : 'Copy the custom prompt above and send it to your existing dialogue AI window (ChatGPT, Claude, Cursor, Bolt, etc.). It will automatically organize code history and progress into a text outline. Then paste it below to instantly start your strategic board debate!'}
            </p>

            <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-900 font-mono text-[10px] text-slate-500 max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
              {language === 'zh' ? chinesePromptText : englishPromptText}
            </div>
          </div>

          {/* STEP 2: PASTE ACTION FIELD */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Brain size={18} className="text-indigo-400" />
              <span>
                {language === 'zh' ? '💡 第二步：将 AI 得出的答复或历史 JSON 粘贴在下方' : '💡 Step 2: Paste the AI response summary or exported JSON below'}
              </span>
            </label>
            <p className="text-xs text-slate-500 leading-normal">
              {language === 'zh'
                ? '在这里直接粘贴您从 AI 获取的文本大纲描述，或者粘贴导出的 JSON 项目备份（兼容直接导入）。系统将自动感应解析，一键唤醒战略委员会开始针对性会商。'
                : 'Paste the generated project text description or standard exported JSON backup below. Our strategic board engine automatically parses it on the fly and boots a precise meeting.'}
            </p>
            <textarea
              required
              rows={12}
              value={importJson}
              onChange={(e) => {
                setImportJson(e.target.value);
                setImportError('');
              }}
              placeholder={language === 'zh'
                ? "# 项目核心创意\n我们正在开发一个...\n\n# 主要目标\n1. 提高用户留存率\n\n# 技术栈与当前架构\nReact + Tailwind...\n\n# 紧迫的下一步挑战\n如何处理大数据集渲染性能瓶颈并实现流式防抖保存"
                : "# Project Core Idea\nWe are building a React application...\n\n# Primary Goals\n1. High performance rendering\n\n# Technical Stack\nTypeScript + Vite...\n\n# Immediate Next Challenge\nHow to solve real-time sync with large local datasets"
              }
              className="w-full text-xs font-mono rounded border border-slate-800 bg-slate-900/50 p-4 text-slate-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder:text-slate-600 leading-relaxed"
            />
          </div>

          {/* STEP 3: SPECIFIC WISH LIST OBJECTIVES */}
          <div className="space-y-3 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Target size={18} className="text-teal-400 animate-pulse" />
                <span>
                  {language === 'zh' ? '💡 第三步：定制本次会商优先达成的改进愿望（可选）' : '💡 Step 3: Add Your Target Wish List & Improvements (Optional)'}
                </span>
              </label>
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20">
                {language === 'zh' ? '战略焦点' : 'Strategic Focus'}
              </span>
            </div>
            
            <p className="text-xs text-slate-500 leading-normal">
              {language === 'zh'
                ? '期望我们在本次会议中帮您解决什么？点击下方的“一键快速预设”来添加，或在输入箱中自主撰写。各位专家将带着这些期望去研判各方立场。'
                : 'What specific outcome are you chasing in this discussion? Click the quick presets below to auto-inject, or type your own. The expert board will align their actions on these goals.'}
            </p>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1 pb-1">
              {(language === 'zh' ? [
                { title: '🎨 优化主视觉与设计', text: '优化更美观高等级的现代UI设计与灵动微特效 (Ensure much better modern aesthetic layouts & slick UI polish)' },
                { title: '🧩 开拓高阶创新功能', text: '增加更多高级创新功能、完整交互逻辑与深入玩法 (Integrate advanced innovative features and custom modules)' },
                { title: '⚡ 追求极速运行性能', text: '提升高极高性能优化、流式防抖与极速渲染响应 (Improve page performance, rendering speeds, and input debounces)' },
                { title: '🛡️ 构建极强安全性体系', text: '加固服务端接口安全过滤、严格错误拦截防御 (Reinforce bulletproof security scanning and robust edge verification)' },
                { title: '📱 极限流畅的多端适配', text: '完美适配极窄手机屏幕至大尺寸电脑的流体自适应 (Tailor perfect responsiveness across touchscreens and varying viewports)' }
              ] : [
                { title: '🎨 Slick UI Polish', text: 'Ensure much better modern aesthetic layouts, rich typography, and slick micro-animations' },
                { title: '🧩 Richer Custom Features', text: 'Integrate advanced innovative features, interactive logic, and premium widgets' },
                { title: '⚡ Performance & Speed', text: 'Improve page performance, fast stream rendering, event debounces, and low latency' },
                { title: '🛡️ Robust Security & Audits', text: 'Reinforce client-integrity, secure proxy controls, and robust error handling' },
                { title: '📱 Slick Mobile Adaptability', text: 'Tailor perfect responsiveness across touchscreens, mobile tap sizes, and fluid layouts' }
              ]).map((preset, index) => {
                const bullet = `- ${preset.text}\n`;
                const isActive = importWishlist.includes(preset.text);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        setImportWishlist(prev => prev.replace(bullet, '').trim());
                      } else {
                        setImportWishlist(prev => {
                          const trimmed = prev.trim();
                          return trimmed ? `${trimmed}\n${bullet}` : bullet;
                        });
                      }
                    }}
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none",
                      isActive
                        ? "bg-teal-500/15 border-teal-500 text-teal-300 shadow-[0_0_12px_rgba(20,184,166,0.2)]"
                        : "bg-slate-900/80 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    )}
                  >
                    {isActive ? '✓ ' : '+ '}
                    {preset.title}
                  </button>
                );
              })}
            </div>

            <textarea
              rows={4}
              value={importWishlist}
              onChange={(e) => setImportWishlist(e.target.value)}
              placeholder={language === 'zh'
                ? "- 🎨 优化并升级用户界面：使其感觉更高档、采用优雅设计和配色\n- ⚡ 提升极其流畅的防抖数据存储与操作性能\n- 📱 兼容完美手机端多终端适配"
                : "- 🎨 Better high-quality layout aesthetics for an eye-catching view\n- ⚡ Highly optimized performance & fast local load times\n- 📱 Perfect adaptivity on smaller touchscreen displays"
              }
              className="w-full text-xs font-mono rounded border border-slate-804/90 bg-slate-900/40 p-3.5 text-slate-300 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all placeholder:text-slate-600 leading-relaxed"
            />
          </div>

          {importError && (
            <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs leading-normal text-rose-400 font-mono">
              ⚠️ {importError}
            </div>
          )}

          {/* Custom API Key Override Block */}
          <div className="pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowKeyInput(!showKeyInput)}
                className="inline-flex items-center gap-2 hover:text-slate-200 text-slate-400 transition text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                <Key size={14} className={cn(customApiKey ? "text-emerald-400" : "text-slate-500")} />
                {customApiKey ? (language === 'zh' ? '● 已配置自定义 API Key' : '● Custom API Key Configured') : (language === 'zh' ? '选项：使用自己的 Gemini API Key 避免限频限制' : 'Optional: Specify customized Gemini API Key')}
              </button>
            </div>
            
            {showKeyInput && (
              <div className="mt-3 p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-mono text-slate-500 font-bold">
                    {language === 'zh' ? '本地 Gemini API 密匙控制' : 'LOCAL GEMINI API KEY OVERRIDE'}
                  </span>
                  {customApiKey && (
                    <button
                      type="button"
                      onClick={() => handleSaveApiKey('')}
                      className="text-[9px] uppercase tracking-wider font-bold text-rose-450 hover:text-rose-450 cursor-pointer"
                    >
                      {language === 'zh' ? '清除密钥' : 'Clear key'}
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  placeholder={language === 'zh' ? '输入以 AIzaSy 开头的 Gemini API Key...' : 'Enter your Gemini API key (AIzaSy)...'}
                  value={customApiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  className="w-full bg-[#0F1219] border border-slate-800 focus:border-violet-500 rounded px-3 py-2 text-xs text-slate-200 outline-none font-mono tracking-wider focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-slate-600"
                />
                <p className="text-[10px] text-slate-500 leading-normal">
                  {language === 'zh' 
                    ? '此密钥仅保存在本地 LocalStorage 中，不会泄露给第三方，可以直接在会商中绕过公共 API 限频。' 
                    : 'Your key stays secure in your LocalStorage, used strictly for bypassing public API rate limits.'}
                </p>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={loading || !importJson.trim()}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded text-[10px] uppercase font-bold tracking-widest hover:bg-indigo-500 disabled:opacity-50 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              {loading ? t.initializing : (language === 'zh' ? '创 建 战 略 董 事 会' : 'START STRATEGIC DISCUSSION')}
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
