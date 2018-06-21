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

	const fullHtml = '<div class="foo"><h1>Name: jason</h1><p>Hello world!</p><button>Click Me</button><pre>Count: 0</pre>xml-style end tags:<div>Value of hello: true\n\t\t</div>explicit end tags:<div>Value of hello: true\n\t\tsome children (count=0)</div>implicit end tags: (&lt;//&gt;)<div>Value of hello: true\n\t\tsome children (count=0)</div>some text at the end</div>';

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
