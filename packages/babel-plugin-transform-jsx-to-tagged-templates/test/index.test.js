import { transform } from '@babel/core';
import transformJsxToTaggedTemplatesPlugin from '../src/index.mjs';

function compile(code, { plugins = [], ...options } = {}) {
	return transform(code, {
		babelrc: false,
		plugins: [
			...plugins,
			[transformJsxToTaggedTemplatesPlugin, options]
		]
	}).code;
}

describe('babel-plugin-transform-jsx-to-tagged-templates', () => {
	describe('elements and text', () => {
		test('single named element', () => {
			expect(
				compile('(<div />);')
			).toBe('html`<div/>`;');

			expect(
				compile('(<div>a</div>);')
			).toBe('html`<div>a</div>`;');
		});

		test('single component element', () => {
			expect(
				compile('(<Foo />);')
			).toBe('html`<${Foo}/>`;');

			expect(
				compile('(<Foo>a</Foo>);')
			).toBe('html`<${Foo}>a</${Foo}>`;');
		});
	});

	describe('options.html = true', () => {
		test('use explicit end tags instead of self-closing', () => {
			expect(
				compile('(<div />);', { html: true })
			).toBe('html`<div></div>`;');

			expect(
				compile('(<div a />);', { html: true })
			).toBe('html`<div a></div>`;');

			expect(
				compile('(<a>b</a>);', { html: true })
			).toBe('html`<a>b</a>`;');
		});
	});

	describe('props', () => {
		test('static values', () => {
			expect(
				compile('(<div a="a" b="bb" c d />);')
			).toBe('html`<div a="a" b="bb" c d/>`;');
		});

		test('expression values', () => {
			expect(
				compile('const Foo = (props, a) => <div a={a} b={"b"} c={{}} d={props.d} e />;')
			).toBe('const Foo = (props, a) => html`<div a=${a} b=${"b"} c=${{}} d=${props.d} e/>`;');
		});

		test('spread', () => {
			expect(
				compile('const Foo = props => <div {...props} />;')
			).toBe('const Foo = props => html`<div ...${props}/>`;');

			expect(
				compile('(<div {...{}} />);')
			).toBe('html`<div ...${{}}/>`;');

			expect(
				compile('(<div a {...b} c />);')
			).toBe('html`<div a ...${b} c/>`;');
		});
	});

	describe('nesting', () => {
		test('element children are merged into one template', () => {
			expect(
				compile('const Foo = () => <div class="foo" draggable>\n  <h1>Hello</h1>\n  <p>world.</p>\n</div>;')
			).toBe('const Foo = () => html`<div class="foo" draggable><h1>Hello</h1><p>world.</p></div>`;');
		});

		test('inter-element whitespace is collapsed', () => {
			expect(
				compile('const Foo = props => <div a b> a <em> b </em> c <strong> d </strong> e </div>;')
			).toBe('const Foo = props => html`<div a b>a<em>b</em>c<strong>d</strong>e</div>`;');
		});

		test('nested JSX Expressions produce nested templates', () => {
			expect(
				compile('const Foo = props => <ul>{props.items.map(item =>\n  <li>\n    {item}\n  </li>\n)}</ul>;')
			).toBe('const Foo = props => html`<ul>${props.items.map(item => html`<li>${item}</li>`)}</ul>`;');
		});
	});

	describe('integration with babel-plugin-jsx-pragmatic', () => {
		test('JSX is still identified and import added', () => {
			expect(
				compile('const Foo = props => <div>hello</div>;', {
					tag: '$$html',
					plugins: [
						['babel-plugin-jsx-pragmatic', {
							// module to import:
							module: 'lit-html',
							// the name of the export to use:
							export: 'html',
							// whatever you specified for the "tag" option:
							import: '$$html'
						}]
					]
				})
			).toBe('import { html as $$html } from "lit-html";\n\nconst Foo = props => $$html`<div>hello</div>`;');
		});
	});
});
