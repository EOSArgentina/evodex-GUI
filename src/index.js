import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import FormCheck from 'react-bootstrap/FormCheck';
/* import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import DropdownMenu from 'react-bootstrap/DropdownMenu' */

import './index.css';
import { ApiService } from './services';
import EOSIOClient from "./utils/eosio-client";


class Board extends React.Component {

  constructor(props) {
    super(props);
    this.state = {  // no declaro todas las variables del estado 
      action: 'addliquidity',
      user: '',
      symbol_code: 'Select one',
      pool1: '',
      pool2: '',
      quantity1: '0.0000',
      quantity2: '0.0000',
      estimated1: '0.0000',
      estimated2: '0.0000',
      fee_voted: '0',
      fee: '',
      firstSend: true,
      updateFee: false
    };
    this.eosio = new EOSIOClient("evodex"); // [];
    this.handleAction = this.handleAction.bind(this);
    this.handleUser = this.handleUser.bind(this);
    this.handleLiquidity = this.handleLiquidity.bind(this);
    this.handleExchange = this.handleExchange.bind(this);
    this.handleFirstSend = this.handleFirstSend.bind(this);
    this.handleVoted = this.handleVoted.bind(this);
    this.handleUpdateFee = this.handleUpdateFee.bind(this);
  }

  
  handleAction(event) {
    this.setState({action: event.target.value,
      estimated1: '0.0000', estimated2: '0.0000', quantity1: '0.0000', quantity2: '0.0000',
        updateFee: false}); // firstSend... si no...
  }

  handleUser(event) {
    this.setState({user: event.target.value});
  }

  handleFee_contract(event) {
    this.setState({fee_contract: event.target.value});
  }

  handleFirstSend(event) {
    this.setState({estimated2: "0.0000", quantity2: "0.0000", 
      firstSend: !this.state.firstSend})
  }

  handleVoted(event){
    // convertir a la fee permitida más cercana.
    this.setState({fee_voted: event.target.value});
  }

  handleLiquidity(event) {
    if (this.state.symbol_code === 'Select one') return;
    const input_amount = parseFloat(event.target.value);
    const int_amount = parseInt(input_amount * (10 ** (precision_from_asset(this.state.supply))));
    // parseInt toma la parte entera
    if (int_amount <= 0) return; // idealmente resetear las cantidades
    const p1 = asset_to_int(this.state.pool1.quantity);
    const p2 = asset_to_int(this.state.pool2.quantity);
    const precision1 = this.state.precision1;
    const precision2 = this.state.precision2;

    const baseAmount1 = parseInt( int_amount * p1 / asset_to_int(this.state.supply) );
    const baseAmount2 = parseInt( int_amount * p2 / asset_to_int(this.state.supply) );
    var estAmount1, estAmount2, amount1, amount2;
    if (this.state.action === 'addliquidity') {
      estAmount1 = ( ( (baseAmount1 + 2 ) * (1 + this.state.fee / 10000) ) / (10 ** precision1)).toFixed(precision1);
      estAmount2 = ( ( (baseAmount2 + 2 ) * (1 + this.state.fee / 10000) ) / (10 ** precision2)).toFixed(precision2);
      amount1 = (estAmount1 * 1005 / 1000 + 10 ** (-precision1)).toFixed(precision1);
      amount2 = (estAmount2 * 1005 / 1000 + 10 ** (-precision2)).toFixed(precision2); 
    }
    if (this.state.action === 'remliquidity') {
      estAmount1 = (baseAmount1 / (10 ** precision1) );
      estAmount2 = (baseAmount2 / (10 ** precision2) );
      amount1 = ( (estAmount1 * 995).toFixed(precision1) / 1000 ).toFixed(precision1);
      amount2 = ( (estAmount2 * 995).toFixed(precision2) / 1000 ).toFixed(precision2); 
    }
    var amount = input_amount.toFixed(precision_from_asset(this.state.supply));
    this.setState({asset: amount + ' ' + this.state.symbol_code,
      estimated1: estAmount1.toString() + ' ' + this.state.symbol_code1,
      estimated2: estAmount2.toString() + ' ' + this.state.symbol_code2,
      quantity1:  amount1.toString() + ' ' + this.state.symbol_code1, 
      quantity2: amount2.toString() + ' ' + this.state.symbol_code2});
  }

