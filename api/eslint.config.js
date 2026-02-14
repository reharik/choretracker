import { createBaseTypeScriptConfig } from '../eslint-shared.js';

export default await createBaseTypeScriptConfig({
  ignores: ['**/db/**', '**/_original/**'],
});
