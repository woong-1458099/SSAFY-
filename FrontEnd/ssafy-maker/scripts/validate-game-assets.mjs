import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { XMLParser } from "fast-xml-parser";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const srcRoot = path.join(projectRoot, "src");
const publicRoot = path.join(projectRoot, "public");
const assetRoot = path.join(publicRoot, "assets", "game");
const assetKeysPath = path.join(projectRoot, "src", "common", "assets", "assetKeys.ts");
const REQUIRED_TMX_LAYERS = [
  {
    assetPath: "/assets/game/map/mainMap.tmx",
    groups: {
      collision: ["root", "build"],
      interaction: ["interaction(build)"],
      foreground: ["tree"]
    }
  },
  {
    assetPath: "/assets/game/map/city.tmx",
    groups: {
      collision: ["build(foul)", "collision(patch)"],
      interaction: ["interaction(prompt)"],
      foreground: ["build(hide)"]
    }
  }
];

const SOURCE_EXTENSIONS = [".ts", ".tsx"];
const MODULE_EXTENSIONS = [".ts", ".tsx", ".mts", ".cts"];
const PATH_ALIASES = {
  "@shared/": path.join(srcRoot, "shared") + path.sep,
  "@features/": path.join(srcRoot, "features") + path.sep,
  "@common/": path.join(srcRoot, "common") + path.sep,
  "@game/": path.join(srcRoot, "game") + path.sep,
  "@app/": path.join(srcRoot, "app") + path.sep,
  "@infra/": path.join(srcRoot, "infra") + path.sep,
  "@debug/": path.join(srcRoot, "debug") + path.sep,
  "@scenes/": path.join(srcRoot, "scenes") + path.sep
};

const exportedConstantCache = new Map();
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  allowBooleanAttributes: true
});

function walkFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(fullPath);
    }

    const extension = path.extname(entry.name);
    if (!SOURCE_EXTENSIONS.includes(extension) || entry.name.endsWith(".d.ts")) {
      return [];
    }

    return [fullPath];
  });
}

function toProjectRelative(filePath) {
  return path.relative(projectRoot, filePath).split(path.sep).join("/");
}

function readSourceFile(filePath) {
  return ts.createSourceFile(filePath, fs.readFileSync(filePath, "utf8"), ts.ScriptTarget.Latest, true);
}

function resolveAliasPath(specifier) {
  const matchedPrefix = Object.keys(PATH_ALIASES).find((prefix) => specifier.startsWith(prefix));
  if (!matchedPrefix) {
    return null;
  }

  return path.join(PATH_ALIASES[matchedPrefix], specifier.slice(matchedPrefix.length));
}

function resolveModulePath(specifier, importingFilePath) {
  let candidateBasePath = null;

  if (specifier.startsWith(".")) {
    candidateBasePath = path.resolve(path.dirname(importingFilePath), specifier);
  } else {
    candidateBasePath = resolveAliasPath(specifier);
  }

  if (!candidateBasePath) {
    return null;
  }

  const directMatch = MODULE_EXTENSIONS
    .map((extension) => `${candidateBasePath}${extension}`)
    .find((candidatePath) => fs.existsSync(candidatePath));
  if (directMatch) {
    return directMatch;
  }

  const indexMatch = MODULE_EXTENSIONS
    .map((extension) => path.join(candidateBasePath, `index${extension}`))
    .find((candidatePath) => fs.existsSync(candidatePath));
  if (indexMatch) {
    return indexMatch;
  }

  return null;
}

function unwrapExpression(expression) {
  if (
    ts.isParenthesizedExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isTypeAssertionExpression(expression) ||
    ts.isSatisfiesExpression(expression)
  ) {
    return unwrapExpression(expression.expression);
  }

  return expression;
}

