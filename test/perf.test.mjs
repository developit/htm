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

import htm from '../src/index.mjs';

const h = (tag, props, ...children) => ({ tag, props, children });
const html = htm.bind(h);

describe('performance', () => {
	test('creation', () => {
		const results = [];
		const Foo = ({ name }) => html`<div class="foo">${name}</div>`;
		const statics = [
			'\n<div id=app data-loading="true">\n\t<h1>Hello World</h1>\n\t<ul class="items" id=', '>\n\t',
			'\n\t</ul>\n\t\n\t<', ' name="foo" />\n\t<', ' name="other">content</', '>\n\n</div>'
		];
		let count = 0;
		function go(count) {
			return html(
				statics.concat(['count:', count]),
				`id${count}`,
				html`<li data-id="${'i'+count}">${'some text #'+count}</li>`,
				Foo, Foo, Foo
			);
		}
		let now = performance.now();
		const start = now;
		while ((now = performance.now()) < start+1000) {
			count++;
			if (results.push(String(go(count)))===10) results.length = 0;
		}
		const elapsed = now - start;
		const hz = count / elapsed * 1000;
		// eslint-disable-next-line no-console
		console.log(`Creation: ${(hz|0).toLocaleString()}/s, average: ${elapsed/count*1000|0}µs`);
		expect(elapsed).toBeGreaterThan(999);
		expect(hz).toBeGreaterThan(1000);
	});

	test('usage', () => {
		const results = [];
		const Foo = ({ name }) => html`<div class="foo">${name}</div>`;
		let count = 0;
		function go(count) {
			return html`
				<div id=app data-loading="true">
					<h1>Hello World</h1>
					<ul class="items" id=${'id' + count}>
						${html`<li data-id="${'i' + count}">${'some text #' + count}</li>`}
					</ul>
					<${Foo} name="foo" />
					<${Foo} name="other">content<//>
				</div>
			`;
		}
		let now = performance.now();
		const start = now;
		while ((now = performance.now()) < start+1000) {
			count++;
			if (results.push(String(go(count)))===10) results.length = 0;
		}
		const elapsed = now - start;
		const hz = count / elapsed * 1000;
		// eslint-disable-next-line no-console
		console.log(`Usage: ${(hz|0).toLocaleString()}/s, average: ${elapsed/count*1000|0}µs`);
		expect(elapsed).toBeGreaterThan(999);
		expect(hz).toBeGreaterThan(100000);
	});
});
