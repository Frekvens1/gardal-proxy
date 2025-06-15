from pydantic import BaseModel


class NodeData(BaseModel):
    node_unid: str
    protocol: str
    ip: str
    port: int
    path: str
