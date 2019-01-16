const stringify = JSON.stringify;

const MODE_SKIP = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 2;
const MODE_TAGNAME = 3;
const MODE_ATTRIBUTE = 4;

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
	let char, propName;
	
	const commit = field => {
		if (mode === MODE_TEXT && (field || (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g,'')))) {
			out += childClose + (field || stringify(buffer));
			childClose = ',';
		}
		else if (mode === MODE_TAGNAME && (field || buffer)) {
			out += childClose + 'h(' + (field || stringify(buffer));
			childClose = ',';
			mode = MODE_WHITESPACE;
		}
		else if (mode === MODE_WHITESPACE && buffer === '...' && field) {
			if (!spreadClose) {
				props = 'Object.assign(' + (props || '{}');
			}
			props += propsClose + ',' + field;
			propsClose = '';
			spreadClose = ')';
		}
		else if (mode === MODE_WHITESPACE && buffer && !field) {
			props += (props ? ',' + (propsClose ? '' : '{') : '{') + stringify(buffer) + ':true';
			propsClose = '}';
		}
		else if (mode === MODE_ATTRIBUTE && propName) {
			props += (props ? ',' + (propsClose ? '' : '{') : '{') + stringify(propName) + ':' + (field || stringify(buffer));
			propsClose = '}';
			propName = '';
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

			if (mode === MODE_TEXT) {
				if (char === '<') {
					// commit buffer
					commit();
					tagClose = spreadClose = propsClose = props = '';
					if (!(depth++) && out && !outClose) {
						out = '[' + out;
						outClose = ']';
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
				if (mode) {
					out += ',' + (props + propsClose + spreadClose || null);
				}
				out += tagClose;
				mode = MODE_TEXT;
			}
			else if (tagClose) {
				// Skip the rest of the tag
			}
			else if (char === '=') {
				mode = MODE_ATTRIBUTE;
				propName = buffer;
				buffer = '';
			}
			else if (char === '/') {
				// </foo>
				commit();
				if (mode === MODE_TAGNAME) {
					mode = MODE_SKIP;
					buffer = '';
				}
				depth--;
				tagClose = ')';
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
	return Function('h', '$', 'return ' + out + outClose);
};