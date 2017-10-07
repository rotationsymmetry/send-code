'use babel';

import SendCodeView from './send-code-view';
import { CompositeDisposable } from 'atom';
import { BufferedProcess } from 'atom';

export default {

  sendCodeView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.sendCodeView = new SendCodeView(state.sendCodeViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.sendCodeView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'send-code:send': () => this.send()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.sendCodeView.destroy();
  },

  serialize() {
    return {
      sendCodeViewState: this.sendCodeView.serialize()
    };
  },

  send() {
    let editor
    if (editor = atom.workspace.getActiveTextEditor()) {
      let selection = editor.getSelectedText();
      const command = 'osascript'
      const args = [
        '-e', 'tell app "iTerm"',
        '-e', 'set mysession to current session of current window',
        '-e', 'tell mysession to write text "' + selection + '"',
        '-e', 'end tell']
      const process = new BufferedProcess({command, args})
    }
  }
};
