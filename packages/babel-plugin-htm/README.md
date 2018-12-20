# `babel-plugin-htm`

A Babel plugin that compiles [htm] syntax to hyperscript, React.createElement, or just plain objects.

## Usage

Basic usage:

```js
[
  ["htm", {
    "pragma": "React.createElement"
  }]
]
```

```js
// input:
html`<div id="foo">hello ${you}</div>`

// output:
React.createElement("div", { id: "foo" }, "hello ", you)
```

## options

### `pragma`

The target "hyperscript" function to compile elements to (see [Babel docs]).
Defaults to: `"h"`.

### `tag=html`

By default, `babel-plugin-htm` will process all Tagged Templates with a tag function named `html`. To use a different name, use the `tag` option in your Babel configuration:

```js
{"plugins":[
  ["babel-plugin-htm", {
    "tag": "myCustomHtmlFunction"
  }]
]}
```

### `useBuiltIns=false`

`babel-plugin-htm` transforms prop spreads (`<a ...${b}>`) into `Object.assign()` calls. For browser support reasons, Babel's standard `_extends` helper is used by default. To use native `Object.assign` directly, pass `{useBuiltIns:true}`.

### `variableArity=true`

By default, `babel-plugin-htm` transpiles to the same output as JSX would, which assumes a target function of the form `h(type, props, ...children)`. If, for the purposes of optimization or simplification, you would like all calls to `h()` to be passed exactly 3 arguments, specify `{variableArity:false}` in your Babel config:

```js
html`<div />`  // h('div', null, [])
html`<div a />`  // h('div', { a: true }, [])
html`<div>b</div>`  // h('div', null, ['b'])
html`<div a>b</div>`  // h('div', { a: true }, ['b'])
```

### `pragma=false` _(experimental)_

Setting `pragma` to `false` changes the output to be plain objects instead of `h()` function calls:

```js
// input:
html`<div id="foo">hello ${you}</div>`
// output:
{ tag:"div", props:{ id: "foo" }, children:["hello ", you] }
```

### `monomorphic` _(experimental)_

Like `pragma=false` but converts all inline text to objects, resulting in the same object shape being used:

```js
// input:
html`<div id="foo">hello ${you}</div>`
// output:
{ type: 1, tag:"div", props:{ id: "foo" }, text: null, children:[
  { type: 3, tag: null, props: null, text: "hello ", children: null },
  you
] }
```


[htm]: https://github.com/developit/htm
[Babel docs]: https://babeljs.io/docs/en/babel-plugin-transform-react-jsx#pragma
