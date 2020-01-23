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

describe('htm', () => {
	test('should cache static subtrees', () => {
		const x = () => html`<div>a</div>`;
		const a = x();
		const b = x();
		expect(a).toEqual({ tag: 'div', props: null, children: ['a'] });
		expect(b).toEqual({ tag: 'div', props: null, children: ['a'] });
		expect(a).toBe(b);
	});

	test('should have a different cache for each h', () => {
		let tmp = htm.bind(() => 1);
		const x = () => tmp`<div>a</div>`;
		const a = x();
		tmp = htm.bind(() => 2);
		const b = x();

		expect(a).toBe(1);
		expect(b).toBe(2);
	});

	describe('`this` in the h function', () => {
		const html = htm.bind(function() {
			return this;
		});

		test('stays the same for each call site)', () => {
			const x = () => html`<div>a</div>`;
			const a = x();
			const b = x();
			expect(a).toBe(b);
		});

		test('is different for each call site', () => {
			const a = html`<div>a</div>`;
			const b = html`<div>a</div>`;
			expect(a).not.toBe(b);
		});

		test('is specific to each h function', () => {
			let tmp = htm.bind(function() { return this; });
			const x = () => tmp`<div>a</div>`;
			const a = x();
			tmp = htm.bind(function() { return this; });
			const b = x();
			expect(a).not.toBe(b);
		});
	});

	describe('`this[0]` in the h function contains the staticness bits', () => {
		const html = htm.bind(function() {
			return this[0];
		});

		test('should be 0 for static subtrees', () => {
			expect(html`<div></div>`).toBe(0);
			expect(html`<div>a</div>`).toBe(0);
			expect(html`<div><a /></div>`).toBe(0);
		});

		test('should be 2 for static nodes with some dynamic children', () => {
			expect(html`<div>${'a'}<b /></div>`).toBe(2);
			expect(html`<div><a y=${2} /><b /></div>`).toBe(2);
		});

		test('should be 1 for dynamic nodes with all static children', () => {
			expect(html`<div x=${1}><a /><b /></div>`).toBe(1);
		});

		test('should be 3 for dynamic nodes with some dynamic children', () => {
			expect(html`<div x=${1}><a y=${2} /><b /></div>`).toBe(3);
		});
	});

	describe('the h function should be able to modify `this[0]`', () => {
		test('should be able to force subtrees to be static', () => {
			function wrapH(h) {
				return function(type, props, ...children) {
					if (props['@static']) {
						this[0] &= ~3;
					}
					return h(type, props, ...children);
				};
			}

			const html = htm.bind(wrapH(h));
			const x = () => html`<div @static>${'a'}</div>`;
			const a = x();
			const b = x();
			expect(a).toEqual({ tag: 'div', props: { '@static': true }, children: ['a'] });
			expect(b).toEqual({ tag: 'div', props: { '@static': true }, children: ['a'] });
			expect(a).toBe(b);
		});
	});
});