function resolveNumericRange(forStatement, env) {
  if (!forStatement.initializer || !ts.isVariableDeclarationList(forStatement.initializer)) {
    return null;
  }

  if (forStatement.initializer.declarations.length !== 1) {
    return null;
  }

  const declaration = forStatement.initializer.declarations[0];
  if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
    return null;
  }

  const loopVariableName = declaration.name.text;
  const startValues = resolveExpression(declaration.initializer, env);
  if (!startValues || startValues.length !== 1) {
    return null;
  }

  const startNumber = Number(startValues[0]);
  if (!Number.isInteger(startNumber) || !forStatement.condition || !forStatement.incrementor) {
    return null;
  }

  const condition = unwrapExpression(forStatement.condition);
  if (!ts.isBinaryExpression(condition) || !ts.isIdentifier(condition.left) || condition.left.text !== loopVariableName) {
    return null;
  }

  const endValues = resolveExpression(condition.right, env);
  if (!endValues || endValues.length !== 1) {
    return null;
  }

  const endNumber = Number(endValues[0]);
  if (!Number.isInteger(endNumber)) {
    return null;
  }

  const incrementor = unwrapExpression(forStatement.incrementor);
  const isUnitIncrement =
    (ts.isPostfixUnaryExpression(incrementor) && incrementor.operator === ts.SyntaxKind.PlusPlusToken && ts.isIdentifier(incrementor.operand) && incrementor.operand.text === loopVariableName) ||
    (ts.isPrefixUnaryExpression(incrementor) && incrementor.operator === ts.SyntaxKind.PlusPlusToken && ts.isIdentifier(incrementor.operand) && incrementor.operand.text === loopVariableName) ||
    (ts.isBinaryExpression(incrementor) &&
      ts.isIdentifier(incrementor.left) &&
      incrementor.left.text === loopVariableName &&
      incrementor.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken &&
      incrementor.right.getText() === "1");

  if (!isUnitIncrement) {
    return null;
  }

  let finalInclusiveEnd = endNumber;
  if (condition.operatorToken.kind === ts.SyntaxKind.LessThanToken) {
    finalInclusiveEnd -= 1;
  } else if (condition.operatorToken.kind !== ts.SyntaxKind.LessThanEqualsToken) {
    return null;
  }

  if (finalInclusiveEnd < startNumber) {
    return [];
  }

  return {
    name: loopVariableName,
    values: Array.from({ length: finalInclusiveEnd - startNumber + 1 }, (_, index) => String(startNumber + index))
  };
}

function resolveTemplateExpression(templateExpression, env) {
  let resolvedParts = [templateExpression.head.text];

  for (const span of templateExpression.templateSpans) {
    const expressionValues = resolveExpression(span.expression, env);
    if (!expressionValues) {
      return null;
    }

    resolvedParts = resolvedParts.flatMap((prefix) =>
      expressionValues.map((value) => `${prefix}${value}${span.literal.text}`)
    );
  }

  return resolvedParts;
}

function resolveExpression(expression, env) {
  const unwrapped = unwrapExpression(expression);

  if (ts.isStringLiteral(unwrapped) || ts.isNoSubstitutionTemplateLiteral(unwrapped)) {
    return [unwrapped.text];
  }

  if (ts.isNumericLiteral(unwrapped)) {
    return [unwrapped.text];
  }

  if (ts.isTemplateExpression(unwrapped)) {
    return resolveTemplateExpression(unwrapped, env);
  }

  if (ts.isIdentifier(unwrapped)) {
    return env.get(unwrapped.text) ?? null;
  }

  if (ts.isPropertyAccessExpression(unwrapped)) {
    const leftValues = resolveExpression(unwrapped.expression, env);
    if (!leftValues || leftValues.length !== 1) {
      return null;
    }

    const memberKey = `${leftValues[0]}.${unwrapped.name.text}`;
    return env.get(memberKey) ?? null;
  }

  if (ts.isBinaryExpression(unwrapped) && unwrapped.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const leftValues = resolveExpression(unwrapped.left, env);
    const rightValues = resolveExpression(unwrapped.right, env);
    if (!leftValues || !rightValues) {
      return null;
    }

    return leftValues.flatMap((leftValue) => rightValues.map((rightValue) => `${leftValue}${rightValue}`));
  }

  return null;
}

