var CACHE = {};
var TEMPLATE = document.createElement('template');
var reg = /(\$_h\[\d+\])/g;
function html(statics) {
    var tpl = CACHE[statics] || (CACHE[statics] = build(statics));
    return tpl(this, arguments);
}

function build(statics) {
    var str = statics[0], i = 1;
    while (i < statics.length) {
        str += '$_h[' + i + ']' + statics[i++];
    }
    TEMPLATE.innerHTML = str.replace(/<(?:(\/)\/|(\/?)(\$_h\[\d+\]))/g, '<$1$2c c@=$3').replace(/<([\w:-]+)(\s[^<>]*?)?\/>/gi, '<$1$2></$1>').trim();
    return Function('h', '$_h', 'return ' + walk((TEMPLATE.content || TEMPLATE).firstChild));
}

function walk(n) {
    if (n.nodeType !== 1) {
        if (n.nodeType === 3 && n.data) 
            { return field(n.data, ','); }
        return 'null';
    }
    var nodeName = "\"" + (n.localName) + "\"", str = '{', sub = '', end = '}';
    for (var i = 0;i < n.attributes.length; i++) {
        var ref = n.attributes[i];
        var name = ref.name;
        var value = ref.value;
        if (name == 'c@') {
            nodeName = value;
            continue;
        }
        if (name.substring(0, 3) === '...') {
            end = '})';
            str = 'Object.assign(' + str + '},' + name.substring(3) + ',{';
            sub = '';
            continue;
        }
        str += sub + "\"" + (name.replace(/:(\w)/g, upper)) + "\":" + (value ? field(value, '+') : true);
        sub = ',';
    }
    str = 'h(' + nodeName + ',' + str + end;
    var child = n.firstChild;
    while (child) {
        str += ',' + walk(child);
        child = child.nextSibling;
    }
    return str + ')';
}

function upper(s, i) {
    return i.toUpperCase();
}

function field(value, sep) {
    var matches = value.match(reg);
    var strValue = JSON.stringify(value);
    if (matches != null) {
        if (matches[0] === value) 
            { return value; }
        strValue = strValue.replace(reg, ("\"" + sep + "$1" + sep + "\"")).replace(/"[+,]"/g, '');
        if (sep === ',') 
            { strValue = "[" + strValue + "]"; }
    }
    return strValue;
}

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
    function mapChildren(child, index, children) {
        if (typeof child === 'string' && child.trim().length === 0 || child == null) {
            if (index === 0 || index === children.length - 1) 
                { return null; }
        }
        if (typeof child === 'string' && isVNode(children[index - 1]) && isVNode(children[index + 1])) {
            child = child.trim();
        }
        if (typeof child === 'string') {
            return stringValue(child);
        }
        return child;
    }
    
    function h(tag, props) {
        var children = [], len = arguments.length - 2;
        while ( len-- > 0 ) children[ len ] = arguments[ len + 2 ];

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
        if (Array.isArray(children)) {
            children = t.arrayExpression(children.map(mapChildren).filter(Boolean));
        }
        return createVNode(tag, propsNode, children);
    }
    
    var html$$1 = html.bind(h);
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
                    path.replaceWith(html$$1.apply(void 0, [ statics ].concat( expr.map(function (p, i) { return ("$$$_h_[" + i + "]"); }) )));
                }
            }
        }
    };
}

module.exports = htmBabelPlugin;
