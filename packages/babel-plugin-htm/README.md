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
