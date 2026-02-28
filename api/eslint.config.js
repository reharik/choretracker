import { createBaseTypeScriptConfig } from '../../infra/config/eslint/eslint-shared.js';

export default await createBaseTypeScriptConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: ['**/db/**'],
});
