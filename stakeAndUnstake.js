const ethers = require('ethers');
require("dotenv").config();
const provider = new ethers.providers.JsonRpcProvider(process.env.API);
const abiErc20 = require("./ABI/abi.json");
const abiClayFaucet = require("./ABI/clay171.json");
const abiClayStrategy = require("./ABI/Clay420.json");

const INTERVAL = 60;//Run every 60 minutes

let tokensMap = new Map();
tokensMap.set('Melville', '0xf66bA729ce62F97DaD71BfFAe842925Ba629F741');
tokensMap.set('Tana', '0x335e2d611384193af84bfe949971eafcea5a7de1');
tokensMap.set('Peipus', '0xfd769a11a1ab3bdfd6fad3c9e20ba2ce322f8ae1');
tokensMap.set('Saimaa', '0x3E3A5efDc4AbA0D92D0A2F52d107E2D45DB6670a');
tokensMap.set('Taymyr', '0x013aadf384f67869af3de4e18d788d3ff3126238');
tokensMap.set('Manitoba', '0xcc17c2da3dc8e480bd070740981d0b561fa39103');
tokensMap.set('Mewru', '0x3557042e5f74b85e6b807192a37e773f9d4be082');
tokensMap.set('Albert', '0x4fe9670ed85ac6beadc0ce1dec131f1e86e717c0');
tokensMap.set('Urnia', '0xC2c2fc434F2ab8D7eae92374dBc2F8E6cCf10EAb');
tokensMap.set('Turkana', '0xdd0895b6c6e50a2bf0625f1e2cd36cfabbd52a93');
tokensMap.set('Nicaragua', '0x786d9a54a0437c2d3bdb44ee6cf57dfff6484131');
tokensMap.set('Onega', '0x1167788F415A162e6016936F458FD92C32823630');
tokensMap.set('Vostok', '0xe43cFea1F09b863D8061F792dc50e904903696cF');
tokensMap.set('Balkhash', '0x85f0ca0045a96abde82363f9ba8426061fefd84c');
tokensMap.set('Ontario', '0xe9c754207f2fb01debf8a1b3aa9f45c4aeb79637');
tokensMap.set('Erie', '0xfC4B76B567A9a17Cefd1D960C3478b16d9623f2a');
tokensMap.set('Malawi', '0x41a1b53df60920cb4ca6beb6c1acc8d914f47067');
tokensMap.set('Baikal', '0x0617A90edF7F8412133C839cbDe409aAC589280C');
tokensMap.set('Santa', '0xe654d4db9893556011b354b4360ced426f823f35');

let keys = process.env.KEYS.split(",");
for (let key of keys) {
    claimApproveDeposit(key);
}
setInterval(function () {
    for (let key of keys) {
        claimApproveDeposit(key);
    }
}, INTERVAL * 60 * 1000);

async function claimApproveDeposit(key) {
    let wallet = new ethers.Wallet(key, provider);
    let cooldown = await getUserCoolDown(wallet);
    console.log(cooldown);
    if (cooldown == 0) {
        await claimMatic(wallet);
        await approveMatic(wallet);
        await deposit(wallet);
        await withdraw(wallet);
    }
}

async function getUserCoolDown(wallet) {
    let contract = new ethers.Contract("0x11fe0b9b1a408f5d790c6ea5666ee6f31306408f", abiClayFaucet, provider);
    let result = await contract.getUsersCooldown("0x499d11e0b6eac7c0593d8fb292dcbbf815fb29ae", wallet.address);
    return result.timeLeft.toNumber();
}

async function claimMatic(wallet) {
    console.log(`claimMatic...`);
    await sendRawTransaction({
        from: wallet.address,
        to: "0x11fe0b9b1a408f5d790c6ea5666ee6f31306408f",
        data: '0xdf8de3e7000000000000000000000000499d11e0b6eac7c0593d8fb292dcbbf815fb29ae',
        gasLimit: 150000
    }, wallet);
}

async function approveMatic(wallet) {
    console.log(`approveMatic...`);
    await sendRawTransaction({
        from: wallet.address,
        to: "0x499d11e0b6eac7c0593d8fb292dcbbf815fb29ae",
        data: '0x095ea7b3000000000000000000000000748c2370dc892f2a1fc9947b1264ef0fad58b12bffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        gasLimit: 60000
    }, wallet);
}

async function deposit(wallet) {
    console.log(`deposit...`);
    await sendRawTransaction({
        from: wallet.address,
        to: "0x748c2370dc892f2a1fc9947b1264ef0fad58b12b",
        data: '0xb6b55f250000000000000000000000000000000000000000000000008ac7230489e80000',
        gasLimit: 150000
    }, wallet);
}

async function withdraw(wallet) {
    console.log(`withdraw...`);
    let token = new ethers.Contract("0x656a6c392f58fec03f33bec84362a586ec94153d", abiErc20, provider);
    const balanceOf = await token.balanceOf(wallet.address);
    if (balanceOf.eq(0)) {
        console.log(`balance 0`);
    } else {
        console.log(`balance not 0, withdraw...`);
        let contract = new ethers.Contract("0x748c2370dc892f2a1fc9947b1264ef0fad58b12b", abiClayStrategy, wallet);
        await contract.withdraw(balanceOf);
        console.log('success');
    }
}

async function sendRawTransaction(tx, wallet) {
    try {
        console.log(tx);
        const txResponse = await wallet.sendTransaction(tx);
        console.log("tx sent, wait to mine");
        const receipt = await txResponse.wait();
        console.log("tx success");
        return true;
    } catch (error) {
        console.log("tx failed");
        console.log(error);
    }
    return false;
}