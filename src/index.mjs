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

const stringify = JSON.stringify;

export default function html(statics) {
	let key = '.';
	for (let i=0; i<statics.length; i++) key += statics[i].length + ',' + statics[i];
	const tpl = CACHE[key] || (CACHE[key] = build(statics));

	// eslint-disable-next-line prefer-rest-params
	return tpl(this, arguments);
}

const MODE_SKIP = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 3;
const MODE_TAGNAME = 4;
const MODE_ATTRIBUTE = 5;

/** Create a template function given strings from a tagged template. */
const build = (statics) => {
	let mode = MODE_TEXT;
	let out = 'return ';
	let buffer = '';
	let tagClose = '';
	let childClose = '';
	let props = '';
	let propsClose = '';
	let spreadClose = '';
	let quote = '';
	let fallbackPropValue = true;
	let char, propName, idx;

	const commit = field => {
		if (mode === MODE_TEXT) {
			if (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g,''))) {
				out += childClose + (field || stringify(buffer));
				childClose = ',';
			}
		}
		else if (mode === MODE_TAGNAME) {
			out += childClose + 'h(' + (field || stringify(buffer));
			childClose = ',';
			mode = MODE_WHITESPACE;
		}
		else if (mode === MODE_WHITESPACE && buffer === '...') {
			if (!spreadClose) {
				props = 'Object.assign(' + (props || '{}');
			}
			props += propsClose + ',' + (field || '');
			propsClose = '';
			spreadClose = ')';
		}
		else if (mode === MODE_ATTRIBUTE || mode === MODE_WHITESPACE) {
			if (mode === MODE_WHITESPACE) {
				propName = buffer;
				buffer = '';
			}
			if (propName) {
				props += (props ? ',' + (propsClose ? '' : '{') : '{') + stringify(propName) + ':' + (field || stringify(buffer || fallbackPropValue));
				propsClose = '}';
				propName = '';
			}
			fallbackPropValue = true;
		}
		buffer = '';
	};

	for (let i=0; i<statics.length; i++) {
		if (i) {
			if (mode === MODE_TEXT) {
				commit();
			}
			commit(`$[${i}]`);
		}
		
		for (let j=0; j<statics[i].length; j++) {
			char = statics[i][j];

			if (mode === MODE_TEXT && char === '<') {
				// commit buffer
				commit();
				tagClose = spreadClose = propsClose = props = '';
				mode = MODE_TAGNAME;
			}
			else if (mode !== MODE_TEXT && (char === quote || !quote) && (idx = '\'">=/\t\n\r '.indexOf(char)) >= 0) {
				if (idx < 2) {
					// char === '"' || char === "'"
					quote = quote ? '' : char;
				}
				else if (idx === 2) {
					// char === '>'
					commit();
					if (mode !== MODE_SKIP) {
						out += ',' + (props + propsClose + spreadClose || null);
					}
					out += tagClose;
					mode = MODE_TEXT;
					commit();
				}
				else if (idx === 3) {
					// char === '='
					mode = MODE_ATTRIBUTE;
					propName = buffer;
					buffer = fallbackPropValue = '';
				}
				else if (idx === 4) {
					// char === '/'
					if (!tagClose) {
						tagClose = ')';
						// </foo>
						if (mode === MODE_TAGNAME && !buffer.trim()) {
							buffer = '';
							mode = MODE_SKIP;
						}
					}
				}
				else {
					// char is a whitespace
					// <a disabled>
					commit();
					mode = MODE_WHITESPACE;
				}
			}
			else {
				buffer += char;
			}
		}
	}
	commit();
	return Function('h', '$', out);
};