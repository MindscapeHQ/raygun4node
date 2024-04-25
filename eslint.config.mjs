// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            // TODO: Remove ignored rules and fix the code
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-var-requires": "off",
            "no-undef": "off",
            "no-unreachable": "off",
            "no-useless-catch": "off",
        }
    }
);