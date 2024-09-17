import eslint from '@eslint/js';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintParser from '@babel/eslint-parser';
import globals from 'globals';

export default [
	eslint.configs.recommended,
	prettierRecommended,
	{
		languageOptions: {
			parser: eslintParser,
			parserOptions: {
				ecmaVersion: 2022,
				requireConfigFile: false,
				sourceType: 'module'
			},
			globals: {
				...globals.browser
			}
		},
		ignores: ['dist'],
		rules: {
			'prettier/prettier': ['error', { endOfLine: 'auto' }],
			'no-unused-vars': 'off'
		}
	}
];
