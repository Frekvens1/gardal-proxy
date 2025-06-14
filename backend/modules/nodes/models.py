from pydantic import BaseModel


class ServerNode(BaseModel):
    node_unid: str
    ip: str
    port: int
