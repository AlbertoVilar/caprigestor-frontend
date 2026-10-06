import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const requireFromRepository = createRequire(
  path.join(repositoryRoot, "package.json")
);
const ts = requireFromRepository("typescript");
const manifestPath = path.join(repositoryRoot, "coverage.type-only.json");

function collectCandidates(directory, relativeDirectory = "src") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    const relativePath = `${relativeDirectory}/${entry.name}`.replaceAll("\\", "/");

    if (entry.isDirectory()) {
      return collectCandidates(absolutePath, relativePath);
    }

    if (!entry.isFile() || !/\.tsx?$/.test(entry.name)) {
      return [];
    }

    if (/\.(test|spec)\.(ts|tsx)$/.test(entry.name)) {
      return [];
    }

    if (relativePath === "src/test/setup.ts") {
      return [];
    }

    return [relativePath];
  });
}

function isEmptyModuleExport(statement) {
  return (
    ts.isExportDeclaration(statement)
    && !statement.moduleSpecifier
    && statement.exportClause
    && ts.isNamedExports(statement.exportClause)
    && statement.exportClause.elements.length === 0
  );
}

function classify(relativePath) {
  const absolutePath = path.join(repositoryRoot, ...relativePath.split("/"));
  const source = fs.readFileSync(absolutePath, "utf8");
  const sourceFile = ts.createSourceFile(
    absolutePath,
    source,
    ts.ScriptTarget.ESNext,
    true
  );

  const parseErrors = (sourceFile.parseDiagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );

  if (parseErrors.length > 0) {
    return {
      path: relativePath,
      error: parseErrors.map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
      ),
    };
  }

  if (sourceFile.isDeclarationFile) {
    return { path: relativePath, typeOnly: true };
  }

  const result = ts.transpileModule(source, {
    fileName: absolutePath,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      verbatimModuleSyntax: false,
      removeComments: true,
      sourceMap: false,
      inlineSourceMap: false,
      inlineSources: false,
      isolatedModules: true,
    },
  });

  const errors = (result.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );

  if (errors.length > 0) {
    return {
      path: relativePath,
      error: errors.map((diagnostic) =>
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
      ),
    };
  }

  const emitted = ts.createSourceFile(
    `${relativePath}.js`,
    result.outputText,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS
  );
  const meaningfulStatements = emitted.statements.filter(
    (statement) =>
      !ts.isEmptyStatement(statement) && !isEmptyModuleExport(statement)
  );

  return { path: relativePath, typeOnly: meaningfulStatements.length === 0 };
}

function fail(message) {
  console.error(`Coverage type-only guard failed: ${message}`);
  process.exitCode = 1;
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (!Array.isArray(manifest) || manifest.some((entry) => typeof entry !== "string")) {
  fail("coverage.type-only.json must be a JSON array of strings.");
  process.exit();
}

const duplicates = manifest.filter((entry, index) => manifest.indexOf(entry) !== index);
if (duplicates.length > 0) {
  fail(`Duplicate manifest paths: ${[...new Set(duplicates)].join(", ")}`);
}

const sortedManifest = [...manifest].sort();
if (manifest.some((entry, index) => entry !== sortedManifest[index])) {
  fail("Manifest paths are not sorted lexicographically.");
}

const invalidPaths = manifest.filter((entry) => !entry.startsWith("src/"));
if (invalidPaths.length > 0) {
  fail(`Manifest paths must start with src/: ${invalidPaths.join(", ")}`);
}

const missingFiles = manifest.filter((entry) =>
  !fs.existsSync(path.join(repositoryRoot, ...entry.split("/")))
);
if (missingFiles.length > 0) {
  fail(`Manifest files do not exist: ${missingFiles.join(", ")}`);
}

const candidates = collectCandidates(path.join(repositoryRoot, "src")).sort();
const results = candidates.map(classify);
const diagnostics = results.filter((result) => result.error);

if (diagnostics.length > 0) {
  for (const result of diagnostics) {
    console.error(`Diagnostics/errors in ${result.path}:`);
    for (const error of result.error) {
      console.error(`  ${error}`);
    }
  }
  process.exitCode = 1;
}

const typeOnlyFiles = results
  .filter((result) => result.typeOnly)
  .map((result) => result.path);
const runtimeFiles = results
  .filter((result) => result.typeOnly === false)
  .map((result) => result.path);
const typeOnlySet = new Set(typeOnlyFiles);
const manifestSet = new Set(manifest);
const missingFromManifest = typeOnlyFiles.filter((entry) => !manifestSet.has(entry));
const noLongerTypeOnly = manifest.filter((entry) => !typeOnlySet.has(entry));

if (missingFromManifest.length > 0) {
  fail(`Missing from manifest: ${missingFromManifest.join(", ")}`);
}

if (noLongerTypeOnly.length > 0) {
  fail(`No longer type-only: ${noLongerTypeOnly.join(", ")}`);
}

console.log(`Candidate files: ${candidates.length}`);
console.log(`Runtime files: ${runtimeFiles.length}`);
console.log(`Type-only files: ${typeOnlyFiles.length}`);
console.log(
  process.exitCode
    ? "Manifest: out of sync"
    : "Manifest: synchronized"
);
