import React from 'react';
import axios from 'axios';
import { Icon, Label, Menu, Table, Message } from 'semantic-ui-react';
import emailjs from 'emailjs-com';

//import htmlparser2 from 'htmlparser2';
const htmlparser2 = require('htmlparser2');
/* const accountSid = 'AC9539d66e52aedfc39775b4d345e16a73';
const authToken = '6ab83e70877528c3b1f2c3dcb6d6bfd8';
const client = require('twilio')(accountSid, authToken); */

let inPreis = false;
let inName = false;
let inAdress = false;
let inTime = false;
let item = 0;
let href_value = false;

/* class Tankstelle {
  constructor(name, preis, adress, updateTime ){
    this.name = name;
    this.preis = preis;
    this.adress = adress;

  }
} */

let Tansktelle = {
  name: '',
  preis: null,
  adress: '',
  updateTime: null,
};
let Tankstellen = [];

const parser = new htmlparser2.Parser(
  {
    onattribute(name, value) {
      /*  if (
        value === 'PriceList__itemPrice h1' ||
        value === 'PriceList__itemTitle h1' ||
        value === 'PriceList__itemSubtitle h1' ||
        value === 'PriceList__itemUpdated h1'
      ) {
        Tankstellen.push(Object.create(Tansktelle));
      }
       */

      if (
        (name === 'href' &&
          value ===
            '/tankstelle/877a6b0f/senftl-gmbh-hauptstr-9-84174-eching-viecht') ||
        value ===
          '/tankstelle/ba87ba9/omv-erlbacher-str-4-84172-buch-am-erlbach' ||
        value ===
          '/tankstelle/63106b10/aral-tankstelle-gewerbepark-sporer-au-1-85368-wang-bei-moosburg' ||
        value === '/tankstelle/ba264f06/agip-wittstrasse-15-84036-landshut' ||
        value === '/tankstelle/adda526f/avia-am-lenghardt-5-84174-eching'
      ) {
        Tankstellen.push(Object.create(Tansktelle));
        href_value = true;
      }
      if (
        name === 'class' &&
        value === 'PriceList__itemPrice h1' &&
        href_value === true
      ) {
        inPreis = true;
      }
      if (
        name === 'class' &&
        value === 'PriceList__itemTitle' &&
        href_value === true
      ) {
        inName = true;
      }
      if (
        name === 'class' &&
        value === 'PriceList__itemSubtitle' &&
        href_value === true
      ) {
        inAdress = true;
      }
      if (
        name === 'class' &&
        value === 'PriceList__itemUpdated' &&
        href_value === true
      ) {
        inTime = true;
      }
    },
    ontext(text) {
      if (inPreis) {
        console.log(text);
        inPreis = false;
        Tankstellen[item].preis = text.trim();
      }
      if (inName) {
        console.log(text);
        inName = false;
        Tankstellen[item].name = text.trim();
      }
      if (inAdress) {
        console.log(text);
        inAdress = false;
        Tankstellen[item].adress = text.trim();
      }
      if (inTime) {
        console.log(text);
        inTime = false;
        Tankstellen[item].updateTime = text.trim();
        item++;
        href_value = false;
      }
    },
    onclosetag(tagname) {
      if (tagname === 'html') {
        inPreis = false;
        console.log(Tankstellen);
      }
    },
  },
  { decodeEntities: true }
);

class App extends React.Component {
  URL = 'https://mehr-tanken.de/tankstellen?searchText=84174&brand=0&fuel=2';
  URL2 =
    'https://www.clever-tanken.de/tankstelle_liste?lat=48.4865015&lon=12.0479673&ort=84174&spritsorte=3&r=5';
  URL_3 =
    'https://mehr-tanken.de/tankstellen?searchText=84174&brand=0&fuel=2&range=15';
  PROXY_URL = 'https://cors-anywhere.herokuapp.com/';
  PROXY_URL2 = 'http://thingproxy.freeboard.io/';

  state = { tankstellen2: [], alert: false, text: '' };

  componentDidMount() {
    this.timer = setInterval(() => this.onPreisRequest(), 600000);
  }

  componentWillUnmount() {
    this.timer = null; // here...
  }

