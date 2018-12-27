const stringify = JSON.stringify;

const MODE_SKIP = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 3;
const MODE_TAGNAME = 4;
const MODE_ATTRIBUTE = 5;

/** Create a template function given strings from a tagged template. */
export const build = (statics) => {
	let mode = MODE_TEXT;
	let out = '';
	let outClose = '';
	let buffer = '';
	let tagClose = '';
	let childClose = '';
	let props = '';
	let propsClose = '';
	let spreadClose = '';
	let quote = '';
	let depth = 0;
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
				if (!(depth++) && out && !outClose) {
					out = '[' + out;
					outClose = ']';
				}
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
						depth--;
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
	return Function('h', '$', 'return ' + out + outClose);
};