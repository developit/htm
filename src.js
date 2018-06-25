// import { h, Component, render as preactRender } from 'preact';

// const CACHE = new Map();
const CACHE = {};

const tn = document.createElement('template');

const reg = /(\$_h\[\d+\])/g;

// export function render(tree, parent) {
// 	preactRender(tree, parent, parent.firstElementChild);
// }

// export { h, Component };

export default function htm(h) {
	return function (statics) {
		const tpl = CACHE[statics] || (CACHE[statics] = build(statics));
		// eslint-disable-next-line prefer-rest-params
		return tpl(h, arguments);
	};
}

// export function html(statics) {
// 	const tpl = CACHE[statics] || (CACHE[statics] = build(statics));
// 	// return tpl(holes, h);
// 	// eslint-disable-next-line prefer-rest-params
// 	return tpl(h, arguments);
// }

/** Create a template function given strings from a tagged template literal. */
function build(statics) {
	let str = statics[0], i = 1;
	while (i < statics.length) {
		str += '$_h[' + i + ']' + statics[i++];
	}
	// let str = '', i = 0;
	// while (i < statics.length) {
	// 	// if (i !== 0) str += `$_h[${i - 1}]`;
	// 	if (i !== 0) str += `$_h[${i}]`;
	// 	str += statics[i++];
	// }

	// tn.innerHTML = str.replace(/<(\$_h\[\d+\])/g, '<c c@=$1').replace(/<\/\$_h\[\d+\]/g, '</c').replace(/<([a-z0-9:@-]+)(\s.*?)?\/>/gi, '<$1$2></$1>').trim();
	// tn.innerHTML = str.replace(/<(\/?)(\$_h\[\d+\])/g, '<$1c c@=$2').replace(/<([a-z0-9:@-]+)(\s.*?)?\/>/gi, '<$1$2></$1>').trim();
	// tn.innerHTML = str.replace(/<(\/?)(\$_h\[\d+\])/g, '<$1c c@=$2').replace(/<([\w-]+)(\s.*?)?\/>/gi, '<$1$2></$1>').replace(RegExp(str.match(/\n\s*/)[0]));
	// tn.innerHTML = str.replace(/<(\/?)(\$_h\[\d+\])/g, '<$1c c@=$2').replace(/\/>/g, '></c>').trim();
	// tn.innerHTML = str.replace(/<(\/?)(\$_h\[\d+\])((\s.*?)?\/>)?/g, (s, slash, name, closing) => (slash ? '' : `<c c@=${name}${closing}${closing?`</${name}>`:''}`) + (slash || closing ? `</${name}>` : '')).trim();
	tn.innerHTML = str.replace(/<(\/?)(\$_h\[\d+\])/g, '<$1c c@=$2').replace(/<([\w:-]+)(\s.*?)?\/>/gi, '<$1$2></$1>').trim();
	return Function('h', '$_h', 'return ' + walk((tn.content || tn).firstChild));
	// const dom = new DOMParser().parseFromString(str.replace(/<(\$_h\[\d+\])/g, '<c@ c@=$1').replace(/<\/\$_h\[\d+\]/g, '</c@').replace(/<([a-z0-9:@-]+)(\s.*?)?\/>/gi, '<$1$2></$1>').trim(), 'text/html').body.firstChild;
	// return Function('h', '$_h', 'return ' + walk(dom));
}

/** Traverse a DOM tree and serialize it to hyperscript function calls */
function walk(n) {
	if (n.nodeType !== 1) {
		if (n.nodeType === 3 && n.data) return field(n.data, ',');
		return 'null';
	}
	// let str = 'h(' + (n.getAttribute('c@') || `"${n.localName}"`) + ',', val, name;
	let nodeName = `"${n.localName}"`, str = '{', sub='', end='}';
	for (let i=0; i<n.attributes.length; i++) {
		let { name, value } = n.attributes[i];
		if (name=='c@') {
			nodeName = value;
			continue;
		}
		if (name.match(/^\.\.\./)) {
			end = '})';
			str = 'Object.assign(' + str + '},' + name.substring(3) + ',{';
			sub = '';
			continue;
		}
		// if (str) str += ',';
		// if (sub) str += ',';
		str += `${sub}"${name.replace(/:(\w)/g, upper)}":${value ? field(value, '+') : true}`;
		sub = ',';
	}
	str = 'h(' + nodeName + ',' + (str + end);
	// str = 'h(' + nodeName + ',' + (str ? (start + str + end) : 'null');
	// str += val === undefined ? 'null' : '}';
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
