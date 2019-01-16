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

export const evaluate = (h, current, fields, args) => {
	for (let i = 1; i < current.length; i++) {
		const field = current[i++];
		const value = field ? fields[field] : current[i];

		if (current[++i] === TAG_SET) {
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


export const build = (statics) => {
	let mode = MODE_TEXT;
	let buffer = '';
	let quote = '';
	let current = [0];
	let char, propName, idx;

	const commit = field => {
		if (mode === MODE_TEXT && (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g,'')))) {
			current.push(field, buffer, CHILD_APPEND);
		}
		else if (mode === MODE_TAGNAME && (field || buffer)) {
			current.push(field, buffer, TAG_SET);
			mode = MODE_WHITESPACE;
		}
		else if (mode === MODE_WHITESPACE && buffer === '...' && field) {
			current.push(field, 0, PROPS_ASSIGN);
		}
		else if (mode === MODE_WHITESPACE && buffer && !field) {
			current.push(0, true, PROPS_SET, buffer);
		}
		else if (mode === MODE_ATTRIBUTE && propName) {
			current.push(field, buffer, PROPS_SET, propName);
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

			if (mode === MODE_TEXT && char === '<') {
				// commit buffer
				commit();
				current = [current];
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
					mode = MODE_TEXT;
				}
				else if (idx === 3) {
					// char === '='
					if (mode) {
						mode = MODE_ATTRIBUTE;
						propName = buffer;
						buffer = '';
					}
				}
				else if (idx === 4) {
					// char === '/'
					if (mode) {
						commit();
						if (mode === MODE_TAGNAME) {
							current = current[0];
						}
						mode = current;
						(current = current[0]).push(0, mode, CHILD_RECURSE);
						mode = MODE_SLASH;
					}
				}
				else if (mode) {
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
	return current;
};