function collectExportedConstants(filePath) {
  const cached = exportedConstantCache.get(filePath);
  if (cached) {
    return cached;
  }

  const constants = new Map();
  exportedConstantCache.set(filePath, constants);

  const sourceFile = readSourceFile(filePath);
  const env = new Map();

  sourceFile.forEachChild((node) => {
    if (!ts.isImportDeclaration(node) || !node.importClause?.namedBindings || !ts.isNamedImports(node.importClause.namedBindings)) {
      return;
    }

    const modulePath = resolveModulePath(node.moduleSpecifier.text, filePath);
    if (!modulePath) {
      return;
    }

    const importedConstants = collectExportedConstants(modulePath);
    node.importClause.namedBindings.elements.forEach((element) => {
      const importedName = (element.propertyName ?? element.name).text;
      const localName = element.name.text;
      if (!importedConstants.has(importedName)) {
        return;
      }

      env.set(localName, importedConstants.get(importedName));
    });
  });

  sourceFile.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) {
      return;
    }

    const isConst = (ts.getCombinedNodeFlags(node.declarationList) & ts.NodeFlags.Const) !== 0;
    if (!isConst) {
      return;
    }

    const isExported = node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) {
      return;
    }

    node.declarationList.declarations.forEach((declaration) => {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
        return;
      }

      const resolved = resolveExpression(declaration.initializer, env);
      if (!resolved) {
        return;
      }

      constants.set(declaration.name.text, resolved);
      env.set(declaration.name.text, resolved);
    });
  });

  return constants;
}

function buildInitialEnvironment(filePath, sourceFile) {
  const env = new Map();

  sourceFile.forEachChild((node) => {
    if (!ts.isImportDeclaration(node) || !node.importClause?.namedBindings || !ts.isNamedImports(node.importClause.namedBindings)) {
      return;
    }

    const modulePath = resolveModulePath(node.moduleSpecifier.text, filePath);
    if (!modulePath) {
      return;
    }

    const importedConstants = collectExportedConstants(modulePath);
    node.importClause.namedBindings.elements.forEach((element) => {
      const importedName = (element.propertyName ?? element.name).text;
      const localName = element.name.text;
      const resolved = importedConstants.get(importedName);
      if (!resolved) {
        return;
      }

      env.set(localName, resolved);
    });
  });

  return env;
}

function getLineNumber(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function getPropertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return null;
}

function collectObjectLeafEntries(expression, prefix = []) {
  const unwrapped = unwrapExpression(expression);

  if (ts.isStringLiteral(unwrapped) || ts.isNoSubstitutionTemplateLiteral(unwrapped)) {
    return [{
      chain: prefix.join("."),
      value: unwrapped.text
    }];
  }

  if (!ts.isObjectLiteralExpression(unwrapped)) {
    return [];
  }

  return unwrapped.properties.flatMap((property) => {
    if (!ts.isPropertyAssignment(property)) {
      return [];
    }

    const propertyName = getPropertyNameText(property.name);
    if (!propertyName) {
      return [];
    }

    return collectObjectLeafEntries(property.initializer, [...prefix, propertyName]);
  });
}

function collectExportedObjectLeafEntries(filePath, exportName) {
  const sourceFile = readSourceFile(filePath);

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }

    const isExported = statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
    if (!isExported) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName || !declaration.initializer) {
        continue;
      }

      return collectObjectLeafEntries(declaration.initializer);
    }
  }

  return [];
}

function collectDuplicateValues(entries) {
  const valuesByEntry = new Map();

  entries.forEach((entry) => {
    const bucket = valuesByEntry.get(entry.value) ?? [];
    bucket.push(entry.chain);
    valuesByEntry.set(entry.value, bucket);
  });

  return [...valuesByEntry.entries()]
    .filter(([, chains]) => chains.length > 1)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([value, chains]) => ({ value, chains }));
}

function collectPropertyAccessReference(node) {
  const segments = [];
  let current = node;

  while (ts.isPropertyAccessExpression(current)) {
    segments.unshift(current.name.text);
    current = current.expression;
  }

  if (!ts.isIdentifier(current)) {
    return null;
  }

  return {
    root: current.text,
    chain: segments.join(".")
  };
}

