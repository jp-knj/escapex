import { cases as existing } from '../competitors/cases.mjs';
import { cases as boundaries } from '../../test/fixtures/native-selection-cases.mjs';
export const cases = { ...existing, ...boundaries };
for (const length of [256, 8192]) cases[`all-targets-${length}`] = '&<>"\''.repeat(Math.ceil(length / 5)).slice(0, length);
