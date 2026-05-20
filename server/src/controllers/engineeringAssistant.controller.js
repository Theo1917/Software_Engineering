import {
  analyzeEngineeringProject,
  collectEngineeringEvidence,
  findRelatedEngineeringSessions,
  getEngineeringSessionById,
  listEngineeringSessions,
  logEngineeringGap,
  saveEngineeringSession,
  upsertEngineeringMemory,
} from "../services/engineeringAssistant.service.js";

export async function analyzeProjectData(req, res, next) {
  try {
    const bundle = collectEngineeringEvidence({
      question: req.body.question,
      repoUrl: req.body.repoUrl,
      deploymentPlatform: req.body.deploymentPlatform,
      logs: req.body.logs,
      repoManifest: req.body.repoManifest,
      configText: req.body.configText,
      environmentNotes: req.body.environmentNotes,
      screenshotNotes: req.body.screenshotNotes,
      extraNotes: req.body.extraNotes,
      files: req.files || [],
    });

    if (!bundle.combinedText && !bundle.repoUrl && !bundle.combinedFileNames.length) {
      return res.status(400).json({ message: "Please provide logs, repo notes, config files, or an uploaded archive." });
    }

    const analysis = analyzeEngineeringProject(bundle);
    const session = await saveEngineeringSession({
      analysis,
      bundle,
      userId: req.user?.id || null,
    });

    await upsertEngineeringMemory(session, analysis);
    await logEngineeringGap(bundle, analysis);

    const relatedIssues = await findRelatedEngineeringSessions(bundle, analysis, 6);

    return res.status(201).json({
      analysis,
      session,
      relatedIssues,
    });
  } catch (error) {
    return next(error);
  }
}

export async function listProjectSessions(req, res, next) {
  try {
    const { q = "", limit = 8 } = req.query;
    const result = await listEngineeringSessions({
      queryText: q,
      userId: req.user?.id || null,
      limit: Math.min(Number(limit) || 8, 25),
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

export async function getProjectSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await getEngineeringSessionById(id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.json({ session });
  } catch (error) {
    return next(error);
  }
}
