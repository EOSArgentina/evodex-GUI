import React from "react";
import { Api, JsonRpc } from "eosjs";
import ScatterJS from "scatterjs-core";
import ScatterEOS from "scatterjs-plugin-eosjs2"; // Use eosjs2 if your version of eosjs is > 16


/* const network = ScatterJS.Network.fromJson({
    blockchain:'eos',
    protocol:'http',
    host:'localhost',
    port:8888,
    chainId:'cf057bbfb72640471fd910bcb67639c22df9f92470936cddc1ade0e2f2e7dc4f'
  }) */

const network = ScatterJS.Network.fromJson({
    blockchain:'eos',
    protocol:'https',
    host:'kylin.eosargentina.io',
    port:443,
    chainId:'5fff1dae8dc8e2fc4d5b23b2c7665c97f9e9d8edf2b6485a86ba311c25639191'
})

  
class EOSIOClient extends React.Component {
	constructor(contractAccount) {
		super(contractAccount);
		this.contractAccount = contractAccount;
		ScatterJS.plugins(new ScatterEOS());

		const rpc = new JsonRpc(network.fullhost());

		// Can implement this into Redux using dispatch(setScatter(ScatterJS.scatter));
		try {
			ScatterJS.scatter.connect(this.contractAccount).then(connected => {
				if (!connected) return console.log("Issue Connecting");
				const scatter = ScatterJS.scatter;
				const requiredFields = {accounts: [network]};
				this.eos = scatter.eos(network, Api, {rpc, beta3:true})
				scatter.getIdentity(requiredFields).then(() => { // scatter.login().then( () => {
					this.account = scatter.identity.accounts.find(
						x => x.blockchain === "eos"
					);
//					const rpc = new JsonRpc(endpoint);
//					this.eos = scatter.eos(network, Api, {rpc, beta3:true})
				}); 
				window.ScatterJS = null; // crucial para seguridad
			});
		} catch (error) {
			console.log(error);
		}
	}

	getName(){
		if (ScatterJS.account('eos')) {return ScatterJS.account('eos').name}
		else {return ' '};
	}
	
	transaction = (tx) => {
		return this.eos.transact( tx,
			{
				blocksBehind: 3,
				expireSeconds: 30
			}
		);
	};

	login_and_tx = (tx) => {
		try {
			const rpc = new JsonRpc(network.fullhost());
			ScatterJS.logout({accounts: [network]});
			return ScatterJS.scatter.connect(this.contractAccount).then(connected => {
				if (!connected) return console.log("Issue Connecting");
				const scatter = ScatterJS.scatter;
				const requiredFields = {accounts: [network]};
				this.eos = scatter.eos(network, Api, {rpc, beta3:true});
				return scatter.getIdentity(requiredFields).then(() => { // scatter.login().then( () => {
					this.account = scatter.identity.accounts.find(
						x => x.blockchain === "eos"
					);
					return this.transaction(tx);
				}); 
				window.ScatterJS = null; // crucial para seguridad
			});
		} catch (error) {
			console.log(error);
		}
	}
}

export default EOSIOClient;