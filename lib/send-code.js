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
      'send-code:open-tab': () => this.openTab(this.first(atom.project.getPaths()))
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
        const rowNumber = editor.getCursorBufferPosition().row;
        const lineText = editor.lineTextForBufferRow(rowNumber);
        this.sendThroughAppleScript(lineText);
        editor.moveDown();
      } else {
        this.sendThroughAppleScript(selection.getText());
      }
    }
  },

  sendThroughAppleScript(text) {
    const escapedText = text.replace(/"/g, '\\\"');
    const command = 'osascript'
    const args = [
      '-e', 'tell app "iTerm"',
      '-e', 'set mysession to current session of current window',
      '-e', 'tell mysession to write text "' + escapedText + '"',
      '-e', 'end tell']
    const process = new BufferedProcess({command, args})
  },

  openTab(path) {
    let cdCommand = ""
    if (path.length > 0) {
      cdCommand = `tell theSession
                    write text "cd \\"${path[0]}\\""
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
  },

  first(a) {
    if (a.length > 0) {
      return a.slice(0, 1);
    } else {
      return a;
    }
  }
};
