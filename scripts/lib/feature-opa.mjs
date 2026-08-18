/**
 * Feature YAML を feature-gate と同じ opa eval -d で読む。catalog 純関数からは呼ばない。
 */
import { execFileSync } from 'node:child_process';

export function loadFeatureViaOpa(opa, yamlPath) {
	const out = execFileSync(opa, ['eval', '-f', 'json', '-d', yamlPath, 'data'], { encoding: 'utf8' });
	const parsed = JSON.parse(out);
	const data = parsed.result?.[0]?.expressions?.[0]?.value;
	if (!data?.feature) throw new Error(`${yamlPath}: トップレベル feature: が必要`);
	return data.feature;
}
