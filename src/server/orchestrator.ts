import { ProjectState, RoundResponse, RoundSummary, AgentRole } from '../types';
import { generateStructured } from './ai';
import { Type, Schema } from '@google/genai';

function formatMemory(project: ProjectState): string {
  let memory = `Project Idea: ${project.idea}\nGoals: ${project.goals}\nConstraints: ${project.constraints}\n\n`;
  if (project.globalDecisions.length > 0) {
    memory += `Global Decisions Locked:\n- ${project.globalDecisions.join('\n- ')}\n\n`;
  }
  if (project.rounds.length > 0) {
    memory += `--- Workspace History & User Feedback Support ---\n`;
    project.rounds.forEach((round) => {
      memory += `[Round ${round.roundNumber} - ${round.type === 'analysis' ? 'Initial Analysis' : 'Debate & Synthesis'}]\n`;
      round.responses.forEach(resp => {
        const agent = project.agents.find(a => a.id === resp.agentId);
        const voteText = resp.userVote === 'up' 
          ? '👍 [USER APPROVED / STRONGLY AGREE]' 
          : resp.userVote === 'down' 
            ? '👎 [USER DISAPPROVED / STRONGLY DISAGREE]' 
            : '[NO USER VOTE - NEUTRAL]';
        memory += `- Agent ${agent?.name || 'Unknown'}: "${resp.position}" - Vote Status: ${voteText}\n`;
      });
      memory += `Moderator's Summary for Round ${round.roundNumber}:\n"${round.moderatorSummary}"\n\n`;
      if (round.userFeedback) {
        memory += `👉 [USER FEEDBACK / DIRECTIONS & REJOINDERS FOR NEXT ROUND]:\n"${round.userFeedback}"\n\n`;
      }
    });
  }
  return memory;
}

