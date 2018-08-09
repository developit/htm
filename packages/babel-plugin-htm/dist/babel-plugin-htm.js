var jsdom = require('jsdom');

var before = global.document;
global.document = new jsdom.JSDOM().window.document;
var htm = require('htm');
global.document = before;
var currentExpressions;
function htmBabelPlugin(ref, options) {
    var t = ref.types;
    if ( options === void 0 ) options = {};

    var pragma = options.pragma === false ? false : dottedIdentifier(options.pragma || 'h');
    var inlineVNodes = options.monomorphic || pragma === false;
    function dottedIdentifier(keypath) {
        var path = keypath.split('.');
        var out;
        for (var i = 0;i < path.length; i++) {
            var ident = propertyName(path[i]);
            out = i === 0 ? ident : t.memberExpression(out, ident);
        }
        return out;
    }
    
    function patternStringToRegExp(str) {
        var parts = str.split('/').slice(1);
        var end = parts.pop() || '';
        return new RegExp(parts.join('/'), end);
    }
    
    function propertyName(key) {
        if (key.match(/(^\d|[^a-z0-9_$])/i)) 
            { return t.stringLiteral(key); }
        return t.identifier(key);
    }
    
    function stringValue(str) {
        if (options.monomorphic) {
            return t.objectExpression([t.objectProperty(propertyName('type'), t.numericLiteral(3)),
                t.objectProperty(propertyName('tag'), t.nullLiteral()),t.objectProperty(propertyName('props'), t.nullLiteral()),
                t.objectProperty(propertyName('children'), t.nullLiteral()),t.objectProperty(propertyName('text'), t.stringLiteral(str))]);
        }
        return t.stringLiteral(str);
    }
    
    function createVNode(tag, props, children) {
        if (inlineVNodes) {
            return t.objectExpression([options.monomorphic && t.objectProperty(propertyName('type'), t.numericLiteral(1)),
                t.objectProperty(propertyName('tag'), tag),t.objectProperty(propertyName('props'), props),
                t.objectProperty(propertyName('children'), children),options.monomorphic && t.objectProperty(propertyName('text'), t.nullLiteral())].filter(Boolean));
        }
        return t.callExpression(pragma, [tag,props,children]);
    }
    
    var isVNode = t.isCallExpression;
    if (inlineVNodes) {
        isVNode = (function (node) {
            if (!t.isObjectExpression(node)) 
                { return false; }
            return node.properties[0].value.value !== 3;
        });
    }
    function childMapper(child, index, children) {
        if (typeof child === 'string' && child.trim().length === 0 || child == null) {
            if (index === 0 || index === children.length - 1) 
                { return null; }
        }
        if (typeof child === 'string' && isVNode(children[index - 1]) && isVNode(children[index + 1])) {
            child = child.trim();
        }
        if (typeof child === 'string') {
            var matches = child.match(/\$\$\$_h_\[(\d+)\]/);
            if (matches) 
                { return currentExpressions[matches[1]]; }
            return stringValue(child);
        }
        return child;
    }
    
    function h(tag, props) {
        var arguments$1 = arguments;

        if (typeof tag === 'string') {
            var matches = tag.match(/\$\$\$_h_\[(\d+)\]/);
            if (matches) 
                { tag = currentExpressions[matches[1]]; }
             else 
                { tag = t.stringLiteral(tag); }
        }
        var propsNode = t.objectExpression(Object.keys(props).map(function (key) {
            var value = props[key];
            if (typeof value === 'string') {
                var tokenizer = /\$\$\$_h_\[(\d+)\]/g;
                var token, lhs, root, index = 0, lastIndex = 0;
                var append = function (expr) {
                    if (lhs) 
                        { expr = t.binaryExpression('+', lhs, expr); }
                    root = (lhs = expr);
                };
                while (token = tokenizer.exec(value)) {
                    append(t.stringLiteral(value.substring(index, token.index)));
                    append(currentExpressions[token[1]]);
                    index = token.index;
                    lastIndex = tokenizer.lastIndex;
                }
                if (lastIndex < value.length) {
                    append(t.stringLiteral(value.substring(lastIndex)));
                }
                value = root;
            } else if (typeof value === 'boolean') {
                value = t.booleanLiteral(value);
            }
            return t.objectProperty(propertyName(key), value);
        }));
        var children = [];
        if (arguments.length > 2) {
            var stack = [];
            for (var i = arguments.length;i-- > 2; ) 
                { stack.push(arguments$1[i]); }
            while (stack.length) {
                var child = stack.pop();
                if (Array.isArray(child)) {
                    for (var i$1 = child.length;i$1--; ) 
                        { stack.push(child[i$1]); }
                } else if (child != null) {
                    children.push(child);
                }
            }
            children = children.map(childMapper).filter(Boolean);
        }
        children = t.arrayExpression(children);
        return createVNode(tag, propsNode, children);
    }
    
    var html = htm.bind(h);
    var htmlName = options.tag || 'html';
    return {
        name: 'htm',
        visitor: {
            TaggedTemplateExpression: function TaggedTemplateExpression(path) {
                var tag = path.node.tag.name;
                if (htmlName[0] === '/' ? patternStringToRegExp(htmlName).test(tag) : tag === htmlName) {
                    var statics = path.node.quasi.quasis.map(function (e) { return e.value.raw; });
                    var expr = path.node.quasi.expressions;
                    currentExpressions = expr;
                    path.replaceWith(html.apply(void 0, [ statics ].concat( expr.map(function (p, i) { return ("$$$_h_[" + i + "]"); }) )));
                }
            }
        }
    };
}

module.exports = htmBabelPlugin;
