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
const build = (statics) => {
	let mode = MODE_WHITESPACE;
	let out = 'return ';
	let buffer = '';
	let field = '';
	let hasChildren = 0;
	let props = '';
	let propsClose = '';
	let spreadClose = '';
	let quote = 0;
	let slash, charCode, inTag, propName, propHasValue;

	const commit = () => {
		if (!inTag) {
			if (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g,''))) {
				if (hasChildren++) out += ',';
				out += field || stringify(buffer);
			}
		}
		else if (mode === MODE_TAGNAME) {
			if (hasChildren++) out += ',';
			out += 'h(' + (field || stringify(buffer));
			mode = MODE_WHITESPACE;
		}
		else if (mode === MODE_ATTRIBUTE || (mode === MODE_WHITESPACE && buffer === '...')) {
			if (mode === MODE_WHITESPACE) {
				if (!spreadClose) {
					spreadClose = ')';
					if (!props) props = 'Object.assign({}';
					else props = 'Object.assign(' + props;
				}
				props += propsClose + ',' + field;
				propsClose = '';
			}
			else if (propName) {
				if (!props) props += '{';
				else props += ',' + (propsClose ? '' : '{');
				propsClose = '}';
				props += stringify(propName) + ':';
				props += field || ((propHasValue || buffer) && stringify(buffer)) || 'true';
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
	};

	for (let i=0; i<statics.length; i++) {
		if (i > 0) {
			if (!inTag) commit();
			field = `$[${i}]`;
			commit();
		}
		
		for (let j=0; j<statics[i].length; j++) {
			charCode = statics[i].charCodeAt(j);

			if (!inTag) {
				if (charCode === TAG_START) {
					// commit buffer
					commit();
					inTag = 1;
					spreadClose = propsClose = props = '';
					slash = propHasValue = false;
					mode = MODE_TAGNAME;
					continue;
				}
			}
			else {
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
						case TAG_END:
							commit();
							if (mode !== MODE_SKIP) {
								if (!props) {
									out += ',null';
								}
								else {
									out += ',' + props + propsClose + spreadClose;
								}
							}
							if (slash) {
								out += ')';
							}
							inTag = 0;
							props = '';
							mode = MODE_TEXT;
							continue;
						case EQUALS:
							mode = MODE_ATTRIBUTE;
							propHasValue = true;
							propName = buffer;
							buffer = '';
							continue;
						case SLASH:
							if (!slash) {
								slash = true;
								// </foo>
								if (mode === MODE_TAGNAME && !buffer.trim()) {
									buffer = field = '';
									mode = MODE_SKIP;
								}
							}
							continue;
						case TAB:
						case NEWLINE:
						case RETURN:
						case SPACE:
							// <a disabled>
							commit();
							mode = MODE_WHITESPACE;
							continue;
					}
				}
			}
			buffer += statics[i].charAt(j);
		}
	}
	commit();
	return Function('h', '$', out);
};
