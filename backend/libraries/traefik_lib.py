import re

from modules.core_models import Slug


def get_domain_names_from_traefik_config(text: str) -> list:
    pattern =r'Host\(\s*["\'`](?!\{)([\w\.-]+\.\w+)["\'`]\s*\)'
    matches = re.findall(pattern, text)

    return list(set(matches))


def build_config(slug: Slug, redirect_url: str, hostnames: list, traefik_config: dict, wildcard: bool = False) -> dict:
    if 'http' not in traefik_config: traefik_config['http'] = {}
    if 'routers' not in traefik_config['http']: traefik_config['http']['routers'] = {}
    if 'services' not in traefik_config['http']: traefik_config['http']['services'] = {}
    if 'middlewares' not in traefik_config['http']: traefik_config['http']['middlewares'] = {}

    for index, hostname in enumerate(hostnames):
        router_name = f'{index}-{slug}-node-router'
        router_redirect_name = f'{index}-{slug}-node-router-redirect'
        service_name = f'{index}-{slug}-node-service'

        tls_domain = hostname
        if wildcard:
            tls_domain = '*.' + '.'.join(hostname.split('.')[1:])

        router = {
            'entryPoints': [
                'websecure'
            ],
            'middlewares': [
                'local-ip-whitelist',
            ],
            'service': service_name,
            'rule': f'Host(`{hostname}`)',
            'tls': {
                'certResolver': 'letsencrypt',
                'domains': [
                    {
                        'main': tls_domain
                    }
                ]
            }
        }

        router_redirect = {
            'entryPoints': [
                'web'
            ],
            'middlewares': [
                'redirect-to-https'
            ],
            'service': service_name,
            'rule': f'Host(`{hostname}`)'
        }

        service = {
            'loadBalancer': {
                'servers': [
                    {
                        'url': redirect_url
                    }
                ]
            }
        }

        # Update the config file
        traefik_config['http']['routers'].update({router_name: router})
        traefik_config['http']['routers'].update({router_redirect_name: router_redirect})
        traefik_config['http']['services'].update({service_name: service})

    # Add https redirect if not present
    traefik_config['http']['middlewares'].setdefault({'redirect-to-https': {
        'redirectScheme': {
            'scheme': 'https'
        }
    }})

    # Add whitelist if not present
    traefik_config['http']['middlewares'].setdefault({'local-ip-whitelist': {
        'ipWhiteList': {
            'sourceRange': [
                '10.0.0.0/8',
                '172.16.0.0/12',
                '192.168.0.0/16',
            ]
        }
    }})

    return traefik_config
