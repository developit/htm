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

import { MINI } from './constants.mjs';

const TAG_SET = 1;
const PROPS_SET = 2;
const PROPS_ASSIGN = 3;
const CHILD_RECURSE = 4;
const CHILD_APPEND = 0;

const MODE_SLASH = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 2;
const MODE_TAGNAME = 3;
const MODE_ATTRIBUTE = 4;

const evaluate = (h, current, fields, args) => {
	for (let i = 1; i < current.length; i++) {
		const field = current[i++];
		const value = typeof field === 'number' ? fields[field] : field;

		if (current[i] === TAG_SET) {
			args[0] = value;
		}
		else if (current[i] === PROPS_SET) {
			(args[1] = args[1] || {})[current[++i]] = value;
		}
		else if (current[i] === PROPS_ASSIGN) {
			args[1] = Object.assign(args[1] || {}, value);
		}
		else if (current[i]) {
			// code === CHILD_RECURSE
			args.push(h.apply(null, evaluate(h, value, fields, ['', null])));
		}
		else {
			// code === CHILD_APPEND
			args.push(value);
		}
	}

	return args;
};

const build = function(statics) {
	const fields = arguments;
	const h = this;

	let mode = MODE_TEXT;
	let buffer = '';
	let quote = '';
	let current = [0];
	let char, propName;

	const commit = field => {
		if (mode === MODE_TEXT && (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g,'')))) {
			if (MINI) {
				current.push(field ? fields[field] : buffer);
			}
			else {
				current.push(field || buffer, CHILD_APPEND);
			}
		}
		else if (mode === MODE_TAGNAME && (field || buffer)) {
			if (MINI) {
				current[1] = field ? fields[field] : buffer;
			}
			else {
				current.push(field || buffer, TAG_SET);
			}
			mode = MODE_WHITESPACE;
		}
		else if (mode === MODE_WHITESPACE && buffer === '...' && field) {
			if (MINI) {
				current[2] = Object.assign(current[2] || {}, fields[field]);
			}
			else {
				current.push(field, PROPS_ASSIGN);
			}
		}
		else if (mode === MODE_WHITESPACE && buffer && !field) {
			if (MINI) {
				(current[2] = current[2] || {})[buffer] = true;
			}
			else {
				current.push(true, PROPS_SET, buffer);
			}
		}
		else if (mode === MODE_ATTRIBUTE && propName) {
			if (MINI) {
				(current[2] = current[2] || {})[propName] = field ? fields[field] : buffer;
			}
			else {
				current.push(field || buffer, PROPS_SET, propName);
			}
			propName = '';
		}
		buffer = '';
	};

	for (let i=0; i<statics.length; i++) {
		if (i) {
			if (mode === MODE_TEXT) {
				commit();
			}
			commit(i);
		}

		for (let j=0; j<statics[i].length; j++) {
			char = statics[i][j];

			if (mode === MODE_TEXT) {
				if (char === '<') {
					// commit buffer
					commit();
					if (MINI) {
						current = [current, '', null];
					}
					else {
						current = [current];
					}
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
					current = current[0];
				}
				mode = current;
				if (MINI) {
					(current = current[0]).push(h.apply(null, mode.slice(1)));
				}
				else {
					(current = current[0]).push(mode, CHILD_RECURSE);
				}
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

	if (MINI) {
		return current.length > 2 ? current.slice(1) : current[1];
	}
	return current;
};

const getCacheMap = (statics) => {
	let tpl = CACHE.get(statics);
	if (!tpl) {
		CACHE.set(statics, tpl = build(statics));
	}
	return tpl;
};

const getCacheKeyed = (statics) => {
	let key = '';
	for (let i = 0; i < statics.length; i++) {
		key += statics[i].length + '-' + statics[i];
	}
	return CACHE[key] || (CACHE[key] = build(statics));
};

const USE_MAP = !MINI && typeof Map === 'function';
const CACHE = USE_MAP ? new Map() : {};
const getCache = USE_MAP ? getCacheMap : getCacheKeyed;

const cached = function(statics) {
	const res = evaluate(this, getCache(statics), arguments, []);
	return res.length > 1 ? res : res[0];
};

export default MINI ? build : cached;
