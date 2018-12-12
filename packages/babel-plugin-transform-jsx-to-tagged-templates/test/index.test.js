import { transform } from '@babel/core';
import transformJsxToTaggedTemplatesPlugin from '../src/index.mjs';

describe('babel-plugin-transform-jsx-to-tagged-templates', () => {
	test('basic transformation', () => {
		expect(
			transform('(<div id="hello">hello</div>);', {
				babelrc: false,
				plugins: [
					transformJsxToTaggedTemplatesPlugin
				]
			}).code
		).toBe('html`<div id="hello">hello</div>`;');
	});

	test('nested children transformation', () => {
		expect(
			transform('const Foo = () => <div class="foo" draggable>\n  <h1>Hello</h1>\n  <p>world.</p>\n</div>;', {
				babelrc: false,
				plugins: [
					transformJsxToTaggedTemplatesPlugin
				]
			}).code
		).toBe('const Foo = () => html`<div class="foo" draggable>\n  <h1>Hello</h1>\n  <p>world.</p>\n</div>`;');
	});

	test('whitespace', () => {
		expect(
			transform('const Foo = props => <div a b> a <em> b </em> c <strong> d </strong> e </div>;', {
				babelrc: false,
				plugins: [
					transformJsxToTaggedTemplatesPlugin
				]
			}).code
		).toBe('const Foo = props => html`<div a b> a <em> b </em> c <strong> d </strong> e </div>`;');
	});

	test('nested templates', () => {
		expect(
			transform('const Foo = props => <ul>{props.items.map(item =>\n  <li>\n    {item}\n  </li>\n)}</ul>;', {
				babelrc: false,
				plugins: [
					transformJsxToTaggedTemplatesPlugin
				]
			}).code
		).toBe('const Foo = props => html`<ul>${props.items.map(item => html`<li>\n    ${item}\n  </li>`)}</ul>`;');
	});
});
