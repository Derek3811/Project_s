import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProjectState } from '../types';
import { Plus, Building2, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectState[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProjects(data.data);
        }
        setLoading(false);
      });
  }, []);

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setProjects(prev => prev.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">{t.loadingWorkspace}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">{t.projects}</h2>
          <p className="text-sm text-slate-400 mt-1">{t.projectsDesc}</p>
        </div>
        <Link 
          to="/new" 
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded transition-all"
        >
          <Plus size={18} />
          {t.newInitiative}
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-[#161B22] border border-slate-800 rounded-xl p-12 text-center shadow-2xl">
          <Building2 className="mx-auto h-12 w-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-medium text-white">{t.noProjects}</h3>
          <p className="text-slate-400 mt-1 mb-6">{t.startFirst}</p>
          <Link 
            to="/new" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border border-slate-700 text-slate-300 font-bold uppercase tracking-widest text-[10px] rounded hover:bg-slate-800 transition-colors"
          >
            {t.createFirst}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link 
              key={p.id} 
              to={`/project/${p.id}`}
              className="block bg-[#161B22] border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all group shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded tracking-widest ${
                  p.status === 'completed' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                }`}>
                  {p.status === 'completed' ? t.completed : t.statusInMeeting}
                </div>
                
                <div className="flex items-center gap-2">
                  {deletingId === p.id ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteProject(p.id);
                        }}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[9px] px-2 py-1 rounded shadow cursor-pointer uppercase tracking-wider transition-all"
                      >
                        OK
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDeletingId(null);
                        }}
                        className="bg-[#1e2530] hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold text-[9px] px-2 py-1 rounded border border-slate-700 cursor-pointer uppercase tracking-wider transition-all"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeletingId(p.id);
                      }}
                      className="p-1 rounded bg-slate-900/40 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                      title={t.deleteProject}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <ChevronRight className="text-slate-500 group-hover:text-cyan-400 transition-colors" size={20} />
                </div>
              </div>
              <h3 className="font-semibold text-white line-clamp-2 leading-snug mb-2">
                {p.idea.slice(0, 60)}{p.idea.length > 60 ? '...' : ''}
              </h3>
              
              <div className="my-4">
                <div className="flex justify-between items-center mb-1.5 text-[10px] font-mono">
                  <span className="text-slate-500 uppercase tracking-wider">{t.progressLabel}</span>
                  <span className="text-cyan-400 font-semibold">{p.rounds.length} {t.ofRounds}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((step) => {
                    const isCompleted = p.rounds.length >= step;
                    return (
                      <div 
                        key={step} 
                        className={`h-full flex-1 transition-all duration-500 ${
                          isCompleted 
                            ? p.status === 'completed' 
                              ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]' 
                              : 'bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.4)]'
                            : 'bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-auto pt-4 border-t border-slate-800">
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>
                <div>{p.rounds.length} {t.round}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
