import { ProjectState } from '../types';
import { validateLogicalCoherence } from './mockValidator';

/**
 * Parses the consensus history and generates functional TypeScript snippets.
 */
export function generateCodeSnippets(project: ProjectState): string {
  const isZh = project.language === 'zh';
  
  // 4. Run coherence validation
  const validation = validateLogicalCoherence(project);
  if (!validation.valid) {
    return isZh 
      ? `// [拦截警告] 逻辑连贯性自检未通过：\n// ${validation.errors.join('\n// ')}\n`
      : `// [HALTED] Logical coherence validation failed:\n// ${validation.errors.join('\n// ')}\n`;
  }
  
  if (project.rounds.length === 0) {
    return isZh 
      ? "// 暂无讨论记录，无法生成代码。\n"
      : "// No debate history exists. Cannot generate code yet.\n";
  }

  // Very basic simulated TS generation grounded in the prompt definitions
  let code = `/**\n * GENERATED STRATEGIC BLUEPRINT CODE\n`;
  code += ` * ${isZh ? '执行结论导出' : 'Executive Consensus Export'}\n`;
  code += ` * Idea: ${project.idea}\n`;
  code += ` */\n\n`;

  code += `import React, { useState, useEffect, useCallback } from 'react';\n\n`;

  // Define interfaces based on global decisions
  code += `// --- Domain Models ---\n`;
  if (project.globalDecisions.length > 0) {
    code += `export interface AppState {\n`;
    project.globalDecisions.forEach((dec, i) => {
      // Create a safely typed mock property from the decision text
      const cleanName = `decision_${i}Locked`;
      code += `  ${cleanName}: boolean; // ${dec}\n`;
    });
    code += `}\n\n`;
  } else {
    code += `export interface AppState {\n  initialized: boolean;\n}\n\n`;
  }

  code += `// --- Modular Engine (Phase 2 Component) ---\n`;
  code += `export const CoreEngine = () => {\n`;
  code += `  console.log('Engine initialized with ${project.agents.length} specialized modules.');\n`;
  if (project.constraints) {
    code += `  // Constraint Enforcement: ${project.constraints}\n`;
  }
  code += `  return { status: 'Operational', mode: 'Local-First' };\n`;
  code += `};\n\n`;
  
  code += `// --- Integration Root ---\n`;
  code += `export default function AppEntry() {\n`;
  code += `  const [state, setState] = useState<AppState | null>(null);\n\n`;
  code += `  // Initialize based on consensus rules\n`;
  code += `  useEffect(() => {\n`;
  code += `    // Bootstrapped constraints applied\n`;
  code += `    const engine = CoreEngine();\n`;
  code += `  }, []);\n\n`;
  code += `  return (\n`;
  code += `    <div className="bg-slate-900 min-h-screen text-white p-6">\n`;
  code += `       ${isZh ? '<h1>核心逻辑准备就绪</h1>' : '<h1>Core Logic Ready</h1>'}\n`;
  code += `    </div>\n`;
  code += `  );\n`;
  code += `}\n`;

  return code;
}
