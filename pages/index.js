import styles from '../styles/Home.module.css'
import {
  EnigmaUtils,
  Secp256k1Pen,
  SigningCosmWasmClient,
  CosmWasmClient,
  pubkeyToAddress,
  encodeSecp256k1Pubkey
} from "secretjs";
import React, { useState, useEffect } from 'react';
let jsonconfig = { "NFT_CONTR_ADRESS": "secret1qdef69pmqp2gndk4d8pel5w3lqgke0y0dqn9wa", "CONTR_ADDRESS": "secret18zgcpn84sf7587m0rv9dua9jhceyjgnpkypk43", "CONTR_HASH": "890ec5bce7afa606282734212da42751064b5c7176466b6c5f553ace2db4c750", "NFT_CONTR_HASH": "31c5b80dc36e5cb214c603424eb5a564107cb9aa62c88c75e935136a2e71df9f", "NFT_CODEID": 6366, "CONTR_CODEID": 6368 }
const CHIAN_ID = "pulsar-2";


/*
  make images use token name and prefix url before
*/
export default function Home() {
  const [keplr, setKeplr] = useState(false);
  const [owned, setOwned] = useState(0);
  const [pool, setPool] = useState();
  const [buyin, setBuyin] = useState();
  const [contractAcc, setcontractAcc] = useState();
  const [signing_client, set_signing_client] = useState(false);
  //gets signing_client
  useEffect(async () => {
    document.title = `You clicked ${owned} times`;
    const sleep = (ms) => new Promise((accept) => setTimeout(accept, ms));
    // Wait for Keplr to be injected to the page
    while (
      !window.keplr &&
      !window.getOfflineSigner &&
      !window.getEnigmaUtils
    ) {
      await sleep(10);
    }
    await window.keplr.experimentalSuggestChain({
      chainId: CHIAN_ID,
      chainName: "Local Secret Chain",
      rpc: "https://rpc.pulsar.griptapejs.com/",
      rest: "http://testnet.securesecrets.org:1317/",
      bip44: {
        coinType: 529,
      },
      coinType: 529,
      stakeCurrency: {
        coinDenom: "SCRT",
        coinMinimalDenom: "uscrt",
        coinDecimals: 6,
      },
      bech32Config: {
        bech32PrefixAccAddr: "secret",
        bech32PrefixAccPub: "secretpub",
        bech32PrefixValAddr: "secretvaloper",
        bech32PrefixValPub: "secretvaloperpub",
        bech32PrefixConsAddr: "secretvalcons",
        bech32PrefixConsPub: "secretvalconspub",
      },
      currencies: [
        {
          coinDenom: "SCRT",
          coinMinimalDenom: "uscrt",
          coinDecimals: 6,
        },
      ],
      feeCurrencies: [
        {
          coinDenom: "SCRT",
          coinMinimalDenom: "uscrt",
          coinDecimals: 6,
        },
      ],
      gasPriceStep: {
        low: 0.1,
        average: 0.25,
        high: 0.4,
      },
      features: ["secretwasm"],
    });

    await window.keplr.enable(CHIAN_ID);
    let keplrOfflineSigner = window.getOfflineSigner(CHIAN_ID);
    const accounts = await keplrOfflineSigner.getAccounts();
    let client = new SigningCosmWasmClient(
      "http://testnet.securesecrets.org:1317/", // holodeck - https://chainofsecrets.secrettestnet.io; mainnet - user your LCD/REST provider
      accounts[0].address,
      keplrOfflineSigner,
      window.getEnigmaUtils(CHIAN_ID),
      {
        // 300k - Max gas units we're willing to use for init
        init: {
          amount: [{ amount: "300000", denom: "uscrt" }],
          gas: "300000",
        },
        // 300k - Max gas units we're willing to use for exec
        exec: {
          amount: [{ amount: "300000", denom: "uscrt" }],
          gas: "300000",
        },
      }
    );
    console.log(client);
    let acc = client.getAccount("secret1saw872anvey9r2hrvyma8k89jh0cas0d44fkxp")
    console.log(await acc)
    set_signing_client(client)
    const json = await getOwnedNfts(client, accounts[0].address);
    let json2 = await poolGetTokens(client, accounts[0].address);
    let buyin = await queryPool(client, accounts[0].address)
    let localacc = await getAccount(client, accounts[0].address);
    setcontractAcc(localacc.funds)
    setBuyin(buyin)
    setPool(json2)
    setOwned(json)

  }, []);
  return (
    <div className='mx-0'>
      <div className='grid grid-cols-3 mx-10 text-white'>
        <div className="">
          <div className="p-2 bg-[#1a181aff] rounded-xl shadow-lg border-4 border-[#121212] text-white">
            <h1 className="text-3xl font-bold  opacity-87">      Your items    </h1>
          </div>
          <div className='flex flex-row flex-wrap'>
            {owned}
          </div>
        </div>
        <div className="">
          <div className=" p-2 bg-[#1a181aff] rounded-xl shadow-lg border-4 border-[#121212] text-white">
            <h1 className="text-3xl font-bold  opacity-87">      In Pool    </h1>
          </div>
          <div className='flex flex-row flex-wrap'>
            {pool}
          </div>
        </div>
        <div className=" bg-[#1a181aff] rounded-xl shadow-lg border-4 border-[#121212] text-white">
          <p className='opacity-87'>
            {"currenct buyin: " + buyin}
          </p>
          <p>
            {"Pool Funds: " + contractAcc}
          </p>
        </div>
      </div>
    </div>
  )
}

