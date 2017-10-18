'use babel';

const {it, fit, ffit, fffit, beforeEach, afterEach} = require('./async-spec-helpers')

import sendcode from '../lib/sendcode';

const text=
`abc

abc
abc
abc


abc
`

describe('sendcode', () => {
  let editor

  afterEach(() => {
    editor.destroy()
  })

  beforeEach(async () => {
    editor = await atom.workspace.open()
    jasmine.unspy(editor, 'shouldPromptToSave')
  })

  it('getBlockText: mid of buffer', () => {
    editor.setText(text)
    editor.moveToTop()
    editor.moveDown(3)
    expect(sendcode.getBlockText(editor)).toBe("abc\nabc\nabc\n")
  })

  it('getBlockText: end of buffers', () => {
    editor.setText(text)
    editor.moveToTop()
    editor.moveDown(7)
    expect(sendcode.getBlockText(editor)).toBe("abc\n")
  })

  it('getBlockText: curror at blank line', () => {
    editor.setText(" \n \n \n")
    editor.moveToTop()
    editor.moveDown(1)
    expect(sendcode.getBlockText(editor)).toBe("")
  })

  it('moveToNextWhiteSpaceLine', () => {
    editor.setText(text)
    editor.moveToTop()
    editor.moveDown(2)
    sendcode.moveToNextWhiteSpaceLine(editor)
    expect(editor.getCursorBufferPosition().row).toBe(5)
  })

  it('moveToNextWhiteSpaceLine: end of line', () => {
    editor.setText("abc\n")
    editor.moveToTop()
    editor.moveDown(1)
    sendcode.moveToNextWhiteSpaceLine(editor)
    expect(editor.getCursorBufferPosition().row).toBe(1)
  })

  it('moveToNextNonWhiteSpaceLine', () => {
    editor.setText(text)
    editor.moveToTop()
    editor.moveDown(5)
    sendcode.moveToNextNonWhiteSpaceLine(editor)
    expect(editor.getCursorBufferPosition().row).toBe(7)
  })

  it('moveToNextNonWhiteSpaceLine: end of line', () => {
    editor.setText(text)
    editor.moveToTop()
    editor.moveDown(7)
    sendcode.moveToNextNonWhiteSpaceLine(editor)
    expect(editor.getCursorBufferPosition().row).toBe(7)
  })
})
