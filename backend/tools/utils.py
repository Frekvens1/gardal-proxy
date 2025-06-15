import re
import urllib.request
from urllib.error import URLError


def fetch_url(url: str) -> str:
    try:
        with urllib.request.urlopen(url) as data:
            return data.read().decode('utf-8')
    except URLError:
        return ''


def get_domain_names_from_traefik_config(text: str) -> list:
    pattern = r'Host\(`(.*?)`\)'
    matches = re.findall(pattern, text)

    return list(set(matches))
