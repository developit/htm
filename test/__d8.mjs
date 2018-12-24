/*global globalThis*/

const queue = [];
let stack = [];
let index = 0;
// let currentName;
// let prefix = '';

async function process() {
	const id = index++;
	if (id === queue.length) {
		queue.length = index = 0;
		return;
	}
	const [op, name, fn, extra] = queue[id];
	queue[id] = undefined;
	await processors[op](name, fn, extra);
	await process();
}

const processors = {
	async describe(name, fn, path) {
		// stack.push(Array.from({ length: stack.length + 1 }).join('  ') + name);
		stack.push(name);
		// log('INFO', Array.from(path).fill('  ').join('') + name);
		log('INFO', name);
		await fn();
		stack.pop();
	},
	async test(name, fn, path) {
		let stackBefore = stack;
		stack = path.concat(name);
		logBuffer = [];
		await new Promise(resolve => {
			let calls = 0;
			const done = () => {
				if (calls++) throw Error(`Callback called multiple times\n\t${name}`);
				log('INFO', `✅  ${name}`);
				resolve();
			};
			Promise.resolve(done)
				.then(fn)
				.then(() => calls || done())
				.catch(err => {
					// setTimeout(process);
					// throw new Error(`\t${err.stack || err.message}`);
					log('ERROR', `🚨  ${name}`);
					log('ERROR', '\t' + String(err.stack || err.message || err));
					// setTimeout(process);
					resolve();
				});
		});
		for (let i=0; i<logBuffer.length; i++) log(...logBuffer[i]);
		logBuffer = undefined;
		stack = stackBefore;
		// process();
	}
};


let logBuffer;

function wrap(obj, method) {
	obj[method] = function() {
		let out = '  ';
		for (let i=0; i<arguments.length; i++) {
			let val = arguments[i];
			if (typeof val === 'object' && val) {
				val = JSON.stringify(val);
			}
			if (out) out += ' ';
			out += val;
		}
		if (method!=='error') out = `\u001b[37m${out}\u001b[0m`;
		if (logBuffer) {
			logBuffer.push([method.toUpperCase(), out]);
		}
		else {
			log(method.toUpperCase(), out);
		}
	};
}
wrap(console, 'log');
wrap(console, 'info');
wrap(console, 'warn');
wrap(console, 'error');

function log(type, msg) {
	if (type === 'ERROR') {
		msg = `\u001b[31m${msg}\u001b[39m`;
	}
	if (type === 'SUCCESS') {
		msg = `\u001b[32m${msg}\u001b[39m`;
	}
	print(Array.from({ length: stack.length }).fill('  ').join('') + msg);
}

function push(op, name, fn, extra) {
	if (queue.push([op, name, fn, extra]) === 1) {
		setTimeout(process);
	}
}

globalThis.describe = (name, fn) => {
	push('describe', name, fn, stack.slice());
};

globalThis.test = (name, fn) => {
	push('test', name, fn, stack.slice());
};

globalThis.expect = (subject) => new Expect(subject);

const SUBJECT = Symbol.for('subject');
const NEGATED = Symbol.for('negated');
class Expect {
	constructor(subject) {
		this[SUBJECT] = subject;
	}
	get not() {
		this[NEGATED] = true;
		return this;
	}
	toBeGreaterThan(value) {
		const subject = this[SUBJECT];
		const negated = this[NEGATED];

		const isOver = subject > value;
		let msg = `Expected ${subject}${negated?' not':''} to be greater than ${value}`;
		if (logBuffer) {
			for (let i=logBuffer.length; i-- > -1; ) {
				if (i<0 || logBuffer[i][2] === 1) {
					logBuffer.splice(i+1, 0, [isOver !== negated ? 'SUCCESS' : 'ERROR', '  ' + msg, 1]);
					break;
				}
			}
		}
		else {
			log(isOver !== negated ? 'SUCCESS' : 'ERROR', '  ' + msg);
		}
	}
}