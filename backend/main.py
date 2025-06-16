from fastapi import FastAPI
from libraries import traefik_lib, mongo_lib
from tools import utils

from modules.nodes.api import initialize as nodes_api
import modules.nodes.utils as nodes_utils

app = FastAPI()
mongo_lib.initialize()

active_hostnames = {}

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
    hostnames_dict = {}
    hostname_list = []
    for server in nodes_utils.get_nodes():
        raw_config = utils.fetch_url(f'{server.protocol.strip()}{server.hostname.strip()}:{server.port}/{server.path.strip()}')
        hostnames_unfiltered = traefik_lib.get_domain_names_from_traefik_config(raw_config)
        hostnames_filtered = utils.filter_duplicates(hostname_list, hostnames_unfiltered)

        traefik_config = traefik_lib.build_config(
            unid=server.node_unid,
            redirect_url=f'https://{server.hostname}',
            hostnames=hostnames_filtered,
            traefik_config=traefik_config,
            wildcard=True
        )

        hostname_list.extend(hostnames_filtered)
        hostnames_dict[server.node_unid] = {
            'active': hostnames_filtered,
            'all': hostnames_unfiltered,
        }

    active_hostnames = hostnames_dict
    return traefik_config


nodes_api(app)
