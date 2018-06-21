const { html, Component, render } = require('.');

describe('preact-html', () => {
	class Foo extends Component {
		render({ name }, { count = 0 }) {
			return html`
				<div class="foo">
					<h1>Name: ${name}</h1>
					<p>Hello world!</p>
					<button onClick=${() => this.setState({ count: ++count })}>Click Me</button>
					<pre>Count: ${count}</pre>
					xml-style end tags:
					<${Bar} hello />
					explicit end tags:
					<${Bar} hello>some children (count=${count})</${Bar}>
					implicit end tags: (${'<//>'})
					<${Bar} hello>some children (count=${count})<//>
					some text at the end
				</div>
			`;
		}
	}

	const Bar = ({ hello, children }) => html`
	<div>
		Value of hello: ${hello + ''}
		${children}
	</div>
	`;

	// const fullHtml = '<div class="foo"><h1>Name: jason</h1><p>Hello world!</p><button>Click Me</button><pre>Count: 0</pre>xml-style end tags:<div>Value of hello: true\n\t\t</div>explicit end tags:<div>Value of hello: true\n\t\tsome children (count=0)</div>implicit end tags: (&lt;//&gt;)<div>Value of hello: true\n\t\tsome children (count=0)</div>some text at the end</div>';
	const fullHtml = '<div class="foo">\n\t\t\t\t\t<h1>Name: jason</h1>\n\t\t\t\t\t<p>Hello world!</p>\n\t\t\t\t\t<button>Click Me</button>\n\t\t\t\t\t<pre>Count: 0</pre>\n\t\t\t\t\txml-style end tags:\n\t\t\t\t\t<div>\n\t\tValue of hello: true\n\t\t\n\t</div>\n\t\t\t\t\texplicit end tags:\n\t\t\t\t\t<div>\n\t\tValue of hello: true\n\t\tsome children (count=0)\n\t</div>\n\t\t\t\t\timplicit end tags: (&lt;//&gt;)\n\t\t\t\t\t<div>\n\t\tValue of hello: true\n\t\tsome children (count=0)\n\t</div>\n\t\t\t\t\tsome text at the end\n\t\t\t\t</div>';

	test('initial render', () => {
		render(html`<${Foo} name=jason />`, document.body);
		expect(document.body.innerHTML).toBe(fullHtml);
	});

	test('rerenders in-place', () => {
		render(html`<${Foo} name=tom />`, document.body);
		expect(document.body.innerHTML).toBe(fullHtml.replace('jason', 'tom'));
	});

	test('state update re-renders', done => {
		document.querySelector('button').click();
		document.querySelector('button').click();
		setTimeout(() => {
			expect(document.body.innerHTML).toBe(fullHtml.replace('jason', 'tom').replace(/\b0\b/g, '2'));
			done();
		});
	});
});
