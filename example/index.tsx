import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { OctofyProvider } from '../src'
import { loadOctofy } from '@octofy/octofy-js'

const App = () => {
  const octofy = loadOctofy('s')
  return (
    <OctofyProvider octofy={octofy}>
      <div>
        <span>hey</span>
      </div>
    </OctofyProvider>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
