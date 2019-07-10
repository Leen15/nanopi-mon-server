'use strict';

const express = require('express');
var request = require('request');
const { ClickHouse } = require('clickhouse');

const clickhouse = new ClickHouse({
    url: process.env.CH_URL,
    port: process.env.CH_PORT,
    debug: false,
    basicAuth: null,
    isUseGzip: false,
    config: {
        session_timeout                         : 60,
        output_format_json_quote_64bit_integers : 0,
        enable_http_compression                 : 0
    },

    // This object merge with request params (see request lib docs)
    reqParams: {
    }
});

async function prepareDB() {
  console.log ("##### CHECK DB STRUCTURE #########");
  const queries = [
      `CREATE DATABASE IF NOT EXISTS nanopi_mon`,
      // `DROP TABLE IF EXISTS nanopi_mon.cubes_data`,
      `CREATE TABLE IF NOT EXISTS nanopi_mon.cubes_data (
        mac_address String,
        hostname String,
        uptime Float64,
        load Float64,
        temperature Float64,
        local_ip String,
        vpn_ip String,
        venue_id UInt32,
        venue_name String,
        town String,
        total_calls UInt32,
        last_call DateTime,
        cube_version String,
        timestamp  DateTime
      )
      ENGINE=MergeTree
      PARTITION BY mac_address ORDER BY timestamp`
  ];

  for(const query of queries) {
      const r = await clickhouse.query(query).toPromise();

      console.log(query, r);
  }
    console.log ("##### CHECK DB COMPLETED #########");

}

async function saveDataOnDB(client_data, metabase_data) {
  var last_call = new Date(metabase_data.last_call);

  let rows = [{
    mac_address: client_data.mac,
    hostname: client_data.hostname || "",
    uptime: client_data.uptime,
    load: client_data.load,
    temperature: client_data.temperature,
    local_ip: client_data.local_ip  || "",
    vpn_ip: client_data.vpn_ip  || "",
    venue_id: metabase_data.id || 0,
    venue_name: metabase_data.name || "",
    town: metabase_data.town || "",
    total_calls: metabase_data.total_calls || 0,
    last_call: Math.floor(last_call.getTime()/1000) || "0000000000",
    cube_version: metabase_data.cube_version || "",
    timestamp: Math.floor(Date.now()/1000)
  }];
  var query = "INSERT INTO nanopi_mon.cubes_data (mac_address, hostname, uptime, load, temperature, local_ip, vpn_ip, venue_id, venue_name, town, total_calls, last_call, cube_version, timestamp)";
  const r = await clickhouse.insert(query, rows).toPromise();

  console.log(query, rows, r);
}



prepareDB();

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';

// App
const app = express();
app.get('/', (req, res) => {
  res.send('Nanopi Monitoring Server\n');
});

app.get('/save-data', (req, res) => {

  if (req.query.mac)
  {

    let url = process.env.METABASE_CUBE_URL +
    '?parameters=[{"type":"category","target":["variable",["template-tag","cube_mac_address"]],"value":"' + req.query.mac + '"}]';

    request({url:url, json: true}, function(err, response, body) {
      if(err) { console.log(err); return; }

      if (body[0] == undefined)
      {
        body[0] = {};
      }
      saveDataOnDB(req.query, body[0]);
    });
  }
  else {
    console.log("No mac address in request: " + req.query);
  }
  res.send(req.query);

});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
