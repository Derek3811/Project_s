import { ProjectState } from '../types';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'projects-data.json');

class Database {
  private projects: Map<string, ProjectState> = new Map();

  constructor() {
    this.seed();
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          parsed.forEach((proj: ProjectState) => {
            this.projects.set(proj.id, proj);
          });
        }
      }
    } catch (e) {
      console.error("Failed to load projects database from disk:", e);
    }
  }

  private saveToDisk() {
    try {
      const list = Array.from(this.projects.values());
      fs.writeFileSync(DB_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to save projects database to disk:", e);
    }
  }

  private seed() {
    // English default project (5 completed rounds)
    const defaultProject: ProjectState = {
      id: 'board-blueprint-001',
      idea: 'AI Multi-Agent Strategic Workspace',
      goals: 'Establish a high-fidelity platform where specialized AI agents debate user ideas to create robust project blueprints with user steering.',
      constraints: 'Minimalist dark-themed aesthetic, high responsiveness, Gemini-powered analysis, resilient fallback simulation mode.',
      status: 'meeting',
      language: 'en',
      createdAt: Date.now() - 10000,
      model: 'gemini-flash-lite-latest',
      globalDecisions: [
        "Adopt a 'Moderator-Synthesized' debate flow to prevent direct agent chatter loops",
        "Adopt 'Local-First + Asynchronous Ceremony' architecture for ultimate client responsiveness",
        "Enforce 'Web Workers Isolation' for heavy calculation models to prevent frame drops",
        "Implement 'Chunked Simulation Tasks' and Web Worker priority queues to mitigate memory overheads",
        "Align ultimate scoring values to 95.75% overall convergence readiness"
      ],
      agents: [
        { id: 'agent-pm', name: 'Strategic PM', description: 'Focuses on MVP scope, user value, and market fit.' },
        { id: 'agent-arch', name: 'Tech Architect', description: 'Focuses on scalability, security, and technical feasibility.' },
        { id: 'agent-ux', name: 'UX Designer', description: 'Focuses on minimalist aesthetics, cognitive load, and accessibility.' }
      ],
      rounds: [
        {
          roundNumber: 1,
          type: 'analysis',
          responses: [
            {
              agentId: 'agent-pm',
              position: 'Establish a pristine steering interface to prevent direct agent chatter loops.',
              reasoning: [
                'Users need to control the AI board directly inside a single system viewport',
                'AI agents can drift and over-engineer scope if left to debate indefinitely without moderator synthesis',
                'Moderator-led feedback loops are superior for strategic alignment'
              ],
              risks: ['Higher density data display can increase user cognitive load'],
              confidence: 88,
              userVote: 'up'
            },
            {
              agentId: 'agent-arch',
              position: 'Design a decoupled moderator orchestrator that handles user adjustments dynamically.',
              reasoning: [
                'Separate LLM processing steps from critical client store architectures',
                'Make it transition smoothly into client simulation mode if Gemini API credentials hit temporary limits',
                'Define rigid type protocols for the database and system interfaces'
              ],
              risks: ['Requires extra development files for type safety guidelines'],
              confidence: 92,
              userVote: 'up'
            },
            {
              agentId: 'agent-ux',
              position: 'A minimalist dark theme is ideal to emphasize raw consensus metrics.',
              reasoning: [
                'Deploy dark carbon palettes and high-contrast typography to convey modern developer-ready toolkits',
                'Maintain high negative spaces around the boards to focus thoughts',
                'Smooth entering state animations can provide passive alignment feedback'
              ],
              risks: ['Subtle visual accents might be overlooked by laymen users'],
              confidence: 95,
              userVote: 'up'
            }
          ],
          moderatorSummary: 'Round 1 successfully solidified our core framework (avg confidence 91%). The board voted to lock the moderator-led synthesis pipeline and adopted the standard React + Tailwind CSS client runtime.',
          decisionsLocked: ['React 18 + Tailwind CSS frontend baseline', 'Moderator-Synthesized debate architecture', 'Minimalist dark-themed developer HUD'],
          openQuestions: ['How to visual consensus metrics elegantly?', 'Are preset developer configurations needed on the first setup?'],
          userFeedback: 'I love the moderator-synthesized debate. Make sure we prioritize raw speed and high-fidelity rendering.'
        },
        {
          roundNumber: 2,
          type: 'debate',
          responses: [
            {
              agentId: 'agent-pm',
              position: 'Approve "Local-First" state persistence as a core MVP advantage.',
              reasoning: [
                'Data should be saved in standard browser storage continuously without login boundaries',
                'Allows offline blueprint reviews and preserves state during active restarts'
              ],
              risks: ['Local storage restricts synchronization across distinct machines'],
              confidence: 90,
              userVote: 'up'
            },
            {
              agentId: 'agent-arch',
              position: 'Align on Local-First Client-State, backing up snapshot states locally immediately.',
              reasoning: [
                'Use standard JSON serializations that fall back gently on memory variables if unavailable',
                'Allows instant state mutations (Zero Network Latency) for a smooth UI flow'
              ],
              risks: ['Large objects can expand memory load on cheaper clients'],
              confidence: 93,
              userVote: 'up'
            },
            {
              agentId: 'agent-ux',
              position: 'Blend local-first mutations with "Asynchronous Ceremony" transitions.',
              reasoning: [
                'Provide optimistic UI indicators to mark updates immediately',
                'Introduce subtle progress pulses or shimmering indicators during background computations to make technical delays feel like an premium consensus building process'
              ],
              risks: ['Flickering micro-animations are harmful if poorly timed'],
              confidence: 94,
              userVote: 'up'
            }
          ],
          moderatorSummary: 'Round 2 successfully approved the "Local-First + Asynchronous Ceremony" architecture. This provides lightweight performance guarantees while keeping user operations fast and responsive.',
          decisionsLocked: ['Local-First state synchronization', 'Optimistic UI + Asynchronous Ceremony experience', 'Integrated local JSON state backends'],
          openQuestions: ['How to prevent local memory overflows under extensive offline simulations?']
        },
        {
          roundNumber: 3,
          type: 'debate',
          responses: [
            {
              agentId: 'agent-pm',
              position: 'We must guarantee that complex calculations do not block user interactions.',
              reasoning: [
                'A single frozen frame ruins the elite developer feel',
                'Board calculations should happen completely in the background'
              ],
              risks: ['Message pass overheads between main thread and threads'],
              confidence: 93,
              userVote: 'up'
            },
            {
              agentId: 'agent-arch',
              position: 'Enforce mathematical separations using dedicated Web Workers.',
              reasoning: [
                'Run simulation algorithms strictly inside dedicated, clean sandbox worker files',
                'Main UI thread remains continuously at a smooth 60fps refresh limit',
                'Implement robust listener hooks to sync results elegantly'
              ],
              risks: ['Complex build bindings on certain deployment web services'],
              confidence: 95,
              userVote: 'up'
            },
            {
              agentId: 'agent-ux',
              position: 'Visualize Worker states with custom progress rails and high-density performance alerts.',
              reasoning: [
                'Show background computation metrics through tiny, neon-colored monospaced details',
                'Establish clean loading flags that reflect calculations being isolated'
              ],
              risks: ['Too much system telemetry can look professional but messy'],
              confidence: 92,
              userVote: 'up'
            }
          ],
          moderatorSummary: 'Round 3 established "Web Workers Isolation" for heavy computations. The board agreed that keeping the UI responsive and thread-isolated is critical for high-fidelity interactive spaces.',
          decisionsLocked: ['Web Workers Thread Isolation for simulations', 'UI Main-Thread 60fps rendering guard', 'Background calculation process states'],
          openQuestions: ['How can we handle risks of extremely large arrays causing OOM in Workers?']
        },
        {
          roundNumber: 4,
          type: 'debate',
          responses: [
            {
              agentId: 'agent-pm',
              position: 'Proactively identify and minimize memory overflow risks under extensive test scenarios.',
              reasoning: [
                'Enterprise users testing extremely complex ideas might trigger browser state crashes',
                'We must prevent memory leaks at all costs'
              ],
              risks: ['Requires restrictive data ceiling thresholds'],
              confidence: 96,
              userVote: 'up'
            },
            {
              agentId: 'agent-arch',
              position: 'Implement chunked execution strategies alongside a Priority Task Queue.',
              reasoning: [
                'Divide huge calculated matrices into tiny chunks executed sequentially with 16ms delays',
                'Provide a heap priority sorting queue to throw out old data and compute high-priority updates first'
              ],
              risks: ['Slightly increases mathematical model complexity'],
              confidence: 97,
              userVote: 'up'
            },
            {
              agentId: 'agent-ux',
              position: 'Inform the user elegantly using subtle diagnostics and soft warnings.',
              reasoning: [
                'Show soft, elegant diagnostics about priority queues under load',
                'Reassure the user that the background queue is performing optimization in real-time'
              ],
              risks: ['Avoid alarming users with aggressive error banners'],
              confidence: 94,
              userVote: 'up'
            }
          ],
          moderatorSummary: 'Round 4 solidified our risk mitigation plan against calculation memory leaks. We successfully locked the "Chunking Computation + Worker Queue priority" workflow, ensuring perfect system stability.',
          decisionsLocked: ['Chunked execution strategy in Web Workers', 'Priority-heap task execution queue', 'OOM auto-healing thread controllers'],
          openQuestions: ['Are we ready to output ultimate readiness ratings for external codegen AI engines?']
        },
        {
          roundNumber: 5,
          type: 'debate',
          responses: [
            {
              agentId: 'agent-pm',
              position: 'Conclude the meeting! The current blueprint has reached a superior 95.75% alignment rate.',
              reasoning: [
                'Product specifications are airtight and fully verified by active user alignments',
                'Phase targets are locked for Cursor/v0 developers to commence physical programming'
              ],
              risks: ['None identified for immediate MVP requirements'],
              confidence: 98,
              userVote: 'up'
            },
            {
              agentId: 'agent-arch',
              position: 'Export instructions are officially validated. Feasibility is locked at an extremely high 94%.',
              reasoning: [
                'System structures, workers, and local stores mapping completed under strict TS standards',
                'Downstream code generation prompts are ready'
              ],
              risks: ['None'],
              confidence: 96,
              userVote: 'up'
            },
            {
              agentId: 'agent-ux',
              position: 'The interface specs are locked with outstanding 95% completeness.',
              reasoning: [
                'Every screen view matches core user experiences and provides modern visual vibes',
                'Ready to package specs with one-click downstream developer prompts'
              ],
              risks: ['None'],
              confidence: 97,
              userVote: 'up'
            }
          ],
          moderatorSummary: 'Round 5 marks the official convergence of our multi-agent strategic debate! We have successfully assessed build readiness at a stellar 95.75% and are ready to export the downstream builder models.',
          decisionsLocked: ['Official strategic board blueprint locking', 'Readiness score convergence confirmation', 'One-Click Codegen Prompts activation'],
          openQuestions: []
        }
      ]
    };
    this.projects.set(defaultProject.id, defaultProject);

    // Chinese default project (5 completed rounds matching requested report)
    const defaultProjectZh: ProjectState = {
      id: 'board-blueprint-001-zh',
      idea: 'AI 多智能体战略会商虚拟空间',
      goals: '构建高保真度协作底座，通过专业智能体董事互评、对抗式辩论，深度还原用户战略，形成极速可迭代的架构设计蓝图。',
      constraints: '极简深色系风格、极致响应速度、Gemini全功能驱动、高可靠性演练模式。',
      status: 'meeting',
      language: 'zh',
      createdAt: Date.now(),
      model: 'gemini-flash-lite-latest',
      globalDecisions: [
        "采用‘主持人/版主提炼’的会商模式，彻底避免智能体之间无限无效的嘴炮对轰",
        "采用‘本地优先 + 异步仪式感’整体架构，将数据即时下盘落到客户端本地",
        "强制 ‘Web Workers 隔离’运行核心计算线程，确保主界面渲染丝滑",
        "实施‘分片计算策略’并在 Web Worker 中引入‘任务优先级队列’，杜绝仿真计算内存溢出",
        "统一就绪度系统评分标准，实现综合得分 95.75% 极高就绪水平"
      ],
      agents: [
        { id: 'agent-pm', name: 'Strategic PM', description: '专注产品 MVP 边界规划、全景商业闭环与核心用户价值对齐。' },
        { id: 'agent-arch', name: 'Tech Architect', description: '专注算力系统扩展、网络及持久化数据安全、底层技术健壮性规划。' },
        { id: 'agent-ux', name: 'UX Designer', description: '专注像素级极简审美、降低宏观认知复杂度与无障碍友好度体验。' }
      ],
      rounds: [
        {
          roundNumber: 1,
          type: 'analysis',
          responses: [
            {
              agentId: 'agent-pm',
              position: '在用户与 AI 董事之间建立极低摩擦、主持人主控的反馈回路，杜绝无效对话。',
              reasoning: [
                '用户需要对智能体决策有绝对掌控权，单靠自由嘴炮极易膨胀需求和产出噪音',
                '引入版主/主持人角色在每一轮会商末尾进行战略整合是最明智、能让决策快速收敛的流式设计'
              ],
              risks: ['高密度战略面板可能会在极短暂的冷启动阶段带来一些信息溢出感'],
              confidence: 88,
              userVote: 'up'
            },
            {
              agentId: 'agent-arch',
              position: '构建彻底解耦的智能体中控编排器，支持优雅的回退和系统自闭环。',
              reasoning: [
                '隔离 AI 逻辑与视图，避免由于接口额度临时耗尽引发客户端渲染断裂',
                '定义强 TypeScript 字段协议，为下一阶段研发代理直接转化为工程目录提供高可靠底标'
              ],
              risks: ['需要对数据模式制定非常严格的设计标准约束'],
              confidence: 92,
              userVote: 'up'
            },
            {
              agentId: 'agent-ux',
              position: '全站遵循克制、冷峻的极客深色美学，让会商文字与评分曲线成为核心。',
              reasoning: [
                '采用 Vercel / Linear 式碳灰背景和发光青铜色，凸显权威性技术规格感',
                '利用具有心流指引、细腻舒缓的转场微动画提示会商进度的流转状态'
              ],
              risks: ['过于肃杀的设计在非重度极客群体中可能需要一点习惯适应时间'],
              confidence: 95,
              userVote: 'up'
            }
          ],
          moderatorSummary: '第 1 轮会商各方达成高度共识（平均置信度 91.6%）。正式否决嘴炮聊天逻辑，确立“主持人提炼模式”并将主技术堆栈绝对锁定在 React 18 + Vite + Tailwind CSS 下。',
          decisionsLocked: ['正式采用“主持人提炼模式”摒弃无效对话', 'React 18 + Vite + Tailwind CSS 技术底座', 'Vercel / Linear 暗黑极简科技美学'],
          openQuestions: ['如何在看板上量化多维共识变化并以图表实时呈现？', '后续阶段是否应当允许追加定制化的研发特设智能体？'],
          userFeedback: '非常喜欢主持人进行提炼的设计。后续面对高频会商场景，请保证界面刷新在秒级内响应，即使是在进行大算力模拟的时候。'
        },
        {
          roundNumber: 2,
          type: 'debate',
          responses: [
            {
              agentId: 'agent-pm',
              position: '重点打造“本地优先 (Local-First)”的运行机制，将用户操作与外部云环境完全解耦。',
              reasoning: [
                '所有会商记录与已锁定共识随时静默写入客户端，无需登陆注册，最大限度保护开发主权',
                '支持完备的无网络断点恢复体验'
              ],
              risks: ['限制了多端设备间的即时全局文件热共享'],
              confidence: 90,
              userVote: 'up'
            },
            {
              agentId: 'agent-arch',
              position: '落实 Local-First 架构，在前端内存与 client-storage 之间构筑透明快照锁存。',
              reasoning: [
                '任何用户打分、方向修正立即零延迟（0ms Network Latency）触发本地落盘序列',
                '本地采用 JSON 备份与抗崩溃恢复脚本，保障高可靠离线会商'
              ],
              risks: ['极大型数据快照对较老旧设备的本地 IO 库可能造成很小的负担'],
              confidence: 94,
              userVote: 'up'
            },
            {
              agentId: 'agent-ux',
              position: '将本地优先与“异步仪式感”设计深度融汇，给简单的客户端操作穿上庄严的艺术外壳。',
              reasoning: [
                '在进行决策落单和轮次推进时引入带有微妙微光、科技卡扣或者上链特效的仪式感（异步仪式感）',
                '配合乐观 UI 机制（Optimistic UI），让用户感受极其灵敏却富有呼吸感的奢华体验'
              ],
              risks: ['转场时长若控制不佳，反复高频操作下可能令老用户抓狂'],
              confidence: 93,
              userVote: 'up'
            }
          ],
          moderatorSummary: '第 2 轮会商深度夯实了“本地优先+异步仪式感”的核心体验。我们正式锁定了本地即时落盘机制与带有心流过渡的 UI 仪式感动作设计。',
          decisionsLocked: ['本地优先 (Local-First) 持久化', '乐观 UI 与异步仪式感深度融合模式', '零云端硬绑定运行规范'],
          openQuestions: ['当仿真场景数据量突然膨胀到数十万级时，如何防范单线程浏览器响应崩溃？']
        },
        {
          roundNumber: 3,
          type: 'debate',
          responses: [
            {
              agentId: 'agent-pm',
              position: '性能指标应当作为一票否决项，主渲染线程绝不允许因算力过载出现丢帧或卡顿。',
              reasoning: [
                '专业开发者会商软件不能有任何粘滞感',
                '任何长时间让浏览器转圈的举动都会打破用户的仪式感心流体验'
              ],
              risks: ['增加了线程间通讯、消息传递的中间复杂度'],
              confidence: 93,
              userVote: 'up'
            },
            {
              agentId: 'agent-arch',
              position: '强制实施 Web Workers 线程隔离机制，将一切仿真计算推入后台。',
              reasoning: [
                '将高维算法和共识汇聚矩阵的数值计算从 UI 渲染大线程彻底剥离',
                '利用标准 Web Worker 脚本跑于额外核中，确保主视图永远维持在 60fps 的绝对丝滑极限'
              ],
              risks: ['在少数极简开发环境打包时，多文件打包配置可能略显繁琐'],
              confidence: 96,
              userVote: 'up'
            },
            {
              agentId: 'agent-ux',
              position: '设计富有技术美感的 Workers 后台运行浮标与多线程运行数据流图例。',
              reasoning: [
                '在屏幕边缘或者细节标签处显示等宽的 Web Worker 运行瞬时负载状态，极大增强专业可信度',
                '采用 JetBrains Mono 等宽字体细腻渲染这些实时后台运算状态'
              ],
              risks: ['图例过多可能会占用部分可利用版幅，可以通过悬停微弹屏实现'],
              confidence: 91,
              userVote: 'up'
            }
          ],
          moderatorSummary: '第 3 轮会商正式通过并锁定了“强制 Web Workers 隔离”计算规范。我们一致认为：唯有物理线程层面的计算隔离，才能在算力膨胀场景下确保极度丝滑的渲染交互。',
          decisionsLocked: ['强制 Web Workers 执行隔离保障', 'UI 主线程 60fps 恒顺保障机制', '实时 Web Workers 负载状态指示器'],
          openQuestions: ['当面对极端用户复杂边界输入时，单独的 Web Worker 自身在遭遇大负荷时是否可能引发内存溢出？']
        },
        {
          roundNumber: 4,
          type: 'debate',
          responses: [
            {
              agentId: 'agent-pm',
              position: '未雨绸缪！我们必须在架构上完备规避任何千万数据仿真层引发的崩溃和内存泄露。',
              reasoning: [
                '高保真战略蓝图可能包含庞大的指令矩阵，如果发生 OOM 会给用户带来灾难性体验劣评',
                '必须设定严丝合缝的安全退避策略'
              ],
              risks: ['在极少数情况下，会迫使极简数据不得不进入分片等待状态'],
              confidence: 95,
              userVote: 'up'
            },
            {
              agentId: 'agent-arch',
              position: '针对大规模仿真运算采用“分片计算策略 (Chunking)”，并在 Web Worker 内部配置“任务优先级队列”。',
              reasoning: [
                '将连绵不绝的繁重运算切分为单次耗时不超过 16ms 的微执行块，平摊在队列中执行',
                '引入优先级排序堆栈，舍弃失效计算片，将跟用户视线、打分操作直接关联的任务最优先解决',
                '一旦检测到 Worker 超级堆栈发生 OOM 危险，后台一键软重启复原，零感保持正常态'
              ],
              risks: ['分片状态还原对架构的并发控制层提出了极精准的同步算法要求'],
              confidence: 96,
              userVote: 'up'
            },
            {
              agentId: 'agent-ux',
              position: '将“分片”与“队列”的调配通过等宽科技面板及微进度条进行仪式感透传。',
              reasoning: [
                '无需隐藏复杂的性能管理，应将其翻译为好玩的极客细节——如“分片 4/12 正在以高优先级编译”',
                '让技术风险的缓解过程，也成为用户掌控技术仪式感的重要审美加分项'
              ],
              risks: ['文字描述需通俗易懂，以防过于晦涩导致用户感到生僻'],
              confidence: 94,
              userVote: 'up'
            }
          ],
          moderatorSummary: '第 4 轮会商核心解决了内存溢出的风控痛点。正式通过了“分片计算策略”及“Web Worker 任务优先级队列”机制，最大程度捍卫了底层高负荷模拟的抗灾稳固度。',
          decisionsLocked: ['分片计算策略 (Chunking Execution)', 'Web Worker 任务优先级队列管控', 'OOM 后方自动拉起自愈引擎'],
          openQuestions: ['目前 5 轮深度对齐指标已充分合闭，就绪度指标是否可以正式终结并评估？']
        },
        {
          roundNumber: 5,
          type: 'debate',
          responses: [
            {
              agentId: 'agent-pm',
              position: '圆满终结研讨会！当前所有业务路线图、锁定痛点与决策档案均已合拢。需求清晰度评分：98%。',
              reasoning: [
                '经过 5 轮由浅入深的淬炼，项目完全摆脱了空泛的辩驳，功能与边界彻底稳固固落',
                '我们正式将整个战略会商的成果汇总为高价值、一键可读的下一阶段物理构建指令集'
              ],
              risks: ['无。当前范围已完美契合卓越交付标准'],
              confidence: 98,
              userVote: 'up'
            },
            {
              agentId: 'agent-arch',
              position: '核心技术通路已全面审查，可行性：94%。技术就绪，随时可以进行一键开发。',
              reasoning: [
                '我们在 Workers 并发隔离、分片算法、本地 snapshot 读写上完成极致自闭环测试',
                '架构完备度达到：95%。能够为Cursor, v0 带来 100% 具备可读与物理自愈性能的完美大提示词'
              ],
              risks: ['无'],
              confidence: 97,
              userVote: 'up'
            },
            {
              agentId: 'agent-ux',
              position: '卓越的战略对齐度达到：96%。全链路用户 steering 机制保障完美的成果收割体验。',
              reasoning: [
                '每一项重磅锁定决策都历经用户的 👍 赞同与 steering 引领，心流一致度登峰造极',
                '多智能体特设开发一键提示词已经全部精雕妥当，我们期待伟大的下游开发智能体在第一时间承接本案成果！'
              ],
              risks: ['无'],
              confidence: 98,
              userVote: 'up'
            }
          ],
          moderatorSummary: '第 5 轮战略会商顺利宣告圆满画上句号！经过 5 轮深度会商，技术路径与视觉规范已高度对齐。委员会全体一致通过《构建就绪度评估报告》，战略综合得分 95.75 分，并全面激活“一键开发大提示词专区”。',
          decisionsLocked: ['宣告 5 轮战略会商蓝图圆满落地完结', '激活全景就绪度综合得分（95.75分）指标', '上线一键复制 AI 批量构建大提示词專区'],
          openQuestions: []
        }
      ]
    };
    this.projects.set(defaultProjectZh.id, defaultProjectZh);
  }

  getProject(id: string): ProjectState | undefined {
    return this.projects.get(id);
  }

  saveProject(project: ProjectState): void {
    this.projects.set(project.id, project);
    this.saveToDisk();
  }

  deleteProject(id: string): boolean {
    const deleted = this.projects.delete(id);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  listProjects(): ProjectState[] {
    return Array.from(this.projects.values()).sort((a, b) => b.createdAt - a.createdAt);
  }
}

export const db = new Database();
