'use babel';

import { CompositeDisposable } from 'atom';
import { BufferedProcess } from 'atom';
import { Range, Point } from 'atom';

const NON_WHITESPACE_REGEXP = /\S/

export default {
  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'sendcode:send': () => this.send(),
      'sendcode:send-line': () => this.sendLine(),
      'sendcode:open-tab': () => this.openTab()
    }));
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  send() {
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      const selection = editor.getLastSelection();
      if (selection.isEmpty()) {
        this.sendBlockText(editor)
      } else {
        this.sendSelectedText(editor)
      }
    }
  },

  sendSelectedText(editor) {
    const selectedText = editor.getSelectedText()
    this.sendToTerminal(selectedText, editor)
  },

  sendBlockText(editor) {
    const bufferRow = editor.getCursorBufferPosition().row
    const currentLine = editor.lineTextForBufferRow(bufferRow)
    if (NON_WHITESPACE_REGEXP.test(currentLine)){
      this.sendToTerminal(this.getBlockText(editor), editor)
      this.moveToNextWhiteSpaceLine(editor)
    }
    this.moveToNextNonWhiteSpaceLine(editor)
  },

  moveToNextWhiteSpaceLine(editor) {
    let row = editor.getCursorBufferPosition().row
    const lastRow = editor.getLineCount() - 1
    while (row <= lastRow && NON_WHITESPACE_REGEXP.test(editor.lineTextForBufferRow(row))){
      row++
      editor.moveDown()
    }
  },

  moveToNextNonWhiteSpaceLine(editor) {
    let row = editor.getCursorBufferPosition().row
    const lastRow = editor.getLineCount() - 1
    while (row <= lastRow && !NON_WHITESPACE_REGEXP.test(editor.lineTextForBufferRow(row))){
      row++
      editor.moveDown()
    }
  },

  getBlockText(editor) {
    const bufferRow = editor.getCursorBufferPosition().row
    if (NON_WHITESPACE_REGEXP.test(editor.lineTextForBufferRow(bufferRow))) {
      let startRow = bufferRow
      while (startRow-1 >= 0 &&
        NON_WHITESPACE_REGEXP.test(editor.lineTextForBufferRow(startRow - 1))) {
        startRow--
      }
      let endRow = bufferRow
      rowCount = editor.getLineCount() - 1
      while (endRow + 1 <= rowCount &&
        NON_WHITESPACE_REGEXP.test(editor.lineTextForBufferRow(endRow + 1))) {
        endRow++
      }
      const range = new Range(new Point(startRow, 0), new Point(endRow+1, 0))
      return editor.getTextInBufferRange(range)
    } else {
      return ""
    }
  },

  sendLine() {
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      const rowNumber = editor.getCursorBufferPosition().row
      const lineText = editor.lineTextForBufferRow(rowNumber)
      this.sendToTerminal(lineText, editor)
      editor.moveDown()
    }
  },

  sendToTerminal(text, editor) {
    this.sendToiTerm(text, editor)
  },

  sendToiTerm(text, editor) {
    const escapedText = text.replace(/"/g, '\\\"');
    const command = 'osascript'
    let args
    if (editor.getGrammar().name == 'Python') {
      args = ['-e',
        `tell app "iTerm"
          set mysession to current session of current window
          tell mysession to write text (ASCII character 27) & "[200~" without newline
          tell mysession to write text "${escapedText}"
          tell mysession to write text (ASCII character 27) & "[201~"
        end tell`]
    } else {
      args = ['-e',
        `tell app "iTerm"
          set mysession to current session of current window
          tell mysession to write text "${escapedText}"
        end tell`]
    }
    const process = new BufferedProcess({command, args})
  },

  openTab(path) {
    let cdCommand = ""
    const paths = atom.project.getPaths()
    if (paths.length > 0) {
      cdCommand = `tell theSession
                    write text "cd \\"${paths[0]}\\""
                  end tell`
    }
    const command = 'osascript'
    const args = ['-e',
      `tell application "iTerm"
        if (count of windows) = 0 then
          set theWindow to (create window with default profile)
          set theSession to current session of theWindow
        else
          set theWindow to current window
          tell current window
            set theTab to create tab with default profile
            set theSession to current session of theTab
          end tell
        end if
        ${cdCommand}
        activate
      end tell`]
    const process = new BufferedProcess({command, args})
  }
};
