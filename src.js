import { h, Component, render as preactRender } from 'preact';

// const CACHE = new Map();
const CACHE = {};

const tn = document.createElement('template');

const reg = /(\$_h\[\d+\])/g;

export function render(tree, parent) {
	preactRender(tree, parent, parent.firstElementChild);
}

export { h, Component };

export function html(statics, ...holes) {
	// let tpl = CACHE.get(statics);
	// if (tpl==null) {
	// 	CACHE.set(statics, tpl = build(statics));
	// }
	// return tpl(holes, h);

	const tpl = CACHE[statics] || (CACHE[statics] = build(statics));
	return tpl(holes, h);

	// const tpl = statics.$_h || (statics.$_h = build(statics));
	// return tpl(holes, h);
}

/** Create a template function given strings from a tagged template literal. */
function build(statics) {
	let str = '', i = 0;
	while (i < statics.length) {
		if (i !== 0) str += `$_h[${i - 1}]`;
		str += statics[i++];
	}
	tn.innerHTML = str.replace(/<(\$_h\[\d+\])/g, '<c@ c@=$1').replace(/<\/\$_h\[\d+\]/g, '</c@').replace(/<([a-z0-9:@-]+)(\s.*?)?\/>/gi, '<$1$2></$1>').trim();
	// console.log(walk((tn.content || tn).firstChild));
	return Function('$_h', 'h', 'return ' + walk((tn.content || tn).firstChild));
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
