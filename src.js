const CACHE = {};

const TEMPLATE = document.createElement('template');

const reg = /(\$_h\[\d+\])/g;

export default function html(statics) {
	const tpl = CACHE[statics] || (CACHE[statics] = build(statics));
	// eslint-disable-next-line prefer-rest-params
	return tpl(this, arguments);
}


/** Create a template function given strings from a tagged template literal. */
function build(statics) {
	let str = statics[0], i = 1;
	while (i < statics.length) {
		str += '$_h[' + i + ']' + statics[i++];
	}
	// Template literal preprocessing:
	// - replace <${Foo}> with <c c@=${Foo}>
	// - replace <x /> with <x></x>
	// - replace <${Foo}>a<//>b with <c c@=${Foo}>a</c>b
	TEMPLATE.innerHTML = str.replace(/<(?:(\/)\/|(\/?)(\$_h\[\d+\]))/g, '<$1$2c c@=$3').replace(/<([\w:-]+)(\s[^<>]*?)?\/>/gi, '<$1$2></$1>').trim();
	return Function('h', '$_h', 'return ' + walk((TEMPLATE.content || TEMPLATE).firstChild));
}

/** Traverse a DOM tree and serialize it to hyperscript function calls */
function walk(n) {
	if (n.nodeType !== 1) {
		if (n.nodeType === 3 && n.data) return field(n.data, ',');
		return 'null';
	}
	let nodeName = `"${n.localName}"`, str = '{', sub='', end='}';
	for (let i=0; i<n.attributes.length; i++) {
		let { name, value } = n.attributes[i];
		if (name=='c@') {
			nodeName = value;
			continue;
		}
		if (name.substring(0,3)==='...') {
			end = '})';
			str = 'Object.assign(' + str + '},' + name.substring(3) + ',{';
			sub = '';
			continue;
		}
		str += `${sub}"${name.replace(/:(\w)/g, upper)}":${value ? field(value, '+') : true}`;
		sub = ',';
	}
	str = 'h(' + nodeName + ',' + str + end;
	let child = n.firstChild;
	while (child) {
		str += ',' + walk(child);
		child = child.nextSibling;
	}
	return str + ')';
}

function upper (s, i) {
	return i.toUpperCase();
}

/** Serialize a field to a String or reference for use in generated code. */
function field(value, sep) {
	let matches = value.match(reg);
	let strValue = JSON.stringify(value);
	if (matches != null) {
		if (matches[0] === value) return value;
		strValue = strValue.replace(reg, `"${sep}$1${sep}"`).replace(/"[+,]"/g, '');
		if (sep === ',') strValue = `[${strValue}]`;
	}
	return strValue;
}
