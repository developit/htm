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

### `import=false` _(experimental)_

Auto-import the pragma function, off by default.

#### `false` (default)

Don't auto-import anything.

#### `String`

Import the `pragma` like `import {<pragma>} from '<import>'`.

With Babel config:
```js
"plugins": [
  ["babel-plugin-htm", {
    "tag": "$$html",
    "import": "preact"
  }]
]
```

```js
import { html as $$html } from 'htm/preact';

export default $$html`<div id="foo">hello ${you}</div>`
```

The above will produce files that look like:

```js
import { h } from 'preact';
import { html as $$html } from 'htm/preact';

export default h("div", { id: "foo" }, "hello ", you)
```

#### `{module: String, export: String}`

Import the `pragma` like `import {<import.export> as <pragma>} from '<import.module>'`.

With Babel config:
```js
"plugins": [
  ["babel-plugin-htm", {
    "pragma": "React.createElement",
    "tag": "$$html",
    "import": {
      // the module to import:
      "module": "react",
      // a named export to use from that module:
      "export": "default"
    }
  }]
]
```

```js
import { html as $$html } from 'htm/react';

export default $$html`<div id="foo">hello ${you}</div>`
```

The above will produce files that look like:

```js
import React from 'react';
import { html as $$html } from 'htm/react';

export default React.createElement("div", { id: "foo" }, "hello ", you)
```

### `useBuiltIns=false`

`babel-plugin-htm` transforms prop spreads (`<a ...${b}>`) into `Object.assign()` calls. For browser support reasons, Babel's standard `_extends` helper is used by default. To use native `Object.assign` directly, pass `{useBuiltIns:true}`.

### `useNativeSpread=false`

`babel-plugin-htm` transforms prop spreads (`<a ...${b} x=y>`) into `{ ...b, x: 'y' }` object spread syntax. For browser support reasons, Babel's standard `_extends` helper is used by default. To use object spread syntax, pass `{useNativeSpread:true}`. This option takes precedence over the `useBuiltIns` option.

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
