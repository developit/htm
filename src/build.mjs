const TAG_SET = 0;
const PROPS_SET = 1;
const PROPS_ASSIGN = 2;
const CHILD_RECURSE = 3;
const CHILD_APPEND = 4;

const MODE_SLASH = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 3;
const MODE_TAGNAME = 4;
const MODE_ATTRIBUTE = 5;

export const evaluate = (h, current, fields) => {
	const args = ['', null];

	for (let i = 1; i < current.length; i++) {
		const field = current[i++];
		const value = field ? fields[field] : current[i];
		
		const code = current[++i];
		if (code === TAG_SET) {
			args[0] = value;
		}
		else if (code === PROPS_SET) {
			(args[1] = args[1] || {})[current[++i]] = value;
		}
		else if (code === PROPS_ASSIGN) {
			args[1] = Object.assign(args[1] || {}, value);
		}
		else if (code === CHILD_RECURSE) {
			args.push(evaluate(h, value, fields));
		}
		else { 	// code === CHILD_APPEND
			args.push(value);
		}
	}

	// eslint-disable-next-line prefer-spread
	return h.apply(null, args);
};

/** Create a template function given strings from a tagged template. */
export const build = (statics) => {
	let mode = MODE_TEXT;
	let buffer = '';
	let quote = '';
	let fallbackPropValue = true;
	let current = [];
	let char, propName, idx;

	const commit = field => {
		if (mode === MODE_TEXT) {
			if (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g,''))) {
				current.push(field, buffer, CHILD_APPEND);
			}
		}
		else if (mode === MODE_TAGNAME && (field || buffer)) {
			current.push(field, buffer, TAG_SET);
			mode = MODE_WHITESPACE;
		}
		else if (mode === MODE_WHITESPACE && buffer === '...') {
			current.push(field, 0, PROPS_ASSIGN);
		}
		else if (mode) {	// mode === MODE_ATTRIBUTE || mode === MODE_WHITESPACE
			if (mode === MODE_WHITESPACE) {
				propName = buffer;
				buffer = '';
			}
			if (propName) {
				current.push(field, buffer || fallbackPropValue, PROPS_SET, propName);
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
			else if (mode !== MODE_TEXT && (idx = '\'">=/\t\n\r '.indexOf(char)) >= 0 && char.indexOf(quote) >= 0) {
				if (idx < 2) {
					// char is a quote && (quote === char || quote is empty)
					quote = quote ? '' : char;
				}
				else if (idx === 2) {
					// char === '>'
					commit();

					if (!mode) {
						// encountered a slash in current tag
												
						if (current.length === 1) {
							// no tag name or attributes before the slash
							current = current[0];
						}
						current[0].push(0, current, CHILD_RECURSE);
						current = current[0];
					}
					mode = MODE_TEXT;
				}
				else if (idx === 3) {
					// char === '='
					if (mode) {
						mode = MODE_ATTRIBUTE;
						propName = buffer;
						buffer = fallbackPropValue = '';
					}
				}
				else if (idx === 4) {
					// char === '/'
					commit();
					mode = MODE_SLASH;
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