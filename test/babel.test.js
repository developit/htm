/**
 * @jest-environment node
 */

const { transform } = require('@babel/core');
const htmBabelPlugin = require('babel-plugin-htm');

describe('htm/babel', () => {
	test('basic transformation', () => {
		expect(
			transform('html`<div id=hello>hello</div>`;', {
				babelrc: false,
				compact: true,
				plugins: [
					htmBabelPlugin
				]
			}).code
		).toBe(`h("div",{id:"hello"},["hello"]);`);
	});

	test('basic transformation with variable', () => {
		expect(
			transform('var name="world";html`<div id=hello>hello, ${name}</div>`;', {
				babelrc: false,
				compact: true,
				plugins: [
					htmBabelPlugin
				]
			}).code
		).toBe(`var name="world";h("div",{id:"hello"},["hello, ",name]);`);
	});

	test('inline vnode transformation: (pragma:false)', () => {
		expect(
			transform('var name="world",vnode=html`<div id=hello>hello, ${name}</div>`;', {
				babelrc: false,
				compact: true,
				plugins: [
					[htmBabelPlugin, {
						pragma: false
					}]
				]
			}).code
		).toBe(`var name="world",vnode={tag:"div",props:{id:"hello"},children:["hello, ",name]};`);
	});

	test('monomorphic transformation', () => {
		expect(
			transform('var name="world",vnode=html`<div id=hello>hello, ${name}</div>`;', {
				babelrc: false,
				compact: true,
				plugins: [
					[htmBabelPlugin, {
						monomorphic: true
					}]
				]
			}).code
		).toBe(`var name="world",vnode={type:1,tag:"div",props:{id:"hello"},children:[{type:3,tag:null,props:null,children:null,text:"hello, "},name],text:null};`);
	});

	test('produce valid code for valid templates', () => {
		expect(
			transform('html`<div>",${name}</div>`;', {
				babelrc: false,
				compact: true,
				plugins: [
					htmBabelPlugin
				]
			}).code
		).toBe(`h("div",{},["\\",",name]);`);
	});
});