  handleExchange(event) {
    if (this.state.symbol_code === 'Select one') return;
    const input_amount = parseFloat(event.target.value);
    if (input_amount < 0) return;
    const p1 = amount_from_asset(this.state.pool1.quantity);
    const p2 = amount_from_asset(this.state.pool2.quantity);
    const precision1 = this.state.precision1;
    const precision2 = this.state.precision2;
    var amount1, amount2, baseAmount2, estAmount2, fee, tolerance;
    this.state.firstSend? 
      ( (amount1 = input_amount) && (fee = -this.state.fee) && (tolerance = -5) ):
      ( (amount1 = -input_amount) && (fee = this.state.fee) && (tolerance = 5) );
// puede convenir calcular baseAmount2 como división entera, como en liquidity
    baseAmount2 = -(p2 * amount1) / (p1 + amount1) + 2 * 10 ** (-precision2);
    estAmount2 = ( baseAmount2 * (1 + fee / 10000) ).toFixed(precision2);
    amount2 = ( estAmount2 * (1 + tolerance / 1000) ).toFixed(precision2);
    this.setState({quantity1: amount1.toFixed(precision1) + ' ' + this.state.symbol_code1,
      estimated2: estAmount2 + ' ' + this.state.symbol_code2, 
      quantity2: amount2 + ' ' + this.state.symbol_code2})
  }

  handleSymbol = async event => {
    if (event.target.value === 'Select one') return;
    const sym = event.target.value;
    this.setState({symbol_code: sym,
      pool1: await ApiService.getTable(sym, 'stat', 'connector1'),
      pool2: await ApiService.getTable(sym, 'stat', 'connector2'),  
      supply: await ApiService.getTable(sym, 'stat', 'supply'),
      fee: await ApiService.getTable(sym, 'stat', 'fee')
    });
    this.setState( {symbol_code1: code_from_asset(this.state.pool1.quantity),
      symbol_code2: code_from_asset(this.state.pool2.quantity),
      precision1: precision_from_asset(this.state.pool1.quantity), 
      precision2: precision_from_asset(this.state.pool2.quantity),
      asset: '0.0000', quantity1: '0.0000', quantity2: '0.0000',
      estimated1: '0.0000', estimated2: '0.0000',} );
    // o hacer update de quantity1 y quantity2
  }

  handleSwitch = async event => {
    this.eosio.switchId();
    // this.setState({name: await this.eosio.switchId()});   este va 
  }
  
  handleSubmit = async event => {
    // se puede agregar chequeos como que las quantities no sean 0.
    const tx = this.makeTx();
    try{
      if (this.state.user !== this.eosio.getName()) {
        const result1 = await this.eosio.login_and_tx(tx);
        console.log(result1);
      } else {
        const result = await this.eosio.transaction(tx);
        console.log(result);
      }
    } catch (e) {
      console.log("\nCaught exception: " + e);
      // if (e instanceof RpcError) console.log(JSON.stringify(e.json, null, 2));
    }
    // evitar duplicación de código en lo que sigue (igual a handleSymbol), 
    // pero no logro componer funciones async
    const sym = this.state.symbol_code;
    this.setState({
      pool1: await ApiService.getTable(sym, 'stat', 'connector1'),
      pool2: await ApiService.getTable(sym, 'stat', 'connector2'),  
      supply: await ApiService.getTable(sym, 'stat', 'supply'),
      fee: await ApiService.getTable(sym, 'stat', 'fee')
    });
    this.setState( {symbol_code1: code_from_asset(this.state.pool1.quantity),
      symbol_code2: code_from_asset(this.state.pool2.quantity),
      precision1: precision_from_asset(this.state.pool1.quantity), 
      precision2: precision_from_asset(this.state.pool2.quantity),
      asset: '0.0000', quantity1: '0.0000', quantity2: '0.0000',
      estimated1: '0.0000', estimated2: '0.0000',} );
  }; 

