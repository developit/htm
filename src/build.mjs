const MODE_SLASH = 0;
const MODE_TEXT = 1;
const MODE_WHITESPACE = 2;
const MODE_TAGNAME = 3;
const MODE_ATTRIBUTE = 4;

export const build = (h, fields) => {
	const root = [];
	const stack = [];
	let mode = MODE_TEXT;
	let buffer = '';
	let quote = '';
	let args = root;
	let char, propName, idx;

	const commit = () => {
		if (mode === MODE_TEXT && (buffer = buffer.replace(/^\s*\n\s*|\s*\n\s*$/g, ''))) {
			args.push(buffer);
		}
		if (mode === MODE_TAGNAME && buffer) {
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

	for (let i=0; i<fields[0].length; i++) {
		if (i) {
			if (mode === MODE_TEXT) {
				commit();
				args.push(fields[i]);
			}
			else if (mode === MODE_TAGNAME) {
				args[0] = fields[i];
				mode = MODE_WHITESPACE;
			}
			else if (mode === MODE_WHITESPACE && buffer === '...') {
				args[1] = Object.assign(args[1] || {}, fields[i]);
			}
			else if (mode === MODE_ATTRIBUTE && propName) {
				(args[1] = args[1] || {})[propName] = fields[i];
				propName = '';
			}
			buffer = '';
		}
		
		for (let j=0; j<fields[0][i].length; j++) {
			char = fields[0][i][j];

			if (mode === MODE_TEXT && char === '<') {
				// commit buffer
				commit();
				stack.push(args);
				args = ['', null];
				buffer = '';
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
							// no tag name before the slash
							args = stack.pop();
						}
						// eslint-disable-next-line prefer-spread
						mode = h.apply(null, args); // Use 'mode' as a temporary variable
						(args = stack.pop()).push(mode);
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
	return root.length < 2 ? root[0] : root;
};