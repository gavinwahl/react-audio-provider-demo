import React, { Component } from 'react';

const {Provider: AudioContextProvider, Consumer: AudioConsumer} = React.createContext();


class AudioProvider extends Component {
  state = {
    pending: [],
    history: [],
    currentlyPlaying: null,
  };

  queue = (options) => {
    if (this.state.currentlyPlaying) {
      this.setState(({ pending }) => ({pending: [...pending, options]}));
    } else {
      this.setState(
        {currentlyPlaying: options},
        () => {
          if (options.type === 'delay') {
            setTimeout(() => this.audioEnded(), options.ms);
          } else {
            this.audioTag.load();
            this.audioTag.play();
          }
        }
      );
    }
  }

  delay = (ms) => {
    this.queue({
      type: 'delay',
      ms,
    });
  }

  play = (file) => {
    this.queue({
      type: 'file',
      file,
    });
  }

  replay = () => {
    // TODO: is this sensible if called while there is pending audio?  This is
    // what was most recently played when replay() was called, not what's at
    // the end of the queue.
    this.queue(this.state.history[0]);
  }

  audioEnded = () => {
    this.setState(({history, currentlyPlaying}) => ({
      currentlyPlaying: null,
      // TODO: don't keep indefinite history?
      history: [currentlyPlaying, ...history],
    }));

    if (this.state.pending.length > 0) {
      const toPlay = this.state.pending[0];
      this.setState(
        {pending: this.state.pending.slice(1)},
        () => this.queue(toPlay)
      );
    }
  }

  render() {
    return (
      <AudioContextProvider
        value={{audio: this, currentlyPlaying: this.state.currentlyPlaying}}
      >
        <audio
          ref={(audioTag) => this.audioTag = audioTag}
          onEnded={this.audioEnded}
        >
          <source
            src={
              this.state.currentlyPlaying && this.state.currentlyPlaying.type === 'file' ?
                this.state.currentlyPlaying.file
              :
                null
            }
          />
        </audio>
        {this.props.children}
      </AudioContextProvider>
    );
  }
}


class App extends Component {

  render() {
    return (
      <AudioProvider>
        <div className="App">
          <AudioConsumer>
            {
              ({audio, currentlyPlaying}) => <React.Fragment>
                <button onClick={() => audio.play('knock.mp3')}>play</button>
                <button onClick={() => audio.delay(1000)}>delay 1s</button>
                <button onClick={() => audio.replay()}>redo</button>
                {currentlyPlaying && currentlyPlaying.type}
              </React.Fragment>
            }
          </AudioConsumer>
        </div>
      </AudioProvider>
    );
  }
}

export default App;
