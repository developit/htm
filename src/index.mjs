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

const CACHE = {};

const TEMPLATE = document.createElement('template');

const reg = /(\$_h\[\d+\])/g;
const nomExp = /([\w-]+)=/g;

export default function html(statics) {
	const tpl = CACHE[statics] || (CACHE[statics] = build(statics));
	// eslint-disable-next-line prefer-rest-params
	return tpl(this, arguments);
}

/** Create a template function given strings from a tagged template. */
function build(statics) {
	const noms = {};
	let str = '', i = 0;
	while (i < statics.length) {
		getNoms(statics[i], noms);
		str += statics[i++] + (i < statics.length ? '$_h[' + i + ']' : '');
	}
	// Template string preprocessing:
	// - replace <${Foo}> with <c c@=${Foo}>
	// - replace <x /> with <x></x>
	// - replace <${Foo}>a<//>b with <c c@=${Foo}>a</c>b
	TEMPLATE.innerHTML = str.replace(/<(?:(\/)\/|(\/?)(\$_h\[\d+\]))/g, '<$1$2c c@=$3').replace(/<([\w:-]+)(\s[^<>]*?)?\/>/gi, '<$1$2></$1>').trim();
	return Function('h', '$_h', 'return ' + walk((TEMPLATE.content || TEMPLATE).firstChild, noms));
}

/** Traverse a DOM tree and serialize it to hyperscript function calls */
function walk(n, noms) {
	if (n.nodeType !== 1) {
		if (n.nodeType === 3 && n.data) return field(n.data, ',');
		return 'null';
	}
	let nodeName = `"${n.localName}"`, str = '', pre, it, prevSpread, anySpread;
	for (let i=0; i<n.attributes.length; i++) {
		let { name } = n.attributes[i];
		const { value } = n.attributes[i];
		name = noms[name] || name;
		if (name=='c@') {
			nodeName = value;
			continue;
		}
		if (name.substring(0,3)==='...') {
			it = name.substring(3);
			pre = str ? (prevSpread ? ',' : '},') : '';
			prevSpread = anySpread = true;
		}
		else {
			it = `"${name.replace(/:(\w)/g, upper)}":${value ? field(value, '+') : true}`;
			pre = str ? (prevSpread ? ',{' : ',') : '{';
			prevSpread = false;
		}
		str += pre + it;
	}
	str = 'h(' + nodeName + ',' + (str ? (anySpread ? 'Object.assign({},' + str + (prevSpread ? '' : '}') + ')' : str + '}') : '{}');
	let child = n.firstChild;
	while (child) {
		str += ',' + walk(child, noms);
		child = child.nextSibling;
	}
	return str + ')';
}

function getNoms(str, noms) {
	let nom;
	while ((nom = nomExp.exec(str)) !== null) noms[nom[1].toLowerCase()] = nom[1];
}

function upper (s, i) {
	return i.toUpperCase();
}

/** Serialize a field to a String or reference for use in generated code. */
function field(value, sep) {
	const matches = value.match(reg);
	let strValue = JSON.stringify(value);
	if (matches != null) {
		if (matches[0] === value) return value;
		strValue = strValue.replace(reg, `"${sep}$1${sep}"`).replace(/"[+,]"/g, '');
		if (sep === ',') strValue = `[${strValue}]`;
	}
	return strValue;
}