  handleUpdateFee (event) {
    this.setState({updateFee: !this.state.updateFee}); 
  }

  makeTx() {
    const action = this.state.action;
    const user = this.state.user;
    const auth = [{actor: user, permission: 'active'}];
    const contract1 = this.state.pool1.contract;
    const contract2 = this.state.pool2.contract;
    const quantity1 = this.state.quantity1;
    const quantity2 = this.state.quantity2;
    const ext_asset1 = {"contract": contract1, "quantity": quantity1};
    const ext_asset2 = {"contract": contract2, "quantity": quantity2};
    const ext_symbol1 = {"contract": contract1, "sym": symbol_from_asset(quantity1)};
    const ext_symbol2 = {"contract": contract2, "sym": symbol_from_asset(quantity2)};
    const symbol = symbol_from_asset(this.state.supply);
    var mainAction, actions;
    
    if (action === 'votefee') {
      mainAction = makeAction('wesetyourfee', 'votefee', auth, 
        {user: user, sym: symbol, 
          fee_index_voted: this.state.fee_voted});
      actions = [mainAction];
      if (this.state.updateFee) {
        actions.push(makeAction('wesetyourfee', 'updatefee', auth,
          {sym: symbol}));
      }
    } else {
      if (action === 'addliquidity') {
        mainAction = makeAction('evolutiondex', 'addliquidity', auth,
          {user: user, to_buy: this.state.asset, max_ext_asset1: ext_asset1,
          max_ext_asset2: ext_asset2} );
      } else if (action === 'remliquidity') {
        mainAction = makeAction('evolutiondex', 'remliquidity', auth,
          {user: user, to_sell: this.state.asset, min_ext_asset1: ext_asset1,
          min_ext_asset2: ext_asset2 } );
      } else if (action === 'exchange') {
        mainAction = makeAction('evolutiondex', 'exchange', auth,
          {user: user, through: symbol_from_asset(this.state.supply), 
            ext_asset1: ext_asset1, ext_asset2: ext_asset2 });
      }      
      actions = [
              makeAction('evolutiondex', 'openext', auth, 
                {user: user, payer: user, ext_symbol: ext_symbol1} ),
              makeAction('evolutiondex', 'openext', auth, 
                {user: user, payer: user, ext_symbol: ext_symbol2} )];
      
      if (quantity1.charAt(0) !== '-' && amount_from_asset(quantity1)!== 0 ) // o si es 0...       
          actions.push(makeAction(contract1, 'transfer', auth,
            {from: user, to: 'evolutiondex', quantity: quantity1, memo: ''}) );
      if (quantity2.charAt(0) !== '-' && amount_from_asset(quantity2)!== 0 )
          actions.push(makeAction(contract2, 'transfer', auth,
            {from: user, to: 'evolutiondex', quantity: quantity2, memo: ''}) );
      
      actions.push(mainAction, 
        makeAction('evolutiondex', 'closeext', auth, {user: user, ext_symbol: ext_symbol1} ), 
        makeAction('evolutiondex', 'closeext', auth, {user: user, ext_symbol: ext_symbol2})
      );
    }
    return({actions: actions});
  }

