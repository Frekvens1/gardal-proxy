from typing import Optional

from pydantic import BaseModel, Field

from modules.core_models import Protocol, Hostname, Port, URLPath, Slug, partial_model


class ConfigURLData(BaseModel):
    protocol: Protocol
    hostname: Hostname
    port: Port
    path: Optional[URLPath]

    def build_url(self) -> str:
        scheme = self.protocol.strip()
        host = self.hostname.strip()
        port = str(self.port)
        path = self.path.strip() if self.path else ''

        return f"{scheme}://{host}:{port}/{path}"


class RedirectURLData(BaseModel):
    protocol: Protocol
    hostname: Hostname
    port: Port

    def build_url(self) -> str:
        scheme = self.protocol.strip()
        host = self.hostname.strip()
        port = str(self.port)

        return f"{scheme}://{host}:{port}"


class NodeData(BaseModel):
    priority: int = Field(default=0, description='Lowest has priority')
    name: str = Field(default='Example node', description='Default node name')
    node_slug: Slug
    config_url: ConfigURLData
    redirect_url: RedirectURLData
    enabled: bool = Field(default=True, description='Enable config merging')
    fetch_config: bool = Field(default=True, description='Enable fetching config from servers')


class NodeDataRequest(NodeData):
    lookup_id: Slug

class PartialNodeData(partial_model(NodeDataRequest)):
    node_slug: Slug

class PartialNodeDataRequest(PartialNodeData):
    lookup_id: Slug