async function getOwnedNfts(signing_client, owner) {
  if (!signing_client) { return false }
  console.log("owner:" + owner)
  let queryMsg = {
    "tokens": {
      "owner": owner,
      "limit": 10
    }
  };
  let response = await signing_client
    .queryContractSmart(jsonconfig.NFT_CONTR_ADRESS, queryMsg)
    .catch((err) => {
      throw new Error(`Could not execute contract: ${err}`);
    });
  let returnarr = await Promise.all(
    response.token_list.tokens.map(async (x, index) => {
      let res = await signing_client
        .queryContractSmart(jsonconfig.NFT_CONTR_ADRESS, {
          "nft_info": {
            "token_id": x
          }
        })
        .catch((err) => {
          throw new Error(`Could not execute contract: ${err}`);
        });
      console.log("res")
      console.log(res);
      let descr = res.nft_info.description.split('%%');
      return (
        //"1942-09-06 %% 655507 %% 55 %% secret1saw872anvey9r2hrvyma8k89jh0cas0d44fkxp"
        <div className="p-4 bg-[#1a181aff] rounded-xl shadow-lg border-4 border-[#121212] w-1/2" key={index}>
          <img src="https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXA6Q1NL4kmrAlOA0_FVPCi2t_fUkRxNztUoreaOBM27OXJYzRD4si72oSJk6SiYbnTkDtSsMcg2r6QoI6t2AHlqUtvZT_3LIeRcAU8ZAvY-AeggbC4xBSHpL8" alt="Logo"
            className="w-full " />
          <h1 className="font-bold underline opacity-87 object-contain">      {res.nft_info.name}    </h1>
          <p className='opacity-60'> {descr[1]}</p>
          <button onClick={async () => await sendNft(signing_client, x)}>
            Deposit {x}
          </button>
        </div>
      )
    })
  )
  return returnarr
}
async function queryPool(signing_client, owner) {
  if (!signing_client) { return false }
  console.log("owner:" + owner)
  let queryMsg = { "query_pool": {} };

  let response = await signing_client
    .queryContractSmart(jsonconfig.CONTR_ADDRESS, queryMsg)
    .catch((err) => {
      throw new Error(`Could not execute contract: ${err}`);
    });
  console.log("poool", await response);
  return response.buyin
}

async function getAccount(signing_client, owner) {
  if (!signing_client) { return false }
  console.log("owner:" + owner)
  let queryMsg = { "query_account": { "adress": owner } };
  let response = await signing_client
    .queryContractSmart(jsonconfig.CONTR_ADDRESS, queryMsg)
    .catch((err) => {
      throw new Error(`Could not execute contract: ${err}`);
    });
  console.log("acc", await response);
  return response
}

async function poolGetTokens(signing_client, owner) {
  if (!signing_client) { return false }
  console.log("owner:" + owner)
  let queryMsg = { "get_settings": {} };

  let response = await signing_client
    .queryContractSmart(jsonconfig.CONTR_ADDRESS, queryMsg)
    .catch((err) => {
      throw new Error(`Could not execute contract: ${err}`);
    });
  let returnarr = await Promise.all(response.items.map(async (x, index) => {
    console.log(x);
    return (
      <div className="p-4 bg-[#1a181aff] rounded-xl shadow-lg border-4 border-[#121212] w-1/2" key={index}>
        <img src="https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXA6Q1NL4kmrAlOA0_FVPCi2t_fUkRxNztUoreaOBM27OXJYzRD4si72oSJk6SiYbnTkDtSsMcg2r6QoI6t2AHlqUtvZT_3LIeRcAU8ZAvY-AeggbC4xBSHpL8" alt="Logo"
          className="w-full " /> <h1 className="font-bold underline opacity-87">      {x.name}    </h1>
        <p className='opacity-60'> {x.value}</p>
      </div>
    )
  }))


  return await returnarr
}

async function sendNft(signing_client, token_id) {
  let jsonex = {
    send_nft: {
      contract: jsonconfig.CONTR_ADDRESS,
      token_id: token_id,
    }
  }
  let response = await signing_client
    .execute(jsonconfig.NFT_CONTR_ADRESS, jsonex)
    .catch((err) => {
      throw new Error(`Could not execute contract: ${err}`);
    });
  console.log('response: ', await response);
}