const TAG_SET = 0;
const PROPS_SET = 1;
const PROPS_ASSIGN = 2;
const CHILD_RECURSE = 3;
const CHILD_APPEND = 4;

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
		else if (code === CHILD_APPEND) {
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
	let quote = -1;
	let fallbackPropValue = true;
	let charCode, propName, current;

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
		else if (mode === MODE_ATTRIBUTE || mode === MODE_WHITESPACE) {
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
			if (mode === MODE_TEXT) commit();
			commit(i);
		}
		
		for (let j=0; j<statics[i].length; j++) {
			charCode = statics[i].charCodeAt(j);

			if (mode === MODE_TEXT) {
				if (charCode === TAG_START) {
					// commit buffer
					commit();
					current = [current];
					mode = MODE_TAGNAME;
					continue;
				}
			}
			else {
				if (quote === charCode) {
					quote = -1;
					continue;
				}
				
				if (quote < 0) {
					switch (charCode) {
						case QUOTE_SINGLE:
						case QUOTE_DOUBLE:
							quote = charCode;
							continue;
						case TAG_END:
							commit();

							if (!mode) {
								if (current.length === 1) {
									current = current[0] || current;
								}
								if (current[0]) {
									current[0].push(0, current, CHILD_RECURSE);
								}
								current = current[0] || current;
							}
							mode = MODE_TEXT;
							continue;
						case EQUALS:
							if (mode) {
								mode = MODE_ATTRIBUTE;
								propName = buffer;
								buffer = fallbackPropValue = '';
							}
							continue;
						case SLASH:
							commit();
							mode = MODE_SLASH;
							continue;
						case TAB:
						case NEWLINE:
						case RETURN:
						case SPACE:
							if (mode) {
								// <a disabled>
								commit();
								mode = MODE_WHITESPACE;
							}
							continue;
					}
				}
			}
			buffer += statics[i].charAt(j);
		}
	}
	commit();
	return current;
};