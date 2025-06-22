import json

from fastapi import FastAPI
from libraries import traefik_lib, mongo_lib
from modules.hosts.models import HostData, HostDict
from tools import utils

from modules.nodes.api import initialize as nodes_api
import modules.nodes.utils as nodes_utils

app = FastAPI(root_path='/api/v1')
mongo_lib.initialize()

active_hostnames = {}


@app.get('/', operation_id='get_root')
async def root():
    return {'message': 'Hello World'}


@app.get('/hosts', response_model=HostDict, operation_id='get_hosts')
async def get_hosts() -> HostDict:
    return HostDict(hosts=active_hostnames)


@app.get('/traefik-config', operation_id='get_traefik_config')
async def get_traefik_config():
    global active_hostnames

    hostname_list = []
    hostnames_dict = {}
    traefik_config = {}

    for server in nodes_utils.get_nodes():
        if not server.fetch_config: continue
        raw_config = utils.fetch_url(server.config_url.build_url())
        hostnames_unfiltered = traefik_lib.get_domain_names_from_traefik_config(raw_config)
        hostnames_filtered, hostnames_duplicates = utils.split_duplicates(hostname_list, hostnames_unfiltered)

        if server.enabled:
            hostname_list.extend(hostnames_filtered)
            traefik_config = traefik_lib.build_config(
                slug=server.node_slug,
                redirect_url=server.redirect_url.build_url(),
                hostnames=hostnames_filtered,
                traefik_config=traefik_config,
                wildcard=True
            )

            hostnames_dict[server.node_slug] = HostData(
                active=hostnames_filtered,
                duplicate=hostnames_duplicates,
                all=hostnames_unfiltered,
            )
        else:
            hostnames_dict[server.node_slug] = HostData(
                active=[],
                duplicate=[],
                all=hostnames_unfiltered,
            )

    active_hostnames = hostnames_dict
    return traefik_config


nodes_api(app)
