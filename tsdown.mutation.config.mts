import production from './tsdown.config.mts';

// Retain the production entries, target and chunking; mutate executable JS.
export default { ...production, tsconfig: false, dts: false };
