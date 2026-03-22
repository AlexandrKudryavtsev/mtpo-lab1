const js = require('@eslint/js');
const security = require('eslint-plugin-security');
const globals = require('globals');

module.exports = [
    js.configs.recommended,
    {
        files: ['src/**/*.js', 'fuzz/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
                ...globals.jest,
                ...globals.es2021,
            },
        },
        plugins: {
            security: security
        },
        rules: {
            'no-unused-vars': ['warn', { 
                'argsIgnorePattern': '^_',
                'varsIgnorePattern': '^_' 
            }],
            'no-console': 'off',
            'no-debugger': 'warn',
            'no-duplicate-imports': 'error',
            
            // security
            'security/detect-object-injection': 'warn',
            'security/detect-non-literal-fs-filename': 'warn',
            'security/detect-unsafe-regex': 'warn',
            'security/detect-buffer-noassert': 'error',
            'security/detect-child-process': 'warn',
            'security/detect-eval-with-expression': 'error',
            'security/detect-possible-timing-attacks': 'warn',
            
            // errors
            'no-unreachable-loop': 'error',
            'no-constant-binary-expression': 'error',
            'no-unsafe-optional-chaining': 'error',
            'no-unsafe-negation': 'error',
            'no-unmodified-loop-condition': 'warn',
            
            // best practics
            'no-var': 'error',
            'prefer-const': 'warn',
            'eqeqeq': ['error', 'always'],
            'curly': ['error', 'all'],
        }
    },
    {
        files: ['src/**/__tests__/**/*.js', 'features/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
                ...globals.es2021,
            },
        },
        rules: {
            'no-unused-vars': 'off',
            'security/detect-object-injection': 'off',
            'security/detect-non-literal-fs-filename': 'off',
            'no-console': 'off',
        }
    }
];
