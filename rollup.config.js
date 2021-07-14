import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default [
	{
		input: 'src/index.js',
		output: {
			file: 'dist/agnostic-draggable.js',
			format: 'umd',
			exports: 'named',
			name: 'agnosticDraggable',
			sourcemap: true,
			plugins: [terser()]
		},
		plugins: [
			resolve({ browser: true, preferBuiltins: false }),
			commonjs(),
			babel({
				babelHelpers: 'bundled',
				exclude: /node_modules/,
				presets: [
					[
						'@babel/preset-env',
						{
							useBuiltIns: 'usage',
							corejs: 3
						}
					]
				],
				plugins: ['array-includes']
			})
		]
	}
];