  render() {
    return (
      <div>

      <Container fluid="md">
        <Row> &nbsp; </Row>
        <Row> &nbsp; </Row>
        <Row>
          <Col align="right"> User </Col>
          <Col xs="2"> 
            <Form.Control size="sm" rows="1" value={this.state.user} onChange={this.handleUser} /> 
          </Col>
          <Col xs="2" align="right"> Action </Col>
          <Col>
            <select value={this.state.action} onChange={this.handleAction}>
            <option value="addliquidity"> Add liquidity </option>
            <option value="remliquidity"> Remove liquidity </option>
            <option value="exchange"> Exchange </option>
            <option value="votefee"> Vote fee </option>
            </select>  
          </Col>
      </Row>
      
      <Row> &nbsp; </Row>
      <Row> &nbsp; </Row>
      <Row> 
        <Col> &nbsp; </Col>
        <Col xs="2"> Pair token: </Col>
        {this.state.action.substring(3) === 'liquidity'? 
          (<Col xs="2"> <Form.Control size="sm" rows="1" onChange={this.handleLiquidity} />
            </Col>):
          (<span> &nbsp; </span>)}
        <Col xs="1.3">
        <select value={this.state.symbol_code} onChange={this.handleSymbol}>
          <option value="Select one"> Select one </option>
          <option value="EOSPESO"> EOSPESO </option>
          <option value="EVO"> EVO </option>
          <option value="USDEOS"> USDEOS </option>
          <option value="CORONA"> CORONA </option>
        </select> 
        </Col>
        <Col xs="2" align="right"> &nbsp; Supply:  <br/> &nbsp; Fee:  </Col>
        <Col> {this.state.supply} <br/> {(this.state.fee / 100).toFixed(2)} % </Col>
      </Row>
      </Container>

      {this.state.action.substring(3) === 'liquidity'? (
      <Container color="blue" fluid="md">
        <Row> &nbsp; </Row>
        <Row> &nbsp; </Row>
        <Row align="left"> <Col xs="4"> </Col>
          <Col xs="2" align="center" style={{ backgroundColor: 'lightblue', height: '30px'}}>
          {this.state.action==='addliquidity'? (<span> To pay </span>):null }
          {this.state.action==='remliquidity'? (<span> To receive </span>):null } </Col> </Row>
        <Row align="right">
          <Col xs="2"> &nbsp; </Col>
          <Col xs="2" align="center" > Token contract </Col>
          <Col xs="2" align="center"> Estimated
            <br/> {this.state.action==='addliquidity'? 
              (<span style={{ fontSize: 12}} height={5}> (including fee) </span>):
              <span> &nbsp; </span>} </Col>
          <Col xs="2" align="center">        
            {this.state.action==='addliquidity'? (<span> Maximum </span>):null }
            {this.state.action==='remliquidity'? (<span> Minimum </span>):null }
          </Col>
          <Col xs="1"/> <Col xs="2" align="center" style={{ backgroundColor: 'lightgreen', height: '30px'}}>
            In pool </Col>
        </Row> 
        <Row style={{height:"20px"}}> &nbsp; </Row>

        <Row align="right"> 
          <Col xs="2"> &nbsp; </Col>
          <Col xs="2"> {this.state.pool1.contract} </Col>
          <Col xs="2"> {this.state.estimated1} </Col>
          <Col xs="2"> {this.state.quantity1}  </Col>
          <Col xs="3"> {this.state.pool1.quantity} </Col>
        </Row>
        <Row align="right"> 
          <Col xs="2"> &nbsp; </Col>
          <Col xs="2"> {this.state.pool2.contract} </Col>
          <Col xs="2"> {this.state.estimated2} </Col>
          <Col xs="2"> {this.state.quantity2} </Col>
          <Col xs="3"> {this.state.pool2.quantity} </Col>
        </Row>
      </Container>
      ):null}

      {this.state.action === 'exchange'? 
        (<Container> 
          <Row> &nbsp; </Row> 
          <Row> &nbsp; </Row>         
          {this.state.firstSend? 
          ( <Row align="center"> 
              <Col style={{ backgroundColor: 'lightgreen', height: '28px'}}> Send </Col>
              <Col> <Button onClick={this.handleFirstSend}> &#8646; </Button> </Col>
              <Col style={{ backgroundColor: 'lightgreen', height: '28px'}}> Receive </Col> </Row> ):
          ( <Row align="center"> 
              <Col style={{ backgroundColor: 'lightgreen', height: '28px'}}> Receive </Col>
              <Col> <Button onClick={this.handleFirstSend}> &#8646; </Button> </Col>
              <Col style={{ backgroundColor: 'lightgreen', height: '28px'}}> Send </Col> 
            </Row> )}

          <Row> &nbsp; </Row>
          <Row> 
            <Col xs="8"> </Col>  
            <Col xs="2"> Estimated </Col>  
            <Col xs="2"> {this.state.firstSend? (<span> at least </span>):
                (<span> at most </span>) }
            </Col>
            <Col xs="2"> &nbsp; </Col>
          </Row>
          <Row> 
            <Col xs="2">
              <Form.Control size="sm" rows="1" onChange={this.handleExchange} />
            </Col>
            <Col xs="3"> {this.state.symbol_code1} </Col>
            <Col xs="3"> &nbsp; </Col>
            <Col xs="2"> {this.state.estimated2.charAt(0)==='-'? 
              (this.state.estimated2.substring(1)):(this.state.estimated2)}  </Col>
            <Col xs="2"> {this.state.quantity2.charAt(0)==='-'? 
              (this.state.quantity2.substring(1)):(this.state.quantity2)} 
            </Col>
            <Col>
            </Col>
          </Row>
          <Row> &nbsp; </Row>
          <Row> 
            <Col> In pool: {this.state.pool1.quantity} &nbsp; ({this.state.pool1.contract})</Col>
            <Col> </Col>
            <Col> In pool: {this.state.pool2.quantity} &nbsp; ({this.state.pool2.contract})</Col>
          </Row>
        </Container>
      ):null }
      
      {this.state.action === 'votefee'? (
        <Container>
          <Row> &nbsp; </Row>
          <Row> &nbsp; </Row>
          <Row> 
            <Col> </Col>
            <Col align="right"> Fee voted: </Col>
            <Col> <Form.Control size="sm" rows="1" onChange={this.handleVoted} /> </Col>
            <Col> 
              <Form.Check type="checkbox" label="Update fee" onClick={this.handleUpdateFee} /> 
            </Col>
            <Col> </Col>
          </Row>

        </Container>

      ):null}

      <Container align="center">
      <Row> &nbsp; </Row>
      <Row> &nbsp; </Row>
      <Row align="center">
        <Col>
          <Button className="default" onClick={this.handleSubmit}>
            Submit
          </Button>
        </Col>
      </Row>
      </Container>

    </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <Board />,
  document.getElementById('root')
);


function symbol_from_asset(asset) {
  var space = asset.indexOf(' ');
  var dot = asset.indexOf('.');
  var precision = space - dot - 1;
  if (dot === -1) precision = 0;
  return(precision + ',' + asset.substring(space + 1));
}

function code_from_asset(asset) {
  return(symbol_from_asset(asset).substring(2) );
}

function precision_from_asset(asset) {
  return( parseInt(symbol_from_asset(asset).substring(0,1)) );
}

function amount_from_asset(asset) {
  if (asset === null) return '0'; 
  var space = asset.indexOf(' ');
  return(parseFloat( asset.substring(0, space)) )
}

function asset_to_int(asset) {
  return(parseInt(amount_from_asset(asset) * (10 ** (precision_from_asset(asset)) )) );
}

function makeAction(contract, action, auth, dataValue){
  return {account: contract, name: action, authorization: auth, data: dataValue};
}

// <div class="p-3 mb-2 bg-primary text-white"> To pay </div>
// <Button onClick={this.handleLink}> Link </Button>

// How to call multiple JavaScript functions in onclick event?

