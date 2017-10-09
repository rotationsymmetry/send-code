'use babel';

import { CompositeDisposable } from 'atom';
import { BufferedProcess } from 'atom';

export default {
  subscriptions: null,

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'send-code:send': () => this.send(),
      'send-code:send-line': () => this.sendLine(),
      'send-code:open-tab': () => this.openTab()
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
        this.sendParagraph(editor)
      } else {
        this.sendSelectedText(editor)
      }
    }
  },

  sendSelectedText(editor) {
    const selectedText = editor.getSelectedText()
    this.sendThroughAppleScript(selectedText)
  },

  sendParagraph(editor) {
    const range = editor.getCurrentParagraphBufferRange()
    if (range) {
      const paragraph = editor.getTextInBufferRange(range)
      this.sendThroughAppleScript(paragraph)
      editor.moveToBeginningOfNextParagraph()
    } else {
      const emptyString = ""
      this.sendThroughAppleScript(emptyString)
      let row = editor.getCursorBufferPosition().row;
      while (row < editor.getLastBufferRow() && editor.lineTextForBufferRow(row).length == 0) {
          row++
          editor.moveDown()
        }
    }
  },

  sendLine() {
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      const rowNumber = editor.getCursorBufferPosition().row
      const lineText = editor.lineTextForBufferRow(rowNumber)
      this.sendThroughAppleScript(lineText)
      editor.moveDown()
    }
  },

  sendThroughAppleScript(text) {
    const escapedText = text.replace(/"/g, '\\\"');
    const command = 'osascript'
    const args = ['-e',
      `tell app "iTerm"
        set mysession to current session of current window
        tell mysession to write text "${escapedText}"
      end tell`]
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
