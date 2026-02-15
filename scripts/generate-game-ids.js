#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SWORDS_PATH = path.join(ROOT, 'src/data/swords.ts');
const SKILLS_PATH = path.join(ROOT, 'src/data/skills.ts');
const OUTPUT_PATH = path.join(ROOT, 'src/constants/gameIds.ts');

function extractEntries(filePath, objectName) {
  const source = fs.readFileSync(filePath, 'utf8');
  const exportStart = source.indexOf(`export const ${objectName}`);
  if (exportStart < 0) {
    throw new Error(`Cannot find object: ${objectName} in ${filePath}`);
  }

  const braceStart = source.indexOf('{', exportStart);
  if (braceStart < 0) {
    throw new Error(`Cannot find object body for: ${objectName}`);
  }

  let depth = 0;
  let braceEnd = -1;
  for (let i = braceStart; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        braceEnd = i;
        break;
      }
    }
  }
  if (braceEnd < 0) {
    throw new Error(`Cannot find end of object: ${objectName}`);
  }

  const objectBlock = source.slice(braceStart + 1, braceEnd);
  const ids = [...objectBlock.matchAll(/^\s{2}([A-Za-z0-9_]+):\s*\{/gm)].map((m) => m[1]);

  return ids.map((id) => {
    const entryRegex = new RegExp(`${id}:\\s*\\{([\\s\\S]*?)\\n\\s{2}\\},`, 'm');
    const entryMatch = objectBlock.match(entryRegex);
    const body = entryMatch ? entryMatch[1] : '';
    const name = (body.match(/\n\s{4}name:\s*'([^']+)'/) || [])[1] || id;
    const description = (body.match(/\n\s{4}description:\s*'([^']+)'/) || [])[1] || '';
    return { id, name, description };
  });
}

function toConstKey(id) {
  return id
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .toUpperCase();
}

function sanitizeComment(text) {
  return text.replace(/\*\//g, '* /').replace(/\n/g, ' ');
}

function buildOutput(swords, skills) {
  const lines = [];
  lines.push('/**');
  lines.push(' * 게임 ID 상수');
  lines.push(' * - 문자열 오타를 방지하기 위한 enum-like constants');
  lines.push(' * - IDE 자동완성과 JSDoc 설명을 함께 제공');
  lines.push(' *');
  lines.push(' * 이 파일은 scripts/generate-game-ids.js 로 갱신할 수 있다.');
  lines.push(' */');
  lines.push('');

  lines.push('export const SWORD_ID = {');
  swords.forEach((sword) => {
    lines.push(`  /** ${sanitizeComment(sword.name)}: ${sanitizeComment(sword.description)} */`);
    lines.push(`  ${toConstKey(sword.id)}: '${sword.id}',`);
  });
  lines.push('} as const;');
  lines.push('');
  lines.push('export type SwordId = (typeof SWORD_ID)[keyof typeof SWORD_ID];');
  lines.push('export const SWORD_ID_LIST = Object.values(SWORD_ID) as SwordId[];');
  lines.push('');

  lines.push('export const SKILL_ID = {');
  skills.forEach((skill) => {
    lines.push(`  /** ${sanitizeComment(skill.name)}: ${sanitizeComment(skill.description)} */`);
    lines.push(`  ${toConstKey(skill.id)}: '${skill.id}',`);
  });
  lines.push('} as const;');
  lines.push('');
  lines.push('export type SkillId = (typeof SKILL_ID)[keyof typeof SKILL_ID];');
  lines.push('export const SKILL_ID_LIST = Object.values(SKILL_ID) as SkillId[];');
  lines.push('');

  return `${lines.join('\n')}`;
}

function main() {
  const swords = extractEntries(SWORDS_PATH, 'SWORDS');
  const skills = extractEntries(SKILLS_PATH, 'SKILLS');
  const output = buildOutput(swords, skills);
  fs.writeFileSync(OUTPUT_PATH, output, 'utf8');
  console.log(`Generated ${path.relative(ROOT, OUTPUT_PATH)}`);
}

main();
