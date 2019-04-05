App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,
  count : 0,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        if (!error) {
          console.log("event triggered", event.args._candidateId);
          $('#events').append('<p> CandidateId : ' + event.args._candidateId  + '</p>');
        } else {
          console.log(error);
        }
        // Reload when a new vote is recorded
        App.render();        
      });
    });
  },

  render: function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function (candidatesCount) {
      App.count = candidatesCount;

      console.log('candidatesCount ',candidatesCount);
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (var i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function (candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }
      return electionInstance.voters(App.account);
    }).then(function(hasVoted) {
      // Do not allow a user to vote
      if(hasVoted) {
        $('form').hide();
      }
      loader.hide();
      content.show();
      /*
      *  event 가 발생할때 마다 listenForEvents() 함수가 호출되고,
      *  listenForEvents()가 render() 함수를 호출되기 때문에 #candidatesResults 에 중복된 목록이 출력된다.
      * 중복해서 출력되지 않도록 cadidateCount(App.count) 보다 table에 출력된 tr의 갯수를 비교하여
      * App.count 보다 큰 tr를 삭제하였음
      */
      var tr_length = $('#candidatesResults').children('tr').length; 
      if(tr_length > App.count){
        console.log('tr length ' + $('#candidatesResults').children('tr').length);
        var tr_index = App.count - 1;
        $('#candidatesResults tr:gt('+ tr_index +')').empty();
      }  
      
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function (instance) {
      //응답시간이 오래 걸리면  Loading 화면으로 빨리 전환하기 위해 vote() 함수를 호출하기 전에 먼저 보여주었음
      $("#content").hide();
      $("#loader").show();
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      //$("#content").hide();
      //$("#loader").show();
      App.listenForEvents();
    }).catch(function(err) {
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
