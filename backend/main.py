from fastapi import FastAPI
from libraries import traefik_lib, mongo_lib
from tools import utils

from modules.nodes.api import initialize as nodes_api
import modules.nodes.utils as nodes_utils

app = FastAPI()
mongo_lib.initialize()

active_hostnames = []

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/hosts")
async def get_hosts():
    return active_hostnames


@app.get("/traefik_config")
async def get_traefik_config():
    global active_hostnames

    traefik_config = {}
    current_hostnames = []
    for server in nodes_utils.get_nodes():
        raw_config = utils.fetch_url(f'{server.protocol}{server.ip}:{server.port}/{server.path}')
        hostnames = utils.get_domain_names_from_traefik_config(raw_config)
        traefik_config = traefik_lib.build_config(
            unid=server.node_unid,
            redirect_url=f'https://{server.ip}',
            hostnames=hostnames,
            traefik_config=traefik_config,
            wildcard=True
        )

        current_hostnames.extend(hostnames)

        print('ID:', server.node_unid)
        print(server.ip, ':', server.port)
        print('hostnames', hostnames)
        print()
        print()

    print()
    print()

    active_hostnames = current_hostnames
    return traefik_config


nodes_api(app)
