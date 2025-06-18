from typing import Dict, List

from pydantic import BaseModel


class HostData(BaseModel):
    active: List[str]
    duplicate: List[str]
    all: List[str]


class HostDict(BaseModel):
    hosts: Dict[str, HostData]
