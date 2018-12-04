
const htm = require('htm');

const html = htm.bind((tag, props, ...children) => ({ tag, props, children }));

describe('htm', () => {
	test('preserves value case', () => {
		expect(html`<div id=Hello />`).toEqual({
			tag: 'div',
			props: { id: 'Hello' },
			children: []
		});
	});

	test('preserves placeholder-looking strings in attributes and text', () => {
		expect(html`<div $_=$_a>$_[1]`).toEqual({
			tag: 'div',
			props: { $_: '$_a' },
			children: ['$_[1]']
		});
	});

	test('preserves underscores in tags, attributes and text', () => {
		expect(html`<tag_name attr_key=attr_value>text_value`).toEqual({
			tag: 'tag_name',
			props: { attr_key: 'attr_value' },
			children: ['text_value']
		});
	});

	test('escapes attribute names with allowed special characters', () => {
		expect(html`<div attr\\=hello />`).toEqual({
			tag: 'div',
			props: { 'attr\\': 'hello' },
			children: []
		});
	});
});