function collectAssetReferences(filePath) {
  const sourceFile = readSourceFile(filePath);
  const initialEnv = buildInitialEnvironment(filePath, sourceFile);
  const references = [];
  const issues = [];
  const assetKeyReferences = [];
  const assetPathReferences = [];

  function visit(node, env) {
    if (ts.isVariableStatement(node)) {
      const nextEnv = new Map(env);
      const isConst = (ts.getCombinedNodeFlags(node.declarationList) & ts.NodeFlags.Const) !== 0;

      node.declarationList.declarations.forEach((declaration) => {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer || !isConst) {
          return;
        }

        const resolved = resolveExpression(declaration.initializer, nextEnv);
        if (resolved) {
          nextEnv.set(declaration.name.text, resolved);
        }
      });

      ts.forEachChild(node, (child) => visit(child, nextEnv));
      return;
    }

    if (ts.isForStatement(node)) {
      const range = resolveNumericRange(node, env);
      const nextEnv = new Map(env);
      if (range) {
        nextEnv.set(range.name, range.values);
      }

      if (node.initializer) {
        visit(node.initializer, nextEnv);
      }
      if (node.condition) {
        visit(node.condition, nextEnv);
      }
      if (node.incrementor) {
        visit(node.incrementor, nextEnv);
      }
      visit(node.statement, nextEnv);
      return;
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "buildGameAssetPath") {
      const resolvedSegments = node.arguments.map((argument) => resolveExpression(argument, env));
      if (resolvedSegments.some((segment) => !segment)) {
        issues.push(
          `[validate:game-assets] Unsupported buildGameAssetPath expression at ${toProjectRelative(filePath)}:${getLineNumber(sourceFile, node)}`
        );
      } else {
        const assetPaths = resolvedSegments.reduce(
          (accumulator, segments) => accumulator.flatMap((prefix) => segments.map((segment) => `${prefix}/${segment}`)),
          ["assets/game"]
        );

        assetPaths.forEach((assetPath) => {
          references.push({
            assetPath,
            filePath,
            line: getLineNumber(sourceFile, node)
          });
        });
      }
    }

    if (ts.isPropertyAccessExpression(node)) {
      const parent = node.parent;
      if (ts.isPropertyAccessExpression(parent) && parent.expression === node) {
        ts.forEachChild(node, (child) => visit(child, env));
        return;
      }

      const reference = collectPropertyAccessReference(node);
      if (reference?.root === "ASSET_KEYS" && reference.chain.length > 0) {
        assetKeyReferences.push({
          chain: reference.chain,
          filePath,
          line: getLineNumber(sourceFile, node)
        });
      }

      if (reference?.root === "ASSET_PATHS" && reference.chain.length > 0) {
        assetPathReferences.push({
          chain: reference.chain,
          filePath,
          line: getLineNumber(sourceFile, node)
        });
      }
    }

    ts.forEachChild(node, (child) => visit(child, env));
  }

  visit(sourceFile, initialEnv);
  return { references, issues, assetKeyReferences, assetPathReferences };
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

function readTmxLayerNames(filePath) {
  const rawTmx = fs.readFileSync(filePath, "utf8");

  let parsed;
  try {
    parsed = xmlParser.parse(rawTmx);
  } catch (error) {
    throw new Error(`Failed to parse TMX XML: ${error instanceof Error ? error.message : String(error)}`);
  }

  const mapNode = parsed?.map;
  if (!mapNode || typeof mapNode !== "object") {
    throw new Error("TMX map node is missing");
  }

  return toArray(mapNode.layer)
    .map((layerNode) => (layerNode && typeof layerNode === "object" ? layerNode.name : undefined))
    .filter((name) => typeof name === "string" && name.trim().length > 0);
}

