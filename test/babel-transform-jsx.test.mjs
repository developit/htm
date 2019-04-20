import { transform } from '@babel/core';
import transformJsxToHtmPlugin from 'babel-plugin-transform-jsx-to-htm';

function compile(code, { plugins = [], ...options } = {}) {
	return transform(code, {
		babelrc: false,
		configFile: false,
		sourceType: 'module',
		plugins: [
			...plugins,
			[transformJsxToHtmPlugin, options]
		]
	}).code;
}

describe('babel-plugin-transform-jsx-to-htm', () => {
	describe('import', () => {
		test('import shortcut', () => {
			expect(
				compile(`(<div />);`, { import: 'htm/preact' })
			).toBe('import { html } from "htm/preact";\nhtml`<div/>`;');
		});

		test('import shortcut, dotted tag', () => {
			expect(
				compile(`(<div />);`, { tag: 'html.bound', import: 'htm/preact' })
			).toBe('import { html } from "htm/preact";\nhtml.bound`<div/>`;');
		});

		test('named import', () => {
			expect(
				compile(`(<div />);`, { import: { module: 'htm/preact', export: '$html' } })
			).toBe('import { $html as html } from "htm/preact";\nhtml`<div/>`;');
		});

		test('named import, dotted tag', () => {
			expect(
				compile(`(<div />);`, { tag: 'html.bound', import: { module: 'htm/preact', export: '$html' } })
			).toBe('import { $html as html } from "htm/preact";\nhtml.bound`<div/>`;');
		});

		test('default import', () => {
			expect(
				compile(`(<div />);`, { import: { module: 'htm/preact', export: 'default' } })
			).toBe('import html from "htm/preact";\nhtml`<div/>`;');
		});

		test('namespace import', () => {
			expect(
				compile(`(<div />);`, { import: { module: 'htm/preact', export: '*' } })
			).toBe('import * as html from "htm/preact";\nhtml`<div/>`;');
		});

		test('no import without JSX', () => {
			expect(
				compile(`false;`, { import: 'htm/preact' })
			).toBe('false;');
		});
	});

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

		test('static text', () => {
			expect(
				compile(`(<div>Hello</div>);`)
			).toBe('html`<div>Hello</div>`;');
			expect(
				compile(`(<div>こんにちわ</div>);`)
			).toBe('html`<div>こんにちわ</div>`;');
		});

		test('HTML entities get unescaped', () => {
			expect(
				compile(`(<div>&amp;</div>);`)
			).toBe('html`<div>&</div>`;');
		});

		test('&lt; gets wrapped into an expression container', () => {
			expect(
				compile(`(<div>a&lt;b&lt;&lt;&lt;c</div>);`)
			).toBe('html`<div>${"a<b<<<c"}</div>`;');
		});
	});

	describe('fragments', () => {
		test('React.Fragment', () => {
			expect(
				compile(`<React.Fragment><div>Foo</div><div>Bar</div></React.Fragment>`)
			).toBe('html`<div>Foo</div><div>Bar</div>`;');
		});

		test('short syntax', () => {
			expect(
				compile(`<><div>Foo</div><div>Bar</div></>`)
			).toBe('html`<div>Foo</div><div>Bar</div>`;');
		});
	});

	describe('props', () => {
		test('static values', () => {
			expect(
				compile('(<div a="a" b="bb" c d />);')
			).toBe('html`<div a="a" b="bb" c d/>`;');
			expect(
				compile('(<div a="こんにちわ" />);')
			).toBe('html`<div a="こんにちわ"/>`;');
		});

		test('HTML entities get unescaped', () => {
			expect(
				compile(`(<div a="&amp;" />);`)
			).toBe('html`<div a="&"/>`;');
		});

		test('double quote values with single quotes', () => {
			expect(
				compile(`(<div a="'b'" />);`)
			).toBe(`html\`<div a="'b'"/>\`;`);
		});

		test('single quote values with double quotes', () => {
			expect(
				compile(`(<div a='"b"' />);`)
			).toBe(`html\`<div a='"b"'/>\`;`);
		});

		test('escape values with newlines as expressions', () => {
			expect(
				compile(`(<div a="\n" />);`)
			).toBe('html`<div a=${"\\n"}/>`;');
		});

		test('escape values with both single and double quotes as expressions', () => {
			expect(
				compile(`(<div a="&#34;'" />);`)
			).toBe('html`<div a=${"\\"\'"}/>`;');
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

		test('inter-element whitespace is collapsed similarly to the JSX plugin', () => {
			expect(
				compile('const Foo = props => <div a b> a \n <em> b \n B </em> c <strong> d </strong> e </div>;')
			).toBe('const Foo = props => html`<div a b> a<em> b B </em> c <strong> d </strong> e </div>`;');
		});

		test('nested JSX Expressions produce nested templates', () => {
			expect(
				compile('const Foo = props => <ul>{props.items.map(item =>\n  <li>\n    {item}\n  </li>\n)}</ul>;')
			).toBe('const Foo = props => html`<ul>${props.items.map(item => html`<li>${item}</li>`)}</ul>`;');
		});

		test('empty expressions are ignored', () => {
			expect(
				compile(`(<div>{/* a comment */}</div>);`)
			).toBe('html`<div/>`;');
		});
	});
});
