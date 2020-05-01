import assert from 'assert';
import htm from 'htm';
import * as preact from 'htm/preact';
import * as standalone from 'htm/preact/standalone';
// TODO: Enable once react distro is ESM compatible.
// import * as react 'htm/react';

assert(typeof htm === 'function', 'import htm from "htm"');

assert(typeof preact.html === 'function', 'import { html } from "preact"');

assert(typeof standalone.html === 'function', 'import { html } from "preact/standalone"');

console.log('✅ Dist Tests Passed');
