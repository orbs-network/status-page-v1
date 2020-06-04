import React from 'react';
import logo from './logo.svg';
import './App.css';
import Dashboard from './Dashboard';

import FakeData from './FakeData';

const data = [];

for (let i = 0; i < 18; i ++) {
  data.push({
    validator: {
      Name: `Validator ${i}`,
      IP: `1.2${i}.3.4${i}`
    },
    management: FakeData,
    vchains: {
      '1000000': {
        BlockHeight: 4497649,
        Version: "v1.3.13-somehash",
        Commit: "somehash",
      },
      '1000001': {
        BlockHeight: 4497649,
        Version: "v1.3.13-somehash",
        Commit: "somehash",
      },
      '1000002': {
        BlockHeight: 4497649,
        Version: "v1.3.13-somehash",
        Commit: "somehash",
      },
      '1000003': {
        BlockHeight: 4497649,
        Version: "v1.3.13-somehash",
        Commit: "somehash",
      },
      '1000004': {
        BlockHeight: 4497649,
        Version: "v1.3.13-somehash",
        Commit: "somehash",
      },
    }
  });
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        Network Status
      </header>
      <main>
      <Dashboard data={data} />
      </main>
    </div>
  );
}

export default App;
