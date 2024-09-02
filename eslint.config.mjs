import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';

export default [
    // Basic eslint rules
    eslint.configs.recommended,
    // Codestyle rules for JS
    stylistic.configs["recommended-flat"],
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
            }
        },
        rules: {
            // Allow unused vars
            "no-unused-vars": ["off", 0],
            // Always require semicolons
            "@stylistic/semi": ["error", "always"],
            // Stick to double quotes
            "@stylistic/quotes": ["error", "double"],
            // Enforce "one true brace style"
            "@stylistic/brace-style": ["error", "1tbs"],
            // Enforce parenthesis in functions: "(a) => a"
            "@stylistic/arrow-parens": ["error", "always"],
            // Disabled rules that collide with Prettier formatter
            "@stylistic/member-delimiter-style": ["off", 0],
            "@stylistic/no-mixed-operators": ["off", 0],
            "@stylistic/operator-linebreak": ["off", 0],
            "@stylistic/quote-props": ["off", 0],
        }
    }
];