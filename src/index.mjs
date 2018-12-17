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
	const key = statics.reduce((key, s) => key + s.length + '$' + s, '');
	const tpl = CACHE[key] || (CACHE[key] = build(statics));
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
function build(statics) {
	let out = 'return ';
	let buffer = '';
	let mode = MODE_WHITESPACE;
	let field = '';
	let hasChildren = 0;
	let props = '';
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
				if (!spread) {
					spread = true;
					if (!props) props = 'Object.assign({},';
					else props = 'Object.assign({},' + props + '},';
				}
				props += field + ',{';
			}
			else if (propName) {
				if (!props) props += '{';
				else if (!props.endsWith('{')) props += ',';
				props += JSON.stringify(propName) + ':';
				props += field || ((propHasValue || buffer) && JSON.stringify(buffer)) || 'true';
				propName = '';
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

	for (let i=0; i<statics.length; i++) {
		if (i > 0) {
			if (!inTag) commit();
			field = `$_h[${i}]`;
			commit();
		}
		
		const input = statics[i];
		for (let j=0; j<input.length; j++) {
			charCode = input.charCodeAt(j);
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
			
			if (quote === 0) {
				switch (charCode) {
					case TAG_START:
						if (!inTag) {
							// commit buffer
							commit();
							inTag = true;
							props = '';
							slash = spread = propHasValue = false;
							mode = MODE_TAGNAME;
							continue;
						}
					
					case TAG_END:
						if (inTag) {
							commit();
							if (mode !== MODE_SKIP) {
								if (!props) {
									out += ',null';
								}
								else {
									out += ',' + props + '}' + (spread ? ')' : '');
								}
							}
							if (slash) {
								out += ')';
							}
							spread = inTag = false;
							props = '';
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
							mode = MODE_WHITESPACE;
							continue;
						}
				}
			}

			buffer += input.charAt(j);
		}
	}
	commit();
	return Function('h', '$_h', out);
}
