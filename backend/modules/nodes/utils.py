from typing import List

from pydantic import TypeAdapter

from libraries import mongo_lib
from modules.nodes.models import ServerNode


# region { Node }

def get_nodes() -> list[ServerNode]:
    server_nodes = list(mongo_lib.nodes.find({}, {'_id': False}))
    return TypeAdapter(list[ServerNode]).validate_python(server_nodes)


def get_node_by_unid(node_unid: str) -> ServerNode | None:
    node = list(mongo_lib.nodes.find({'node_unid': node_unid}))
    if len(node) == 0:
        return None
    return ServerNode.model_validate(node[0])

def replace_node(server_node: ServerNode) -> bool:
    mongo_lib.nodes.replace_one({'node_unid': server_node.node_unid}, server_node.model_dump(), upsert=True)
    return True

def update_node(server_node: ServerNode) -> bool:
    mongo_lib.nodes.update_one({'node_unid': server_node.node_unid}, server_node.model_dump())
    return True


def delete_node(node_unid: str) -> bool:
    mongo_lib.nodes.delete_one({'node_unid': node_unid})
    return True

# endregion
