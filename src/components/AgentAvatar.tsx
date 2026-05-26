import React from 'react';
import { Briefcase, Cpu, Shield, Palette, Bot, User, CheckSquare, LineChart, Megaphone, Server, Scale } from 'lucide-react';

interface AgentAvatarProps {
  id: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export default function AgentAvatar({ id, name, size = 'md', className = '' }: AgentAvatarProps) {
  // Deterministic styling based on ID or Name hash
  const getAgentTheme = (agentId: string, agentName: string) => {
    const normalizedId = agentId ? agentId.toString() : '';
    const nameLower = agentName ? agentName.toLowerCase() : '';

    if (normalizedId === '1' || nameLower.includes('product') || nameLower.includes('manager')) {
      return {
        colorClass: 'from-emerald-600 to-teal-500 text-emerald-100 border-emerald-500/30 shadow-emerald-500/20',
        glowColor: 'rgba(16,185,129,0.3)',
        Icon: Briefcase,
      };
    }
    if (normalizedId === '2' || nameLower.includes('architect') || nameLower.includes('system') || nameLower.includes('engineer')) {
      return {
        colorClass: 'from-blue-600 to-cyan-500 text-blue-100 border-blue-500/30 shadow-blue-500/20',
        glowColor: 'rgba(59,130,246,0.3)',
        Icon: Cpu,
      };
    }
    if (normalizedId === '3' || nameLower.includes('security') || nameLower.includes('analyst') || nameLower.includes('cyber')) {
      return {
        colorClass: 'from-amber-600 to-rose-500 text-amber-100 border-amber-500/30 shadow-amber-500/20',
        glowColor: 'rgba(245,158,11,0.3)',
        Icon: Shield,
      };
    }
    if (normalizedId === '4' || nameLower.includes('ux') || nameLower.includes('lead') || nameLower.includes('design') || nameLower.includes('user')) {
      return {
        colorClass: 'from-purple-600 to-fuchsia-500 text-purple-100 border-purple-500/30 shadow-purple-500/20',
        glowColor: 'rgba(139,92,246,0.3)',
        Icon: Palette,
      };
    }
    if (normalizedId === '5' || nameLower.includes('qa') || nameLower.includes('test') || nameLower.includes('quality')) {
      return {
        colorClass: 'from-indigo-600 to-violet-500 text-indigo-100 border-indigo-500/30 shadow-indigo-500/20',
        glowColor: 'rgba(99,102,241,0.3)',
        Icon: CheckSquare,
      };
    }
    if (normalizedId === '6' || nameLower.includes('data') || nameLower.includes('analyst') || nameLower.includes('scientist')) {
      return {
        colorClass: 'from-pink-600 to-rose-500 text-pink-100 border-pink-500/30 shadow-pink-500/20',
        glowColor: 'rgba(236,72,153,0.3)',
        Icon: LineChart,
      };
    }
    if (normalizedId === '7' || nameLower.includes('market') || nameLower.includes('growth') || nameLower.includes('strategist')) {
      return {
        colorClass: 'from-orange-600 to-amber-500 text-orange-100 border-orange-500/30 shadow-orange-500/20',
        glowColor: 'rgba(249,115,22,0.3)',
        Icon: Megaphone,
      };
    }
    if (normalizedId === '8' || nameLower.includes('devops') || nameLower.includes('sre') || nameLower.includes('deploy')) {
      return {
        colorClass: 'from-slate-600 to-zinc-500 text-slate-100 border-slate-500/30 shadow-slate-500/20',
        glowColor: 'rgba(100,116,139,0.3)',
        Icon: Server,
      };
    }
    if (normalizedId === '9' || nameLower.includes('legal') || nameLower.includes('counsel') || nameLower.includes('compliance')) {
      return {
        colorClass: 'from-red-600 to-orange-500 text-red-100 border-red-500/30 shadow-red-500/20',
        glowColor: 'rgba(239,68,68,0.3)',
        Icon: Scale,
      };
    }

    // Deterministic fallback for other custom agent names
    const hash = Array.from(agentName || '').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const themes = [
      {
        colorClass: 'from-indigo-600 to-violet-500 text-indigo-100 border-indigo-500/30 shadow-indigo-500/20',
        glowColor: 'rgba(99,102,241,0.3)',
        Icon: Bot,
      },
      {
        colorClass: 'from-pink-600 to-rose-500 text-pink-100 border-pink-500/30 shadow-pink-500/20',
        glowColor: 'rgba(236,72,153,0.3)',
        Icon: User,
      },
      {
        colorClass: 'from-orange-600 to-amber-500 text-orange-100 border-orange-500/30 shadow-orange-500/20',
        glowColor: 'rgba(249,115,22,0.3)',
        Icon: Cpu,
      },
    ];
    return themes[hash % themes.length];
  };

  const { colorClass, glowColor, Icon } = getAgentTheme(id, name);

  const sizeStyles = {
    xs: 'w-6 h-6 text-xs rounded-lg',
    sm: 'w-8 h-8 text-sm rounded-lg',
    md: 'w-10 h-10 text-base rounded-xl',
    lg: 'w-12 h-12 text-lg rounded-xl',
  };

  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <div 
      className={`relative flex items-center justify-center border shadow-lg bg-gradient-to-br shrink-0 ${colorClass} ${sizeStyles[size]} ${className}`}
      style={{ boxShadow: `0 0 12px ${glowColor}` }}
    >
      {/* Abstract geometric background layer with a nice grid/circles */}
      <div className="absolute inset-x-0 inset-y-0 opacity-15 overflow-hidden rounded-md">
        <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="4" strokeDasharray="8 8" />
          <line x1="10" y1="10" x2="90" y2="90" stroke="currentColor" strokeWidth="2" />
          <line x1="90" y1="10" x2="10" y2="90" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
      
      {/* Center Icon */}
      <Icon size={iconSizes[size]} className="z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] shrink-0" />
    </div>
  );
}
