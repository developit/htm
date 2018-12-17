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

export default function html(statics) {
	const str = statics.join('\0');
	const tpl = CACHE[str] || (CACHE[str] = build(str));
	// eslint-disable-next-line prefer-rest-params
	return tpl(this, arguments);
}

const TAG_START = 60;
const TAG_END = 62;
const EQUALS = 61;
const QUOTE_DOUBLE = 34;
const QUOTE_SINGLE = 39;
const TAB = 9;
const NEWLINE = 10;
const RETURN = 13;
const SPACE = 32;
const SLASH = 47;

const MODE_WHITESPACE = 0;
const MODE_TEXT = 1;
const MODE_TAGNAME = 9;
const MODE_ATTRIBUTE = 13;
const MODE_SKIP = 47;

/** Create a template function given strings from a tagged template. */
function build(input) {
	let out = 'return ';
	let buffer = '';
	let mode = MODE_WHITESPACE;
	let fieldIndex = 1;
	let field = '';
	let hasChildren = 0;
	let propCount = 0;
	let spreads = 0;
	let quote = 0;
	let spread, slash, charCode, inTag, propName, propHasValue;

	function commit() {
		if (!inTag) {
			if (field || (buffer = buffer.trim())) {
				if (hasChildren++) out += ',';
				out += field || JSON.stringify(buffer);
			}
		}
		else if (mode === MODE_TAGNAME) {
			if (hasChildren++) out += ',';
			out += 'h(' + (field || JSON.stringify(buffer));
			mode = MODE_WHITESPACE;
		}
		else if (mode === MODE_ATTRIBUTE || (mode === MODE_WHITESPACE && buffer === '...')) {
			if (mode === MODE_WHITESPACE) {
				spread = true;
				if (!spreads++) {
					if (propCount === 0) out += ',Object.assign({},';
					else out = out.replace(/,\(\{(.*?)$/, ',Object.assign({},{$1') + '},';
				}
				out += field + ',{';
				propCount++;
			}
			else if (propName) {
				if (!spread) out += ',';
				if (propCount === 0) out += '({';
				out += JSON.stringify(propName) + ':';
				out += field || ((propHasValue || buffer) && JSON.stringify(buffer)) || 'true';
				propName = '';
				spread = false;
				propCount++;
			}
			propHasValue = false;
		}
		else if (mode === MODE_WHITESPACE) {
			mode = MODE_ATTRIBUTE;
			// we're in an attribute name
			propName = buffer;
			buffer = field = '';
			commit();
			mode = MODE_WHITESPACE;
		}
		buffer = field = '';
	}

	for (let i=0; i<input.length; i++) {
		charCode = input.charCodeAt(i);
		field = '';

		if (charCode === QUOTE_SINGLE || charCode === QUOTE_DOUBLE) {
			if (quote === charCode) {
				quote = 0;
				continue;
			}
			if (quote === 0) {
				quote = charCode;
				continue;
			}
		}

		if (charCode === 0) {
			if (!inTag) commit();
			field = `$_h[${fieldIndex++}]`;
			commit();
			continue;
		}

		if (quote === 0) {
			switch (charCode) {
				case TAG_START:
					if (!inTag) {
						// commit buffer
						commit();
						inTag = true;
						propCount = 0;
						slash = spread = propHasValue = false;
						mode = MODE_TAGNAME;
						continue;
					}
				
				case TAG_END:
					if (inTag) {
						commit();
						if (mode !== MODE_SKIP) {
							if (propCount === 0) {
								out += ',null';
							}
							else {
								out += '})';
							}
						}
						if (slash) {
							out += ')';
						}
						inTag = false;
						propCount = 0;
						mode = MODE_TEXT;
						continue;
					}
				
				case EQUALS:
					if (inTag) {
						mode = MODE_ATTRIBUTE;
						propHasValue = true;
						propName = buffer;
						buffer = '';
						continue;
					}

				case SLASH:
					if (inTag) {
						if (!slash) {
							slash = true;
							// </foo>
							if (mode === MODE_TAGNAME && !field && !buffer.trim().length) {
								buffer = field = '';
								mode = MODE_SKIP;
							}
						}
						continue;
					}
				case TAB:
				case NEWLINE:
				case RETURN:
				case SPACE:
					// <a disabled>
					if (inTag) {
						commit();
						continue;
					}
			}
		}

		buffer += input.charAt(i);

	}
	commit();
	return Function('h', '$_h', out);
}
