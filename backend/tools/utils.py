import urllib.request
from urllib.error import URLError


def fetch_url(url: str) -> str:
    try:
        with urllib.request.urlopen(url) as data:
            return data.read().decode('utf-8')
    except URLError:
        return ''

def filter_duplicates(main_list: list, to_be_filtered: list) -> list:
    return [item for item in to_be_filtered if item not in main_list]
