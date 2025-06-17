from pydantic import TypeAdapter

from libraries import mongo_lib
from modules.core_enums import DatabaseResponse
from modules.nodes.models import NodeData, NodeDataRequest


# region { Node }

def get_nodes() -> list[NodeData]:
    server_nodes = list(mongo_lib.nodes.find({}, {'_id': False}))
    return TypeAdapter(list[NodeData]).validate_python(server_nodes)


def get_node_by_unid(node_unid: str) -> NodeData | None:
    node = list(mongo_lib.nodes.find({'node_unid': node_unid}))
    if len(node) == 0:
        return None
    return NodeData.model_validate(node[0])


def replace_node(server_node: NodeDataRequest) -> DatabaseResponse:
    server_node.path = server_node.path.lstrip('/')
    is_replacing = server_node.original_node_unid != server_node.node_unid
    if is_replacing: delete_node(server_node.node_unid)

    result = mongo_lib.nodes.replace_one({'node_unid': server_node.original_node_unid}, server_node.model_dump(), upsert=True)
    if result.did_upsert: return DatabaseResponse.CREATED

    return DatabaseResponse.REPLACED if is_replacing else DatabaseResponse.UPDATED


def update_node(server_node: NodeData) -> DatabaseResponse:
    mongo_lib.nodes.update_one({'node_unid': server_node.node_unid}, server_node.model_dump())
    return DatabaseResponse.UPDATED


def delete_node(node_unid: str) -> DatabaseResponse:
    mongo_lib.nodes.delete_one({'node_unid': node_unid})
    return DatabaseResponse.DELETED

# endregion
