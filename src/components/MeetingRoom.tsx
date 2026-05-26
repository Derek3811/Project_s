import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectState, RoundSummary } from '../types';
import { Bot, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, Download, Users, Lightbulb, UserCheck, ShieldAlert, Cpu, ThumbsDown, History, Copy, Check, Brain, Target, Sparkles, Code } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../i18n/LanguageContext';
import AgentAvatar from './AgentAvatar';
import ConsensusChart from './ConsensusChart';
import CodeExportPanel from './CodeExportPanel';
import VirtualizedRoundList from './VirtualizedRoundList';
import debounce from 'lodash.debounce';

export default function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [project, setProject] = useState<ProjectState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [debouncedFeedback, setDebouncedFeedback] = useState('');
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [selectedRound, setSelectedRound] = useState<number | 'all'>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [sessionDeleting, setSessionDeleting] = useState(false);
  const [laymanMode, setLaymanMode] = useState(true);
  const [customApiKey, setCustomApiKey] = React.useState(() => localStorage.getItem('user_gemini_api_key') || '');
  const [showKeyInput, setShowKeyInput] = React.useState(false);

  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    localStorage.setItem('user_gemini_api_key', key);
  };

  const visibleDecisionsSet = React.useMemo(() => {
    if (!project) return new Set<string>();
    const rounds = project.rounds || [];
    const filteredRounds = rounds.filter(
      (round) => selectedRound === 'all' || selectedRound === round.roundNumber
    );
    const set = new Set<string>();
    filteredRounds.forEach((round) => {
      if (round.decisionsLocked) {
        round.decisionsLocked.forEach((d) => {
          if (d) set.add(d.trim());
        });
      }
    });
    return set;
  }, [project, selectedRound]);

  const globalDecisionsToShow = React.useMemo(() => {
    if (!project) return [];
    const globalDec = project.globalDecisions || [];
    return globalDec.filter((d) => !visibleDecisionsSet.has(d.trim()));
  }, [project, visibleDecisionsSet]);

  const performFeedbackDebounce = React.useMemo(
    () => debounce((value: string) => setDebouncedFeedback(value), 300),
    []
  );

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedbackText(e.target.value);
    performFeedbackDebounce(e.target.value);
  };

  const handleDeleteThisProject = async () => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        navigate('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [activePromptTab, setActivePromptTab] = useState<'builder' | 'system' | 'foundation' | 'combined'>('builder');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [showDossier, setShowDossier] = useState(false);
  const [dossierTab, setDossierTab] = useState<'json' | 'markdown'>('json');

  const handleCopyToClipboard = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }).catch(err => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      } catch (e) {
        console.error("Failed to copy", e);
      }
    });
  };

  const getMarkdownDossier = (proj: ProjectState) => {
    const isZh = proj.language === 'zh';
    let md = `# ${isZh ? 'AI 智能体战略会商虚拟空间 —— 项目战略留档蓝图' : 'AI Multi-Agent Strategic Workspace -- Project Blueprint Dossier'}\n\n`;
    
    md += `## 1. ${isZh ? '项目基础信息 (Foundations)' : 'Project Basics'}\n`;
    md += `- **${isZh ? '核心构想 (Core Idea)' : 'Core Idea'}**: ${proj.idea}\n`;
    md += `- **${isZh ? '主要目标 (Primary Goals)' : 'Primary Goals'}**:\n${proj.goals ? proj.goals : (isZh ? '(无)' : '(None)')}\n\n`;
    md += `- **${isZh ? '限制条件 (Constraints)' : 'Constraints'}**:\n${proj.constraints ? proj.constraints : (isZh ? '(无)' : '(None)')}\n\n`;
    md += `- **${isZh ? 'AI 引擎 (Engine)' : 'AI Model Engine'}**: ${proj.model || 'Gemini'}\n`;
    md += `- **${isZh ? '创建时间 (Created)' : 'Created Date'}**: ${new Date(proj.createdAt).toLocaleString()}\n\n`;

    md += `## 2. ${isZh ? '已锁定的关键决策结构 (Locked SPEC/Invariants)' : 'Locked Decisions & System Invariants'}\n`;
    if (proj.globalDecisions && proj.globalDecisions.length > 0) {
      proj.globalDecisions.forEach((d, i) => {
        md += `${i + 1}. [${isZh ? '已锁定' : 'LOCKED'}] ${d}\n`;
      });
    } else {
      md += isZh ? '*（暂未锁定任何最终决策）*\n' : '*No permanent decisions locked yet.*\n';
    }
    md += `\n`;

    md += `## 3. ${isZh ? '会商历史档案 (Strategic Debate History)' : 'Strategic Board Rounds History'}\n`;
    if (proj.rounds && proj.rounds.length > 0) {
      proj.rounds.forEach((round) => {
        md += `### ${isZh ? `第 ${round.roundNumber} 轮` : `Round ${round.roundNumber}`} [Type: ${round.type.toUpperCase()}]\n`;
        md += `#### ${isZh ? '委员会成员立场与推理 (Board Members Positions)' : 'Board Members Positions & Perspectives'}:\n`;
        
        round.responses.forEach((resp) => {
          const agent = proj.agents.find(a => a.id === resp.agentId);
          const name = agent ? agent.name : `Agent ${resp.agentId}`;
          md += `- **[${name}]**:\n`;
          md += `  - **${isZh ? '立场立场 (Stance)' : 'Stance/Structured Position'}**: ${resp.position}\n`;
          md += `  - **${isZh ? '推理逻辑 (Reasoning)' : 'Reasoning/Invariants'}**:\n`;
          resp.reasoning.forEach(r => {
            md += `    - ${r}\n`;
          });
          if (resp.risks && resp.risks.length > 0) {
            md += `  - **${isZh ? '识别的风险 (Risks)' : 'Identified Risks'}**: ${resp.risks.join(', ')}\n`;
          }
          md += `  - **${isZh ? '置信度' : 'Confidence'}**: ${resp.confidence}%, **${isZh ? '用户票决' : 'User Evaluation'}**: ${resp.userVote ? resp.userVote.toUpperCase() : (isZh ? '未投票' : 'Abstained')}\n\n`;
        });

        md += `#### ${isZh ? '中调联席报告主持人综述 (Moderator Consensus Integration)' : 'Moderator Consensus Integration'}:\n`;
        md += `> ${round.moderatorSummary}\n\n`;

        if (round.userFeedback) {
          md += `#### ${isZh ? '用户打分点评与下次指向 (User Direct Steering Injected)' : 'User Directions & Injected Feedback'}:\n`;
          md += `> "${round.userFeedback}"\n\n`;
        }
      });
    } else {
      md += isZh ? '*（暂无会商辩论轮次历史记录）*\n' : '*No debates or rounds conducted yet.*\n';
    }

    return md;
  };

  useEffect(() => {
    if (project && project.rounds.length > 0) {
      setSelectedRound(project.rounds.length);
    } else {
      setSelectedRound('all');
    }
  }, [project?.rounds.length]);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const [exportData, setExportData] = useState<{
    systemInstructions: string;
    foundation: string;
    builderPrompt: string;
    buildReadiness: string;
    readinessScore: number;
    clarityScore: number;
    alignmentScore: number;
    completenessScore: number;
    feasibilityScore: number;
  } | null>(null);
  const [exportDataLoading, setExportDataLoading] = useState(false);

  useEffect(() => {
    if (project && project.status === 'completed' && !exportData && !exportDataLoading) {
      loadExportData();
    }
  }, [project?.status]);

  const loadExportData = async () => {
    setExportDataLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/export`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'X-Gemini-API-Key': customApiKey } : {})
        }
      });
      const data = await res.json();
      if (data.success) {
        setExportData(data.data);
      }
    } catch (err) {
      console.error("Failed to prefetch export specs:", err);
    } finally {
      setExportDataLoading(false);
    }
  };

  const fetchProject = async () => {
    const res = await fetch(`/api/projects/${id}`);
    const data = await res.json();
    if (data.success) setProject(data.data);
    setLoading(false);
  };

  const handleNextRound = async (action: 'continue' | 'conclude') => {
    setActionLoading(true);
    try {
      let finalFeedback = debouncedFeedback;
      const answeredQuestions = Object.entries(questionAnswers).filter(([_, a]) => a.trim() !== '');
      if (answeredQuestions.length > 0) {
        const answersStr = answeredQuestions.map(([q, a]) => `[Question: ${q}]\nAnswer: ${a}`).join('\n\n');
        finalFeedback = `${answersStr}\n\n${finalFeedback}`;
      }

      const res = await fetch(`/api/projects/${id}/next-round`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'X-Gemini-API-Key': customApiKey } : {})
        },
        body: JSON.stringify({ action, feedback: finalFeedback })
      });
      const data = await res.json();
      if (data.success) {
        setProject(data.data);
        setFeedbackText('');
        setDebouncedFeedback('');
        setQuestionAnswers({});
        setReplyingTo(null);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDecision = async (decision: string) => {
    if (!project) return;
    
    // Copy for rollback
    const rollbackDecisions = [...project.globalDecisions];
    
    // Optimistic Update
    setProject(prev => {
      if (!prev) return null;
      return {
        ...prev,
        globalDecisions: prev.globalDecisions.filter(d => d !== decision)
      };
    });

    try {
      const res = await fetch(`/api/projects/${id}/decision`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error('Failed to delete decision');
      const data = await res.json();
      if (data.success) {
        setProject(data.data);
      } else {
        setProject(prev => prev ? { ...prev, globalDecisions: rollbackDecisions } : null);
      }
    } catch (err) {
      console.error(err);
      setProject(prev => prev ? { ...prev, globalDecisions: rollbackDecisions } : null);
    }
  };

  const handleVote = async (roundNumber: number, agentId: string, voteType: 'up' | 'down') => {
    if (!project) return;

    // Deep copy for clean state rollback on failure
    const rollbackRounds = JSON.parse(JSON.stringify(project.rounds));

    // Optimistic state update
    const updatedRounds = project.rounds.map(round => {
      if (round.roundNumber === roundNumber) {
        return {
          ...round,
          responses: round.responses.map(resp => {
            if (resp.agentId === agentId) {
              const nextVote = resp.userVote === voteType ? null : voteType;
              return { ...resp, userVote: nextVote };
            }
            return resp;
          })
        };
      }
      return round;
    });

    setProject({
      ...project,
      rounds: updatedRounds
    });

    try {
      // Find what the final vote status will toggled to
      const currentRound = project.rounds.find(r => r.roundNumber === roundNumber);
      const currentResp = currentRound?.responses.find(resp => resp.agentId === agentId);
      const finalVoteVal = currentResp?.userVote === voteType ? null : voteType;

      const res = await fetch(`/api/projects/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundNumber, agentId, vote: finalVoteVal })
      });
      const data = await res.json();
      if (data.success) {
        setProject(data.data);
      } else {
        setProject(prev => prev ? { ...prev, rounds: rollbackRounds } : null);
      }
    } catch (err) {
      console.error(err);
      setProject(prev => prev ? { ...prev, rounds: rollbackRounds } : null);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      let dataToUse = exportData;
      if (!dataToUse) {
        const res = await fetch(`/api/projects/${id}/export`, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          dataToUse = data.data;
          setExportData(data.data);
        }
      }

      if (dataToUse) {
        downloadFile('SYSTEM_INSTRUCTIONS.md', dataToUse.systemInstructions);
        downloadFile('FOUNDATION.md', dataToUse.foundation);
        downloadFile('BUILDER_PROMPT.md', dataToUse.builderPrompt);
        if (dataToUse.buildReadiness) {
          downloadFile('BUILD_READINESS.md', dataToUse.buildReadiness);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  };

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) return <div className="text-center p-12 text-slate-500">{t.loadingCtx}</div>;
  if (!project) return <div className="text-center p-12 text-red-500">{t.notFound}</div>;

  return (
    <>
      {/* Back & Delete Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/60 pb-5 mb-2 animate-in fade-in duration-300">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-3 pb-1.5 pt-1.5 rounded-lg bg-[#161B22] hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-400 hover:text-slate-200 uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-md shrink-0"
        >
          <ChevronRight size={14} className="rotate-180 text-cyan-500" />
          {t.goBackHome}
        </button>

        <div className="relative shrink-0">
          {sessionDeleting ? (
            <div className="flex items-center gap-2.5 animate-in fade-in zoom-in-95 duration-150">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10">
                {project.language === 'zh' ? '确定永久删除本案吗?' : 'Confirm delete session?'}
              </span>
              <button
                onClick={handleDeleteThisProject}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[9px] px-2.5 py-1.5 rounded uppercase tracking-wider cursor-pointer transition-all shadow-md active:scale-95 text-center"
              >
                {project.language === 'zh' ? '是的，确定删除' : 'YES, REMOVE'}
              </button>
              <button
                onClick={() => setSessionDeleting(false)}
                className="bg-[#1e2530] hover:bg-slate-800 text-slate-350 font-bold text-[9px] px-2.5 py-1.5 rounded border border-slate-700 uppercase tracking-wider cursor-pointer transition-all text-center"
              >
                {project.language === 'zh' ? '取消' : 'CANCEL'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSessionDeleting(true)}
              className="inline-flex items-center gap-1.5 px-3 pb-1.5 pt-1.5 rounded-lg bg-slate-950/20 hover:bg-rose-500/10 border border-slate-850 hover:border-rose-500/20 text-xs font-bold text-slate-500 hover:text-rose-400 uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <span>{t.deleteProject}</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        {/* Main Content: Meeting Transcript */}
      <div className="space-y-6">
        <div className="bg-[#161B22] md:rounded-t-xl rounded-xl border border-slate-800 p-6 shadow-2xl flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">{t.activeMeeting}</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 select-none">
                <div className="flex items-center gap-2">
                  <Cpu size={12} className="text-violet-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Engine:</span>
                  <select 
                    value={project.model || 'gemini-flash-lite-latest'}
                    onChange={async (e) => {
                      const nextModel = e.target.value;
                      setProject(prev => prev ? { ...prev, model: nextModel } : null);
                      try {
                        await fetch(`/api/projects/${id}/model`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ model: nextModel })
                        });
                      } catch (err) {
                        console.error("Failed to update model:", err);
                      }
                    }}
                    className="bg-[#0F1219] hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 text-slate-300 rounded px-2.5 py-1 text-[11px] font-semibold tracking-wide outline-none transition-all cursor-pointer focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="gemini-flash-lite-latest">Gemini 3.5 Flash Lite (Fast / Default)</option>
                    <option value="gemini-2.1-flash">Gemini 2.1 Flash (Consistent Output)</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Modern Intelligence)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Cognition)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowKeyInput(!showKeyInput)}
                    className={cn(
                      "px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer border",
                      customApiKey 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 shadow-sm shadow-emerald-500/5" 
                        : "bg-[#0F1219] border-slate-800 text-slate-400 hover:bg-slate-800/60"
                    )}
                  >
                    {customApiKey ? (project.language === 'zh' ? '● 已设自定义 API Key' : '● Custom API Key Loaded') : (project.language === 'zh' ? '设置自定义 API KEY' : 'Set Custom API Key')}
                  </button>
                </div>
              </div>

              {showKeyInput && (
                <div className="mt-3 p-3 bg-slate-950/40 rounded-lg border border-slate-800/80 max-w-md space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                      {project.language === 'zh' ? 'Gemini API 密钥覆盖' : 'Gemini API Key Override'}
                    </span>
                    {customApiKey && (
                      <button
                        onClick={() => handleSaveApiKey('')}
                        className="text-[9px] uppercase tracking-wider font-bold text-rose-450 hover:text-rose-450 transition cursor-pointer"
                      >
                        {project.language === 'zh' ? '清除密钥' : 'Clear key'}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder={project.language === 'zh' ? '输入以 AIzaSy 开头的 Gemini API Key...' : 'Enter your Gemini API key (AIzaSy)...'}
                      value={customApiKey}
                      onChange={(e) => handleSaveApiKey(e.target.value)}
                      className="flex-1 bg-[#0F1219] border border-slate-800 focus:border-violet-500 rounded px-3 py-1.5 text-xs text-slate-200 outline-none font-mono tracking-wider placeholder:text-slate-600 focus:ring-1 focus:ring-violet-500/30 transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    {project.language === 'zh' 
                      ? '此 Key 保存在您本人的浏览器 LocalStorage 中，仅用于代理向 Gemini API 发送请求，绝不会泄露。' 
                      : 'This Key is stored safely on your client LocalStorage and sent only for your personal session proxying.'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {project.status === 'completed' && (
                <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 font-bold uppercase tracking-widest text-[10px] rounded flex items-center gap-1">
                  <CheckCircle2 size={12} /> {t.completed}
                </span>
              )}
              <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 font-bold uppercase tracking-widest text-[10px] rounded flex items-center gap-1">
                <Users size={12} /> {project.agents.length} {t.agentsCount}
              </span>
            </div>
          </div>

          {/* Project Details Panel (Core Idea, Primary Goals, Constraints) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#0F1219]/60 border border-slate-800/80 p-5 rounded-xl text-left shadow-inner">
            {/* Core Idea */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <Brain size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">{t.coreIdea}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans max-h-24 overflow-y-auto pr-1">
                {project.idea}
              </p>
            </div>

            {/* Primary Goals */}
            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-4">
              <div className="flex items-center gap-2 text-green-400">
                <Target size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">{t.primaryGoals}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans max-h-24 overflow-y-auto pr-1 whitespace-pre-line">
                {project.goals || (project.language === 'zh' ? '（暂无明确目标）' : '(No specified goals)')}
              </p>
            </div>

            {/* Constraints */}
            <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-4">
              <div className="flex items-center gap-2 text-amber-500">
                <ShieldAlert size={16} />
                <span className="text-xs font-bold uppercase tracking-widest">{t.constraints}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans max-h-24 overflow-y-auto pr-1 whitespace-pre-line">
                {project.constraints || (project.language === 'zh' ? '（暂无特定限制条件）' : '(No specific constraints)')}
              </p>
            </div>
          </div>

          {/* Dossier & Backup / Restoration Trigger Button */}
          <div className="mt-2 flex justify-start">
            <button
              onClick={() => setShowDossier(!showDossier)}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-md",
                showDossier 
                  ? "bg-slate-800 border-slate-700 text-cyan-400" 
                  : "bg-slate-900/60 border-slate-850/60 text-slate-400 hover:text-slate-200 hover:border-slate-800"
              )}
            >
              <span>{(t as any).toggleDossier || '📁 Backup & Transfer Pack'}</span>
              <ChevronRight size={12} className={cn("transition-transform duration-200", showDossier && "rotate-90")} />
            </button>
          </div>

          {/* Dossier Collapsible View Block */}
          {showDossier && (
            <div className="bg-[#0F1219]/70 border border-slate-800/80 p-5 rounded-xl text-left shadow-inner space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    {t.transferPack}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal max-w-xl">
                    {t.transferPackDesc}
                  </p>
                </div>

                {/* Tab select for JSON vs Markdown */}
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800/60 shrink-0 select-none">
                  <button
                    onClick={() => setDossierTab('json')}
                    className={cn(
                      "px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer",
                      dossierTab === 'json'
                        ? "bg-slate-800 text-cyan-400 shadow"
                        : "text-slate-500 hover:text-slate-350"
                    )}
                  >
                    {t.jsonTab || 'JSON (Restore)'}
                  </button>
                  <button
                    onClick={() => setDossierTab('markdown')}
                    className={cn(
                      "px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer",
                      dossierTab === 'markdown'
                        ? "bg-slate-800 text-cyan-400 shadow"
                        : "text-slate-500 hover:text-slate-350"
                    )}
                  >
                    {t.markdownTab || 'Markdown (AI chat)'}
                  </button>
                </div>
              </div>

              {/* Text Area & Copy Display Frame */}
              <div className="relative">
                <div className="absolute right-3 top-3 z-10">
                  <button
                    onClick={() => {
                      const text = dossierTab === 'json' 
                        ? JSON.stringify(project, null, 2) 
                        : getMarkdownDossier(project);
                      handleCopyToClipboard(text, 'dossier');
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-md",
                      copiedKey === 'dossier'
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    )}
                  >
                    {copiedKey === 'dossier' ? <Check size={10} /> : <Copy size={10} />}
                    <span>{copiedKey === 'dossier' ? t.copiedBtn : t.copyBtn}</span>
                  </button>
                </div>

                <div className="bg-[#05070A] rounded-xl border border-slate-850 p-4 pt-11 max-h-64 overflow-y-auto block select-text">
                  <pre className="text-slate-300 font-mono text-[10px] leading-relaxed whitespace-pre-wrap text-left select-text">
                    {dossierTab === 'json' 
                      ? JSON.stringify(project, null, 2) 
                      : getMarkdownDossier(project)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 py-2 border-t border-b border-slate-800/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Board Members:</span>
            <div className="flex flex-wrap gap-2">
              {project.agents.map((agent) => {
                const agentId = agent.id as keyof typeof t.agentNames;
                const name = t.agentNames[agentId] || agent.name;
                return (
                  <div key={agent.id} className="flex items-center gap-2 px-2.5 py-1 bg-slate-900/40 border border-slate-800 rounded-lg text-xs" title={name}>
                    <AgentAvatar id={agent.id} name={agent.name} size="xs" />
                    <span className="text-slate-300 font-medium text-[11px] truncate max-w-[120px]">{name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center mb-1.5 text-xs font-mono">
              <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px]">{t.progressLabel}</span>
              <span className="text-cyan-400 font-semibold text-xs">{project.rounds.length} {t.ofRounds}</span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex gap-1">
              {[1, 2, 3, 4, 5].map((step) => {
                const isCompleted = project.rounds.length >= step;
                return (
                  <div 
                    key={step} 
                    className={`h-full flex-1 transition-all duration-500 ${
                      isCompleted 
                        ? project.status === 'completed' 
                          ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' 
                          : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                        : 'bg-slate-800'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {project.quotaWarning && (
          <div id="quota-warning-banner" className="bg-amber-500/10 border border-amber-500/30 text-amber-200 p-4 rounded-xl flex items-start gap-3 shadow-lg">
            <ShieldAlert className="text-amber-400 shrink-0 mt-0.5" size={18} />
            <div className="space-y-1 text-xs text-left">
              <h4 className="font-bold text-white text-[13px]">
                {project.language === 'zh' ? '已激活智能离线模拟模式' : 'Offline Strategic Simulation Active'}
              </h4>
              <p className="text-slate-300/90 leading-relaxed text-[11px]">
                {project.language === 'zh' 
                  ? '检测到 Gemini 免费版 API 访问受限（已超 20 次额度上限），或 API Key 未设置。为确保体验不中断，系统已自动装载离线模拟会商引擎。后续交互与议题锁定等功能可照常无损体验。' 
                  : 'Your Gemini Free Tier request quota was exceeded (rate-limited) or the API Key is unconfigured. To prevent workflow blockages, we have activated our high-fidelity offline simulation loop. All votes and consensus metrics remain fully interactive.'}
              </p>
            </div>
          </div>
        )}

        {/* Round Navigation Tabs */}
        {project.rounds.length > 0 && (
          <div id="round-navigation-tabs" className="bg-[#161B22] border border-slate-800 rounded-xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <History size={12} className="text-indigo-400" />
                {project.language === 'zh' ? '会商辩论轮次导航' : 'Debate History Navigation'}
              </span>
              <span className="text-[9px] font-mono text-slate-500">
                {project.language === 'zh' 
                  ? `当前在看: ${selectedRound === 'all' ? '全部轮次' : `第 ${selectedRound} 轮`}` 
                  : `Viewing: ${selectedRound === 'all' ? 'All Rounds' : `Round ${selectedRound}`}`}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <button
                onClick={() => setSelectedRound('all')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-95",
                  selectedRound === 'all'
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-750"
                )}
              >
                {project.language === 'zh' ? '📊 显示全景' : '📊 Show All'}
              </button>

              {project.rounds.map((r) => {
                const isSelected = selectedRound === r.roundNumber;
                return (
                  <button
                    key={r.roundNumber}
                    onClick={() => setSelectedRound(r.roundNumber)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5",
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                        : "bg-slate-900/60 border-slate-850 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    )}
                  >
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isSelected ? "bg-cyan-300 animate-pulse" : "bg-slate-500"
                    )} />
                    {project.language === 'zh' ? `第 ${r.roundNumber} 轮` : `Round ${r.roundNumber}`}
                  </button>
                );
              })}
            </div>
            
            {/* Layman Mode Toggle Option */}
            <div className="border-t border-slate-800/80 pt-3 mt-2 flex items-center justify-between gap-4">
              <div className="flex gap-2 items-start">
                <Sparkles size={13} className={cn("text-cyan-400 mt-0.5 shrink-0", laymanMode && "animate-pulse")} />
                <div>
                  <p className="text-[11px] font-bold text-slate-200 tracking-wide flex items-center gap-1.5 matches-theme">
                    {t.simplifyView}
                    <span className={cn(
                      "text-[8px] font-mono px-1 py-0.5 rounded uppercase tracking-wider font-bold",
                      laymanMode ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-slate-800 text-slate-500 border border-slate-700/30"
                    )}>
                      {laymanMode ? (project.language === 'zh' ? '已开启' : 'Active') : (project.language === 'zh' ? '已关闭' : 'Off')}
                    </span>
                  </p>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-md mt-0.5">
                    {t.simplifyViewDesc}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setLaymanMode(!laymanMode)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:outline-none",
                  laymanMode ? "bg-cyan-500" : "bg-slate-800"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    laymanMode ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        )}

        <div className="space-y-8 font-sans">
          {project.rounds.length === 0 ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
              <Bot className="mx-auto h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white">{t.meetingInit}</h3>
              <p className="text-slate-400 mt-1 mb-6">{t.startAnalysis}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {project.rounds
                .filter(round => selectedRound === 'all' || selectedRound === round.roundNumber)
                .map((round) => {
                  const isZh = project.language === 'zh';
                  return (
                    <div key={round.roundNumber} className="bg-[#161B22] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-cyan-500" />
                          {isZh ? `回合 ${round.roundNumber}: 决策` : `Round ${round.roundNumber}: Decisions`}
                        </h3>
                        <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                          {round.type === 'analysis' ? (isZh ? '初始分析' : 'Initial Analysis') : (isZh ? '辩论综合' : 'Debate Synthesis')}
                        </span>
                      </div>
                      
                      {round.decisionsLocked && round.decisionsLocked.length > 0 ? (
                        <div className="space-y-3">
                          {round.decisionsLocked.map((d, index) => (
                            <div key={index} className="bg-[#0D1117] border border-slate-800 rounded-lg p-4 group relative hover:border-slate-700/80 transition-all duration-200">
                              <div className="flex items-start gap-3">
                                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-1.5 shrink-0 animate-pulse"></div>
                                <div className="flex-1 pr-14">
                                  <span className="text-[11px] font-medium text-slate-200 leading-normal block whitespace-pre-wrap break-words">
                                    {d.trim().replace(/\n(?:[ \t]*\n)+/g, '\n')}
                                  </span>
                                </div>
                                <div className="absolute right-3 top-3">
                                  <button
                                    onClick={() => handleRejectDecision(d)}
                                    className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors flex items-center justify-center border border-rose-500/30"
                                    title={t.thumbsDown || "Reject"}
                                    aria-label={t.thumbsDown || "Reject"}
                                  >
                                    <ThumbsDown size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-500 text-[11px] italic py-2">
                          {isZh ? '本回合暂无决策或已全部被移除' : 'No decisions in this round, or all have been rejected.'}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {project.rounds.length > 0 && project.status !== 'completed' && (
          <div className="space-y-6">
            {/* Global Memory Block */}
            <div className="bg-[#161B22] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-500"/> {t.globalMemory}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t.lockedDecisions}</div>
                  {globalDecisionsToShow.length === 0 ? (
                    <div className="text-[11px] text-slate-500 italic">
                      {project.globalDecisions.length > 0 
                        ? (project.language === 'zh' ? '已在下方轮次列表中显示' : 'All shown in the round list below')
                        : t.noneYet}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {globalDecisionsToShow.map((d, i) => (
                        <GlobalDecisionItem key={i} decision={d} project={project} onReject={handleRejectDecision} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive User Feedback & Open Questions Section */}
            <div id="interactive-user-feedback-section" className="bg-[#161B22] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-6 scroll-mt-24 transition-all duration-300">
              
              {project.rounds[project.rounds.length - 1].openQuestions && project.rounds[project.rounds.length - 1].openQuestions?.length !== 0 && (
                <div className="overflow-hidden rounded-lg bg-indigo-500/5 border border-indigo-500/10 mb-4 p-4 space-y-3">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Target size={12} className="text-amber-500" />
                    {t.openQuestions}
                  </div>
                  <ul className="space-y-4 pl-1">
                    {project.rounds[project.rounds.length - 1].openQuestions!.map((q, i) => (
                      <li key={i} className="group relative">
                        <div className="flex items-start gap-3">
                          <div className="w-1 h-1 bg-amber-500 rounded-full mt-1.5 shrink-0 group-hover:scale-150 transition-transform"></div>
                          <div className="flex-1 space-y-2">
                            <span className="text-xs text-slate-300 leading-relaxed block">{q}</span>
                            <textarea
                              rows={2}
                              placeholder={t.answerInputLabel || 'Answer this question...'}
                              value={questionAnswers[q] || ''}
                              onChange={(e) => setQuestionAnswers(prev => ({ ...prev, [q]: e.target.value }))}
                              className="w-full bg-[#0A0D14]/80 border border-slate-700/50 hover:border-slate-600 rounded box-border p-2.5 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-y max-h-32"
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Cpu size={18} />
                    </span>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">{t.feedbackTitle}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {t.submitFeedbackHelp}
                      </p>
                    </div>
                  </div>
                </div>

                <textarea
                  id="user-feedback-textarea"
                  value={feedbackText}
                  onChange={handleFeedbackChange}
                  placeholder={t.feedbackPlaceholder}
                  className="w-full h-32 bg-[#0A0D14]/80 border border-slate-800 hover:border-slate-700 rounded-lg p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans leading-relaxed resize-y mt-2 box-border"
                />
              </div>
            </div>
          </div>
        )}

        {project.status !== 'completed' ? (
          <div className="flex items-center justify-end gap-4 border-t border-slate-800 pt-6 mt-8">
            {project.rounds.length > 0 && (
              <button
                onClick={() => handleNextRound('conclude')}
                disabled={actionLoading}
                className="px-4 py-2 text-[10px] text-slate-400 hover:text-white uppercase font-bold tracking-widest disabled:opacity-50"
              >
                {t.conclude}
              </button>
            )}
            <button
              onClick={() => handleNextRound('continue')}
              disabled={actionLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-widest uppercase rounded text-[10px] flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {actionLoading 
                ? t.processing 
                : project.rounds.length === 0 
                  ? t.startInitial 
                  : debouncedFeedback.trim() 
                    ? (project.language === 'zh' ? '提交意见并进入下轮辩论' : 'SUBMIT DIRECTIONS & ADVANCE') 
                    : t.nextRound}
              {!actionLoading && <ChevronRight size={14} />}
            </button>
          </div>
        ) : (
          <div className="mt-8 pt-8 border-t border-slate-800 text-left space-y-6">
            <CodeExportPanel project={project} />
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono font-bold uppercase tracking-wider text-[9px] rounded-md">
                  METRICS SYSTEM
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {project.language === 'zh' ? '🚀 构建就绪度战略评估看板 (Build Readiness Scorecard)' : '🚀 Build Readiness Scorecard'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                {project.language === 'zh'
                  ? '多维度战略审计结果：系统客观评估多智能体辩论收敛度、议题锁定率和面向落地承接的研发交付就绪等级。'
                  : 'Multi-disciplinary consensus audits: evaluates multi-agent convergence, locked specs, and next-stage code R&D alignment.'}
              </p>
            </div>

            {exportDataLoading ? (
              <div className="bg-[#161B22]/60 rounded-xl border border-slate-800/80 p-8 text-center animate-pulse space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto"></div>
                <p className="text-xs text-slate-400 uppercase tracking-widest font-mono font-bold">
                  {project.language === 'zh' ? '抓取中控台就绪度分析算法模型...' : 'Fetching live workspace audit calculations...'}
                </p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Score meters grid */}
                <div className="flex flex-col md:flex-row gap-5">
                  {/* Circular meter */}
                  <div className="flex flex-col items-center justify-center bg-[#161B22] rounded-xl border border-slate-800/80 p-5 text-center shadow-2xl min-w-[200px] shrink-0">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-3">
                      {project.language === 'zh' ? '综合就绪度 (Overall)' : 'Overall Readiness'}
                    </span>
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="6" className="text-slate-800" fill="transparent" />
                        <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="6" className="text-emerald-500 transition-all duration-1000" strokeDasharray="301.6" strokeDashoffset={301.6 - (301.6 * (exportData?.readinessScore || 75)) / 100} fill="transparent" />
                      </svg>
                      <span className="absolute text-3xl font-black font-mono text-white select-none">
                        {exportData?.readinessScore || 75}%
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold tracking-widest uppercase mt-4 px-3 py-1 rounded-full border ${
                      (exportData?.readinessScore || 75) >= 85 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}>
                      {(exportData?.readinessScore || 75) >= 85 
                        ? (project.language === 'zh' ? '🟢 卓越就绪' : '🟢 EXTREMELY READY') 
                        : (project.language === 'zh' ? '🟡 中高就绪' : '🟡 STRATEGICALLY STABLE')}
                    </span>
                  </div>

                  {/* Dimension sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    {/* Clarity */}
                    <div className="bg-[#161B22] rounded-xl border border-slate-800/80 p-4 shadow-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          {project.language === 'zh' ? '需求清晰度 (Clarity)' : 'Clarity Index'}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">
                          {project.language === 'zh' ? '商业构想与技术约束定义的细致度' : 'Goals & limitations definition depth'}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-[10px] text-slate-400">Score</span>
                          <span className="text-xs font-mono font-bold text-blue-400">{exportData?.clarityScore || 80}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-1000" style={{ width: `${exportData?.clarityScore || 80}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Alignment */}
                    <div className="bg-[#161B22] rounded-xl border border-slate-800/80 p-4 shadow-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          {project.language === 'zh' ? '战略对齐度 (Alignment)' : 'Alignment Index'}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">
                          {project.language === 'zh' ? '董事辩论锁定及用户投票转化度' : 'Board debate stability & vote traction'}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-[10px] text-slate-400">Score</span>
                          <span className="text-xs font-mono font-bold text-teal-400">{exportData?.alignmentScore || 85}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-1000" style={{ width: `${exportData?.alignmentScore || 85}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Completeness */}
                    <div className="bg-[#161B22] rounded-xl border border-slate-800/80 p-4 shadow-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          {project.language === 'zh' ? '架构完备度 (Completeness)' : 'Completeness Index'}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">
                          {project.language === 'zh' ? '系统数据字典与核心逻辑覆盖率' : 'Schema invariants & components covered'}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-[10px] text-slate-400">Score</span>
                          <span className="text-xs font-mono font-bold text-violet-400">{exportData?.completenessScore || 75}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 transition-all duration-1000" style={{ width: `${exportData?.completenessScore || 75}%` }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Feasibility */}
                    <div className="bg-[#161B22] rounded-xl border border-slate-800/80 p-4 shadow-xl flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                          {project.language === 'zh' ? '研发可行性 (Feasibility)' : 'Feasibility Index'}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-0.5">
                          {project.language === 'zh' ? '依托标准技术栈成功编码执行的概率' : 'React/TS setup & library execution ease'}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-[10px] text-slate-400">Score</span>
                          <span className="text-xs font-mono font-bold text-pink-400">{exportData?.feasibilityScore || 90}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-pink-500 to-rose-400 transition-all duration-1000" style={{ width: `${exportData?.feasibilityScore || 90}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Actions Preview Panel */}
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <History size={12} className="text-cyan-400 shrink-0" />
                    <span>
                      {project.language === 'zh' 
                        ? '《研发合规行动与就绪度评估说明书 (BUILD_READINESS.md)》在线视窗' 
                        : 'Actionable Build Blueprint (BUILD_READINESS.md) Preview HUD'}
                    </span>
                  </div>
                  <div className="bg-[#090D14]/90 rounded-xl border border-slate-800/85 p-5 shadow-inner max-h-72 overflow-y-auto block whitespace-pre-line text-slate-300 font-sans text-xs leading-relaxed select-text">
                    {exportData?.buildReadiness || (project.language === 'zh' ? '正在渲染就绪度底层算法报告...' : 'Computing strategic convergence audit logs...')}
                  </div>
                </div>

                {/* ⚡ Codegen Prompt Center & One-Click Copy */}
                <div id="codegen-prompt-center" className="mt-8 border-t border-slate-800/80 pt-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Cpu size={16} className="text-amber-500 shrink-0" />
                      <span>{t.promptLibraryTitle}</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      {t.promptLibraryDesc}
                    </p>
                  </div>

                  {/* Tab Selector */}
                  <div className="flex flex-wrap gap-1.5 bg-[#0F1219] p-1 rounded-lg border border-slate-800/60">
                    <button
                      onClick={() => setActivePromptTab('builder')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex-1 text-center whitespace-nowrap",
                        activePromptTab === 'builder'
                          ? "bg-slate-800 text-cyan-400 border border-slate-700/80 shadow-md animate-in fade-in zoom-in-95 duration-150"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {t.builderPromptTab}
                    </button>
                    <button
                      onClick={() => setActivePromptTab('system')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex-1 text-center whitespace-nowrap",
                        activePromptTab === 'system'
                          ? "bg-slate-800 text-cyan-400 border border-slate-700/80 shadow-md animate-in fade-in zoom-in-95 duration-150"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {t.systemInstructionsTab}
                    </button>
                    <button
                      onClick={() => setActivePromptTab('foundation')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex-1 text-center whitespace-nowrap",
                        activePromptTab === 'foundation'
                          ? "bg-slate-800 text-cyan-400 border border-slate-700/80 shadow-md animate-in fade-in zoom-in-95 duration-150"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {t.foundationTab}
                    </button>
                    <button
                      onClick={() => setActivePromptTab('combined')}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex-1 text-center whitespace-nowrap",
                        activePromptTab === 'combined'
                          ? "bg-gradient-to-r from-indigo-950 to-purple-950 text-indigo-300 border border-indigo-800/40 shadow-inner animate-in fade-in zoom-in-95 duration-150"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      {t.combinedMegaPromptTab}
                    </button>
                  </div>

                  {/* Active content viewport */}
                  {exportData && (
                    <div className="space-y-3 relative">
                      <div className="absolute right-4 top-4 z-10">
                        <button
                          onClick={() => {
                            let textToCopy = '';
                            if (activePromptTab === 'builder') textToCopy = exportData.builderPrompt;
                            else if (activePromptTab === 'system') textToCopy = exportData.systemInstructions;
                            else if (activePromptTab === 'foundation') textToCopy = exportData.foundation;
                            else if (activePromptTab === 'combined') {
                              textToCopy = `# AI DEVELOPER CODE GENERATION MEGA-PROMPT\n\nYou are an expert full-stack developer AI. Your task is to build a high-fidelity, complete application based on the following strategic board specifications, product foundations, and system instructions.\n\n## 1. SYSTEM ROLE & CODING CONSTRAINTS\n${exportData.systemInstructions}\n\n## 2. PRODUCT FOUNDATION & COMPLETED DESIGN WORK\n${exportData.foundation}\n\n## 3. DOWNSTREAM DEVELOPMENT STEPS (CHRONOLOGICAL TASKS)\n${exportData.builderPrompt}`;
                            }
                            handleCopyToClipboard(textToCopy, activePromptTab);
                          }}
                          className={cn(
                            "px-3.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 select-none transition-all active:scale-95 cursor-pointer shadow-md",
                            copiedKey === activePromptTab
                              ? "bg-emerald-600 text-white shadow-emerald-500/20"
                              : "bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/10"
                          )}
                        >
                          {copiedKey === activePromptTab ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedKey === activePromptTab ? t.copiedBtn : t.copyBtn}</span>
                        </button>
                      </div>

                      <div className="bg-[#090D14]/90 rounded-xl border border-slate-800/85 p-5 pt-14 shadow-inner h-64 overflow-y-auto block select-text">
                        <pre className="text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text text-left">
                          {activePromptTab === 'builder' && exportData.builderPrompt}
                          {activePromptTab === 'system' && exportData.systemInstructions}
                          {activePromptTab === 'foundation' && exportData.foundation}
                          {activePromptTab === 'combined' && (
                            `# AI DEVELOPER CODE GENERATION MEGA-PROMPT

You are an expert full-stack developer AI. Your task is to build a high-fidelity, complete application based on the following strategic board specifications, product foundations, and system instructions.

## 1. SYSTEM ROLE & CODING CONSTRAINTS
${exportData.systemInstructions}

## 2. PRODUCT FOUNDATION & COMPLETED DESIGN WORK
${exportData.foundation}

## 3. DOWNSTREAM DEVELOPMENT STEPS (CHRONOLOGICAL TASKS)
${exportData.builderPrompt}`
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-widest uppercase rounded text-[10px] flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Download size={14} />
                {exportLoading ? t.processing : t.exportSpec}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}

function simplifyText(text: string, isZh: boolean): string {
  if (!text) return "";
  let s = text;
  if (isZh) {
    s = s.replace(/MVP/g, "最简洁实用的核心雏形 (MVP)");
    s = s.replace(/解耦/g, "各部分代码拆分独立、互相不干扰");
    s = s.replace(/持久化/g, "自动安全存盘");
    s = s.replace(/防抖/g, "合并重复频繁点击事件");
    s = s.replace(/服务端/g, "云端服务器");
    s = s.replace(/负载/g, "访问压力");
    s = s.replace(/并读写/g, "并多人读写");
    s = s.replace(/并发/g, "高人流同时访问");
    s = s.replace(/重合/g, "重复");
    s = s.replace(/WCAG AA/g, "色彩高对比无障碍标准");
    s = s.replace(/IndexedDB/g, "网页浏览器本地数据库");
    s = s.replace(/LocalStorage/g, "网页本地自带存储");
    s = s.replace(/数据表/g, "核心信息数据保存表");
    s = s.replace(/静态合规扫描/g, "安全及规范防错扫描");
    s = s.replace(/内存泄露/g, "内存没放开导致卡死");
    s = s.replace(/竞态冲突/g, "数据同时修改覆盖冲突");
    s = s.replace(/高维/g, "复杂大量的复合统计");
    s = s.replace(/算子/g, "运算处理机制");
    s = s.replace(/一致性/g, "想法契合度");
    s = s.replace(/共识/g, "见解统一度");
    s = s.replace(/未捕获异常/g, "没想到的运行错误");
    s = s.replace(/容灾/g, "自动防崩溃恢复");
    s = s.replace(/弱依赖/g, "不用非得时刻联网");
    s = s.replace(/骨架假载动画/g, "平滑的发光占位格");
    s = s.replace(/Skeleton UI/g, "发光占位特效加载卡片");
    s = s.replace(/多终端适配/g, "手机和电脑等多屏幕自适应");
    s = s.replace(/同理心/g, "贴心好懂");
    s = s.replace(/无障碍高对比度/g, "看起来非常清楚的无障碍色彩");
  } else {
    s = s.replace(/\bMVP\b/g, "Simplest Core Prototype (MVP)");
    s = s.replace(/\bdecoupling\b/gi, "clean separation of code rules");
    s = s.replace(/\bdecoupled\b/gi, "uniquely separated");
    s = s.replace(/\bpersistence\b/gi, "automatic local storing");
    s = s.replace(/\bpersisting\b/gi, "saving locally");
    s = s.replace(/\bpersistent\b/gi, "locally-saved");
    s = s.replace(/\bIndexedDB\b/g, "local browser database");
    s = s.replace(/\bLocalStorage\b/g, "browser local storage");
    s = s.replace(/\bdebounces\b/gi, "throttled delays");
    s = s.replace(/\bdebounced\b/gi, "prevented double-clicks");
    s = s.replace(/\bWCAG AA\b/g, "highly accessible eye-comfort standards");
    s = s.replace(/\bskeleton loads\b/gi, "shimmering layout placeholders");
    s = s.replace(/\bskeleton load\b/gi, "shimmering layout placeholder");
    s = s.replace(/\bskeletons\b/g, "loading card shapes");
    s = s.replace(/\bskeleton\b/g, "loading card shape");
    s = s.replace(/\bconcurrency\b/gi, "simultaneous user traffic");
    s = s.replace(/\bload balancing\b/gi, "traffic routing speedup");
    s = s.replace(/\bOOM\b/g, "out of memory crash");
    s = s.replace(/\brace conditions\b/gi, "data update clashes");
    s = s.replace(/\brace condition\b/gi, "data update clash");
    s = s.replace(/\bdecouple model\b/gi, "make code modules independent");
    s = s.replace(/\bformulate edge-validation\b/gi, "set strict input form checks");
  }
  return s;
}

interface GlobalDecisionItemProps {
  decision: string;
  project: ProjectState;
  onReject: (decision: string) => void;
}

const GlobalDecisionItem: React.FC<GlobalDecisionItemProps> = ({ decision, project, onReject }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, t } = useLanguage();
  const isZh = language === 'zh';
  
  // Find which round this decision was locked in
  // Compare strings properly. Sometimes decisions might have been slightly modified if trimmed, 
  // so we check if the locked decision string includes or is precisely this decision.
  const lockingRound = project.rounds.find(r => 
    r.decisionsLocked.some(ld => ld.trim() === decision.trim() || decision.includes(ld) || ld.includes(decision))
  );

  return (
    <div className="bg-slate-800/20 border border-slate-700/50 rounded-lg overflow-hidden transition-all duration-300 group">
      <div 
        className="p-3 cursor-pointer hover:bg-slate-800/40 flex items-start gap-3 relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="mt-1 shrink-0">
           {isOpen ? <ChevronUp size={14} className="text-cyan-500" /> : <ChevronDown size={14} className="text-cyan-500" />}
        </div>
        <div className="flex-1 pr-14">
          <span className="text-[11px] font-medium text-slate-200 leading-normal block whitespace-pre-wrap break-words">
            {decision.trim().replace(/\n(?:[ \t]*\n)+/g, '\n')}
          </span>
        </div>
        <div className="absolute right-3 top-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReject(decision);
            }}
            className="p-1 rounded bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-colors flex items-center justify-center border border-rose-500/30"
            title={t.thumbsDown || "Reject"}
            aria-label={t.thumbsDown || "Reject"}
          >
            <ThumbsDown size={14} />
          </button>
        </div>
      </div>
      
      {isOpen && lockingRound && (
        <div className="p-3 pt-0 border-t border-slate-700/30 bg-slate-800/10">
          <div className="text-[10px] text-slate-400 mb-2 mt-2 font-mono flex items-center justify-between">
            <span>{isZh ? '来源: 回合' : 'Source: Round'} {lockingRound.roundNumber}</span>
          </div>
          <div className="bg-[#0A0D14] p-3 rounded border border-slate-800/80">
            <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-1.5">{isZh ? '辩论摘要节选' : 'Debate Excerpt'}</div>
            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              "{lockingRound.moderatorSummary.slice(0, 250)}{lockingRound.moderatorSummary.length > 250 ? '...' : ''}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

interface RoundCardProps {
  round: RoundSummary;
  agents: ProjectState['agents'];
  onVote: (agentId: string, voteType: 'up' | 'down') => void;
  laymanMode: boolean;
}

const RoundCard: React.FC<RoundCardProps> = ({ round, agents, onVote, laymanMode }) => {
  const { t, language } = useLanguage();
  const isZh = language === 'zh';
  const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});

  const toggleAgentExpanded = (agentId: string) => {
    setExpandedAgents(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  return (
    <div className="bg-[#161B22] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="bg-[#0F1219] px-6 py-3 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {t.round} {round.roundNumber}: {round.type === 'analysis' ? t.initialAnalysis : t.debateSynthesis}
        </h3>
      </div>
      <div className="p-6 space-y-6">
        {/* Agent Responses */}
        <div className="grid gap-4">
          {round.responses.map(res => {
            const agent = agents.find(a => a.id === res.agentId);
            const agentName = agent ? t.agentNames[agent.id as keyof typeof t.agentNames] || agent.name : t.agent;
            
            const isExpanded = !laymanMode || !!expandedAgents[res.agentId];
            const simplifiedPosition = laymanMode ? simplifyText(res.position, isZh) : res.position;
            const simplifiedReasoning = res.reasoning.map(r => laymanMode ? simplifyText(r, isZh) : r);
            const simplifiedRisks = res.risks.map(r => laymanMode ? simplifyText(r, isZh) : r);

            return (
              <div key={res.agentId} className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <AgentAvatar id={res.agentId} name={agent?.name || ''} size="xs" />
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-slate-300 uppercase">{agentName}</span>
                      <span className="text-[9px] font-mono text-cyan-400 tracking-wider">[{res.confidence}% {t.conf}]</span>
                    </div>
                  </div>
                  
                  {/* Voting UI feedback */}
                  <div className="flex items-center gap-1.5" title={t.votePrompt}>
                    <button
                      onClick={() => onVote(res.agentId, 'down')}
                      className={cn(
                        "p-1.5 rounded-md border border-slate-800/80 hover:bg-slate-800/50 transition-all flex items-center justify-center gap-1 group cursor-pointer",
                        res.userVote === 'down' 
                          ? "bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.12)]" 
                          : "bg-slate-900/40 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                      )}
                      aria-label={t.thumbsDown}
                    >
                      <ThumbsDown size={12} className={cn("transition-transform group-hover:translate-y-0.5", res.userVote === 'down' && "fill-rose-500/20")} />
                      <span className="text-[10px] font-mono font-semibold px-0.5">{t.thumbsDown}</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-slate-800/20 p-4 rounded-lg border border-slate-700/50">
                  <p className="text-sm text-slate-200 font-semibold leading-relaxed mb-1">{simplifiedPosition}</p>
                  
                  {/* Layman collapsible details button */}
                  {laymanMode && (
                    <button
                      type="button"
                      onClick={() => toggleAgentExpanded(res.agentId)}
                      className="mt-1 mb-1 shadow-sm inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer select-none py-1 px-2 rounded bg-slate-950/15 border border-slate-800/50 hover:bg-slate-950/30"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={11} className="text-cyan-400" />
                          <span>{t.hideTechnicalDetails}</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown size={11} className="text-cyan-400" />
                          <span>{t.showTechnicalDetails}</span>
                        </>
                      )}
                    </button>
                  )}
                
                  {isExpanded && (
                    <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                          {t.reasoning}
                        </div>
                        <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                          {simplifiedReasoning.map((r, i) => <li key={i} className="leading-snug">{r}</li>)}
                        </ul>
                      </div>
                    
                      {simplifiedRisks.length > 0 && (
                        <div className="pt-3 mt-3 border-t border-slate-700/50">
                          <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                            {t.risks}
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {simplifiedRisks.map((r, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-350 uppercase tracking-wider">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Moderator Summary */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2">
             <span className="text-[10px] font-mono text-indigo-400">[{t.moderator}]</span>
             <span className="text-xs font-bold text-slate-300 uppercase">{t.synthesis}</span>
          </div>
          <div className="bg-slate-800/30 p-5 rounded-lg border-l-2 border-indigo-500">
             <p className="text-sm leading-normal text-slate-300 italic whitespace-pre-wrap break-words">
               "{laymanMode ? simplifyText(round.moderatorSummary, isZh).trim().replace(/\n(?:[ \t]*\n)+/g, '\n') : round.moderatorSummary.trim().replace(/\n(?:[ \t]*\n)+/g, '\n')}"
             </p>
          </div>
        </div>

        {round.userFeedback && (
          <div className="mt-6 border-t border-slate-800/60 pt-5">
            <div className="flex items-center gap-2 mb-2">
               <span className="text-[10px] font-mono text-emerald-400">[{t.userFeedback}]</span>
               <span className="text-xs font-bold text-slate-300 uppercase">{t.userDirections}</span>
            </div>
            <div className="bg-emerald-500/5 p-5 border border-emerald-500/10 rounded-lg border-l-2 border-emerald-500">
               <p className="text-sm leading-normal text-slate-200 whitespace-pre-wrap break-words">
                 {round.userFeedback.trim().replace(/\n(?:[ \t]*\n)+/g, '\n')}
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
