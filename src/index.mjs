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

const reg = /(\$_\[\d+\])/g;

export default function html(statics) {
	const tpl = CACHE[statics] || (CACHE[statics] = build(statics));
	// eslint-disable-next-line prefer-rest-params
	return tpl(this, arguments);
}

function escape(str) {
	return str.replace(/([_A-Z])/g, '$_$1');
}

function unescape(str) {
	return str.replace(/\$_([_A-Z])/gi, (_, c) => c.toUpperCase());
}

/** Create a template function given strings from a tagged template. */
function build(statics) {
	let str = escape(statics[0]), i = 1;
	while (i < statics.length) {
		str += '$_[' + i + ']' + escape(statics[i++]);
	}
	// Template string preprocessing:
	// - replace <${Foo}> with <c $_=${Foo}>
	// - replace <x /> with <x></x>
	// - replace <${Foo}>a<//>b with <c $_=${Foo}>a</c>b
	TEMPLATE.innerHTML = str
		.replace(/<(?:(\/)\/|(\/?)(\$_\[\d+\]))/g, '<$1$2c $_=$3')
		.replace(/<([\w:-]+)(?:\s[^<>]*?)?\/>/g, '$&</$1>')
		.trim();
	return Function('h', '$_', 'return ' + unescape(walk((TEMPLATE.content || TEMPLATE).firstChild)));
}

/** Traverse a DOM tree and serialize it to hyperscript function calls */
function walk(n) {
	if (n.nodeType != 1) {
		if (n.nodeType == 3 && n.data) return field(n.data, ',');
		return 'null';
	}
	let str = '',
		nodeName = field(n.localName, str),
		sub = '',
		start = ',({';
	for (let i=0; i<n.attributes.length; i++) {
		const name = n.attributes[i].name;
		const value = n.attributes[i].value;
		if (name=='$_') {
			nodeName = value;
		}
		else if (name.substring(0,3)=='...') {
			sub = '';
			start = ',Object.assign({';
			str += '},' + name.substring(3) + ',{';
		}
		else {
			str += `${sub}${JSON.stringify(name)}:${value ? field(value, '+') : true}`;
			sub = ',';
		}
	}
	str = 'h(' + nodeName + start + str + '})';
	let child = n.firstChild;
	while (child) {
		str += ',' + walk(child);
		child = child.nextSibling;
	}
	return str + ')';
}

/** Serialize a field to a String or reference for use in generated code. */
function field(value, sep) {
	const matches = value.match(reg);
	let strValue = JSON.stringify(value);
	if (matches != null) {
		if (matches[0] === value) return value;
		strValue = strValue.replace(reg, `"${sep}$1${sep}"`).replace(/"[+,]"/g, '');
		if (sep == ',') strValue = `[${strValue}]`;
	}
	return strValue;
}