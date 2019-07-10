
# Nanopi Monitoring Server

## What's up?  

A nodejs app for store on a Clickhouse DB hardware info about aarch64 NanoPI boards (NEO2 and NEO-Plus-2 100% tested).  
it saves:
- mac_address
- hostname
- local ip
- vpn ip
- uptime
- load
- temperature
- aditional data from external resource

it also read from an external resource (metabase in our case) additional data based on the mac address of the agent.

It works in combination with the [nanopi-mon-agent](https://github.com/Leen15/nanopi-mon-agent).

## Environment Variables  

You have to set these environment variables:  
`CH_URL`: Clickhouse URL in the format http://clickhouse.url   
`CH_PORT`: Clickhouse HTTP listing interface PORT in the format `8123`   
`METABASE_CUBE_URL`: a metabase public url that allow to pass a `cube_mac_address` parameter   
