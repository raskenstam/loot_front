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

const CHIAN_ID = "pulsar-2";
export default function Home() {
  const [keplr, setKeplr] = useState(false);
  const [count, setCount] = useState(0);
  useEffect(async () => {
    document.title = `You clicked ${count} times`;
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
  }, []);
  return (

    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>
        <div>
          <p>You clicked {JSON.stringify(keplr)} times</p>
          <button onClick={() => setCount(1)}>
            Click me
          </button>
        </div>
      </main>
    </div>
  )
}

