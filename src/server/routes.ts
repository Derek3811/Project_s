import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { ProjectState } from '../types';
import { processNextRound, generateBuilderExport } from './orchestrator';

export const apiRouter = Router();

apiRouter.post('/projects/import', (req, res) => {
  try {
    const { projectData } = req.body;
    if (!projectData) {
      return res.status(400).json({ success: false, error: 'Project data is required' });
    }

    let parsedProject: ProjectState;
    if (typeof projectData === 'string') {
      parsedProject = JSON.parse(projectData);
    } else {
      parsedProject = projectData;
    }

    if (!parsedProject.id || !parsedProject.idea) {
      return res.status(400).json({ success: false, error: 'Invalid project format. Must contain id and idea.' });
    }

    // Ensure all required fields exist
    parsedProject.rounds = parsedProject.rounds || [];
    parsedProject.globalDecisions = parsedProject.globalDecisions || [];
    parsedProject.agents = parsedProject.agents || [];
    parsedProject.createdAt = parsedProject.createdAt || Date.now();
    parsedProject.status = parsedProject.status || 'meeting';
    parsedProject.language = parsedProject.language || 'en';
    parsedProject.model = parsedProject.model || 'gemini-flash-lite-latest';

    db.saveProject(parsedProject);
    res.json({ success: true, data: parsedProject });
  } catch (err: any) {
    res.status(400).json({ success: false, error: 'Failed to parse project state: ' + err.message });
  }
});

apiRouter.post('/projects', (req, res) => {
  const { idea, goals, constraints, agents, language, model, uiStyle } = req.body;
  if (!idea) {
    return res.status(400).json({ success: false, error: 'Idea is required' });
  }

  const project: ProjectState = {
    id: uuidv4(),
    idea,
    goals: goals || '',
    constraints: constraints || '',
    status: 'meeting',
    agents: agents || [],
    rounds: [],
    globalDecisions: [],
    createdAt: Date.now(),
    language: language || 'en',
    model: model || 'gemini-flash-lite-latest',
    uiStyle: uiStyle || 'interactive-neon'
  };

  db.saveProject(project);
  res.json({ success: true, data: project });
});

apiRouter.post('/projects/:id/model', (req, res) => {
  const project = db.getProject(req.params.id);
  if (!project) return res.status(404).json({ success: false, error: 'Not found' });

  const { model } = req.body;
  if (!model) {
    return res.status(400).json({ success: false, error: 'Model name is required' });
  }

  project.model = model;
  db.saveProject(project);
  res.json({ success: true, data: project });
});

apiRouter.get('/projects', (req, res) => {
  res.json({ success: true, data: db.listProjects() });
});

apiRouter.get('/projects/:id', (req, res) => {
  const project = db.getProject(req.params.id);
  if (!project) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: project });
});

apiRouter.delete('/projects/:id', (req, res) => {
  const deleted = db.deleteProject(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, message: 'Project removed successfully' });
});

apiRouter.post('/projects/:id/next-round', async (req, res) => {
  try {
    const project = db.getProject(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Not found' });
    
    if (project.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Project meetings are completed.' });
    }

    const { action, feedback } = req.body; // action can dictate if we should 'auto-advance' or 'conclude'
    const customApiKey = (req.body?.apiKey || req.body?.customApiKey || req.headers['x-gemini-api-key']) as string | undefined;

    if (project.rounds.length > 0) {
      const lastRound = project.rounds[project.rounds.length - 1];
      if (typeof feedback === 'string' && feedback.trim() !== '') {
        lastRound.userFeedback = feedback;
      }
      for (const response of lastRound.responses) {
        if (!response.userVote) {
          response.userVote = 'up';
        }
      }
    }

    const updatedProject = await processNextRound(project, action, customApiKey);
    db.saveProject(updatedProject);
    res.json({ success: true, data: updatedProject });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.delete('/projects/:id/decision', (req, res) => {
  const project = db.getProject(req.params.id);
  if (!project) return res.status(404).json({ success: false, error: 'Not found' });

  const { decision } = req.body;
  if (!decision) {
    return res.status(400).json({ success: false, error: 'Decision text is required' });
  }

  // Remove elements from global decisions and round-level locked decisions
  const initialLength = project.globalDecisions.length;
  project.globalDecisions = project.globalDecisions.filter(d => 
    d.trim() !== decision.trim() && !d.includes(decision) && !decision.includes(d)
  );

  project.rounds = project.rounds.map(round => ({
    ...round,
    decisionsLocked: round.decisionsLocked ? round.decisionsLocked.filter(d => 
      d.trim() !== decision.trim() && !d.includes(decision) && !decision.includes(d)
    ) : []
  }));

  db.saveProject(project);
  res.json({ success: true, data: project });
});

apiRouter.post('/projects/:id/export', async (req, res) => {
  try {
    const project = db.getProject(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Not found' });
    
    const customApiKey = (req.body?.apiKey || req.body?.customApiKey || req.headers['x-gemini-api-key']) as string | undefined;
    const exportData = await generateBuilderExport(project, customApiKey);
    res.json({ success: true, data: exportData });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/projects/:id/vote', (req, res) => {
  try {
    const project = db.getProject(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Not found' });

    const { roundNumber, agentId, vote } = req.body;
    if (typeof roundNumber !== 'number' || !agentId) {
      return res.status(400).json({ success: false, error: 'roundNumber and agentId are required' });
    }

    const round = project.rounds.find(r => r.roundNumber === roundNumber);
    if (!round) return res.status(404).json({ success: false, error: 'Round not found' });

    const response = round.responses.find(resp => resp.agentId === agentId);
    if (!response) return res.status(404).json({ success: false, error: 'Agent response not found in this round' });

    response.userVote = (vote === 'up' || vote === 'down') ? vote : null;
    db.saveProject(project);

    res.json({ success: true, data: project });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});
