import { h, Component, render } from '//unpkg.com/preact?module';

const CACHE = new Map();

const tn = document.createElement('template');

const reg = /(\$_h\[\d+\])/g;

export { h, Component, render };

export function html(statics, ...holes) {
  let tpl = CACHE.get(statics);
  if (tpl==null) {
    CACHE.set(statics, tpl = build(statics));
  }
  return tpl(holes, h);
}

function field(value, sep) {
  let matches = value.match(reg);
  let strValue = JSON.stringify(value);
  if (matches!=null) {
    if (matches[0]===value) return value;
    strValue = strValue.replace(reg, `"${sep}$1${sep}"`).replace(/(^""[+,]|[+,]""$)/g,'');
    if (sep===',') strValue = `[${strValue}]`;
  }
  return strValue;
}

function build(statics) {
  let str = '', i = 0;
  while (i < statics.length) {
    if (i !== 0) str += `$_h[${i-1}]`;
    str += statics[i++];
  }
  function walk(n) {
    if (n.nodeType !== 1) {
      if (n.nodeType === 3 && n.data) return field(n.data, ',');
      return 'null';
    }
    const attrs = n.getAttributeNames();
    let str = '$_c(' + (attrs[0]=='c@' ? n.getAttribute(attrs.shift()) : `"${n.localName}"`) + ',', val, matches;
    for (const name of attrs) {
      str += val===undefined ? '{' : ',';
      val = n.getAttribute(name);
      str += `"${name.replace(/^on-/,'on')}":${val==='' ? 'true' : field(val, '+')}`;
    }
    str += val===undefined ? 'null' : '}';
    let child = n.firstChild;
    while (child) {
      str += ',' + walk(child);
      child = child.nextSibling;
    }
    return str + ')';
  }
  tn.innerHTML = str.replace(/<(\$_h\[\d+\])/g, '<c@ c@=$1').replace(/<\/\$_h\[\d+\]/g, '</c@').replace(/<([a-z0-9:@-]+)(\s.*?)?\/>/gi, '<$1$2></$1>').trim();
  return new Function('$_h', '$_c', 'return ' + walk((tn.content || tn).firstChild));
}
