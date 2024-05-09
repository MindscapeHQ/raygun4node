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

            // "@stylistic/ts/member-delimiter-style": ["error",
            //     {
            //         "multiline": {
            //             "delimiter": "comma",
            //             "requireLast": true
            //         },
            //         "singleline": {
            //             "delimiter": "comma",
            //             "requireLast": false
            //         },
            //         "multilineDetection": "brackets"
            //     }
            // ],

            "@stylistic/ts/object-curly-spacing": ["error", "always"],
            "@stylistic/ts/comma-dangle": ["off", 0],
            "@stylistic/ts/quote-props": ["off", 0],
            "@stylistic/member-delimiter-style": ["off", 0],
            "@stylistic/ts/space-before-function-paren": ["off", 0],
            "@stylistic/brace-style": ["error", "1tbs"],
            "@stylistic/no-mixed-operators": ["off", 0],

            "@stylistic/arrow-parens": ["error", "always"],
            // Collides with Prettier
            "@stylistic/operator-linebreak": ["off", 0],
        }
    }
);