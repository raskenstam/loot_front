
import React, { useState, useEffect } from "react";
import { useImmer } from 'use-immer';
import { useRouter } from 'next/router'
import {
    EnigmaUtils,
    Secp256k1Pen,
    SigningCosmWasmClient,
    CosmWasmClient,
    pubkeyToAddress,
    encodeSecp256k1Pubkey
} from "secretjs";
let jsonconfig = { "NFT_CONTR_ADRESS": "secret1qdef69pmqp2gndk4d8pel5w3lqgke0y0dqn9wa", "CONTR_ADDRESS": "secret18zgcpn84sf7587m0rv9dua9jhceyjgnpkypk43", "CONTR_HASH": "890ec5bce7afa606282734212da42751064b5c7176466b6c5f553ace2db4c750", "NFT_CONTR_HASH": "31c5b80dc36e5cb214c603424eb5a564107cb9aa62c88c75e935136a2e71df9f", "NFT_CODEID": 6366, "CONTR_CODEID": 6368 }
const CHIAN_ID = "pulsar-2";
/*
    api call that update data
    component that renders from api data 
*/

function Main() {
    const router = useRouter()
    const [owned_nft_components, setOwnedComponents] = useState([]);
    const [pool_nft_components, setPoolComponents] = useState();
    const [tokenarray, setTokenArray] = useState();
    const [ownedData, setOwned] = useState();
    const [poolData, setPool] = useState();
    const [buyin, setBuyin] = useState(false);
    const [funds, setFunds] = useState(false);
    const [lootbox, setLootbox] = useState();
    const [signing_client, set_signing_client] = useState(false);
    async function getOwnedNfts(client) {
        let queryMsg = {
            "tokens": {
                "owner": client.senderAddress,
            }
        };
        let response = await client
            .queryContractSmart(jsonconfig.NFT_CONTR_ADRESS, queryMsg)
            .catch((err) => {
                throw new Error(`Could not execute contract: ${err}`);
            });
        setTokenArray(response.token_list.tokens)
        let returnarr = await Promise.all(
            response.token_list.tokens.map(async (x, index) => {
                let res = await client
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
                return {
                    name: res.nft_info.name,
                    price: descr[1],
                    tokenid: x,
                    index: index
                }
            })
        )
        console.log(returnarr);
        setOwned(returnarr);
    }
    async function getPoolNfts(client) {
        let queryMsg = { "get_settings": {} };
        let response = await client
            .queryContractSmart(jsonconfig.CONTR_ADDRESS, queryMsg)
            .catch((err) => {
                throw new Error(`Could not execute contract: ${err}`);
            });
        console.log(response);
        setPool(await response.items)
    }
    async function getContract(signing_client, owner) {
        if (!signing_client) { return false }
        console.log("owner:" + owner)
        let queryMsg = { "query_account": { "adress": owner } };
        let response = await signing_client
            .queryContractSmart(jsonconfig.CONTR_ADDRESS, queryMsg)
            .catch((err) => {
                throw new Error(`Could not execute contract: ${err}`);
            });
        console.log("acc", await response);
        setFunds(response.funds)
        let buyin = await queryPool(signing_client, signing_client.senderAddress)
        setBuyin(buyin)
    }
    async function rollContract(signing_client) {
        const handleMsg = { "start_loot_pool": {} };
        console.log('Updating count');
        response = await signing_client.execute(jsonconfig.CONTR_ADDRESS, handleMsg);
        setLootbox(<p>loading</p>);
        let queryMsg = {
            "tokens": {
                "owner": signing_client.senderAddress,
            }
        };
        let response = await signing_client
            .queryContractSmart(jsonconfig.NFT_CONTR_ADRESS, queryMsg)
            .catch((err) => {
                throw new Error(`Could not execute contract: ${err}`);
            });
        let difference = response.token_list.tokens.filter(x => !tokenarray.includes(x));
        /*
        console.log(poolData[0].tokenid);
        console.log(difference[0])
        let a = poolData.filter(x => x.token_id != difference[0])
        console.log(a);
        */
        let loopindex = 0;
        let boxarr = [];
        for (let index = 0; index < 40; index++) {
            //fill with pool item
            if (loopindex >= poolData.length) {
                loopindex = 0;
            }
            console.log(poolData.length);
            console.log(loopindex);
            console.log(poolData[loopindex]);
            if (index == 5) {
                let a = poolData.filter(x => x.tokenid == difference[0])
                boxarr.push(a[0])
            }
            else {
                boxarr.push(
                    poolData[loopindex]
                )
                loopindex++;
            }
        }
        console.log(boxarr);
        let arr = boxarr.map((x, index) => {
            return (
                <div className="thing" key={index}>
                    <p>
                        {index}
                    </p>
                </div>
            )
        })
        let asd =
            <div className='main'>
                <div className="relative">
                </div>
                <div className="leftpanel">
                </div>
                <div className="rightpanel">
                </div>
                <div className="boxwrapper">
                    {arr}
                </div>
            </div>
        setLootbox(asd);
    }

    useEffect(async () => {
        if (!router.isReady) return;
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
        console.log(keplrOfflineSigner);
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
        set_signing_client(client)
        getPoolNfts(client);
        getOwnedNfts(client);
        getContract(client, client.senderAddress)
    }, [router.isReady]);

    useEffect(async () => {
        if (!signing_client) { return false }
        if (poolData) {
            let returnarr = poolData.map((x, index) => {
                console.log(x);
                return (
                    <div className="p-4 bg-[#1a181aff] rounded-xl shadow-lg border-4 border-[#121212] w-1/2" key={index}>
                        <img src="https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXA6Q1NL4kmrAlOA0_FVPCi2t_fUkRxNztUoreaOBM27OXJYzRD4si72oSJk6SiYbnTkDtSsMcg2r6QoI6t2AHlqUtvZT_3LIeRcAU8ZAvY-AeggbC4xBSHpL8" alt="Logo"
                            className="w-full " /> <h1 className="font-bold underline opacity-87">      {x.name}    </h1>
                        <p className='opacity-60'> {x.value}</p>
                    </div>
                )
            })
            const equals = (a, b) => JSON.stringify(a) === JSON.stringify(b);
            if (!equals(returnarr, pool_nft_components)) {
                setPoolComponents(returnarr)
            }
        }
        if (ownedData) {
            let returnarr = ownedData.map((x, index) => {
                return (
                    //"1942-09-06 %% 655507 %% 55 %% secret1saw872anvey9r2hrvyma8k89jh0cas0d44fkxp"
                    <div className="p-4 bg-[#1a181aff] rounded-xl shadow-lg border-4 border-[#121212] w-1/2" key={index}>
                        <img src="https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXA6Q1NL4kmrAlOA0_FVPCi2t_fUkRxNztUoreaOBM27OXJYzRD4si72oSJk6SiYbnTkDtSsMcg2r6QoI6t2AHlqUtvZT_3LIeRcAU8ZAvY-AeggbC4xBSHpL8" alt="Logo"
                            className="w-full " />
                        <h1 className="font-bold underline opacity-87 object-contain">      {x.name}    </h1>
                        <p className='opacity-60'> {x.price}</p>
                        <button onClick={async () => {
                            await sendNft(signing_client, x.tokenid)
                            getOwnedNfts(signing_client)
                            getPoolNfts(signing_client)
                        }}>
                            Deposit {x.tokenid}
                        </button>
                    </div>
                )
            })
            const equals = (a, b) => JSON.stringify(a) === JSON.stringify(b);
            if (!equals(returnarr, owned_nft_components)) {
                console.log("not equeal");
                setOwnedComponents(returnarr)
            }

        }
    });

    /*
        array of 40 div created from lootbox item
        for loop to push array and when right is reached ad winner
        number x is the winner.
        start when won token is confirmed
    */
    return (
        <div className='mx-0'>
            {lootbox}
            <div className='grid grid-cols-3 mx-10 text-white'>
                <div className="">
                    <div className="p-2 bg-[#1a181aff] rounded-xl shadow-lg border-4 border-[#121212] text-white">
                        <h1 className="text-3xl font-bold  opacity-87">      Your items    </h1>
                    </div>
                    <div className='flex flex-row flex-wrap'>
                        {owned_nft_components}
                    </div>
                </div>
                <div className="">
                    <div className=" p-2 bg-[#1a181aff] rounded-xl shadow-lg border-4 border-[#121212] text-white">
                        <h1 className="text-3xl font-bold  opacity-87">      In Pool    </h1>
                    </div>
                    <div className='flex flex-row flex-wrap'>
                        {pool_nft_components}
                    </div>
                </div>
                <div className=" bg-[#1a181aff] rounded-xl shadow-lg border-4 border-[#121212] text-white">
                    <p className='opacity-87'>
                        {"currenct buyin: " + buyin}
                    </p>
                    <p>
                        {"Pool Funds: " + funds}
                    </p>
                    <button onClick={async () => {
                        rollContract(signing_client);
                    }}>
                        start lootbox
                    </button>
                </div>
            </div>
        </div>
    )
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
export default Main

function Lootbox(items) {

    return (
        <div className=''>
            <div className="relative">
            </div>
            <div className="leftpanel">
            </div>
            <div className="rightpanel">
            </div>
            <div className="boxwrapper">
                {items}
            </div>
        </div>)
}