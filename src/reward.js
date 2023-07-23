const Web3 = require('web3');
const contractABI = require('./mul.json');
const contractAddress = '0xaD4D33A2E36BfC037FC427E60b679bE841fEe7DB';
const httpWeb3Provider = 'http://104.238.173.226:8545'; // HTTP RPC URL
const wsWeb3Provider = 'ws://104.238.173.226:8545/ws'; // WebSocket URL

const tokenABI = require('./token.json');
const tokenAddress = '0xF7dC07AC084198485E15a50c7b7Af882b36DCF3B';

const privateKey = 'ADD_PRIVATE_KEY'; 

const web3Ws = new Web3(new Web3.providers.WebsocketProvider(wsWeb3Provider));

const web3Http = new Web3(new Web3.providers.HttpProvider(httpWeb3Provider));

const contract = new web3Ws.eth.Contract(contractABI, contractAddress);

const tokenContract = new web3Http.eth.Contract(tokenABI, tokenAddress);

async function sendTokensToMiner(minerAddress) {
  try {
    const tokenAmount = web3Http.utils.toWei('5', 'ether'); // Convert 5 tokens to wei
    const gasPrice = await web3Http.eth.getGasPrice();
    const gasLimit = 200000; // Adjust the gas limit as per your requirement

    const myAccount = web3Ws.eth.accounts.privateKeyToAccount(privateKey);
    web3Ws.eth.accounts.wallet.add(myAccount);

    const txObject = {
      from: myAccount.address,
      to: tokenAddress,
      value: '0x0',
      data: tokenContract.methods.transfer(minerAddress, tokenAmount).encodeABI(),
      gas: gasLimit,
      gasPrice: gasPrice,
    };

    const signedTx = await myAccount.signTransaction(txObject);
    const receipt = await web3Ws.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log(`Transaction hash: ${receipt.transactionHash}`);
  } catch (err) {
    console.error('Error sending tokens to miner:', err);
  }
}
async function getTokenBalance(walletAddress) {
  try {
    const balance = await tokenContract.methods.balanceOf(walletAddress).call();
    const tokenBalance = web3Http.utils.fromWei(balance, 'ether');
    return tokenBalance;
  } catch (err) {
    console.error('Error getting token balance:', err);
    return 'N/A';
  }
}

async function getCurrentBlockCoinbase(blockNumber) {
  try {
    const coinbase = await contract.methods.getCurrentBlockCoinbase().call();
    console.log(`Block Number: ${blockNumber}, reward: ${coinbase}`);

    const minerAddress = coinbase; // Assuming the coinbase is the miner's address
    await sendTokensToMiner(minerAddress);

    const ownerWalletAddress = '0x7E1C53F9e28e6992BB30A285f13dAB8547A8D545'; 
    const tokenBalance = await getTokenBalance(ownerWalletAddress);
    console.log(`Owner's wallet token balance: ${tokenBalance}`);
  } catch (err) {
    console.error('Error calling getCurrentBlockCoinbase:', err);
  }
}

async function monitorNewBlocks() {
  try {
    const currentBlockNumber = await web3Ws.eth.getBlockNumber();

    console.log('Current block number:', currentBlockNumber);

    // Monitor for new blocks using WebSocket
    web3Ws.eth.subscribe('newBlockHeaders', async (error, result) => {
      if (!error) {
        const blockNumber = result.number;
        console.log('New block:', blockNumber);
        await getCurrentBlockCoinbase(blockNumber);
      } else {
        console.error('Error in monitoring new blocks:', error);
      }
    });
  } catch (err) {
    console.error('Error in monitorNewBlocks:', err);
  }
}

monitorNewBlocks();
