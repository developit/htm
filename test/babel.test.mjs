/**
 * @jest-environment node
 */

import { transform } from '@babel/core';
import htmBabelPlugin from 'babel-plugin-htm';

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

	test('basic nested transformation', () => {
		expect(
			transform('html`<a b=${2} ...${{ c: 3 }}>d: ${4}</a>`;', {
				babelrc: false,
				compact: true,
				plugins: [
					htmBabelPlugin
				]
			}).code
		).toBe(`h("a",{b:2,c:3},["d: ",4]);`);
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

	test('preserves placeholder-looking strings in attributes and text', () => {
		expect(
			transform('html`<div $$$_h_[1]=$$$_h_[2]>$$$_h_[3]</div>`;', {
				babelrc: false,
				compact: true,
				plugins: [
					htmBabelPlugin
				]
			}).code
		).toBe(`h("div",{"$$$_h_[1]":"$$$_h_[2]"},["$$$_h_[3]"]);`);
	});
});
