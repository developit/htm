/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { build, evaluate } from './build.mjs';
 
const CACHE = {};

export default function html(statics) {
	let key = '.';
	for (let i=0; i<statics.length; i++) {
		key += statics[i].length + ',' + statics[i];
	}
	const tpl = CACHE[key] || (CACHE[key] = build(statics));

	// eslint-disable-next-line prefer-rest-params
	const res = evaluate(this, tpl, arguments, []);
	return res.length > 1 ? res : res[0];
}