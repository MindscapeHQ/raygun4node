// @ts-check

import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    // Basic eslint rules
    eslint.configs.recommended,
    // Codestyle rules for JS
    stylistic.configs["recommended-flat"],
    // Codestyle rules for TS
    stylisticTs.configs["all-flat"],
    // Eslint rules for TS
    ...tseslint.configs.recommended,
    {
        languageOptions: {
            // Add node globals to ignore undefined
            globals: {
                "__dirname": false,
                "__filename": false,
                "console": false,
                "module": false,
                "process": false,
                "require": false,
                "setTimeout": false,
                "exports": false,
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
            // Always indent with two spaces
            '@stylistic/ts/indent': ['error', 2],
            // Enforce curly braces spacing
            "@stylistic/ts/object-curly-spacing": ["error", "always"],
            // Enforce "one true brace style"
            "@stylistic/brace-style": ["error", "1tbs"],
            // Enforce parenthesis in functions: "(a) => a"
            "@stylistic/arrow-parens": ["error", "always"],
            // Disabled rules that collide with Prettier formatter
            "@stylistic/member-delimiter-style": ["off", 0],
            "@stylistic/no-mixed-operators": ["off", 0],
            "@stylistic/operator-linebreak": ["off", 0],
            "@stylistic/quote-props": ["off", 0],
            "@stylistic/ts/comma-dangle": ["off", 0],
            "@stylistic/ts/no-extra-parens": ["off", 0],
            "@stylistic/ts/quote-props": ["off", 0],
            "@stylistic/ts/space-before-function-paren": ["off", 0],
        }
    }
);