  onPreisRequest = async () => {
    this.setState({ tankstellen2: [] });

    axios
      .get(this.PROXY_URL + this.URL_3, {
        headers: {
          //'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Headers':
            'Origin, X-Requested-With, Content-Type, Accept',
        },
      })
      .then((resp) => {
        parser.write(resp.data);
        parser.end();
        this.setState({ tankstellen2: Tankstellen });
        let tankstellenPreis = this.findTankstelle(Tankstellen);
        let text = this.checkTankstellePreis(tankstellenPreis);
        console.log(tankstellenPreis);
        this.sendEmail(text);
        this.sendWhatsapp(text);
        if (Tankstellen.length > 0) {
          Tankstellen = [];
          item = 0;
        }
      });
  };

  sendEmail = (text) => {
    let template = {
      to_name: 'Rosemarie Mayer',
      message: text,
      from_name: 'Ozan Gök',
    };

    emailjs
      .send(
        'service_srqqh8q',
        'template_s0nwj49',
        template,
        'user_FqO2ESEAOg7IPAouBefvn'
      )
      .then(
        (result) => {
          console.log(result.text);
        },
        (error) => {
          console.log(error.text);
        }
      );
  };

  /*   sendWhatsapp = (text) => {
    client.messages
      .create({
        from: 'whatsapp:+14155238886',
        to: 'whatsapp:+4917630173373',
        body: text,
      })
      .then((message) => console.log(message));
  }; */
  findTankstelle = (tankstellenPreis) => {
    let preises = {
      preisAvia: null,
      preisAgip: null,
      preisOMV: null,
      preisAral: null,
      preisSenftl: null,
    };

    for (let element of tankstellenPreis) {
      if (element.name.includes('Senftl')) {
        preises.preisSenftl = element.preis;
      } else if (element.name.includes('AVIA')) {
        preises.preisAvia = element.preis;
      } else if (element.name.includes('OMV')) {
        preises.preisOMV = element.preis;
      } else if (element.name.includes('Agip')) {
        preises.preisAgip = element.preis;
      } else if (element.name.includes('Aral')) {
        preises.preisAral = element.preis;
      } else {
      }
    }

    return preises;
  };

  checkTankstellePreis = (preises) => {
    let Text = '';
    if (preises.preisSenftl >= preises.preisAvia) {
      this.setState({ alert: true });
      let diff = (preises.preisSenftl - preises.preisAvia).toFixed(2);
      Text =
        ' Alerttt!!! The Preises of AviaTankstelle is ' +
        diff +
        ' Cent' +
        ' cheaper than ours... ';
    } else if (preises.preisSenftl > preises.preisOMV) {
      this.setState({ alert: true });

      Text =
        ' Alerttt!!! The Preises of OMV Tankstelle is ' +
        preises.preisSenftl -
        preises.preisAvia +
        ' cheaper than ours... ';
    } else if (preises.preisSenftl > preises.preisAral) {
      this.setState({ alert: true });

      Text =
        ' Alerttt!!! The Preises of Aral Tankstelle is ' +
        preises.preisSenftl -
        preises.preisAvia +
        ' cheaper than ours... ';
    } else if (preises.preisSenftl > preises.preisAgip) {
      this.setState({ alert: true });

      Text =
        ' Alerttt!!! The Preises of Agip Tankstelle is ' +
        preises.preisSenftl -
        preises.preisAvia +
        ' cheaper than ours... ';
    } else {
      console.log('Alles in Ordnung..');
      Text = 'Alles in Ordnung';
    }

    /*   return (
      <Message>
        <p>{Text}</p>
      </Message>
    ); */

    this.setState({ text: Text });
    return Text;
  };

  render() {
    return (
      <div className="ui segment">
        <button className="ui button" onClick={this.onPreisRequest}>
          Click Here
        </button>
        {this.state.tankstellen2.map((tankstelle) => {
          return (
            <Table celled>
              <Table.Header>
                <Table.HeaderCell>Tankstelle</Table.HeaderCell>
                <Table.HeaderCell>Preis</Table.HeaderCell>
                <Table.HeaderCell>Adress</Table.HeaderCell>
                <Table.HeaderCell>Updated Time</Table.HeaderCell>
              </Table.Header>
              <Table.Body>
                <Table.Row>
                  <Table.Cell>{tankstelle.name}</Table.Cell>
                  <Table.Cell>{tankstelle.preis}</Table.Cell>
                  <Table.Cell>{tankstelle.adress}</Table.Cell>
                  <Table.Cell>{tankstelle.updateTime}</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          );
        })}
        <Message>
          <p style={{ color: 'red', fontSize: '20px' }}>{this.state.text}</p>
        </Message>
      </div>
    );
  }
}

export default App;
