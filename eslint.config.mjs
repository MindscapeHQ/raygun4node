// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    // Do not report unused function arguments
                    "args": "none",
                    // "argsIgnorePattern": "^_",
                    // "caughtErrors": "all",
                    // "caughtErrorsIgnorePattern": "^_",
                    // "destructuredArrayIgnorePattern": "^_",
                    // "varsIgnorePattern": "^_",
                    // "ignoreRestSiblings": true
                }
            ],
            // TODO: Remove ignored rules and fix the code
            "@typescript-eslint/no-var-requires": "off",
            "no-undef": "off",
            "no-unreachable": "off",
            "no-useless-catch": "off",
        }
    }
);