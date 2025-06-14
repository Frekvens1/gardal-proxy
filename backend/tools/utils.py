import re
import urllib.request


def fetch_url(url: str) -> str:
    with urllib.request.urlopen(url) as data:
        return data.read().decode('utf-8')


def get_domain_names_from_traefik_config(text: str) -> list:
    pattern = r'Host\(`(.*?)`\)'
    matches = re.findall(pattern, text)

    return list(set(matches))
