import { JSDOM } from 'jsdom';
const before = global.document;
global.document = new JSDOM().window.document;
const htm = require('htm');
global.document = before;

// htm() uses the HTML parser, which serializes attribute values.
// this is a problem, because composite values here can be made up
// of strings and AST nodes, which serialize to [object Object].
// Since the handoff from AST node handling to htm() is synchronous,
// this global lookup will always reflect the corresponding
// AST-derived values for the current htm() invocation.
let currentExpressions;

/**
 * @param {Babel} babel
 * @param {object} options
 * @param {string} [options.pragma=h]  JSX/hyperscript pragma.
 * @param {string} [options.tag=html]  The tagged template "tag" function name to process.
 * @param {boolean} [options.monomorphic=false]  Output monomorphic inline objects instead of using String literals.
 */
export default function htmBabelPlugin({ types: t }, options = {}) {
	const pragma = options.pragma===false ? false : dottedIdentifier(options.pragma || 'h');
  
	const inlineVNodes = options.monomorphic || pragma===false;

	function dottedIdentifier(keypath) {
		const path = keypath.split('.');
		let out;
		for (let i=0; i<path.length; i++) {
			const ident = propertyName(path[i]);
			out = i===0 ? ident : t.memberExpression(out, ident);
		}
		return out;
	}

	function patternStringToRegExp(str) {
		const parts = str.split('/').slice(1);
		const end = parts.pop() || '';
		return new RegExp(parts.join('/'), end);
	}
  
	function propertyName(key) {
		if (key.match(/(^\d|[^a-z0-9_$])/i)) return t.stringLiteral(key);
		return t.identifier(key);
	}
  
	function stringValue(str) {
		if (options.monomorphic) {
			return t.objectExpression([
				t.objectProperty(propertyName('type'), t.numericLiteral(3)),
				t.objectProperty(propertyName('tag'), t.nullLiteral()),
				t.objectProperty(propertyName('props'), t.nullLiteral()),
				t.objectProperty(propertyName('children'), t.nullLiteral()),
				t.objectProperty(propertyName('text'), t.stringLiteral(str))
			]);
		}
		return t.stringLiteral(str);
	}
  
	function createVNode(tag, props, children) {
		if (inlineVNodes) {
			return t.objectExpression([
				options.monomorphic && t.objectProperty(propertyName('type'), t.numericLiteral(1)),
				t.objectProperty(propertyName('tag'), tag),
				t.objectProperty(propertyName('props'), props),
				t.objectProperty(propertyName('children'), children),
				options.monomorphic && t.objectProperty(propertyName('text'), t.nullLiteral())
			].filter(Boolean));
		}
    
		return t.callExpression(pragma, [tag, props, children]);
	}

	let isVNode = t.isCallExpression;
	if (inlineVNodes) {
		isVNode = node => {
			if (!t.isObjectExpression(node)) return false;
			return node.properties[0].value.value!==3;
		};
	}

	function mapChildren(child, index, children) {
		// JSX-style whitespace: (@TODO: remove? doesn't match the browser version)
		if (typeof child==='string' && child.trim().length===0 || child==null) {
			if (index===0 || index===children.length-1) return null;
		}
		if (typeof child==='string' && isVNode(children[index-1]) && isVNode(children[index+1])) {
			child = child.trim();
		}
		if (typeof child==='string') {
			return stringValue(child);
		}
		return child;
	}

	function h(tag, props, ...children) {
		if (typeof tag==='string') {
			const matches = tag.match(/\$\$\$_h_\[(\d+)\]/);
			if (matches) tag = currentExpressions[matches[1]];
			else tag = t.stringLiteral(tag);
		}

		//const propsNode = props==null || Object.keys(props).length===0 ? t.nullLiteral() : t.objectExpression(
		const propsNode = t.objectExpression(
			Object.keys(props).map(key => {
				let value = props[key];
				if (typeof value==='string') {
					const tokenizer = /\$\$\$_h_\[(\d+)\]/g;
					let token, lhs, root, index=0, lastIndex=0;
					const append = expr => {
						if (lhs) expr = t.binaryExpression('+', lhs, expr);
						root = lhs = expr;
					};
					while ((token = tokenizer.exec(value))) {
						append(t.stringLiteral(value.substring(index, token.index)));
						append(currentExpressions[token[1]]);
						index = token.index;
						lastIndex = tokenizer.lastIndex;
					}
					if (lastIndex < value.length) {
						append(t.stringLiteral(value.substring(lastIndex)));
					}
					value = root;
				}
				else if (typeof value==='boolean') {
					value = t.booleanLiteral(value);
				}
				return t.objectProperty(propertyName(key), value);
			})
		);
    
		if (Array.isArray(children)) {
			children = t.arrayExpression(children.map(mapChildren).filter(Boolean));
		}
		return createVNode(tag, propsNode, children);
	}
  
	const html = htm.bind(h);

	// The tagged template tag function name we're looking for.
	// This is static because it's generally assigned via htm.bind(h),
	// which could be imported from elsewhere, making tracking impossible.
	const htmlName = options.tag || 'html';
	return {
		name: 'htm',
		visitor: {
			TaggedTemplateExpression(path) {
				const tag = path.node.tag.name;
				if (htmlName[0]==='/' ? patternStringToRegExp(htmlName).test(tag) : tag === htmlName) {
					const statics = path.node.quasi.quasis.map(e => e.value.raw);
					const expr = path.node.quasi.expressions;
					currentExpressions = expr;
					path.replaceWith(html(statics, ...expr.map((p, i) => `$$$_h_[${i}]`)));
				}
			}
		}
	};
}