/**
 * @jest-environment node
 */

import { transform } from '@babel/core';
import htmBabelPlugin from 'babel-plugin-htm';

const options = {
	babelrc: false,
	configFile: false,
	sourceType: 'script',
	compact: true
};

describe('htm/babel', () => {
	test('basic transformation', () => {
		expect(
			transform('html`<div id=hello>hello</div>`;', {
				...options,
				plugins: [
					htmBabelPlugin
				]
			}).code
		).toBe(`h("div",{id:"hello"},"hello");`);
	});

	test('basic transformation with variable', () => {
		expect(
			transform('var name="world";html`<div id=hello>hello, ${name}</div>`;', {
				...options,
				plugins: [
					htmBabelPlugin
				]
			}).code
		).toBe(`var name="world";h("div",{id:"hello"},"hello, ",name);`);
	});

	test('basic nested transformation', () => {
		expect(
			transform('html`<a b=${2} ...${{ c: 3 }}>d: ${4}</a>`;', {
				...options,
				plugins: [
					[htmBabelPlugin, {
						useBuiltIns: true
					}]
				]
			}).code
		).toBe(`h("a",Object.assign({b:2},{c:3}),"d: ",4);`);
	});

	test('spread a single variable', () => {
		expect(
			transform('html`<a ...${foo}></a>`;', {
				...options,
				plugins: [
					htmBabelPlugin
				]
			}).code
		).toBe(`h("a",foo);`);
	});

	test('spread two variables', () => {
		expect(
			transform('html`<a ...${foo} ...${bar}></a>`;', {
				...options,
				plugins: [
					[htmBabelPlugin, {
						useBuiltIns: true
					}]
				]
			}).code
		).toBe(`h("a",Object.assign({},foo,bar));`);
	});

	test('property followed by a spread', () => {
		expect(
			transform('html`<a b="1" ...${foo}></a>`;', {
				...options,
				plugins: [
					[htmBabelPlugin, {
						useBuiltIns: true
					}]
				]
			}).code
		).toBe(`h("a",Object.assign({b:"1"},foo));`);
	});

	test('spread followed by a property', () => {
		expect(
			transform('html`<a ...${foo} b="1"></a>`;', {
				...options,
				plugins: [
					[htmBabelPlugin, {
						useBuiltIns: true
					}]
				]
			}).code
		).toBe(`h("a",Object.assign({},foo,{b:"1"}));`);
	});

	test('mix-and-match spreads', () => {
		expect(
			transform('html`<a b="1" ...${foo} c=${2} ...${{d:3}}></a>`;', {
				...options,
				plugins: [
					[htmBabelPlugin, {
						useBuiltIns: true
					}]
				]
			}).code
		).toBe(`h("a",Object.assign({b:"1"},foo,{c:2},{d:3}));`);
	});

	test('mix-and-match dynamic and static values', () => {
		expect(
			transform('html`<a b="1${2}${3}"></a>`;', {
				...options,
				plugins: [
					[htmBabelPlugin, {
						useBuiltIns: true
					}]
				]
			}).code
		).toBe(`h("a",{b:"1"+2+3});`);
	});

	test('coerces props to strings when needed', () => {
		expect(
			transform('html`<a b=\'${1}${2}${"3"}${4}\'></a>`;', {
				...options,
				plugins: [
					[htmBabelPlugin, {
						useBuiltIns: true
					}]
				]
			}).code
		).toBe(`h("a",{b:1+""+2+"3"+4});`);
	});

	test('coerces props to strings only when needed', () => {
		expect(
			transform('html`<a b=\'${"1"}${2}${"3"}${4}\'></a>`;', {
				...options,
				plugins: [
					[htmBabelPlugin, {
						useBuiltIns: true
					}]
				]
			}).code
		).toBe(`h("a",{b:"1"+2+"3"+4});`);
	});

	describe('{variableArity:false}', () => {
		test('should pass no children as an empty Array', () => {
			expect(
				transform('html`<div />`;', {
					...options,
					plugins: [
						[htmBabelPlugin, {
							variableArity: false
						}]
					]
				}).code
			).toBe(`h("div",null,[]);`);
		});

		test('should pass children as an Array', () => {
			expect(
				transform('html`<div id=hello>hello</div>`;', {
					...options,
					plugins: [
						[htmBabelPlugin, {
							variableArity: false
						}]
					]
				}).code
			).toBe(`h("div",{id:"hello"},["hello"]);`);
		});
	});

	describe('{pragma:false}', () => {
		test('should transform to inline vnodes', () => {
			expect(
				transform('var name="world",vnode=html`<div id=hello>hello, ${name}</div>`;', {
					...options,
					plugins: [
						[htmBabelPlugin, {
							pragma: false
						}]
					]
				}).code
			).toBe(`var name="world",vnode={tag:"div",props:{id:"hello"},children:["hello, ",name]};`);
		});
	});

	describe('{monomorphic:true}', () => {
		test('should transform to monomorphic inline vnodes', () => {
			expect(
				transform('var name="world",vnode=html`<div id=hello>hello, ${name}</div>`;', {
					...options,
					plugins: [
						[htmBabelPlugin, {
							monomorphic: true
						}]
					]
				}).code
			).toBe(`var name="world",vnode={type:1,tag:"div",props:{id:"hello"},children:[{type:3,tag:null,props:null,children:null,text:"hello, "},name],text:null};`);
		});
	});

	describe('main test suite', () => {
		// Run all of the main tests against the Babel plugin:
		const mod = require('fs').readFileSync(require('path').resolve(__dirname, 'index.test.mjs'), 'utf8').replace(/\\0/g, '\0');
		const { code } = transform(mod.replace(/^\s*import\s*.+?\s*from\s+(['"]).*?\1[\s;]*$/im, 'const htm = function(){};'), {
			...options,
			plugins: [htmBabelPlugin]
		});
		eval(code);
	});
});