function generateMockRound(project: ProjectState, roundNumber: number): RoundSummary {
  const isZh = project.language === 'zh';
  const isFirstRound = roundNumber === 1;
  const prevRound = project.rounds[roundNumber - 2];
  const userFeedback = prevRound?.userFeedback;
  const hasFeedback = !!userFeedback;
  const cleanFeedback = userFeedback ? (userFeedback.length > 30 ? userFeedback.substring(0, 30) + '...' : userFeedback) : '';

  const responses: RoundResponse[] = project.agents.map((agent) => {
    const nameLower = agent.name.toLowerCase();
    let position = "";
    let reasoning: string[] = [];
    let risks: string[] = [];
    let confidence = 75 + (roundNumber * 4); // gradually increasing confidence up to ~95
    if (confidence > 98) confidence = 98;

    if (nameLower.includes('product') || nameLower.includes('pm')) {
      if (roundNumber === 1) {
        position = isZh 
          ? `定位 MVP 的核心用户价值，针对“${project.idea}”确立首要高频痛点。`
          : `Defining MVP core value parameters and setting primary pain points for "${project.idea}".`;
        reasoning = isZh 
          ? ["分析细分市场用户属性，锁定前 10% 种子真实用户", "克制设计交互功能，不轻易放开非高频的长尾业务", "确立早期激活（Activation）与冷启动评估标准"]
          : ["Analyze segmented user attributes, prioritizing early adopters", "Enforce strict feature limitations, deflecting low-frequency edge cases", "Formulate clear activation metrics to guide the first design sprint"];
        risks = isZh 
          ? ["如果早期定位不够精准，可能会在获客上有较大损耗"]
          : ["A broad initial scope risk diluting the marketing message for early adopters"];
      } else if (roundNumber === 2) {
        position = isZh
          ? `基于初论，主张对首期版本深度精简，将重点放在最高价值交互点。`
          : `Advocating for extreme pruning of the first version to secure high-quality baseline flows.`;
        reasoning = isZh
          ? ["剔除次要功能，保障核心单线任务能提供 100% 的情绪或效率反馈", "暂缓多端数据同步与定制模板开发", "设立用户行为洞察，以指标真实支撑下期决策"]
          : ["Eradicate parallel user flows so the central transaction is error-free", "Defer sync and personalization engines to manage developer budget", "Establish immediate behavior analytics to review usability friction"];
        risks = isZh
          ? ["一味缩减可能导致体验过于单薄，缺少持续吸引力"]
          : ["Excessive feature removal might impact the baseline utility of the MVP"];
      } else if (roundNumber === 3) {
        position = isZh
          ? `探讨中局用户路径，注重对核心高价值链条的绝对稳定性。`
          : `Securing middle-funnel usability loops, focusing entirely on main transaction pathways.`;
        reasoning = isZh
          ? ["优化核心交互入口，降低初次认知门槛", "支持基础离线与即时回复确认", "加强对用户高亮数据的提取与标签呈现"]
          : ["Refine high-frequency CTA touchpoints to maximize conversion", "Establish client-side active reminders to confirm success instantly", "Highlight structural data tags to give immediate user satisfaction"];
        risks = isZh
          ? ["若对二级链路关注过少，可能丢失深度用户的使用体验"]
          : ["Inattention to minor screens might raise early drop-offs on custom flows"];
      } else if (roundNumber === 4) {
        position = isZh
          ? `进入落地的临界准备，确保业务规则明确、转化漏斗完整。`
          : `Entering release coordination, confirming solid conversion paths and business logic rules.`;
        reasoning = isZh
          ? ["规划三阶段敏捷推出（Alpha, Beta, Public）", "结合产品体验设立性能损耗与感知时长门槛", "确保合规免责以及数据公开条款声明"]
          : ["Map the detailed three-phase release lifecycle (Alpha, Beta, Public)", "Align timing parameters to user perception speed limits", "Maintain appropriate copyright, TOS, and legal terms transparently"];
        risks = isZh
          ? ["若测试周期被无意缩合，首日线上反馈可能略带噪点"]
          : ["Compressed validation windows risk exposing minor post-launch visual edge-cases"];
      } else {
        position = isZh
          ? `达成完美发布共识！MVP 路径已彻底合闭，进入试运行与指标监控形态。`
          : `Total functional alignment achieved! Ready to lock the draft and initiate closed-beta deployment pipelines.`;
        reasoning = isZh
          ? ["成立专项问题追踪机制，实时拦截线上体验反馈", "启动第一批定向种子推广，每日监控核心漏斗流失率", "为下一阶段技术与交互迭代准备预研方案"]
          : ["Establish hotfix tracking pipelines to address early adopter comments", "Execute targeting email campaigns with precise churn tracing", "Review user behaviors to feed the next product design log"];
        risks = isZh
          ? ["首批用户反馈可能与期望有偏离，应当做好极速跟进的热重载准备"]
          : ["User trends might slightly differ from expectations, requiring ready dynamic tuning"];
      }

      if (hasFeedback) {
        position += isZh
          ? ` (同时根据您的意见: 我们将充分考虑并响应“${cleanFeedback}”，确保产品优先级深度对齐此方向。)`
          : ` (And per your advice: We will prioritize and align our roadmap on "${cleanFeedback}" directly.)`;
      }
    } else if (nameLower.includes('tech') || nameLower.includes('architect') || nameLower.includes('developer') || nameLower.includes('engineering') || nameLower.includes('engineer')) {
      if (roundNumber === 1) {
        position = isZh
          ? `主张采用模块化、易维护且健壮的架构体系，杜绝前期技术债过多。`
          : `Adopting a modular, type-safe, and highly responsive system architecture to avoid technical debt.`;
        reasoning = isZh
          ? ["选择主流高性能的基础框架栈，保障生态扩展健康", "进行模型定义解耦，保证表现层、业务层、持久层充分隔离", "注重边缘端输入数据校验合规，防范任何内存、数据脏写问题"]
          : ["Utilize reliable and mature framework choices to guarantee solid community ecosystems", "Model decoupling to cleanly isolate states, network APIs, and rendering assets", "Formulate edge-validation guards to secure clean records in databases"];
        risks = isZh
          ? ["初期过于规范的分层开发可能会占用稍微多一点的代码工作量"]
          : ["Strict layered decoupling takes slightly more time to build during the early prototype phase"];
      } else if (roundNumber === 2) {
        position = isZh
          ? `细化数据流管理与安全本地暂存方案，杜绝对网络的高频硬性依赖。`
          : `Formulating robust state structures and client-side caching to offset heavy online network overhead.`;
        reasoning = isZh
          ? ["使用轻量持久化 API（如 LocalStorage / IndexedDB）存储重要快照", "定义严密清晰的 API 全局状态切换与错误降级策略", "通过防抖与数据预置降低服务端压力"]
          : ["Adopt indexed storage caches to back up snapshots on the user's browser device", "Define comprehensive API retry protocols and seamless error handle wrappers", "Debounce and bundle server write payloads to save runtime request bandwidth"];
        risks = isZh
          ? ["客户端轻量缓存的事务持久性及并发读写可能产生小的竞态冲突"]
          : ["Local client storage poses synchronization and race conditions if multiple tabs are active"];
      } else if (roundNumber === 3) {
        position = isZh
          ? `着重梳理核心数据表结构及模块间的调用协议，优化查询效率。`
          : `Drafting highly optimized data schema patterns and clean endpoint payloads.`;
        reasoning = isZh
          ? ["设计优雅且自解释的 JSON 传输格式与类型定义", "消除冗余的模型重合，将计算耗时的操作推迟到必要时按需懒加载", "针对高维统计数据提供优化的聚合算子，简化 Recharts 绑定的数据源"]
          : ["Format semantic and self-describing JSON payload standard types", "Eradicate overlapping variables, lazy loading heavy computed logic when needed", "Expose pre-aggregated statistics to simplify client-side visual graph components"];
        risks = isZh
          ? ["若数据变动极为高频，渲染层可能产生轻微卡顿，需加入渲染限流机制"]
          : ["High data emission velocity might cause micro-lag if ui re-renders aren't debounced"];
      } else if (roundNumber === 4) {
        position = isZh
          ? `强化代码安全编译、混淆，并为整个模块进行自动化健壮性测试。`
          : `Securing our software boundary and implementing automatic tests and error recovery loops.`;
        reasoning = isZh
          ? ["编写完备的局部单元测试用例，覆盖至少 80% 的关键核心逻辑", "在编译流水线中加入静态合规扫描与依赖链检测", "实施全面的全局未捕获异常兜底处理器，提供高逼真的友好出错界面"]
          : ["Introduce test suites covering at least 80% of critical mathematical and logical functions", "Insert static scanners during builds to identify insecure open-source dependencies", "Utilize general error bounds across UI modules to avoid raw application crashes"];
        risks = isZh
          ? ["测试用例增加可能在极其紧迫的交付排期下分散一小部分纯研发时间"]
          : ["Managing complete integration specs takes valuable hours during short sprints"];
      } else {
        position = isZh
          ? `技术就绪度达到 100% 生产级别！架构已经受了充分的仿真性能推演。`
          : `Production readiness is 100%! Server configurations are thoroughly simulated and scalable.`;
        reasoning = isZh
          ? ["完成本地离线机制与云端异步双写的数据完美适配", "开启全面内存消耗检测，无任何明显的闭包泄漏隐患", "所有接口层 and 数据操作均由 TypeScript 强类型安全防护"]
          : ["Ensure cohesive syncing between temporary browser storage and cloud APIs", "Complete memory-leak diagnostics to prove stable performance in infinite cycles", "All visual fields and calculations are locked by strong TypeScript invariants"];
        risks = isZh
          ? ["生产环境的宿主机器性能差异可能对实际毫秒耗时产生微调影响"]
          : ["Server-side hardware tier variances might lead to mild latency fluctuations"];
      }

      if (hasFeedback) {
        position += isZh
          ? ` (同时根据您的意见: 我们将充分考虑并响应“${cleanFeedback}”，在架构安全与服务边界中给予强力支持。)`
          : ` (And per your advice: We will optimize technical systems around "${cleanFeedback}" supporting database stability.)`;
      }
    } else if (nameLower.includes('design') || nameLower.includes('ux') || nameLower.includes('ui')) {
      if (roundNumber === 1) {
        position = isZh
          ? `建立极简优雅的视觉规范，依靠精美文字排版和充沛空白提供呼吸感。`
          : `Staging clean, modern visual styles, leveraging elegant typography and empty space to generate breathing room.`;
        reasoning = isZh
          ? ["选取 Inter 与 Space Grotesk 字体作为首选布局文字，强化技术前沿格调", "避免嘈杂的各种鲜亮彩色渐变，主要以深灰/白高对比度沉淀纯粹美感", "提供舒适、明确的反馈微动画，实现对用户操作的自然交互实体感"]
          : ["Utilize Inter and Space Grotesk fonts to reflect advanced modern layouts", "Avoid visual clutter from generic colorful gradients, setting soft cool themes", "Integrate immediate elastic micro-animations to confirm interactive clicks naturally"];
        risks = isZh
          ? ["过度单色冷淡风布局可能造成非专业受众在理解功能主次上的一小点认知损耗"]
          : ["Extreme minimal layouts might occasionally feel cold to mainstream audiences"];
      } else if (roundNumber === 2) {
        position = isZh
          ? `优化主操控板、看板或仪表盘的物理排版，力求信息密度与易读性的完美对齐。`
          : `Arranging balanced dashboard card densities to pair readability and high-fidelity statistics correctly.`;
        reasoning = isZh
          ? ["使用清晰、非对称的卡片格局体现视觉美感，避免死板", "将核心议题状态以极其鲜明色（如翡翠绿、深金兰）作高亮标记", "支持响应式适配，保证桌面级精致比例在手机等小指端同样无损保留"]
          : ["Use dynamic card sizing to avoid dull standard symmetrical grid patterns", "Highlight critical action states using bold high-contrast emerald and amber variables", "Build perfect responsive media rules so desktop balance replicates nicely on mobile touch screens"];
        risks = isZh
          ? ["多类卡片密集陈列容易造成视觉热图上的过多干扰，应严格控制总量"]
          : ["Crowding multiple widgets on screen poses high graphic load to human processing"];
      } else if (roundNumber === 3) {
        position = isZh
          ? `为系统数据波动及置信投票加入生动的 Recharts 走势与进度百分比动画。`
          : `Injecting smooth graph gradients and visual indicators for board confidence parameters.`;
        reasoning = isZh
          ? ["在 Recharts 图表中使用平滑的贝塞尔缓和曲线，展示共识变化轨迹", "为状态卡片的转换添加淡入与横向拉升过场，避免突兀瞬变", "确保在黑夜与高光模式下均具备舒适的色彩无障碍高对比度（WCAG AA）"]
          : ["Represent board consensus shifts using elegant Bezier curves on Recharts tracking lines", "Leverage slide-and-fade triggers on tabs so content enters dynamically", "Enforce strict contrast guidelines (WCAG AA compliant) with deep grays and neon highlights"];
        risks = isZh
          ? ["由于搭载了各种动画效果，在极低端旧浏览器上可能产生像素抖动"]
          : ["Heavy motion rendering can cause tiny stutters on very legacy hardware chips"];
      } else if (roundNumber === 4) {
        position = isZh
          ? `精雕细琢各种空数据（Empty View）、网络中断、极速加载占位界面（Skeleton UI）。`
          : `Designing delicate loading states, empty views, and friendly error UI pages.`;
        reasoning = isZh
          ? ["提供充满同理心与设计美妙的空界面插图和建议交互入口", "设计优雅的骨架假载动画，极大安抚用户等待时的认知焦躁感", "为按钮操作注入明显的忙碌状态（Spinner / Loading Dots），禁止多次重复触碰"]
          : ["Create high-fidelity friendly illustrations for empty search filter configurations", "Code glowing skeleton loaders to make backend database delays feel faster", "Inject immediate disables on forms when active requests are in flight to prevent overlap"];
        risks = isZh
          ? ["过于讲究的边缘插画设计可能在第一阶段略微增加静态美术资源包体体积"]
          : ["Artistic custom vectors add tiny payload weights to early build bundles"];
      } else {
        position = isZh
          ? `视觉体验已达到最高标准！整体交互流畅自如，品质极其考究。`
          : `User experience achieves the highest standard! The interface is highly responsive with solid visual craft.`;
        reasoning = isZh
          ? ["完成了所有分辨率及移动端的手指物理触摸交互测试", "全部的字体粗细、色值和卡片内边距经微观对齐，比例绝对舒适", "动态辩论圆环和置信度波谱动画已彻底顺滑定调"]
          : ["Complete fluid rendering testing under various aspect ratios and handheld sizes", "Validate perfect consistency in padding multipliers, color tokens, and border bevels", "All consensus dials, confidence ripples, and charts are fluidly functional"];
        risks = isZh
          ? ["若用户机器的系统字体做过强行重载，排版间距可能会产生微调偏差"]
          : ["Custom client browser configurations can sometimes cause small font-offset anomalies"];
      }

      if (hasFeedback) {
        position += isZh
          ? ` (同时根据您的意见: 我们将充分考虑并响应“${cleanFeedback}”，从极致的品牌交互与用户情绪层完美呈现。)`
          : ` (And per your advice: We will refine design elements for "${cleanFeedback}" to provide outstanding responsive patterns.)`;
      }
    } else {
      if (roundNumber === 1) {
        position = isZh
          ? `提出建立审慎的业务推估体系，为项目的全生命周期安全开辟可靠跑道。`
          : `Proposing structured risk models to establish long-term viable runarounds for this initiative.`;
        reasoning = isZh
          ? ["进行多维商业与定位优势研判，确保构想完全经得起落地审视", "设计最简可行路线，严格管控非核心研发成本的流出", "早于初始设计前就确立必要的用户合规安全审计指引"]
          : ["Conduct comparative positioning analysis to proof check user interest trends", "Preserve extreme control on team output scopes to maintain clean budget loops", "Anticipate system bounds to prepare complete legal documentation patterns early"];
        risks = isZh
          ? ["过于审慎可能在立项初期减慢大家的动作速度"]
          : ["Heavy early focus on compliance might slow down the first prototyping efforts"];
      } else if (roundNumber === 2) {
        position = isZh
          ? `推动全体董事建立多维度约束标准，把不确定的风险控制在安全阈值下。`
          : `Encouraging high alignment parameters across roles to keep dynamic risks fully predictable.`;
        reasoning = isZh
          ? ["引导在 MVP 层面将不相关的辅助构想彻底冻结", "设立清晰的技术实现红线，在保证流畅体验和控制服务器费用中取平衡点", "确保项目状态在各环节具备完美的透明度（Dashboard Observability）"]
          : ["Introduce strict freezes on loose third-party integrations for the first build", "Enforce precise engineering targets to keep performance high and cost metrics lean", "Create clear workspace transparency dashboards so team alignments are highly visible"];
        risks = isZh
          ? ["强制性冻结个别附带点可能引起会议观点的一时碰撞"]
          : ["Strict freezes can occasionally limit the experimental freedom of visual designers"];
      } else if (roundNumber === 3) {
        position = isZh
          ? `为系统对多方数据的安全校验、备份以及边缘情境的恢复设立标准规程。`
          : `Building standardized security policies, automated database backups, and recover protocols.`;
        reasoning = isZh
          ? ["规范敏感数据的客户端加密哈希存储，避免任何明文暴露", "确立本地快照定期回溯机制，即便遭遇浏览器重置亦可迅速修复", "为各类不可预测的错误提供简洁、高容灾的系统退步机制"]
          : ["Validate hash encryption formats on user inputs to check data integrity", "Establish recovery backups for snapshots so refresh resets are easily handled", "Implement disaster-recovery fallback interfaces for edge network disruptions"];
        risks = isZh
          ? ["复杂的容灾校验可能会令纯文本的底层开发稍微增加一小部分嵌套度"]
          : ["Advanced exception recovery patterns append a minor logical nesting level"];
      } else if (roundNumber === 4) {
        position = isZh
          ? `开展高密度的综合功能压力模拟与测试，防止任何上线首日的崩溃隐患。`
          : `Simulating high-density performance test scenarios to ensure safe post-release launch.`;
        reasoning = isZh
          ? ["构建并发用户量预测曲线，预估服务器最佳物理配额", "全面对核心算法展开多线程、大体量离线压力测试", "提前组织一小批真实体验官，进行高密集度下的功能阻碍排查"]
          : ["Model heavy data loads to allocate appropriate server configuration scaling variables", "Subject database calculations and async code to dense continuous stresstests", "Invite internal test managers to execute exhaustive friction hunts across the main flows"];
        risks = isZh
          ? ["全景压力测试耗费的部分数据流量或算力可能引起细微的额外费用支出"]
          : ["Comprehensive benchmark drills slightly increase server runtime execution billings"];
      } else {
        position = isZh
          ? `该董事会对整个业务安全体系和防御型降级架构表示全部认同。`
          : `Fully co-signing corporate compliance, and graceful adaptive storage layouts.`;
        reasoning = isZh
          ? ["所有的多角色测试、安全拦截 and 高密集测试已经全部达到最佳就绪状态", "我们将紧密执行已达成的神圣共识，为用户筑牢落地基石"]
          : ["Acknowledge complete test suites and offline storage routines are fully prepared", "Adhere tightly to team-locked foundations to empower user operations"];
        risks = isZh
          ? ["后期需要严格按照已达成战略对齐约束执行，保持一致性"]
          : ["Ongoing execution relies strictly on maintaining strategic alignment invariants"];
      }

      if (hasFeedback) {
        position += isZh
          ? ` (同时根据您的意见: 我们将充分考虑并响应“${cleanFeedback}”，提供完备的决策合规 and 风控支持。)`
          : ` (And per your advice: We will structure risk rules for "${cleanFeedback}" fully.)`;
      }
    }

    return {
      agentId: agent.id,
      position,
      reasoning,
      risks,
      confidence,
    };
  });

  let decisionsLocked: string[] = [];
  if (roundNumber === 1) {
    decisionsLocked = isZh 
      ? ["锁定 MVP 阶段的核心愿景与主要功能范围", "确立敏捷松耦合的系统架构边界"]
      : ["Establishing the core MVP vision and major user workflows", "Determining early system boundaries and non-coupled interfaces"];
  } else if (roundNumber === 2) {
    decisionsLocked = isZh
      ? ["彻底剪除次要和长尾功能，极度精简第一版交互首屏", "确立本地 (LocalStorage) 离线缓存快照持久机制"]
      : ["Ruthlessly pruned secondary modules to lock a clean desktop workspace screen", "Decided on browser IndexedStorage for continuous local caching"];
  } else if (roundNumber === 3) {
    decisionsLocked = isZh
      ? ["锁定核心数据 Model 实体的强类型 JSON 定义", "为置信指标走势集成 Recharts 专业图表组件"]
      : ["Locked strong TypeScript schema interfaces for global database states", "Integrated dynamic Recharts trendlines to show meeting consensus changes"];
  } else if (roundNumber === 4) {
    decisionsLocked = isZh
      ? ["通过 80% 覆盖率的关键单元逻辑测试用例编写", "建立全局未捕获错误的容灾处理器与 Skeleton UI 加载遮罩"]
      : ["Approved complete integration test coverage for core business formulas", "Constructed custom skeletons and edge error screens to maximize accessibility"];
  } else {
    decisionsLocked = isZh
      ? ["全票通过发布终审，MVP 原型处于生产发布就绪极佳状态", "锁定了未来长期功能迭代优先级与种子用户反馈跟进机制(TOS)"]
      : ["Unanimously passed release auditing to lock production draft pipeline", "Confirmed upcoming version milestone roadmaps and targeting marketing triggers"];
  }

  if (hasFeedback) {
    decisionsLocked.push(isZh 
      ? `落实关于反馈“${cleanFeedback}”的具体指导机制` 
      : `Incorporating user feedback guidance: "${cleanFeedback}"`);
  }

  let openQuestions: string[] = [];
  if (roundNumber === 1) {
    openQuestions = isZh
      ? ["高级图表交互与云端多端实时同步的最佳阶段排期", "如何将首期部署运行所需的云端机器及持久层费用降到最低"]
      : ["Precise phase schedules for cross-platform replication and live data tables", "Optimizing initial deployment options to manage resource costs"];
  } else if (roundNumber === 2) {
    openQuestions = isZh
      ? ["用户长时间断网情况下，本地大批量缓存快照的合并冲突解析协议设计", "图表在多种极限分辨率（巨型桌面、极窄手机）下的极致自适应比例参数"]
      : ["How to handle logical race conflicts on long offline local queues upon reconnecting", "Determining fluid canvas ratios for very narrow screens or tablet formats"];
  } else if (roundNumber === 3) {
    openQuestions = isZh
      ? ["数据在高频提交形态下的渲染限流门槛选择", "特定角色对全局共识结果拥有一票否决权时的特殊表决流处理方案"]
      : ["Selecting specific debounces and throttling mills for fast interactive inputs", "Drafting dynamic protocols when certain roles demand veto overrides on locked items"];
  } else if (roundNumber === 4) {
    openQuestions = isZh
      ? ["自动化流水线中，针对不同地域访问延迟的最优预热资源节点配置", "是否在正式全量公开前，为定向内测种子用户启用专属灰度部署通道"]
      : ["Configuring optimum pre-warmed edge clusters to combat global route latency", "Planning restricted release beta-branches for early testers"];
  } else {
    openQuestions = isZh
      ? ["上线第一周内收集到的海量数据指标中，哪三个为决定下一次大版本发力的黄金指标", "如何更自然地引导首批满意的种子用户前往公开平台分享推荐，拉动裂变"]
      : ["Securing the top three critical customer metrics from active logs to trigger major sidetracks", "Encouraging premium tier adopters to leave recommendations and boost virality"];
  }

  let moderatorSummary = "";
  if (roundNumber === 1) {
    moderatorSummary = isZh
      ? `【总协调人第 1 轮会商纪要】会议在极其务实、理性的氛围中开启。各位董事代表分别针对项目“${project.idea}”的首期战略构想阐述了各自的专业判断。产品经理指出应该牢牢咬合并优先打通首要价值痛点；技术架构师对底层框架类型安全以及分层开发给出了高度前沿的指导；交互设计师提议构建纯静优雅、富含呼吸感的视觉格调。多方首期契合良好，共识基础正在快速形成。`
      : `[Moderator Round 1 Summary] The strategic board session opened smoothly. Panelists contributed focused analyses on "${project.idea}". PM surged focusing purely on initial user conversions; Tech Architect insisted on type-safe systems and layered bounds; UX Designer suggested a clean, spacious visual canvas with precise typography. Key baseline alignments are rapidly materializing.`;
  } else if (roundNumber === 2) {
    moderatorSummary = isZh
      ? `【总协调人第 2 轮会商纪要】辩论迅速切入到具体可行性、裁剪无谓损耗的核心痛点上。多位代表达成绝对共识：首期版本必须对功能进行“无情剪裁”，以追求主链流畅性。同时，为了规避网络依赖对体验的阻碍，大家全体赞成加入高稳定性、易回复的 LocalStorage 离线快照机制，作为客户端的安全网。各部门工作细化分工明确。`
      : `[Moderator Round 2 Summary] Debates progressed to hard execution bounds. Consensus solidified around "ruthless trimming" to secure a clean main transaction journey. To eliminate online dependencies, we agreed on persistent browser local caching as a secure reliability buffer. Role outputs are tightly integrated.`;
  } else if (roundNumber === 3) {
    moderatorSummary = isZh
      ? `【总协调人第 3 轮会商纪要】会商深度切入到了逻辑持久化表、复杂算子提炼与更具情绪张力的 UI 反馈机制上。Tech 详细阐述了结构自解释与延迟加载的优势；UX 设计师则为共识波动与数据统计走势定制了生动的 Recharts 动态走势渐变线。会议在逻辑、美学两个维度全面成熟。`
      : `[Moderator Round 3 Summary] Alignment dived into logical persistence patterns, compute optimization, and expressive feedback visuals. Tech Architect designed clean transactional payloads; UX Designer integrated Recharts graphs representing agreement progressions. The project exhibits outstanding balance in both architecture and visual quality.`;
  } else if (roundNumber === 4) {
    moderatorSummary = isZh
      ? `【总协调人第 4 轮会商纪要】落地的准备工作进入攻坚期。Tech 提交了高度健壮的单元测试保障与未捕获异常降级处理器；UX 设计师完成了高同理心、富有美感的美妙空界面、加载骨架与 busy indicators 细节覆盖；PM 制定了分阶段灰度发布的科学路线。产品生命周期已然极为丰满。`
      : `[Moderator Round 4 Summary] Launch readiness activities are peaking. Tech Architect integrated modular test lines and global error catching layers; UX Designer finalized friendly custom skeletons and empty indicators; PM detailed a calculated three-tier deployment rollout plan. Security and usability are well guaranteed.`;
  } else {
    moderatorSummary = isZh
      ? `【总协调人第 5 轮会商纪要（终审圆满完成）】会议达成完美的高维统一！全体参与者以极大热忱通过了对原型蓝图的最终签字画押。在最精熟的工程化设计 and 商业风险合规控管下，我们锁定了最精湛的产品蓝图。各通道就绪指标全部绿灯亮起，MVP 原型开发指令处于随时可以触发、极佳的发展势头！`
      : `[Moderator Round 5 Summary (Audit Completed)] High-order consensus reached! Panelists co-signed the final product specifications with strong support and confidence. Under disciplined engineering limits and secure legal standards, we locked down the perfect design setup. All traffic monitors are green, and the development blueprint is ready to execute!`;
  }

  if (hasFeedback) {
    moderatorSummary += isZh
      ? ` 另外，会议专门接收并深入研讨了您的反馈指导意见：“${userFeedback}”，已将其定为下一阶段工程落地约束，各部门代表已表示十分赞同。`
      : ` In addition, standard alignment has absorbed your direct feedback: "${userFeedback}". This is officially integrated into our project pipeline.`;
  }

  return {
    roundNumber,
    type: isFirstRound ? 'analysis' : 'debate',
    responses,
    moderatorSummary,
    decisionsLocked,
    openQuestions,
  };
}

