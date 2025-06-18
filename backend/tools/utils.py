import urllib.request
from typing import List, Tuple
from urllib.error import URLError


def fetch_url(url: str) -> str:
    try:
        with urllib.request.urlopen(url) as data:
            return data.read().decode('utf-8')
    except URLError:
        return ''


def split_duplicates(main_list: List[str], to_be_filtered: List[str]) -> Tuple[List[str], List[str]]:
    filtered = []
    duplicates = []

    main_set = set(main_list)
    for item in to_be_filtered:
        if item in main_set:
            duplicates.append(item)
        else:
            filtered.append(item)

    return filtered, duplicates
