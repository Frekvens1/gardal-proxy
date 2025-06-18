from typing import Optional

from pydantic import BaseModel, Field

from modules.core_models import Protocol, Hostname, Port, URLPath, Slug


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
    name: str = Field(default='Example node', description='Default node name')
    node_slug: Slug
    config_url: ConfigURLData
    redirect_url: RedirectURLData


class NodeDataRequest(NodeData):
    existing_node_slug: Slug