export async function processNextRound(project: ProjectState, action: string, customApiKey?: string): Promise<ProjectState> {
  const roundNumber = project.rounds.length + 1;
  const isFirstRound = roundNumber === 1;

  if (action === 'conclude' || roundNumber > 5) {
    project.status = 'completed';
    return project;
  }

  const memoryContext = formatMemory(project);
  const responses: RoundResponse[] = [];

  try {
    const agentTasks = project.agents.map(async (agent) => {
      const outputLanguageInstruction = project.language === 'zh'
          ? "\nCRITICAL RULE: While this prompt is in English, you MUST output all your generated JSON string values entirely in Chinese (Simplified). The JSON keys must remain in English." 
          : "";

      const prompt = `You are playing the role of: ${agent.name} (${agent.description}).
      
  Context:
  ${memoryContext}
  
  Task:
  ${isFirstRound 
    ? "Provide your initial strategic analysis on this idea based on your role." 
    : "Review the previous round. If the user provided feedback, you MUST address it directly. If the user did NOT provide feedback, naturally drive the conversation forward by tackling the 'Open Questions', proposing new concrete implementation details, or moving to the next logical phase. DO NOT repeat your previous position."}
  
  Rules:
  - Be extremely concise. Use 2-3 brief bullet points for reasoning.
  - Explain your position and reasons in VERY SIMPLE, clear, and layman-friendly language. Avoid using complex corporate, academic, or technical jargon. If you must use a specialized term, explain it clearly in simple words inside parentheses. Someone with absolutely no technical background must easily understand it!
  - Identify 1-2 key risks clearly in plain words.
  - Output high-signal content only. No conversational filler.${outputLanguageInstruction}
  `;

      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          position: { type: Type.STRING, description: "Short core opinion" },
          reasoning: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 concise bullet points" },
          risks: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-3 concise bullet points" },
          confidence: { type: Type.INTEGER, description: "0-100%" }
        },
        required: ["position", "reasoning", "risks", "confidence"]
      };

      const res = await generateStructured<Omit<RoundResponse, 'agentId'>>(prompt, schema, project.model, customApiKey);
      return {
        agentId: agent.id,
        ...res
      };
    });

    const agentResults = await Promise.all(agentTasks);
    responses.push(...agentResults);

    const outputLanguageInstruction = project.language === 'zh'
        ? "\nCRITICAL RULE: You MUST output all your generated JSON string values entirely in Chinese (Simplified). The JSON keys must remain in English." 
        : "";

    const moderatorPrompt = `You are the Moderator.
  Context:
  ${memoryContext}
  
  Recent Agent Responses:
  ${JSON.stringify(agentResults, null, 2)}
  
  Task:
  Summarize this round in simple, non-jargon, layman-friendly words. Keep sentences short and easy to understand. Completely avoid high-sounding academic buzzwords or complex technological phrases. If talking about technical decisions, explain simply what they mean to a casual reader. Identify consensus, disagreements, newly locked decisions, and open questions.
  If confidence is generally > 80% and disagreements are minor, note that we might be ready to conclude.${outputLanguageInstruction}`;

    const moderatorSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        moderatorSummary: { type: Type.STRING, description: "Synthesis of consensus, disagreements, and risk overview." },
        decisionsLocked: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Any completely agreed upon decisions." },
        openQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["moderatorSummary", "decisionsLocked", "openQuestions"]
    };

    const modRes = await generateStructured<{ moderatorSummary: string, decisionsLocked: string[], openQuestions: string[] }>(moderatorPrompt, moderatorSchema, project.model, customApiKey);

    const newRound: RoundSummary = {
      roundNumber,
      type: isFirstRound ? 'analysis' : 'debate',
      responses,
      moderatorSummary: modRes.moderatorSummary,
      decisionsLocked: modRes.decisionsLocked,
      openQuestions: modRes.openQuestions
    };

    project.rounds.push(newRound);
    project.globalDecisions.push(...modRes.decisionsLocked);
    
    // Deduplicate global decisions
    project.globalDecisions = Array.from(new Set(project.globalDecisions));
    project.quotaWarning = false; // Reset warning if real request succeeded
  } catch (err: any) {
    console.warn("[Orchestrator] Gemini API failed / Quota exceeded, falling back to offline simulation mode:", err);
    
    // Generate beautiful realistic mock round
    const fallbackRound = generateMockRound(project, roundNumber);
    project.rounds.push(fallbackRound);
    project.globalDecisions.push(...fallbackRound.decisionsLocked);
    project.globalDecisions = Array.from(new Set(project.globalDecisions));
    
    // Activate quota rating alert banner!
    project.quotaWarning = true;
  }

  return project;
}

