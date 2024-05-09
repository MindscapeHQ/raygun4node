// @ts-check

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    stylistic.configs["recommended-flat"],
    stylisticTs.configs["all-flat"],
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            // Add node globals to ignore undefined
            globals: {
                "__dirname": false,
                "console": false,
                "module": false,
                "process": false,
                "require": false,
                "setTimeout": false,
            }
        },
        rules: {
            // Unused vars reported as error
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    // Do not report unused function arguments
                    "args": "none",
                }
            ],
            // Required to import JS modules
            "@typescript-eslint/no-var-requires": "off",
            // Always require semicolons
            "@stylistic/semi": ["error", "always"],
            // Stick to double quotes
            "@stylistic/quotes": ["error", "double"],
            '@stylistic/ts/indent': ['error', 2],

            // "@stylistic/ts/member-delimiter-style": ["error", "comma"],
        }
    }
);