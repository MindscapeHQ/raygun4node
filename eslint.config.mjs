// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
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
            // TODO: Remove ignored rules and fix the code
            "no-unreachable": "off",
            "no-useless-catch": "off",
        }
    }
);