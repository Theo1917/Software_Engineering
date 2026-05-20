import AdmZip from "adm-zip";
import { createHash } from "crypto";
import { pool } from "../config/db.js";

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".log",
  ".md",
  ".json",
  ".yaml",
  ".yml",
  ".env",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".toml",
  ".ini",
  ".cfg",
  ".conf",
  ".dockerfile",
]);

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);
const ZIP_EXTENSIONS = new Set([".zip"]);

function normalizeText(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .trim();
}

function normalizeName(value) {
  return String(value || "").replace(/\\/g, "/").trim().toLowerCase();
}

function getExtension(fileName) {
  const normalized = normalizeName(fileName);
  const lastSegment = normalized.split("/").pop() || normalized;

  if (lastSegment === "dockerfile") {
    return ".dockerfile";
  }

  const dotIndex = lastSegment.lastIndexOf(".");
  return dotIndex >= 0 ? lastSegment.slice(dotIndex) : "";
}

function isTextFile(fileName, mimeType = "") {
  const extension = getExtension(fileName);
  return TEXT_EXTENSIONS.has(extension) || String(mimeType).startsWith("text/");
}

function isImageFile(fileName, mimeType = "") {
  const extension = getExtension(fileName);
  return IMAGE_EXTENSIONS.has(extension) || String(mimeType).startsWith("image/");
}

function isZipFile(fileName, mimeType = "") {
  const extension = getExtension(fileName);
  return ZIP_EXTENSIONS.has(extension) || mimeType === "application/zip";
}

