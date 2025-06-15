from pydantic import BaseModel


class NodeData(BaseModel):
    node_unid: str
    protocol: str
    hostname: str
    port: int
    path: str

class NodeDataRequest(NodeData):
    original_node_unid: str
