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

const MODE_SLASH = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 2;
const MODE_TAGNAME = 3;
const MODE_ATTRIBUTE = 4;

const htm = function(statics) {
	const root = [];
	const stack = [];
	let mode = MODE_TEXT;
	let buffer = '';
	let quote = '';
	let args = root;
	let char, propName;

	const commit = () => {
		if (mode === MODE_TEXT && (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g, ''))) {
			args.push(buffer);
		}
		else if (mode === MODE_TAGNAME && buffer) {
			args[0] = buffer;
			mode = MODE_WHITESPACE;
		}
		else if (mode === MODE_WHITESPACE && buffer) {
			(args[1] = args[1] || {})[buffer] = true;
		}
		else if (mode === MODE_ATTRIBUTE && propName) {
			(args[1] = args[1] || {})[propName] = buffer;
			propName = '';
		}
		buffer = '';
	};

	for (let i=0; i<statics.length; i++) {
		if (i) {
			if (mode === MODE_TEXT) {
				commit();
				args.push(arguments[i]);
			}
			else if (mode === MODE_TAGNAME) {
				args[0] = arguments[i];
				mode = MODE_WHITESPACE;
			}
			else if (mode === MODE_WHITESPACE && buffer === '...') {
				args[1] = Object.assign(args[1] || {}, arguments[i]);
			}
			else if (mode === MODE_ATTRIBUTE && propName) {
				(args[1] = args[1] || {})[propName] = arguments[i];
				propName = '';
			}
			buffer = '';
		}
		
		for (let j=0; j<arguments[0][i].length; j++) {
			char = arguments[0][i][j];

			if (mode === MODE_TEXT) {
				if (char === '<') {
					// commit buffer
					commit();
					stack.push(args);
					args = ['', null];
					buffer = '';
					mode = MODE_TAGNAME;
				}
				else {
					buffer += char;
				}
			}
			else if (quote) {
				if (char === quote) {
					quote = '';
				}
				else {
					buffer += char;
				}
			}
			else if (char === '"' || char === "'") {
				quote = char;
			}
			else if (char === '>') {
				commit();
				mode = MODE_TEXT;
			}
			else if (!mode) {
				// Ignore everything until the tag ends
			}
			else if (char === '=') {
				mode = MODE_ATTRIBUTE;
				propName = buffer;
				buffer = '';
			}
			else if (char === '/') {
				commit();
				if (mode === MODE_TAGNAME) {
					// no tag name before the slash
					args = stack.pop();
				}
				// eslint-disable-next-line prefer-spread
				mode = this.apply(null, args); // Use 'mode' as a temporary variable
				(args = stack.pop()).push(mode);
				mode = MODE_SLASH;
			}
			else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
				// <a disabled>
				commit();
				mode = MODE_WHITESPACE;
			}
			else {
				buffer += char;
			}
		}
	}
	commit();
	return root.length < 2 ? root[0] : root;
};

export default htm;