function safePreview(text, maxLength = 260) {
  const compact = normalizeText(text).replace(/\s+/g, " ");
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 1)}…` : compact;
}

function splitKeywords(text) {
  return normalizeText(text)
    .toLowerCase()
    .match(/[a-z0-9_.-]+/g)
    ?.filter((token) => token.length > 1) || [];
}

const ENGINEERING_CONCEPTS = {
  deployment: ["deploy", "release", "production", "build", "runtime", "startup"],
  backend: ["api", "server", "express", "fastapi", "service", "endpoint"],
  frontend: ["client", "react", "vite", "next", "browser", "ui"],
  database: ["postgres", "postgresql", "mongo", "mongodb", "db", "database_url", "connection"],
  env: ["environment", "env", "secret", "variable", "configuration"],
  cors: ["origin", "preflight", "credentials", "cross-origin"],
  docker: ["container", "dockerfile", "compose", "image", "entrypoint"],
  vercel: ["edge", "functions", "vercel.json", "rewrite"],
  render: ["render.yaml", "healthcheck", "web service"],
  railway: ["railway.json", "nixpacks"],
  crash: ["offline", "down", "failed", "exception", "error", "stacktrace"],
};

function expandSemanticTerms(text) {
  const tokens = splitKeywords(text);
  const expanded = new Set(tokens);

  Object.entries(ENGINEERING_CONCEPTS).forEach(([concept, synonyms]) => {
    if (tokens.includes(concept) || synonyms.some((term) => tokens.includes(term))) {
      expanded.add(concept);
      synonyms.forEach((term) => expanded.add(term));
    }
  });

  return [...expanded];
}

function semanticScore(query, candidate) {
  const queryTerms = expandSemanticTerms(query);
  const candidateTerms = new Set(expandSemanticTerms(candidate));

  if (!queryTerms.length || !candidateTerms.size) {
    return 0;
  }

  let score = 0;
  queryTerms.forEach((term) => {
    if (candidateTerms.has(term)) {
      score += term.length >= 7 ? 3 : 2;
    }
  });

  return score;
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function collectMatches(text, regexList) {
  const lines = normalizeText(text).split("\n");
  const snippets = [];

  for (const regex of regexList) {
    const line = lines.find((entry) => regex.test(entry));
    if (line) {
      snippets.push(safePreview(line));
    }
  }

  return uniq(snippets).slice(0, 4);
}

function scoreOverlap(sourceText, targetText) {
  const sourceTokens = new Set(splitKeywords(sourceText));
  if (!sourceTokens.size) {
    return 0;
  }

  let score = 0;
  for (const token of splitKeywords(targetText)) {
    if (sourceTokens.has(token)) {
      score += token.length > 5 ? 2 : 1;
    }
  }

  return score;
}

function digestSignature(input) {
  return createHash("sha1").update(normalizeText(input)).digest("hex");
}

function extractZipArchive(fileName, buffer) {
  const zip = new AdmZip(buffer);
  const extracted = [];

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) {
      continue;
    }

    const entryName = normalizeName(entry.entryName);
    const extension = getExtension(entryName);
    const supported = TEXT_EXTENSIONS.has(extension) || [
      "package.json",
      "vercel.json",
      "render.yaml",
      "render.yml",
      "dockerfile",
      "docker-compose.yml",
      "docker-compose.yaml",
      "requirements.txt",
      "pyproject.toml",
      "tsconfig.json",
      "next.config.js",
      "vite.config.js",
      "vite.config.ts",
    ].some((pattern) => entryName.endsWith(pattern));

    if (!supported) {
      continue;
    }

    const content = normalizeText(entry.getData().toString("utf8"));
    if (!content) {
      continue;
    }

    extracted.push({
      source: fileName,
      path: entryName,
      content,
      preview: safePreview(content),
    });
  }

  return extracted;
}

export function collectEngineeringEvidence({
  question = "",
  repoUrl = "",
  deploymentPlatform = "",
  logs = "",
  repoManifest = "",
  configText = "",
  environmentNotes = "",
  screenshotNotes = "",
  extraNotes = "",
  files = [],
}) {
  const uploadedFiles = [];
  const uploadedImages = [];
  const extractedFiles = [];

  for (const file of files || []) {
    const originalName = normalizeName(file.originalname || file.name || "attachment");
    const mimeType = file.mimetype || file.type || "";
    const buffer = file.buffer || Buffer.from(file.content || "");

    if (isZipFile(originalName, mimeType)) {
      extractedFiles.push(...extractZipArchive(originalName, buffer));
      uploadedFiles.push({ name: originalName, kind: "zip" });
      continue;
    }

    if (isImageFile(originalName, mimeType)) {
      uploadedImages.push({
        name: originalName,
        type: mimeType,
        size: file.size || buffer.length || 0,
      });
      uploadedFiles.push({ name: originalName, kind: "image" });
      continue;
    }

    if (isTextFile(originalName, mimeType)) {
      const content = normalizeText(buffer.toString("utf8"));
      if (content) {
        extractedFiles.push({
          source: originalName,
          path: originalName,
          content,
          preview: safePreview(content),
        });
      }
      uploadedFiles.push({ name: originalName, kind: "text" });
      continue;
    }

    uploadedFiles.push({ name: originalName, kind: mimeType || "file" });
  }

  const textInputs = [
    question,
    logs,
    repoManifest,
    configText,
    environmentNotes,
    screenshotNotes,
    extraNotes,
    extractedFiles.map((file) => `${file.path}\n${file.content}`).join("\n\n"),
  ]
    .map(normalizeText)
    .filter(Boolean);

  const combinedText = textInputs.join("\n\n");
  const combinedFileNames = uniq([
    ...uploadedFiles.map((file) => file.name),
    ...extractedFiles.map((file) => file.path),
  ]);

  return {
    question: normalizeText(question),
    repoUrl: normalizeText(repoUrl),
    deploymentPlatform: normalizeText(deploymentPlatform),
    logs: normalizeText(logs),
    repoManifest: normalizeText(repoManifest),
    configText: normalizeText(configText),
    environmentNotes: normalizeText(environmentNotes),
    screenshotNotes: normalizeText(screenshotNotes),
    extraNotes: normalizeText(extraNotes),
    uploadedFiles,
    uploadedImages,
    extractedFiles,
    combinedText,
    combinedFileNames,
  };
}

function detectTechnologySet(bundle) {
  const text = `${bundle.combinedText}\n${bundle.combinedFileNames.join("\n")}`.toLowerCase();
  const technologies = [];

  const pushTechnology = (name, type, evidenceRegexes) => {
    if (evidenceRegexes.some((regex) => regex.test(text))) {
      technologies.push({
        name,
        type,
        evidence: collectMatches(bundle.combinedText, evidenceRegexes),
      });
    }
  };

  pushTechnology("React", "frontend", [/\breact\b/i, /jsx/i, /vite/i]);
  pushTechnology("Next.js", "frontend", [/\bnext\.js\b/i, /next\.config/i, /hydration/i]);
  pushTechnology("Vite", "build", [/\bvite\b/i, /vite\.config/i, /vite build/i]);
  pushTechnology("Express", "backend", [/\bexpress\b/i, /server\.js/i, /app\.use\(/i]);
  pushTechnology("FastAPI", "backend", [/\bfastapi\b/i, /uvicorn/i]);
  pushTechnology("PostgreSQL", "database", [/\bpostgres\b/i, /\bpg\b/i, /database_url/i, /schema\.sql/i]);
  pushTechnology("MongoDB", "database", [/\bmongodb\b/i, /mongoose/i]);
  pushTechnology("Docker", "deployment", [/dockerfile/i, /docker-compose/i, /\bdocker\b/i]);
  pushTechnology("Vercel", "deployment", [/vercel\.json/i, /vercel/i]);
  pushTechnology("Render", "deployment", [/render\.yaml/i, /render\.yml/i, /render/i]);
  pushTechnology("Railway", "deployment", [/railway/i]);
  pushTechnology("JWT Auth", "auth", [/\bjwt\b/i, /bearer/i, /auth/i]);

  return uniq(technologies.map((item) => JSON.stringify(item))).map((item) => JSON.parse(item));
}

function detectDeploymentPlatform(bundle) {
  const text = `${bundle.deploymentPlatform}\n${bundle.combinedText}\n${bundle.combinedFileNames.join("\n")}`.toLowerCase();

  if (/vercel/.test(text)) {
    return "Vercel";
  }

  if (/render/.test(text)) {
    return "Render";
  }

  if (/railway/.test(text)) {
    return "Railway";
  }

  if (/docker/.test(text)) {
    return "Docker";
  }

  return bundle.deploymentPlatform || "Unknown";
}

function detectArchitecture(technologies) {
  const hasFrontend = technologies.some((item) => item.type === "frontend");
  const hasBackend = technologies.some((item) => item.type === "backend");
  const hasDatabase = technologies.some((item) => item.type === "database");

  if (hasFrontend && hasBackend) {
    return {
      style: "split-frontend-backend",
      description: "The project is structured as a separate client/server application.",
      layers: ["frontend", "backend", hasDatabase ? "database" : null].filter(Boolean),
    };
  }

  if (hasBackend && !hasFrontend) {
    return {
      style: "backend-service",
      description: "The repository appears to be backend-centric with API and infrastructure code.",
      layers: ["backend", hasDatabase ? "database" : null].filter(Boolean),
    };
  }

  return {
    style: "frontend-app",
    description: "The repository appears to be frontend-centric with shared configuration and routing.",
    layers: ["frontend", hasDatabase ? "database" : null].filter(Boolean),
  };
}

const ISSUE_PATTERNS = [
  {
    code: "PORT_CONFLICT",
    label: "Port conflict",
    severity: 95,
    symptom: "The app exits because the runtime port is already in use.",
    rootCause: "Another process is already bound to the deployment port, or the app is being started twice.",
    explanation: "Deployment platforms only route traffic to one healthy process on the expected port.",
    match: [/EADDRINUSE/i, /address already in use/i],
    fixes: [
      "Make the server read the platform port from PORT and stop hard-coding 3000 or 5000.",
      "Ensure only one start command runs in production.",
    ],
  },
  {
    code: "MISSING_DATABASE_URL",
    label: "Missing database connection string",
    severity: 98,
    symptom: "The backend crashes during boot or the API stays offline.",
    rootCause: "The database connection string is missing or invalid, so the backend cannot initialize PostgreSQL.",
    explanation: "The server starts, reads env vars, and immediately fails when it cannot open the database pool.",
    match: [/DATABASE_URL/i, /connection string/i, /could not connect/i, /password authentication failed/i, /no pg_hba/i],
    fixes: [
      "Add DATABASE_URL to the production environment and verify the host, user, password, and database name.",
      "Confirm the backend waits for the database before serving requests.",
    ],
  },
  {
    code: "DATABASE_CONNECTION_FAILURE",
    label: "Database connectivity failure",
    severity: 93,
    symptom: "The app cannot reach PostgreSQL or the API fails on first query.",
    rootCause: "The backend cannot reach the database network endpoint.",
    explanation: "Even with a valid URL, the deployment can fail if the host is blocked, the port is wrong, or the service is asleep.",
    match: [/ECONNREFUSED.*5432/i, /connect ECONNREFUSED/i, /timeout.*5432/i, /server closed the connection/i],
    fixes: [
      "Check the database host/port and whether the service allows external connections.",
      "Verify SSL requirements and network access rules on the managed database.",
    ],
  },
  {
    code: "CORS_MISCONFIGURATION",
    label: "CORS mismatch",
    severity: 88,
    symptom: "Frontend requests are blocked even though the API is reachable.",
    rootCause: "The browser origin is not allowed by the backend CORS configuration.",
    explanation: "The browser enforces cross-origin rules, so the server must explicitly allow the deployed frontend origin.",
    match: [/CORS/i, /blocked by cors policy/i, /origin not allowed/i],
    fixes: [
      "Add the deployed frontend origin to CLIENT_ORIGIN.",
      "Make sure credentials and allowed origins match the browser request.",
    ],
  },
  {
    code: "BUILD_COMMAND_MISMATCH",
    label: "Build command mismatch",
    severity: 90,
    symptom: "The deployment fails before the app starts.",
    rootCause: "The platform is running the wrong build command or output path.",
    explanation: "Production deploys need a build step that matches the framework and emits the correct output directory.",
    match: [/missing script: build/i, /command .* not found/i, /could not determine executable to run/i, /build failed/i],
    fixes: [
      "Use the production build command for the detected framework.",
      "Confirm the output directory and start command match the platform settings.",
    ],
  },
  {
    code: "IMPORT_OR_DEPENDENCY_ERROR",
    label: "Import or dependency issue",
    severity: 84,
    symptom: "The build stops on a missing module or unresolved import.",
    rootCause: "The repository is missing a dependency, or the import path/case does not match the file system.",
    explanation: "Bundlers resolve imports at build time, so one bad path or missing package prevents deploys.",
    match: [/cannot find module/i, /failed to resolve import/i, /module not found/i, /does not provide an export named/i],
    fixes: [
      "Install the missing package and verify it is listed in package.json.",
      "Check relative paths, file casing, and named exports.",
    ],
  },
  {
    code: "SYNTAX_OR_TRANSPILE_ERROR",
    label: "Syntax or transpilation error",
    severity: 87,
    symptom: "The build fails while parsing source files.",
    rootCause: "The source contains a syntax error or unsupported language feature for the current build pipeline.",
    explanation: "The compiler cannot emit the bundle if one file has broken JSX, TypeScript, or JavaScript syntax.",
    match: [/syntaxerror/i, /unexpected token/i, /failed to compile/i, /unterminated/i],
    fixes: [
      "Fix the reported file and line before checking anything else.",
      "Run a local build to catch the parser error earlier in the workflow.",
    ],
  },
  {
    code: "DEV_SCRIPT_IN_PROD",
    label: "Development script used in production",
    severity: 86,
    symptom: "The app deploys but crashes or never becomes healthy.",
    rootCause: "The deployment is trying to run a development-only command instead of the production build/start flow.",
    explanation: "Managed platforms need a compiled app and a persistent runtime entrypoint, not a watcher or dev server.",
    match: [/npm run dev/i, /nodemon/i, /vite/i, /next dev/i],
    fixes: [
      "Use build + start for production, not dev.",
      "Check that the platform start command points at the compiled server entrypoint.",
    ],
  },
  {
    code: "SSR_BROWSER_MISMATCH",
    label: "Server/client runtime mismatch",
    severity: 82,
    symptom: "The app works locally but fails after render or hydration.",
    rootCause: "Client-only APIs are being executed on the server, or the server output differs from the browser render.",
    explanation: "SSR frameworks need code that guards browser globals and produces consistent markup on both sides.",
    match: [/window is not defined/i, /document is not defined/i, /hydration failed/i],
    fixes: [
      "Move browser-only code into effects or guarded branches.",
      "Make server and client render the same initial markup.",
    ],
  },
  {
    code: "MISSING_ENV_VARS",
    label: "Missing environment variables",
    severity: 92,
    symptom: "A specific feature or integration fails after deploy.",
    rootCause: "One or more required environment variables are absent in production.",
    explanation: "Local dotenv files do not automatically exist in cloud deployments, so every secret must be configured explicitly.",
    match: [/process\.env\.[A-Z0-9_]+/i, /missing environment/i, /undefined/i],
    fixes: [
      "List every env var used by the repo and add it to the deployment platform.",
      "Document which variables are required for build-time versus runtime.",
    ],
  },
  {
    code: "DOCKER_RUNTIME_ISSUE",
    label: "Docker runtime issue",
    severity: 89,
    symptom: "The container builds but the service never becomes healthy.",
    rootCause: "The Dockerfile does not expose the right port, start the correct command, or copy the app into the image properly.",
    explanation: "Containerized deployments rely on the container listening on the expected port and keeping the process alive.",
    match: [/dockerfile/i, /expose/i, /cmd/i, /entrypoint/i, /container/i],
    fixes: [
      "Check the Dockerfile CMD and EXPOSE values against the platform port.",
      "Verify the final image contains the built files and runtime dependencies.",
    ],
  },
];

function scorePattern(pattern, text) {
  const matches = pattern.match.flatMap((regex) => collectMatches(text, [regex]));
  return matches.length ? pattern.severity + matches.length * 2 : 0;
}

function buildDetectedSignals(bundle, understanding) {
  const evidenceText = bundle.combinedText;
  const matches = ISSUE_PATTERNS.map((pattern) => {
    const score = scorePattern(pattern, evidenceText);
    if (!score) {
      return null;
    }

    return {
      code: pattern.code,
      label: pattern.label,
      severity: score,
      symptom: pattern.symptom,
      rootCause: pattern.rootCause,
      explanation: pattern.explanation,
      evidence: collectMatches(evidenceText, pattern.match),
      fixes: pattern.fixes,
    };
  }).filter(Boolean);

  if (!matches.length && understanding.technologies.length > 0) {
    matches.push({
      code: "UNKNOWN",
      label: "Needs more context",
      severity: 40,
      symptom: "The uploaded data is too sparse to identify a single failure mode.",
      rootCause: "The assistant needs logs, configs, or repository files to narrow the problem.",
      explanation: "Context-aware debugging works best when it can correlate the stack, deployment target, and failure output.",
      evidence: [],
      fixes: [
        "Upload the deployment logs and the relevant config files.",
        "Include repo structure or a zip archive so the assistant can inspect the architecture.",
      ],
    });
  }

  return matches.sort((a, b) => b.severity - a.severity);
}

function buildRootCause(bundle, understanding, signals) {
  const primary = signals[0] || null;
  const strongestTech = understanding.technologies[0] || null;
  const hasBackend = understanding.architecture.layers.includes("backend");
  const hasDatabase = understanding.architecture.layers.includes("database");

  if (!primary) {
    return {
      code: "UNKNOWN",
      label: "Unknown root cause",
      visibleSymptom: "The uploaded material does not show a specific failure pattern.",
      actualCause: "More logs, repository files, or config details are needed.",
      confidence: 30,
      evidence: [],
      whyItHappened: "The system can identify the architecture but cannot safely guess the failure without diagnostics.",
      layers: understanding.architecture.layers,
    };
  }

  let actualCause = primary.rootCause;
  let visibleSymptom = primary.symptom;
  let whyItHappened = primary.explanation;

  if (primary.code === "MISSING_DATABASE_URL" && hasBackend && hasDatabase) {
    actualCause = "The backend initializes PostgreSQL during startup, but the production environment does not provide a valid DATABASE_URL, so the process crashes before the API can answer requests.";
    visibleSymptom = "The app looks offline or the API never responds after deploy.";
    whyItHappened = "The repo uses a real database layer, so the server cannot boot until the deployment platform has the database credentials and the app reads them from environment variables.";
  }

  if (primary.code === "DEV_SCRIPT_IN_PROD" && bundle.deploymentPlatform) {
    actualCause = `The ${bundle.deploymentPlatform} deployment is launching a development-only command instead of the production build/start flow.`;
    visibleSymptom = "The deployment never becomes healthy or crashes after startup.";
  }

  if (primary.code === "BUILD_COMMAND_MISMATCH" && strongestTech?.name) {
    whyItHappened = `The deployment command does not match the ${strongestTech.name} toolchain detected in the repository.`;
  }

  return {
    code: primary.code,
    label: primary.label,
    visibleSymptom,
    actualCause,
    confidence: Math.min(98, Math.max(primary.severity, 45)),
    evidence: primary.evidence,
    whyItHappened,
    layers: understanding.architecture.layers,
  };
}

function buildFixPlan(rootCause, understanding, bundle) {
  const fixes = [];
  const platform = bundle.deploymentPlatform || understanding.deploymentPlatform || "your deployment platform";

  if (rootCause.code === "MISSING_DATABASE_URL") {
    fixes.push(
      {
        title: "Add production database env vars",
        why: "The backend cannot initialize PostgreSQL without a valid connection string.",
        action: "Set DATABASE_URL, confirm SSL requirements, and redeploy.",
      },
      {
        title: "Fail fast with a clear health check",
        why: "It is easier to debug a visible startup failure than a silent crash.",
        action: "Log the missing configuration early and expose a health endpoint.",
      }
    );
  } else if (rootCause.code === "DATABASE_CONNECTION_FAILURE") {
    fixes.push(
      {
        title: "Verify network access to PostgreSQL",
        why: "The database host may block external traffic or require SSL.",
        action: "Check the host, port, firewall rules, and managed database connection policy.",
      },
      {
        title: "Confirm the backend uses the deployed connection string",
        why: "Local .env values often differ from production credentials.",
        action: "Move the correct DATABASE_URL into the platform environment settings.",
      }
    );
  } else if (rootCause.code === "PORT_CONFLICT") {
    fixes.push(
      {
        title: "Read the platform port dynamically",
        why: "Managed hosts inject a PORT value that should override local defaults.",
        action: "Use process.env.PORT and avoid hard-coded ports in production.",
      },
      {
        title: "Run only one server process",
        why: "Two listeners on the same port will immediately fail.",
        action: "Check scripts, Docker CMD, and process managers for duplicate starts.",
      }
    );
  } else if (rootCause.code === "CORS_MISCONFIGURATION") {
    fixes.push(
      {
        title: "Allow the deployed frontend origin",
        why: "The browser blocks cross-origin requests until the API permits them.",
        action: "Add the live frontend URL to CLIENT_ORIGIN.",
      },
      {
        title: "Keep credentials and origins aligned",
        why: "CORS headers must match how the client sends requests.",
        action: "Re-test with the exact production URL and cookies/token mode.",
      }
    );
  } else if (rootCause.code === "BUILD_COMMAND_MISMATCH") {
    fixes.push(
      {
        title: "Use the correct build step for the framework",
        why: "The platform must compile the app before it can serve traffic.",
        action: `Set the build command for ${platform} to the repo's production build script.`,
      },
      {
        title: "Verify output and start commands",
        why: "A correct build is not enough if the service starts the wrong file.",
        action: "Match the output directory and server entrypoint to the framework.",
      }
    );
  } else if (rootCause.code === "IMPORT_OR_DEPENDENCY_ERROR") {
    fixes.push(
      {
        title: "Install or declare the missing dependency",
        why: "The bundler cannot resolve a package that is absent from package.json.",
        action: "Add the package, reinstall, and rebuild locally.",
      },
      {
        title: "Check file names and export types",
        why: "Import casing and named exports are common deployment-only failures on Linux.",
        action: "Compare the import path with the exact file name and exported symbol.",
      }
    );
  } else if (rootCause.code === "SYNTAX_OR_TRANSPILE_ERROR") {
    fixes.push(
      {
        title: "Fix the parser error at the reported line",
        why: "Syntax errors block the compiler before deploy.",
        action: "Open the first reported file and repair the exact broken expression or tag.",
      },
      {
        title: "Run the build locally first",
        why: "Local builds surface the same parsing issues without waiting for deploy.",
        action: "Use the production build command before pushing changes.",
      }
    );
  } else if (rootCause.code === "DEV_SCRIPT_IN_PROD") {
    fixes.push(
      {
        title: "Switch to build + start",
        why: "Production should not run a watcher or dev server.",
        action: `Update ${platform} to use the production build and runtime start command.`,
      },
      {
        title: "Expose the expected port",
        why: "A production server must listen on the host port to become healthy.",
        action: "Make the runtime bind to process.env.PORT.",
      }
    );
  } else if (rootCause.code === "SSR_BROWSER_MISMATCH") {
    fixes.push(
      {
        title: "Move browser-only code behind client guards",
        why: "Server rendering cannot access window or document.",
        action: "Wrap browser APIs in useEffect or runtime checks.",
      },
      {
        title: "Make server and client markup consistent",
        why: "Hydration fails when the first render differs between environments.",
        action: "Keep the initial render deterministic and data-driven.",
      }
    );
  } else if (rootCause.code === "DOCKER_RUNTIME_ISSUE") {
    fixes.push(
      {
        title: "Align the Dockerfile with the app port",
        why: "The container must listen on the platform port.",
        action: "Verify EXPOSE and CMD match the runtime listener.",
      },
      {
        title: "Copy the built artifacts into the image",
        why: "The container should contain the compiled frontend/backend assets.",
        action: "Re-check the multi-stage build and final copy step.",
      }
    );
  } else if (rootCause.code === "MISSING_ENV_VARS") {
    fixes.push(
      {
        title: "Document all runtime env vars",
        why: "Production needs every required secret and URL configured explicitly.",
        action: "List the env vars referenced by process.env and add them to the deployment platform.",
      },
      {
        title: "Separate build-time and runtime config",
        why: "Some values are needed during build while others are only needed at runtime.",
        action: "Split the configuration into platform build and runtime settings.",
      }
    );
  } else {
    fixes.push(
      {
        title: "Add the missing logs and config files",
        why: "A fuller bundle gives the assistant enough context to identify the failure path.",
        action: "Upload the deployment logs, repo manifest, and platform config files together.",
      },
      {
        title: "Capture the affected environment",
        why: "The same code can fail differently on Render, Vercel, Railway, or Docker.",
        action: "Include the platform name and the exact build/start commands.",
      }
    );
  }

  const stackSummary = understanding.technologies.length
    ? understanding.technologies.map((item) => item.name).join(" + ")
    : "Unknown stack";

  return fixes.map((fix) => ({
    ...fix,
    context: `${stackSummary}${bundle.deploymentPlatform ? ` on ${bundle.deploymentPlatform}` : ""}`,
  }));
}

