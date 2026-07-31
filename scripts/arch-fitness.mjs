#!/usr/bin/env node
/**
 * Architecture fitness gate (ADR 0034).
 * Exit 0 = pass, 1 = violations found.
 *
 * Known non-goals (documented in ADR 0034): cross-file re-export tracking;
 * arch-fitness-allow whole-file escape; not in pre_commit (verify/DoD).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative, resolve } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const LIB_SERVER = join(SRC, 'lib', 'server');
const ADAPTERS = join(LIB_SERVER, 'adapters');

/** @type {{ file: string, rule: string, line: number, excerpt: string }[]} */
const violations = [];

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walk(dir) {
	/** @type {string[]} */
	const out = [];
	for (const name of readdirSync(dir)) {
		if (name === 'node_modules' || name === '.svelte-kit') continue;
		const p = join(dir, name);
		const st = statSync(p);
		if (st.isDirectory()) out.push(...walk(p));
		else if (/\.(ts|js|svelte)$/.test(name) && !name.endsWith('.d.ts')) out.push(p);
	}
	return out;
}

/**
 * @param {string} content
 */
function hasAllow(content) {
	const first = content.split('\n', 1)[0] ?? '';
	return first.startsWith('// arch-fitness-allow:');
}

/**
 * @param {string} file
 * @param {string} rule
 * @param {number} line
 * @param {string} excerpt
 */
function add(file, rule, line, excerpt) {
	violations.push({
		file: relative(ROOT, file),
		rule,
		line,
		excerpt: excerpt.trim().slice(0, 160)
	});
}

/**
 * @param {string} line
 * @returns {string[]}
 */
function extractModuleSpecifiers(line) {
	/** @type {string[]} */
	const specs = [];
	const re = /(?:from\s+|import\s*\(\s*|import\s+|require\s*\(\s*)['"]([^'"]+)['"]/g;
	let m;
	while ((m = re.exec(line))) specs.push(m[1]);
	return specs;
}

/**
 * Resolve import specifier to absolute path prefix under src, or null.
 * @param {string} fromFile
 * @param {string} spec
 */
function resolveSpec(fromFile, spec) {
	if (spec.startsWith('$lib/')) {
		return normalize(join(SRC, 'lib', spec.slice('$lib/'.length)));
	}
	if (spec.startsWith('.')) {
		return normalize(resolve(dirname(fromFile), spec));
	}
	return null;
}

/**
 * @param {string} abs
 * @param {string} rootDir
 */
function isUnder(abs, rootDir) {
	const rel = relative(rootDir, abs);
	return rel === '' || (!rel.startsWith('..') && !rel.includes(':'));
}

/**
 * @param {string} file
 */
function isClientModule(file) {
	const rel = relative(SRC, file).replaceAll('\\', '/');
	if (rel === 'hooks.server.ts') return false;
	if (rel.endsWith('.svelte')) return true;
	if (/\+page\.ts$/.test(rel) || /\+layout\.ts$/.test(rel)) return true;
	if (/\+page\.server\.ts$/.test(rel) || /\+layout\.server\.ts$/.test(rel)) return false;
	if (/\+server\.ts$/.test(rel)) return false;
	if (rel.startsWith('lib/') && !rel.startsWith('lib/server/')) {
		if (/\.(ts|js)$/.test(rel)) return true;
	}
	return false;
}

/**
 * @param {string} file
 */
function isAdapter(file) {
	return isUnder(file, ADAPTERS);
}

/**
 * @param {string} file
 */
function isCompositionRoot(file) {
	const rel = relative(SRC, file).replaceAll('\\', '/');
	return rel === 'hooks.server.ts' || rel === 'routes/+layout.ts';
}

/**
 * @param {string} content
 * @param {string} pkg
 * @param {string[]} symbols
 * @returns {Set<string>}
 */
function namedBindings(content, pkg, symbols) {
	/** @type {Set<string>} */
	const names = new Set();
	const re = new RegExp(
		`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${pkg.replace('/', '\\/')}['"]`,
		'g'
	);
	let m;
	while ((m = re.exec(content))) {
		for (const part of m[1].split(',')) {
			const bit = part.trim();
			if (!bit || bit.startsWith('type ')) continue;
			const as = bit.match(/^(?:type\s+)?(\w+)\s+as\s+(\w+)$/);
			if (as) {
				if (symbols.includes(as[1])) names.add(as[2]);
			} else if (symbols.includes(bit)) {
				names.add(bit);
			}
		}
	}
	return names;
}

const files = walk(SRC);

for (const file of files) {
	const content = readFileSync(file, 'utf8');
	if (hasAllow(content)) continue;
	const lines = content.split('\n');
	const underRoutesOrHooks =
		relative(SRC, file).replaceAll('\\', '/').startsWith('routes/') ||
		relative(SRC, file).replaceAll('\\', '/') === 'hooks.server.ts';

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const specs = extractModuleSpecifiers(line);
		for (const spec of specs) {
			const abs = resolveSpec(file, spec);
			if (!abs) continue;

			if (isClientModule(file) && isUnder(abs, LIB_SERVER)) {
				add(file, 'client-must-not-import-$lib/server', i + 1, line);
			}
			if (underRoutesOrHooks && isUnder(abs, ADAPTERS)) {
				add(file, 'routes-must-not-import-adapters', i + 1, line);
			}
		}
	}

	if (isAdapter(file)) continue;

	const createClientNames = namedBindings(content, '@supabase/supabase-js', ['createClient']);
	const ssrNames = namedBindings(content, '@supabase/ssr', [
		'createBrowserClient',
		'createServerClient'
	]);

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		if (/^\s*import\s+type\b/.test(line)) continue;

		for (const name of createClientNames) {
			if (new RegExp(`\\b${name}\\s*\\(`).test(line)) {
				add(file, 'createClient-only-in-adapters', i + 1, line);
			}
		}
		if (
			/from\s*['"]@supabase\/supabase-js['"]/.test(line) &&
			/\bcreateClient\b/.test(line) &&
			!/^\s*import\s+type\b/.test(line)
		) {
			add(file, 'createClient-import-only-in-adapters', i + 1, line);
		}

		if (/\bnew\s+Stripe\s*\(/.test(line)) {
			add(file, 'Stripe-client-only-in-adapters', i + 1, line);
		}
		if (/\bnew\s+OpenAI\s*\(/.test(line)) {
			add(file, 'OpenAI-client-only-in-adapters', i + 1, line);
		}

		if (!isCompositionRoot(file)) {
			for (const name of ssrNames) {
				if (new RegExp(`\\b${name}\\s*\\(`).test(line)) {
					add(file, 'supabase-ssr-only-in-composition-roots', i + 1, line);
				}
			}
			// also catch non-aliased if import present but binding parse missed
			if (
				ssrNames.size === 0 &&
				/@supabase\/ssr/.test(content) &&
				/\bcreate(Browser|Server)Client\s*\(/.test(line)
			) {
				add(file, 'supabase-ssr-only-in-composition-roots', i + 1, line);
			}
		}
	}
}

if (violations.length === 0) {
	console.log('[arch-fitness] pass');
	process.exit(0);
}

console.error(`[arch-fitness] FAIL (${violations.length} violation(s))`);
for (const v of violations) {
	console.error(`  ${v.file}:${v.line} [${v.rule}] ${v.excerpt}`);
}
process.exit(1);
