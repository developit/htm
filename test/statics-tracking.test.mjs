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

const html = htm.bind(function(tag, props, ...children) {
	return [this, ...children];
});

describe('htm statics tracking', () => {
	test('basic functionality', () => {
		expect(html``).toEqual(undefined);
		expect(html`<div />`).toEqual([3]);
		expect(html`<div>${'a'}</div>`).toEqual([1, 'a']);
		expect(html`<div x=1 />`).toEqual([3]);
		expect(html`<div x=1>${'a'}</div>`).toEqual([1, 'a']);
		expect(html`<div x=${1} />`).toEqual([0]);
		expect(html`<div x=${1}>${'a'}</div>`).toEqual([0, 'a']);
	});

	test('dynamic root, static descendants', () => {
		expect(html`<div x=${1}><a><b /></a></div>`).toEqual([0, [3, [3]]]);
	});

	test('mixed static + dynamic descendants', () => {
		expect(html`<div><a x=1 /><a x=${1}/></div>`).toEqual([1, [3], [0]]);
		expect(html`<div><a><b x=1 /></a><a><b x=${1}/></a></div>`).toEqual([1, [3, [3]], [1, [0]]]);
	});
});