function buildGeneratedConfigs(rootCause, understanding, bundle) {
  const platform = understanding.deploymentPlatform;
  const hasBackend = understanding.architecture.layers.includes("backend");
  const hasFrontend = understanding.architecture.layers.includes("frontend");
  const hasDocker = understanding.technologies.some((item) => item.name === "Docker");
  const hasVite = understanding.technologies.some((item) => item.name === "Vite");
  const hasExpress = understanding.technologies.some((item) => item.name === "Express");
  const hasDatabase = understanding.technologies.some((item) => item.name === "PostgreSQL");

  const snippets = [];

  if (platform === "Vercel" && hasFrontend) {
    snippets.push({
      type: "vercel.json",
      rationale: "Ensures frontend routes and API proxying are resolved consistently in Vercel deployments.",
      content: JSON.stringify(
        {
          rewrites: [
            { source: "/api/:path*", destination: "/api/:path*" },
            { source: "/(.*)", destination: "/" },
          ],
        },
        null,
        2
      ),
    });
  }

  if (platform === "Render" && hasBackend) {
    snippets.push({
      type: "render.yaml",
      rationale: "Defines a stable build/start flow and injects critical environment variables.",
      content: [
        "services:",
        "  - type: web",
        "    name: acf-backend",
        "    env: node",
        "    rootDir: server",
        "    buildCommand: npm install",
        "    startCommand: npm start",
        "    envVars:",
        "      - key: NODE_ENV",
        "        value: production",
        "      - key: PORT",
        "        value: 5000",
        "      - key: CLIENT_ORIGIN",
        "        sync: false",
        hasDatabase ? "      - key: DATABASE_URL\n        sync: false" : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  if (platform === "Railway" && hasBackend) {
    snippets.push({
      type: "railway.json",
      rationale: "Encodes the production start command and health check behavior for Railway.",
      content: JSON.stringify(
        {
          build: {
            builder: "NIXPACKS",
          },
          deploy: {
            startCommand: "npm start",
            healthcheckPath: "/api/health",
            healthcheckTimeout: 120,
          },
        },
        null,
        2
      ),
    });
  }

  if (hasDocker || rootCause.code === "DOCKER_RUNTIME_ISSUE") {
    const runCommand = hasBackend ? "npm --prefix server start" : "npm start";
    snippets.push({
      type: "Dockerfile",
      rationale: "Provides a production-ready container entrypoint that honors the platform PORT.",
      content: [
        "FROM node:20-alpine",
        "WORKDIR /app",
        "COPY package*.json ./",
        "COPY server/package*.json ./server/",
        "RUN npm install && npm --prefix server install",
        "COPY . .",
        hasVite ? "RUN npm --prefix client install && npm --prefix client run build" : "",
        "ENV NODE_ENV=production",
        "ENV PORT=5000",
        "EXPOSE 5000",
        `CMD [\"sh\", \"-c\", \"${runCommand}\"]`,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  if (hasExpress) {
    snippets.push({
      type: ".env.example",
      rationale: "Documents runtime configuration so deployment env vars are not missed.",
      content: [
        "NODE_ENV=production",
        "PORT=5000",
        "CLIENT_ORIGIN=https://your-frontend-domain",
        hasDatabase ? "DATABASE_URL=postgres://username:password@host:5432/dbname" : "",
        "JWT_SECRET=replace-with-secure-secret",
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  if (hasVite && hasFrontend) {
    snippets.push({
      type: "frontend.env.example",
      rationale: "Keeps frontend API wiring explicit for build-time environment values.",
      content: [
        "VITE_API_BASE_URL=https://your-backend-domain/api",
      ].join("\n"),
    });
  }

  return snippets;
}

function buildExplanation(rootCause, understanding, bundle, fixes) {
  return [
    {
      title: "Why the visible error appears",
      body: rootCause.visibleSymptom,
    },
    {
      title: "Why the system failed",
      body: rootCause.actualCause,
    },
    {
      title: "What the assistant inferred about the project",
      body: `${understanding.summary} ${bundle.repoUrl ? `Repository: ${bundle.repoUrl}.` : ""}`.trim(),
    },
    {
      title: "How to correct it",
      body: fixes.map((fix) => `${fix.title}: ${fix.action}`).join(" "),
    },
  ];
}

function buildSummary(rootCause, understanding) {
  const stack = understanding.technologies.map((item) => item.name).slice(0, 4).join(", ") || "unknown stack";
  return `Detected ${stack} and identified ${rootCause.label.toLowerCase()} as the leading failure mode.`;
}

function buildConfidence(technologies, signals) {
  const base = technologies.length * 7 + signals.length * 10;
  return Math.min(98, Math.max(35, base || 35));
}

export function analyzeEngineeringProject(bundle) {
  const technologies = detectTechnologySet(bundle);
  const deploymentPlatform = detectDeploymentPlatform(bundle);
  const architecture = detectArchitecture(technologies);
  const understanding = { technologies, architecture, deploymentPlatform, summary: "" };
  const signals = buildDetectedSignals(bundle, understanding);
  const rootCause = buildRootCause(bundle, understanding, signals);
  const fixPlan = buildFixPlan(rootCause, understanding, bundle);
  const generatedConfigs = buildGeneratedConfigs(rootCause, understanding, bundle);
  understanding.summary = buildSummary(rootCause, understanding);
  const explanation = buildExplanation(rootCause, understanding, bundle, fixPlan);

  const envVars = uniq(
    [bundle.combinedText.match(/process\.env\.([A-Z0-9_]+)/g), bundle.combinedText.match(/\b[A-Z][A-Z0-9_]{5,}\b/g)]
      .flat()
      .filter(Boolean)
      .map((item) => item.replace(/^process\.env\./, ""))
  ).filter((item) => /[_A-Z]/.test(item));

  const configFiles = bundle.extractedFiles
    .filter((file) => /package\.json|vercel\.json|render\.(ya?ml)|dockerfile|compose|requirements\.txt|pyproject\.toml|tsconfig\.json|vite\.config|next\.config/i.test(file.path))
    .map((file) => ({
      path: file.path,
      preview: file.preview,
    }));

  const analysisTitle = bundle.question
    ? `Debugging: ${safePreview(bundle.question, 72)}`
    : `Debugging: ${deploymentPlatform} project analysis`;

  return {
    title: analysisTitle,
    summary: understanding.summary,
    confidence: buildConfidence(technologies, signals),
    projectUnderstanding: {
      deploymentPlatform,
      architecture,
      technologies,
      envVars,
      configFiles,
      screenshotNotes: bundle.screenshotNotes,
      uploadedFiles: bundle.uploadedFiles,
      uploadedImages: bundle.uploadedImages,
      repoUrl: bundle.repoUrl,
    },
    deploymentAnalysis: {
      platform: deploymentPlatform,
      signals,
      visibleIssues: signals.map((signal) => signal.symptom),
    },
    rootCause,
    fixPlan,
    generatedConfigs,
    explanation,
    relatedKeywords: uniq([
      ...splitKeywords(bundle.question),
      ...splitKeywords(bundle.logs),
      ...splitKeywords(bundle.repoManifest),
      ...splitKeywords(bundle.configText),
    ]).slice(0, 24),
  };
}

export async function saveEngineeringSession({ analysis, bundle, userId = null }) {
  const title = analysis.title || "Engineering analysis";
  const sessionSignature = digestSignature(
    [
      analysis.rootCause.code,
      analysis.projectUnderstanding.deploymentPlatform,
      analysis.projectUnderstanding.technologies.map((item) => item.name).join("|"),
      bundle.repoUrl,
      bundle.question,
      bundle.logs,
    ].join("::")
  );

  const result = await pool.query(
    `INSERT INTO engineering_sessions (
       user_id,
       title,
       query_text,
       deployment_platform,
       repo_url,
       logs_text,
       project_manifest,
       config_text,
       environment_notes,
       screenshot_notes,
       extracted_files,
       detected_stack,
       detected_signals,
       root_cause,
       fix_plan,
       explanation,
       summary,
       session_signature
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb, $17, $18)
     RETURNING *`,
    [
      userId,
      title,
      bundle.question,
      analysis.projectUnderstanding.deploymentPlatform,
      bundle.repoUrl || null,
      bundle.logs || null,
      bundle.repoManifest || null,
      bundle.configText || null,
      bundle.environmentNotes || null,
      bundle.screenshotNotes || null,
      JSON.stringify(bundle.extractedFiles),
      JSON.stringify(analysis.projectUnderstanding),
      JSON.stringify(analysis.deploymentAnalysis.signals),
      JSON.stringify(analysis.rootCause),
      JSON.stringify(analysis.fixPlan),
      JSON.stringify(analysis.explanation),
      analysis.summary,
      sessionSignature,
    ]
  );

  return result.rows[0];
}

export async function upsertEngineeringMemory(session, analysis) {
  const signature = digestSignature(
    [
      analysis.rootCause.code,
      analysis.projectUnderstanding.deploymentPlatform,
      analysis.projectUnderstanding.technologies.map((item) => item.name).join("|"),
    ].join("::")
  );

  const stackSignature = analysis.projectUnderstanding.technologies.map((item) => item.name).join(" + ") || "Unknown stack";
  const rootCause = analysis.rootCause.actualCause || analysis.rootCause.visibleSymptom;
  const fixSummary = analysis.fixPlan.map((fix) => fix.action).slice(0, 2).join(" ");

  await pool.query(
    `INSERT INTO engineering_memory (
       signature,
       issue_type,
       stack_signature,
       root_cause,
       fix_summary,
       example_session_id,
       occurrence_count,
       last_seen_at,
       updated_at
     ) VALUES ($1, $2, $3, $4, $5, $6, 1, NOW(), NOW())
     ON CONFLICT (signature) DO UPDATE SET
       issue_type = EXCLUDED.issue_type,
       stack_signature = EXCLUDED.stack_signature,
       root_cause = EXCLUDED.root_cause,
       fix_summary = EXCLUDED.fix_summary,
       example_session_id = EXCLUDED.example_session_id,
       occurrence_count = engineering_memory.occurrence_count + 1,
       last_seen_at = NOW(),
       updated_at = NOW()`,
    [signature, analysis.rootCause.label, stackSignature, rootCause, fixSummary, session.id]
  );
}

export async function logEngineeringGap(bundle, analysis) {
  if (analysis.rootCause.confidence >= 60) {
    return;
  }

  const queryText = bundle.question || analysis.rootCause.visibleSymptom || analysis.summary;
  const normalizedQuery = normalizeText(queryText).toLowerCase().replace(/\s+/g, " ").slice(0, 255);
  if (!normalizedQuery) {
    return;
  }

  await pool.query(
    `INSERT INTO kb_search_gaps (query_text, normalized_query, source, result_count, occurrence_count, status, last_seen_at)
     VALUES ($1, $2, 'ENGINEERING_ASSISTANT', 0, 1, 'OPEN', NOW())
     ON CONFLICT (normalized_query, source) DO UPDATE SET
       query_text = EXCLUDED.query_text,
       result_count = LEAST(kb_search_gaps.result_count, EXCLUDED.result_count),
       occurrence_count = kb_search_gaps.occurrence_count + 1,
       status = 'OPEN',
       last_seen_at = NOW()`,
    [queryText, normalizedQuery]
  );
}

export async function findRelatedEngineeringSessions(bundle, analysis, limit = 5) {
  const result = await pool.query(
    `SELECT id, title, query_text, summary, root_cause, detected_stack, deployment_platform, created_at
     FROM engineering_sessions
     ORDER BY created_at DESC
     LIMIT 40`
  );

  const searchText = [
    bundle.question,
    bundle.logs,
    bundle.repoManifest,
    bundle.configText,
    analysis.rootCause.label,
    analysis.rootCause.actualCause,
    analysis.projectUnderstanding.technologies.map((item) => item.name).join(" "),
    analysis.projectUnderstanding.deploymentPlatform,
  ].join(" ");

  return result.rows
    .map((session) => {
      const sessionText = [
        session.title,
        session.query_text,
        session.summary,
        session.root_cause ? JSON.stringify(session.root_cause) : "",
        session.detected_stack ? JSON.stringify(session.detected_stack) : "",
      ].join(" ");

      const tokenScore = scoreOverlap(searchText, sessionText);
      const issueBoost = session.root_cause?.code && session.root_cause.code === analysis.rootCause.code ? 16 : 0;
      const platformBoost = session.deployment_platform === analysis.projectUnderstanding.deploymentPlatform ? 6 : 0;

      return {
        id: session.id,
        title: session.title,
        summary: session.summary,
        createdAt: session.created_at,
        score: tokenScore + issueBoost + platformBoost,
        rootCause: session.root_cause,
        deploymentPlatform: session.deployment_platform,
      };
    })
    .filter((session) => session.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function listEngineeringSessions({ queryText = "", userId = null, limit = 8 }) {
  const sessionsResult = await pool.query(
    `SELECT id, user_id, title, query_text, deployment_platform, summary, root_cause, detected_stack, fix_plan, created_at
     FROM engineering_sessions
     ${userId ? "WHERE user_id = $1" : ""}
     ORDER BY created_at DESC
     LIMIT ${userId ? "$2" : "$1"}`,
    userId ? [userId, limit] : [limit]
  );

  const memoryResult = await pool.query(
    `SELECT id, issue_type, stack_signature, root_cause, fix_summary, occurrence_count, last_seen_at, updated_at
     FROM engineering_memory
     ORDER BY occurrence_count DESC, last_seen_at DESC
     LIMIT $1`,
    [limit]
  );

  const query = normalizeText(queryText).toLowerCase();
  const filteredSessions = query
    ? sessionsResult.rows
        .map((session) => {
          const sessionText = [
            session.title,
            session.query_text,
            session.summary,
            session.root_cause ? JSON.stringify(session.root_cause) : "",
            session.detected_stack ? JSON.stringify(session.detected_stack) : "",
            session.fix_plan ? JSON.stringify(session.fix_plan) : "",
          ].join(" ").toLowerCase();

          const lexicalScore = scoreOverlap(query, sessionText);
          const semantic = semanticScore(query, sessionText);

          return {
            ...session,
            score: lexicalScore + semantic,
          };
        })
        .filter((session) => session.score > 0)
        .sort((a, b) => b.score - a.score)
    : sessionsResult.rows;

  return {
    sessions: filteredSessions.slice(0, limit),
    memory: memoryResult.rows,
  };
}

export async function getEngineeringSessionById(sessionId) {
  const result = await pool.query(
    `SELECT *
     FROM engineering_sessions
     WHERE id = $1`,
    [sessionId]
  );

  return result.rows[0] || null;
}

export async function semanticSearchEngineeringKnowledge({ queryText = "", limit = 10 }) {
  const query = normalizeText(queryText);
  if (!query) {
    return { sessions: [], memory: [] };
  }

  const sessionResult = await pool.query(
    `SELECT id, title, query_text, deployment_platform, summary, root_cause, fix_plan, detected_stack, created_at
     FROM engineering_sessions
     ORDER BY created_at DESC
     LIMIT 120`
  );

  const memoryResult = await pool.query(
    `SELECT id, issue_type, stack_signature, root_cause, fix_summary, occurrence_count, last_seen_at
     FROM engineering_memory
     ORDER BY occurrence_count DESC, last_seen_at DESC
     LIMIT 120`
  );

  const sessions = sessionResult.rows
    .map((session) => {
      const sessionText = [
        session.title,
        session.query_text,
        session.summary,
        session.root_cause ? JSON.stringify(session.root_cause) : "",
        session.fix_plan ? JSON.stringify(session.fix_plan) : "",
        session.detected_stack ? JSON.stringify(session.detected_stack) : "",
      ].join(" ");

      const lexical = scoreOverlap(query, sessionText);
      const semantic = semanticScore(query, sessionText);
      const blended = lexical + semantic;

      return {
        ...session,
        score: blended,
      };
    })
    .filter((session) => session.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const memory = memoryResult.rows
    .map((item) => {
      const text = [item.issue_type, item.stack_signature, item.root_cause, item.fix_summary].join(" ");
      const lexical = scoreOverlap(query, text);
      const semantic = semanticScore(query, text);

      return {
        ...item,
        score: lexical + semantic,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { sessions, memory };
}
