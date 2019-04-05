var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "drive ...";

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    ganache: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: function () {
           return new HDWalletProvider(mnemonic, 'https://ropsten.infura.io/v3/79bfa7e03d7e4af6b08d066b85cf7876');
      },
      network_id: '3',
      gas: 4500000,
      gasPrice: 10000000000,
    }
  },
  compilers: {
    solc: {
      version: '0.4.25',
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