export async function generateBuilderExport(project: ProjectState, customApiKey?: string): Promise<{
  systemInstructions: string;
  foundation: string;
  builderPrompt: string;
  buildReadiness: string;
  readinessScore: number;
  clarityScore: number;
  alignmentScore: number;
  completenessScore: number;
  feasibilityScore: number;
}> {
  if (project.id === 'board-blueprint-001-zh') {
    return {
      systemInstructions: `# 多智能体战略会商系统 - 顶级 AI 研发规范 (SYSTEM_INSTRUCTIONS.md)

作为资深全栈研发 AI，你将严格承接该项目的物理构建，遵守以下系统级准则：

1. **会商承袭 (Strategic Role Cohesion)**:
   - 深度对齐战略经理 (PM)、系统架构师 (Arch) 以及体验设计专家 (UX) 达成的高度共识。
   - 采用 React 18 + Vite + Tailwind CSS 以及 TypeScript 强类型约束进行最高标准的编码。

2. **性能与沙盒约束 (Worker & Isolation Policies)**:
   - **强制 Web Workers 隔离**：所有复杂仿真计算与图表数据重构，必须放入后台 Web Worker。严禁在 UI 主线程执行耗时运算，以防造成帧率波动（Drop-frames）。
   - **任务分片与优先级**：Worker 必须应用“分片计算策略 (Chunking)”并自带“优先级任务队列 (Priority Queue)”，保障高优先级反馈顺畅发出。

3. **视觉与交互规范 (Optimistic UI & Minimalist Theme)**:
   - 全站贯彻 **Vercel / Linear** 式的暗黑机能美学。巧用 \`Inter\` 字体搭配数字专用的等宽 \`JetBrains Mono\`。
   - 主张 **“乐观 UI + 异步仪式感”**：任何实质更新应即时体现在客户端状态中（乐观 UI 渲染），同时配合平滑、带有科技弧光或微渐变的骨架屏、动态连线或图表渲染波纹（强化交互仪式感）。`,
      foundation: `# 业务愿景与已锁定技术共识 (FOUNDATION.md)

本项目 *AI 多智能体战略会商虚拟空间* 已经由董事会在前 5 轮深度研讨会中达成终极架构锁钥。

## 1. 核心愿景 & 物理约束
- **主攻目标**: 构建高保真协作底座，通过专业智能体董事对抗式辩论与互评，深度还原项目蓝图。
- **视觉风格**: 暗色极极简、微克制渐变，以充裕的负外边距营造顶级的心流思考空间。
- **状态同步**: 100% 客户端本地优先 (Local-First)，数据即时落盘 LocalStorage，多端协作接口选用高冗余度的弱依赖弹性结构。

## 2. 核心合规与决策档案
- **决策一 (主持人提炼模式)**: 摒弃传统嘴炮对轰，引入 Moderator 进行阶段归纳。
- **决策二 (Web Workers 隔离)**: 音视频及复杂仿真推演全部开辟离线纯净独立计算空间。
- **决策三 (分片计算与缓冲队列)**: 针对大负荷场景设置了缓存淘汰和优先级队列，完全杜绝内存溢出风险。

## 3. 标准实体与数据定义 (TypeScript)
\`\`\`typescript
interface Agent {
  id: string;
  name: string;
  avatar: string;
  role: 'PM' | 'Arch' | 'UX';
}
interface Decision {
  id: string;
  title: string;
  lockedRound: number;
}
\`\`\``,
      builderPrompt: `# Cursor / v0 / Bolt 一键构建大提示词 (BUILDER_PROMPT.md)

请顺承以下两阶段任务，一步到位开始软件物理编译：

## 阶段 1: 建立高对齐的单页战略控制舱 (Control Room Layout)
1. 建立布局极其高级、充满空气感的 Vercel 风格控制舱界面：左边栏为智能体状态卡片（带闪烁微光呼吸灯），中心区域展示多智能体对抗辩论的动态文本卡片。
2. 配置 Recharts 共识偏转曲线组件，以发光的 cyan/amber 数据弧线优雅显示每一轮一致性的演进大势。
3. 实现“乐观 UI”：点击决策锁定时，零延迟呈现已锁定徽章；同时，卡片背景泛起一层柔和的波动仪式感特效，模拟数据上链或固封过程。

## 阶段 2: 编写 Web Worker 离线计算与优先级任务核心
1. 编写独立于主线程的 \`sim-calculator.worker.ts\` 脚本，支持对几万个仿真点进行分片计算。
2. 每一个分片大小设定为 500 个数据单元，分片执行间隙空出 16ms 给予 DOM 刷新窗口。
3. 封装 Worker 通信层与 Hook，自带状态异常自动恢复机制（若 Worker 发生 Out Of Memory 自动自愈并拉起新线程）。`,
      buildReadiness: `# 构建就绪度评估报告  

## 1. 执行摘要 
项目已完成五轮深度会商，技术路径与视觉规范已高度对齐。核心架构已锁定为‘本地优先+异步仪式感’，具备极高的工程落地可行性。  

## 2. 核心优势 
- **决策锁定**: 彻底摒弃无效对话，采用主持人提炼模式。 
- **性能保障**: 强制Web Workers隔离，确保交互丝滑。 
- **用户体验**: 乐观UI与仪式感设计的深度融合。  

## 3. 风险与缓解 
- **风险**: 复杂仿真计算可能导致内存溢出。 
- **缓解**: 实施分片计算策略，并在Web Worker中设置任务优先级队列。  

## 4. 就绪度评分表 
| 指标 | 分数 | 
| :--- | :--- | 
| 需求清晰度 | 98 | 
| 战略对齐度 | 96 | 
| 架构完备度 | 95 | 
| 研发可行性 | 94 | 
| **综合得分** | **95.75**`,
      readinessScore: 96,
      clarityScore: 98,
      alignmentScore: 96,
      completenessScore: 95,
      feasibilityScore: 94
    };
  }

  if (project.id === 'board-blueprint-001') {
    return {
      systemInstructions: `# Multi-Agent Strategic Workspace - Premium AI System Instructions (SYSTEM_INSTRUCTIONS.md)

As a senior full-stack implementation AI, you are instructed to execute the physical system build for this project under the following guardrails:

1. **Strategic Role Cohesion**:
   - Align with the consensus established by the Strategic PM, Tech Architect, and UX Designer.
   - Build using React 18, Vite, Tailwind CSS, and strict TypeScript rules.

2. **Performance & Thread Isolation**:
   - **Enforce Web Workers Isolation**: Heavy calculations and background algorithms must reside strictly inside isolated web worker files to avoid frame rate drops on the UI thread.
   - **Chunking & Priority Queue**: Workers must divide computation tasks into small chunks and utilize an internal priority heap queue to handle user actions immediately.

3. **Visual Aesthetics & Ceremony**:
   - Implement carbon slate dark themes inspired by modern developer tooling (Vercel/Linear).
   - Prioritize Optimistic UI combined with smooth transition ceremonies to denote system progress.`,
      foundation: `# Product Foundations & Strategic Consensus Checkpoints (FOUNDATION.md)

The technical foundations and consensus agreements solidified across the 5 committee sessions.

## 1. Product Vision & Constraints
- **Primary Goal**: Build a high-fidelity workspace where specialized agents validate project blueprints under user steering.
- **Vibe & Style**: Sleek high-contrast layout displaying clean Inter and JetBrains Mono fonts.
- **Logical Binding**: 100% Client-First local state mapping backed up seamlessly into standard Web Storage.

## 2. Main Consensus Agreements
- **Moderator-Synthesized Flow**: Sidestepped direct agent chatter, routing all inputs to the Moderator.
- **Web Workers Computation**: Isolates rendering from compute structures.
- **Strategic Mitigations**: Deployed chunked arrays to minimize potential browser OOM overheads.`,
      builderPrompt: `# Target Code Generation Phase Prompts (BUILDER_PROMPT.md)

Run these prompts in Cursor / v0 / Bolt.new to construct the application:

## Phase 1: High-Fidelity Strategic Hub Layout
1. Construct a clean developer cockpit layout. The left pane shows agent statuses (with glowing green micro pulses), and the main canvas streams debate results.
2. Embed highly stylized Recharts line charts running cyan and amber glows to graph the convergence metric trends.
3. Establish optimistic state responses highlighting locked directives instantly with crisp, smooth shimmer animations upon user selection.

## Phase 2: Compute Worker & Heap Queue Implementation
1. Construct an independent isolated \`sim-calculator.worker.ts\` script managing high-load simulations.
2. Slice calculation tasks into chunks of 500 items, executing with 16ms yields to preserve DOM cycles.
3. Wire the worker via customized React hooks with automatic thread recovery wrappers.`,
      buildReadiness: `# Implementation Build Readiness Report

## 1. Executive Summary
The initiative has completed 5 sessions of evaluation. Implementation paths and visual norms are fully aligned. Core components are locked onto a "Local-First + Asynchronous Ceremony" flow with ultra-high feasibility.

## 2. Solidified Strengths
- **Moderator Consensus**: Extinguished unnecessary dialogue through synthesized moderator summations.
- **Performance Guards**: Thread-isolated calculations using Web Workers ensure smooth interactions.
- **Optimistic UI**: Experience blends instant UI visual state mutations with micro-transitions.

## 3. Engineering Risks & Mitigations
- **Identified Risk**: Large-scale calculations risk memory exhaustion.
- **Mitigation Action**: Impose computational chunking coupled with a task priority queue in background threads.

## 4. Build Readiness Scorecard
| Audit Dimension | Evaluated Metric |
| :--- | :--- |
| Goals & Constraint Clarity | 98 |
| Strategic Consensus Alignment | 96 |
| Architectural Completeness | 95 |
| Implementation Feasibility | 94 |
| **Combined Readiness Rating** | **95.75**`,
      readinessScore: 96,
      clarityScore: 98,
      alignmentScore: 96,
      completenessScore: 95,
      feasibilityScore: 94
    };
  }

  const context = formatMemory(project) + `\nGlobal Decisions:\n- ${project.globalDecisions.join('\n- ')}\n`;
  
  const outputLanguageInstruction = project.language === 'zh'
        ? "\nCRITICAL RULE: Generate the markdown content entirely in Chinese (Simplified)." 
        : "";

  const prompt = `Based on the following AI Strategic Workspace context, generate markdown files and build readiness metrics for an external coding agent to build the actual product.
  Context: ${context}
  
  Your output MUST evaluate the architectural alignment, team consensus convergence, and developer action readiness.
  Specifically, compute:
  - Clarity Score (需求清晰度): Clarity of goals, metrics, and technical/business constraints.
  - Alignment Score (战略对齐度): Extent to which multi-agent debate converged and active users agreed vs voted down.
  - Completeness Score (架构完备度): Coverage of UI screens, APIs, data stores, or key integration details.
  - Feasibility Score (研发可行性): Practicality of implementing this system in modern clean React + TypeScript with standard libraries.
  Provide an overall Readiness Score as the math average of these four.
  
  Format the 'buildReadiness' markdown file as a highly professional report outlining:
  1. Executive Summary & Readiness Rating
  2. Core Strengths (Decisions Solidified)
  3. Identified Implementation Risks & Mitigation Actions
  4. Build Readiness Scorecard Table (showing Clarity, Alignment, Completeness, Feasibility and overall percentage)
  
  ${outputLanguageInstruction}`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      systemInstructions: { type: Type.STRING, description: "SYSTEM_INSTRUCTIONS.md content detailing roles and rules for the coding AI." },
      foundation: { type: Type.STRING, description: "FOUNDATION.md content detailing product vision, goals, and architecture with high clarity." },
      builderPrompt: { type: Type.STRING, description: "BUILDER_PROMPT.md content with concrete code-focused phase-by-phase tasks." },
      buildReadiness: { type: Type.STRING, description: "BUILD_READINESS.md content containing the rigorous scorecard, strengths, and risk analysis in markdown format." },
      readinessScore: { type: Type.NUMBER, description: "Overall build readiness score from 0 to 100." },
      clarityScore: { type: Type.NUMBER, description: "Clear business model and constraint definitions score from 0 to 100." },
      alignmentScore: { type: Type.NUMBER, description: "Team and user strategic alignment score from 0 to 100." },
      completenessScore: { type: Type.NUMBER, description: "Architecture specifications completeness score from 0 to 100." },
      feasibilityScore: { type: Type.NUMBER, description: "Physical code execution feasibility score from 0 to 100." }
    },
    required: ["systemInstructions", "foundation", "builderPrompt", "buildReadiness", "readinessScore", "clarityScore", "alignmentScore", "completenessScore", "feasibilityScore"]
  };

  try {
    const files = await generateStructured<any>(prompt, schema, project.model, customApiKey);
    return {
      systemInstructions: files.systemInstructions,
      foundation: files.foundation,
      builderPrompt: files.builderPrompt,
      buildReadiness: files.buildReadiness,
      readinessScore: Math.round(Number(files.readinessScore) || 75),
      clarityScore: Math.round(Number(files.clarityScore) || 75),
      alignmentScore: Math.round(Number(files.alignmentScore) || 75),
      completenessScore: Math.round(Number(files.completenessScore) || 75),
      feasibilityScore: Math.round(Number(files.feasibilityScore) || 75)
    };
  } catch (err: any) {
    console.warn("[Orchestrator] generateBuilderExport failed/quota exceeded, falling back to smart export template:", err);
    
    const isZh = project.language === 'zh';
    
    // Fallback metrics calculation
    const clarityScore = Math.min(100, (project.goals ? 35 : 15) + (project.constraints ? 35 : 15) + 30);
    const alignmentScore = Math.min(100, 50 + project.globalDecisions.length * 8 - (project.rounds.some(r => r.responses.some(rp => rp.userVote === 'down')) ? 10 : 0));
    const completenessScore = Math.min(100, 40 + project.rounds.length * 15 + project.globalDecisions.length * 5);
    const feasibilityScore = 90; // defaults high for physical mock architecture
    const readinessScore = Math.round((clarityScore + alignmentScore + completenessScore + feasibilityScore) / 4);

    const systemInstructions = isZh 
      ? `# 智能体会商研发规范指引 (SYSTEM_INSTRUCTIONS.md)

本指令集合面向下一阶段承接系统的 AI 研发代理，包含核心工作模式与准则：

1. **会商多角色承袭**: 研发代理应深度对齐项目经理、架构专家与UI交互团队，以跨领域的全景视野驱动敏捷产出。
2. **极简优雅标准**: UI样式务必力求纯正高级，采用合理的字体搭配、充足的负外边距，以轻巧设计传递产品高级质感。
3. **安全拦截与强类型**: 一切基础服务与接口必须遵循强类型规范，杜绝空值引起的系统异常，实施全天候优雅的出错降级。`
      : `# Multi-Agent Board System Implementation Guide (SYSTEM_INSTRUCTIONS.md)

This system outline instructs downstream building agents to achieve precision:

1. **Role Cohesion**: Synthesize active Product, Tech, and visual experience mandates into unified codebase commits.
2. **Minimalist Aesthetic**: Align layout structures strictly with the Inter and Space Grotesk fonts, highlighting crucial decision points clearly.
3. **Type-Safe Invariants**: Assert comprehensive input validation guards on all client interactive scopes to maintain system predictability.`;

    const foundation = isZh
      ? `# 业务构想与已锁定共识 (FOUNDATION.md)

本项目构想 *${project.idea}* 经过专家会商后沉淀的核心资产设计蓝图：

## 1. 战略性诉求
- **愿景目标**: ${project.goals || '构筑具备极高商业、技术可行性的标杆产品'}
- **资源与性能约束**: ${project.constraints || '追求极致的代码复杂度控制与极致响应式适配'}

## 2. 历经辩论固化的全局共识
${project.globalDecisions.length > 0 
  ? project.globalDecisions.map(d => `- ${d}`).join('\n') 
  : "- 聚焦在核心MVP的业务数据及轻量级本地化操作闭环\n- 构建松耦合接口定义，防止架构硬化绑定"}

## 3. 技术及设计系统基线
- 表现层: 基于 React 18, Vite 编译与 Tailwind CSS 的高级原子类样式
- 交互流: 基于 localState 的状态持久化引擎`
      : `# Strategic Core Foundations & Clear Agreements (FOUNDATION.md)

The official product foundation established for initiative: *${project.idea}*

## 1. Vision & Constraints
- **Core Intent**: ${project.goals || 'To produce an incredibly well aligned and secure service prototype'}
- **Technical Guards**: ${project.constraints || 'Maintain small module weight and excellent data readability'}

## 2. Settled Strategic Decisions
${project.globalDecisions.length > 0 
  ? project.globalDecisions.map(d => `- ${d}`).join('\n') 
  : "- Optimize client interaction around key user pain points first\n- Retain strict isolation between visual cards and data retrieval routines"}

## 3. Reference Implementation Architecture
- Presentation Layer: Responsive layouts powered by Tailwind CSS on React 18
- Logical Binding: Client-friendly state engine storing configuration snapshots securely`;

    const builderPrompt = isZh
      ? `# 下阶段核心开发任务 (BUILDER_PROMPT.md)

请引导下一代工程师严格完成以下两阶段任务：

## 阶段 1: 首页仪表盘与美学画幅确立
- 构建充满呼吸感、高对比度的后台运营主站仪表盘。
- 将已锁定的关键共识与决策指标，以直观精致的组件化形态进行响应式铺设。

## 阶段 2: 数据安全拦截与离线暂存方案
- 实现简捷的 LocalStorage 读写机制，支持对会商快照的非网络断点续存。
- 为高密度统计 and 数据渲染，加入 Recharts 整合实现，确保共识变化直观可感。`
      : `# Target Code Generation Phase Prompts (BUILDER_PROMPT.md)

Execute these step-by-step tasks to transform the board consensus into functional software code:

## Phase 1: Establish High-Fidelity Workspace Layouts
- Setup a bold, typography-centric home layout designed for dark canvas rendering.
- Present responsive grid components that visualization newly locked decisions correctly.

## Phase 2: Formulate Local Snapshot Persistence
- Integrate lightweight Web Storage APIs to retain configurations on browser refresh.
- Setup elegant charts utilizing Recharts to render active statistics smoothly.`;

    const buildReadiness = isZh
      ? `# 研发行动就绪度报告 (BUILD_READINESS.md)

根据 AI 多智能体中控台的会商链条，对项目构想 **${project.idea}** 的落地就绪度（Build Readiness）评估结果如下：

## 1. 核心就绪度：${readinessScore}%
当前项目表现出了**${readinessScore >= 85 ? '卓越' : '中高'}等**就绪度。通过多轮跨领域辩论与用户的深度方向性对齐，系统边界已相对清晰。

## 2. 就绪度细分矩阵
| 专业评审维度 | 评估得分 | 评审状态 | 核心考量依据 |
| :--- | :--- | :--- | :--- |
| **需求清晰度 (Clarity)** | ${clarityScore}% | ${clarityScore >= 80 ? '🟢 充分固化' : '🟡 部分明确'} | 商业构想和技术限制的整体表述细致程度 |
| **战略对齐度 (Alignment)** | ${alignmentScore}% | ${alignmentScore >= 80 ? '🟢 高度对齐' : '🟡 轻微偏差'} | 智能体辩论结果、一致性演进与用户赞同/反对投票倾向 |
| **架构完备度 (Completeness)** | ${completenessScore}% | ${completenessScore >= 80 ? '🟢 高度完备' : '🟡 待扩充'} | 已锁定决策对数据库、渲染模块及交互层的覆盖率 |
| **研发可行性 (Feasibility)** | ${feasibilityScore}% | 🟢 极高 | 基于 React/Tailwind/TypeScript 的物理承接无任何壁垒 |

## 3. 会商淬炼优势亮点
- **用户主导对齐**: 用户全天候参与对齐机制，使专家智能体的偏向能够根据真实现场反馈极速修正。
- **高阶决策固化**: 已锁定 \`${project.globalDecisions.length}\` 项全局底层重大架构决策，为后续阶段直接建构工程树奠定了确定性常态。

## 4. 落地合规安全风控
- **防御型限额处理**: 系统底层建立了离线仿真后备引擎（Offline Simulator Fallback），可 100% 抵御高并发接口受限或服务超额配额中断（429 报错）。
- **静态强类型保证**: 统一通过强 TypeScript 结构规避复杂环境下动态语言特有的结构退化风险。`
      : `# Developer Implementation & Build Readiness Review (BUILD_READINESS.md)

An exhaustive assessment outlining the physical implementation readiness of project initiative: **${project.idea}**

## 1. Executive Summary & Readiness Level: ${readinessScore}%
The overall build readiness scorecard is **${readinessScore >= 85 ? 'EXTREMELY WELL PREPARED' : 'STRATEGICALLY STABLE'}**. The board multi-agent debate and active user feedback convergence have established solid development constraints.

## 2. Strategic Quality Matrix
| Audit Dimension | Evaluated Metric | Status | Primary Assessment Rationale |
| :--- | :--- | :--- | :--- |
| **Clarity** | ${clarityScore}% | ${clarityScore >= 80 ? '🟢 HIGHLY CLEAR' : '🟡 PARTIAL'} | Definition depth of strategic business vision and constraints |
| **Alignment** | ${alignmentScore}% | ${alignmentScore >= 80 ? '🟢 CONVERGED' : '🟡 DIVERGENT'} | Extent of advisor consensus and active user approval signals |
| **Completeness** | ${completenessScore}% | ${completenessScore >= 80 ? '🟢 SATISFACTORY' : '🟡 INITIAL'} | Domain specific system agreements mapped to date |
| **Feasibility** | ${feasibilityScore}% | 🟢 FEASIBLE | Direct physical execution mapping using standard React/TypeScript frameworks |

## 3. Solidified Strengths
- **Stepping Loop Solidified**: Direct incorporation of user-led alignment mechanisms mitigates potential over-engineering.
- **Architectural Footprints**: \`${project.globalDecisions.length}\` major global architecture checkpoints are locked, preventing requirements creep.

## 4. Key Engineering Intercepts & Risks
- **Quota Exceeded Graceful Fallbacks**: Adaptive local simulation layer defends fully against upstream live API key rates and limitations.
- **Strict Typing Declarations**: Strongly-typed structures block schema regressions during agile code deliveries.`;

    return {
      systemInstructions,
      foundation,
      builderPrompt,
      buildReadiness,
      readinessScore,
      clarityScore,
      alignmentScore,
      completenessScore,
      feasibilityScore
    };
  }
}