function validateRequiredTmxLayers(issues) {
  REQUIRED_TMX_LAYERS.forEach(({ assetPath, groups }) => {
    const absolutePath = path.join(publicRoot, ...assetPath.replace(/^\//, "").split("/"));
    if (!fs.existsSync(absolutePath)) {
      issues.push(`[validate:game-assets] Missing TMX file for layer validation: ${assetPath}`);
      return;
    }

    let layerNames;
    try {
      layerNames = readTmxLayerNames(absolutePath);
    } catch (error) {
      issues.push(
        `[validate:game-assets] Failed to parse ${assetPath}: ${error instanceof Error ? error.message : String(error)}`
      );
      return;
    }

    const availableLayerSet = new Set(layerNames.map((name) => name.trim().toLowerCase()));

    Object.entries(groups).forEach(([groupName, requiredNames]) => {
      const missingNames = requiredNames.filter((name) => !availableLayerSet.has(name.trim().toLowerCase()));
      if (missingNames.length === 0) {
        return;
      }

      issues.push(
        `[validate:game-assets] Missing ${groupName} layer(s) in ${assetPath}: ${missingNames.join(", ")}. Available layers: ${layerNames.join(", ")}`
      );
    });
  });
}

function main() {
  const sourceFiles = walkFiles(srcRoot);
  const allReferences = [];
  const issues = [];
  const allAssetKeyReferences = [];
  const allAssetPathReferences = [];

  sourceFiles.forEach((filePath) => {
    const { references, issues: fileIssues, assetKeyReferences, assetPathReferences } = collectAssetReferences(filePath);
    allReferences.push(...references);
    issues.push(...fileIssues);
    if (filePath !== assetKeysPath) {
      allAssetKeyReferences.push(...assetKeyReferences);
      allAssetPathReferences.push(...assetPathReferences);
    }
  });

  const assetKeyEntries = collectExportedObjectLeafEntries(assetKeysPath, "ASSET_KEYS");
  const assetPathEntries = collectExportedObjectLeafEntries(assetKeysPath, "ASSET_PATHS");
  const assetKeyChainSet = new Set(assetKeyEntries.map((entry) => entry.chain));
  const assetPathChainSet = new Set(assetPathEntries.map((entry) => entry.chain));

  const uniqueReferences = new Map();
  allReferences.forEach((reference) => {
    const uniqueKey = `${reference.assetPath}::${reference.filePath}::${reference.line}`;
    uniqueReferences.set(uniqueKey, reference);
  });

  [...uniqueReferences.values()]
    .sort((left, right) => left.assetPath.localeCompare(right.assetPath) || left.filePath.localeCompare(right.filePath) || left.line - right.line)
    .forEach((reference) => {
      const publicAssetPath = path.join(publicRoot, ...reference.assetPath.split("/"));
      if (!fs.existsSync(publicAssetPath)) {
        issues.push(
          `[validate:game-assets] Missing asset ${reference.assetPath} referenced from ${toProjectRelative(reference.filePath)}:${reference.line}`
        );
      }
    });

  collectDuplicateValues(assetKeyEntries).forEach(({ value, chains }) => {
    issues.push(`[validate:game-assets] Duplicate ASSET_KEYS value "${value}" declared by: ${chains.join(", ")}`);
  });

  collectDuplicateValues(assetPathEntries).forEach(({ value, chains }) => {
    issues.push(`[validate:game-assets] Duplicate ASSET_PATHS value "${value}" declared by: ${chains.join(", ")}`);
  });

  assetPathEntries.forEach((entry) => {
    const publicAssetPath = path.join(publicRoot, ...entry.value.split("/"));
    if (!fs.existsSync(publicAssetPath)) {
      issues.push(`[validate:game-assets] Missing asset file for ASSET_PATHS.${entry.chain}: ${entry.value}`);
    }
  });

  allAssetKeyReferences.forEach((reference) => {
    if (!assetKeyChainSet.has(reference.chain)) {
      issues.push(
        `[validate:game-assets] Undefined ASSET_KEYS reference ${reference.chain} at ${toProjectRelative(reference.filePath)}:${reference.line}`
      );
    }
  });

  allAssetPathReferences.forEach((reference) => {
    if (!assetPathChainSet.has(reference.chain)) {
      issues.push(
        `[validate:game-assets] Undefined ASSET_PATHS reference ${reference.chain} at ${toProjectRelative(reference.filePath)}:${reference.line}`
      );
    }
  });

  const referencedAssetKeys = new Set(allAssetKeyReferences.map((reference) => reference.chain));
  const referencedAssetPaths = new Set(allAssetPathReferences.map((reference) => reference.chain));
  const unusedAssetKeys = assetKeyEntries
    .map((entry) => entry.chain)
    .filter((chain) => !referencedAssetKeys.has(chain))
    .sort();
  const unusedAssetPaths = assetPathEntries
    .map((entry) => entry.chain)
    .filter((chain) => !referencedAssetPaths.has(chain))
    .sort();

  validateRequiredTmxLayers(issues);

  if (issues.length > 0) {
    console.error("[validate:game-assets] failed");
    issues.forEach((issue) => console.error(`- ${issue}`));
    process.exitCode = 1;
    return;
  }

  console.log("[validate:game-assets] OK");
  console.log(`- asset root: ${toProjectRelative(assetRoot)}`);
  console.log(`- source files scanned: ${sourceFiles.length}`);
  console.log(`- asset references validated: ${uniqueReferences.size}`);
  console.log(`- ASSET_KEYS definitions: ${assetKeyEntries.length}`);
  console.log(`- ASSET_PATHS definitions: ${assetPathEntries.length}`);
  console.log(`- unused ASSET_KEYS: ${unusedAssetKeys.length > 0 ? unusedAssetKeys.join(", ") : "none"}`);
  console.log(`- unused ASSET_PATHS: ${unusedAssetPaths.length > 0 ? unusedAssetPaths.join(", ") : "none"}`);
}

main();
