from fastapi import FastAPI

import traefik_lib
import utils

app = FastAPI()

traefik_servers = [

]


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/traefik_config")
async def get_traefik_config():
    traefik_config = {}
    for server in traefik_servers:
        raw_config = utils.fetch_url(f'http://{server['ip']}:{server['port']}/api/rawdata')
        hostnames = utils.get_domain_names_from_traefik_config(raw_config)
        traefik_config = traefik_lib.build_config(
            unid=server['unid'],
            redirect_url=f'https://{server['ip']}',
            hostnames=hostnames,
            traefik_config=traefik_config
        )

        print('ID:', server['unid'])
        print(server['ip'], ':', server['port'])
        print('hostnames', hostnames)
        print()
        print()

    print()
    print()

    return traefik_config
