/*
 *  Copyright 2018 DeepCode AG
 *
 *  Author: Lorenzo Donati
 */
'use strict';

const fs = require('fs');
const express = require('express')
const bodyParser = require('body-parser');
const axios_ = require('axios');
const jwt = require('atlassian-jwt');
const assert = require('assert');
const debug = require('debug')(`app:${require('path').basename(__filename)}`);

let descriptor = fs.readFileSync('descriptor.json', 'utf8');
const Env = require('./env/env');

const LOCAL_PORT = Env('LOCAL_PORT');
const HOST_URL = Env('HOST_URL');
const DC_CLIENT_URL = Env('DC_CLIENT_URL');
const DC_SERVER_URL = Env('DC_SERVER_URL');
const BIT_BUCKET_APP_KEY = Env('BIT_BUCKET_APP_KEY');
const BIT_BUCKET_API_URL = Env('BIT_BUCKET_API_URL');
const BIT_BUCKET_URL = Env('BIT_BUCKET_URL');

// Set defaults for API calls.
const server = axios_.create({
  baseURL: DC_SERVER_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});


const app = express()
app.use(bodyParser.json())


let mSharedSecret = 'u3t4wcWYsmmdLyWJQ7R9xzpmMoKSCd7UpvYH5yXBjg0';
let mReq;


app.get('/', (req, res) => {
  debug(`Descriptor requested`);
  try{
    var d = JSON.parse(descriptor);
    d.key = BIT_BUCKET_APP_KEY ? BIT_BUCKET_APP_KEY : d.key;
    d.baseUrl = HOST_URL ? HOST_URL : d.baseUrl;
    res.json(d);
  } catch (error) {
    debug(error);
    res.json(JSON.parse(descriptor));
  }
});


app.get('/redirect', async (req, res) => {
  debug(`Redirecting get request to ${DC_CLIENT_URL}/app/bb/review`);
  res.redirect(`${DC_CLIENT_URL}/app/bb/review`);
});

app.post('/redirect', async (req, res) => {
  debug(`Redirecting post request to ${DC_CLIENT_URL}/app/bb/review`);
  res.redirect(`${DC_CLIENT_URL}/app/bb/review`);
});

app.post('/installed', async (req, res) => {
  const {key, clientKey, sharedSecret} = req.body;
  debug(`App installed for client ${clientKey}`);
  req.headers['X-Event-Key'] = 'app:installed';
  try{
    req.body.event = 'app:installed'
    await server.post(`webhook/bb`, req.body);
    res.sendStatus(204);
  } catch(error) {
    console.error(error);
    res.sendStatus(503);
  }
});

app.post('/uninstalled', async (req, res) => {
  const {key, clientKey, sharedSecret} = req.body;
  debug(`App uninstalled for client ${clientKey}`);
  try{
    req.body.event = 'app:uninstalled'
    await server.post(`webhook/bb`, req.body);
    res.sendStatus(204);
  } catch(error) {
    console.error(error);
    res.sendStatus(503);
  }
});

app.post('/webhook', async (req, res) => {
  res.sendStatus(204);
  mReq = req.body;
  debug(`Webhook received`);
      
  try{
    if(req.headers.authorization && req.headers.authorization.startsWith('JWT ') && req.body.event && req.body.event === req.headers['x-event-key'] && req.body.data.repository.name && req.body.data.repository.owner.uuid) {
      debug(`Webhook received for event ${req.body.event} on repo ${req.body.data.repository.name} owned by ${req.body.data.repository.owner.uuid}`);
      req.body.jwt = req.headers.authorization.split(' ')[1];
      await server.post(`webhook/bb`, req.body);
    } else {
      console.error("Received a bad webhook format");      
    }
  } catch(error) {
    console.error(error);
  }

});

try{
  debug(`App reachable on url ${HOST_URL}`);
  app.listen(LOCAL_PORT, () => console.log(`App listening on port ${LOCAL_PORT}!`));
}catch(error){
  console.error(error);
}
