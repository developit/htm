/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { html, Component, render } from 'htm/preact';

const sleep = ms => new Promise(r => setTimeout(r, ms));

describe('htm/preact', () => {
	const scratch = document.createElement('div');
	document.body.appendChild(scratch);

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

	const Baz = ({ myCaseSensitiveProp }) => html`<div>${myCaseSensitiveProp}</div>`;

	const fullHtml = '<div class="foo"><h1>Name: jason</h1><p>Hello world!</p><button>Click Me</button><pre>Count: 0</pre>xml-style end tags:<div>Value of hello: true</div>explicit end tags:<div>Value of hello: truesome children (count=0)</div>implicit end tags: (&lt;//&gt;)<div>Value of hello: truesome children (count=0)</div>some text at the end</div>';

	test('initial render', () => {
		render(html`<${Foo} name=jason />`, scratch);
		expect(scratch.innerHTML).toBe(fullHtml);
	});

	test('rerenders in-place', () => {
		render(html`<${Foo} name=tom />`, scratch);
		expect(scratch.innerHTML).toBe(fullHtml.replace('jason', 'tom'));
	});

	test('state update re-renders', async () => {
		document.querySelector('button').click();
		document.querySelector('button').click();
		await sleep(1);
		expect(scratch.innerHTML).toBe(fullHtml.replace('jason', 'tom').replace(/\b0\b/g, '2'));
	});

	test('preserves case', () => {
		scratch.textContent = '';
		render(html`<${Baz} myCaseSensitiveProp="Yay!" />`, scratch);
		expect(scratch.innerHTML).toBe('<div>Yay!</div>');
	});

	test('object spreads', () => {
		scratch.textContent = '';

		const props = { a: 1, b: 2, c: 3 };
		const other = { d: 4, e: 5, f: 6 };

		render(html`<div ...${props} />`, scratch);
		expect(scratch.innerHTML).toBe(`<div a="1" b="2" c="3"></div>`);
		scratch.innerHTML = '';

		render(html`<div is-before="blah" ...${props} />`, scratch);
		expect(scratch.innerHTML).toBe(`<div a="1" b="2" c="3" is-before="blah"></div>`);
		scratch.innerHTML = '';

		render(html`<div ...${props} is-after />`, scratch);
		expect(scratch.innerHTML).toBe(`<div a="1" b="2" c="3" is-after="true"></div>`);
		expect(JSON.stringify(props)).toBe(`{"a":1,"b":2,"c":3}`);
		scratch.innerHTML = '';

		render(html`<div is-before ...${props} is-after="blah" />`, scratch);
		expect(scratch.innerHTML).toBe(`<div a="1" b="2" c="3" is-after="blah" is-before="true"></div>`);
		scratch.innerHTML = '';

		render(html`<div ...${props} ...${other} />`, scratch);
		expect(scratch.innerHTML).toBe(`<div a="1" b="2" c="3" d="4" e="5" f="6"></div>`);
		scratch.innerHTML = '';

	});

	// describe('performance', () => {
	// 	test('creation', () => {
	// 		const results = [];
	// 		const Foo = ({ name }) => html`<div class="foo">${name}</div>`;
	// 		const statics = [
	// 			'\n<div id=app data-loading="true">\n\t<h1>Hello World</h1>\n\t<ul class="items" id=', '>\n\t',
	// 			'\n\t</ul>\n\t\n\t<', ' name="foo" />\n\t<', ' name="other">content</', '>\n\n</div>'
	// 		];
	// 		let count = 0;
	// 		function go(count) {
	// 			return html(
	// 				statics.concat(['count:', count]),
	// 				`id${count}`,
	// 				html(['<li data-id="','">', '</li>'], 'i'+count, 'some text #'+count),
	// 				Foo, Foo, Foo
	// 			);
	// 		}
	// 		let now = performance.now();
	// 		const start = now;
	// 		while ((now = performance.now()) < start+2000) {
	// 			count++;
	// 			if (results.push(String(go(count)))===10) results.length = 0;
	// 		}
	// 		const elapsed = now - start;
	// 		const hz = count / elapsed * 1000;
	// 		// eslint-disable-next-line no-console
	// 		console.log(`Creation: ${hz|0}/s, average: ${elapsed/count.toFixed(4)}ms`);
	// 		expect(elapsed).toBeGreaterThan(999);
	// 		expect(hz).toBeGreaterThan(10);
	// 	});
	// });
});
