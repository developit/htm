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
	test('empty', () => {
		expect(html``).toEqual(undefined);
	});

	test('single named elements', () => {
		expect(html`<div />`).toEqual({ tag: 'div', props: null, children: [] });
		expect(html`<div/>`).toEqual({ tag: 'div', props: null, children: [] });
		expect(html`<span />`).toEqual({ tag: 'span', props: null, children: [] });
	});
	
	test('multiple root elements', () => {
		expect(html`<a /><b></b><c><//>`).toEqual([
			{ tag: 'a', props: null, children: [] },
			{ tag: 'b', props: null, children: [] },
			{ tag: 'c', props: null, children: [] }
		]);
	});

	test('single dynamic tag name', () => {
		expect(html`<${'foo'} />`).toEqual({ tag: 'foo', props: null, children: [] });
		function Foo () {}
		expect(html`<${Foo} />`).toEqual({ tag: Foo, props: null, children: [] });
	});

	test('single boolean prop', () => {
		expect(html`<a disabled />`).toEqual({ tag: 'a', props: { disabled: true }, children: [] });
	});

	test('two boolean props', () => {
		expect(html`<a invisible disabled />`).toEqual({ tag: 'a', props: { invisible: true, disabled: true }, children: [] });
	});

	test('single prop with empty value', () => {
		expect(html`<a href="" />`).toEqual({ tag: 'a', props: { href: '' }, children: [] });
	});

	test('two props with empty values', () => {
		expect(html`<a href="" foo="" />`).toEqual({ tag: 'a', props: { href: '', foo: '' }, children: [] });
	});

	test('single prop with empty name', () => {
		expect(html`<a ""="foo" />`).toEqual({ tag: 'a', props: { '': 'foo' }, children: [] });
	});

	test('single prop with static value', () => {
		expect(html`<a href="/hello" />`).toEqual({ tag: 'a', props: { href: '/hello' }, children: [] });
	});
	
	test('single prop with static value followed by a single boolean prop', () => {
		expect(html`<a href="/hello" b />`).toEqual({ tag: 'a', props: { href: '/hello', b: true }, children: [] });
	});

	test('two props with static values', () => {
		expect(html`<a href="/hello" target="_blank" />`).toEqual({ tag: 'a', props: { href: '/hello', target: '_blank' }, children: [] });
	});

	test('single prop with dynamic value', () => {
		expect(html`<a href=${'foo'} />`).toEqual({ tag: 'a', props: { href: 'foo' }, children: [] });
	});

	test('two props with dynamic values', () => {
		function onClick(e) { }
		expect(html`<a href=${'foo'} onClick=${onClick} />`).toEqual({ tag: 'a', props: { href: 'foo', onClick }, children: [] });
	});

	test('prop with multiple static and dynamic values get concatenated as strings', () => {
		expect(html`<a href="before${'foo'}after" />`).toEqual({ tag: 'a', props: { href: 'beforefooafter' }, children: [] });
		expect(html`<a href=${1}${1} />`).toEqual({ tag: 'a', props: { href: '11' }, children: [] });
		expect(html`<a href=${1}between${1} />`).toEqual({ tag: 'a', props: { href: '1between1' }, children: [] });
	});

	test('spread props', () => {
		expect(html`<a ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { foo: 'bar' }, children: [] });
		expect(html`<a b ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
		expect(html`<a b c ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] });
		expect(html`<a ...${{ foo: 'bar' }} b />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
		expect(html`<a b="1" ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: '1', foo: 'bar' }, children: [] });
		expect(html`<a x="1"><b y="2" ...${{ c: 'bar' }}/></a>`).toEqual(h('a', { x: '1' }, h('b', { y: '2', c: 'bar' }) ));
		expect(html`<a b=${2} ...${{ c: 3 }}>d: ${4}</a>`).toEqual(h('a',{ b: 2, c: 3 }, 'd: ', 4));
		expect(html`<a ...${{ c: 'bar' }}><b ...${{ d: 'baz' }}/></a>`).toEqual(h('a', { c: 'bar' }, h('b', { d: 'baz' }) ));
	});

	test('multiple spread props in one element', () => {
		expect(html`<a ...${{ foo: 'bar' }} ...${{ quux: 'baz' }} />`).toEqual({ tag: 'a', props: { foo: 'bar', quux: 'baz' }, children: [] });
	});
  
	test('mixed spread + static props', () => {
		expect(html`<a b ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
		expect(html`<a b c ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] });
		expect(html`<a ...${{ foo: 'bar' }} b />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
		expect(html`<a ...${{ foo: 'bar' }} b c />`).toEqual({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] });
	});

	test('closing tag', () => {
		expect(html`<a></a>`).toEqual({ tag: 'a', props: null, children: [] });
		expect(html`<a b></a>`).toEqual({ tag: 'a', props: { b: true }, children: [] });
	});

	test('auto-closing tag', () => {
		expect(html`<a><//>`).toEqual({ tag: 'a', props: null, children: [] });
	});

	test('text child', () => {
		expect(html`<a>foo</a>`).toEqual({ tag: 'a', props: null, children: ['foo'] });
		expect(html`<a>foo bar</a>`).toEqual({ tag: 'a', props: null, children: ['foo bar'] });
		expect(html`<a>foo "<b /></a>`).toEqual({ tag: 'a', props: null, children: ['foo "', { tag: 'b', props: null, children: [] }] });
	});

	test('dynamic child', () => {
		expect(html`<a>${'foo'}</a>`).toEqual({ tag: 'a', props: null, children: ['foo'] });
	});

	test('mixed text + dynamic children', () => {
		expect(html`<a>${'foo'}bar</a>`).toEqual({ tag: 'a', props: null, children: ['foo', 'bar'] });
		expect(html`<a>before${'foo'}after</a>`).toEqual({ tag: 'a', props: null, children: ['before', 'foo', 'after'] });
		expect(html`<a>foo${null}</a>`).toEqual({ tag: 'a', props: null, children: ['foo', null] });
	});

	test('element child', () => {
		expect(html`<a><b /></a>`).toEqual(h('a', null, h('b', null)));
	});

	test('multiple element children', () => {
		expect(html`<a><b /><c /></a>`).toEqual(h('a', null, h('b', null), h('c', null)));
		expect(html`<a x><b y /><c z /></a>`).toEqual(h('a', { x: true }, h('b', { y: true }), h('c', { z: true })));
		expect(html`<a x=1><b y=2 /><c z=3 /></a>`).toEqual(h('a', { x: '1' }, h('b', { y: '2' }), h('c', { z: '3' })));
		expect(html`<a x=${1}><b y=${2} /><c z=${3} /></a>`).toEqual(h('a', { x: 1 }, h('b', { y: 2 }), h('c', { z: 3 })));
	});

	test('mixed typed children', () => {
		expect(html`<a>foo<b /></a>`).toEqual(h('a', null, 'foo', h('b', null)));
		expect(html`<a><b />bar</a>`).toEqual(h('a', null, h('b', null), 'bar'));
		expect(html`<a>before<b />after</a>`).toEqual(h('a', null, 'before', h('b', null), 'after'));
		expect(html`<a>before<b x=1 />after</a>`).toEqual(h('a', null, 'before', h('b', { x: '1' }), 'after'));
		expect(html`
			<a>
				before
				${'foo'}
				<b />
				${'bar'}
				after
			</a>
		`).toEqual(h('a', null, 'before', 'foo', h('b', null), 'bar', 'after'));
	});

	test('hyphens (-) are allowed in attribute names', () => {
		expect(html`<a b-c></a>`).toEqual(h('a', { 'b-c': true }));
	});
	
	test('NUL characters are allowed in attribute values', () => {
		expect(html`<a b="\0"></a>`).toEqual(h('a', { b: '\0' }));
		expect(html`<a b="\0" c=${'foo'}></a>`).toEqual(h('a', { b: '\0', c: 'foo' }));
	});
	
	test('NUL characters are allowed in text', () => {
		expect(html`<a>\0</a>`).toEqual(h('a', null, '\0'));
		expect(html`<a>\0${'foo'}</a>`).toEqual(h('a', null, '\0', 'foo'));
	});
	
	test('cache key should be unique', () => {
		html`<a b="${'foo'}" />`;
		expect(html`<a b="\0" />`).toEqual(h('a', { b: '\0' }));
		expect(html`<a>${''}9aaaaaaaaa${''}</a>`).not.toEqual(html`<a>${''}0${''}aaaaaaaaa${''}</a>`);
		expect(html`<a>${''}0${''}aaaaaaaa${''}</a>`).not.toEqual(html`<a>${''}.8aaaaaaaa${''}</a>`);
	});
	
	test('do not mutate spread variables', () => {
		const obj = {};
		html`<a ...${obj} b="1" />`;
		expect(obj).toEqual({});
	});
});
