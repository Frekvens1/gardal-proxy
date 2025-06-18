from typing import List

from pydantic import TypeAdapter

from libraries import mongo_lib
from modules.core_enums import DatabaseResponse
from modules.core_models import Slug
from modules.nodes.models import NodeData, NodeDataRequest


def __node_id(slug: Slug) -> dict:
    return {'node_slug': slug}


# region { Node }

def get_nodes() -> List[NodeData]:
    server_nodes = list(mongo_lib.nodes.find({}, {'_id': False}))
    return TypeAdapter(List[NodeData]).validate_python(server_nodes)


def get_node_by_slug(node_slug: Slug) -> NodeData | None:
    node = mongo_lib.nodes.find_one(__node_id(node_slug))
    if node is None:
        return None

    return NodeData.model_validate(node)


def replace_node(server_node: NodeDataRequest) -> DatabaseResponse:
    is_replacing = server_node.existing_node_slug != server_node.node_slug
    if is_replacing: delete_node(server_node.node_slug)

    result = mongo_lib.nodes.replace_one(
        __node_id(server_node.existing_node_slug),
        __to_node_data(server_node).model_dump(),
        upsert=True
    )

    if is_replacing: return DatabaseResponse.REPLACED
    return DatabaseResponse.CREATED if result.did_upsert else DatabaseResponse.UPDATED


def delete_node(node_slug: Slug) -> DatabaseResponse:
    mongo_lib.nodes.delete_one(__node_id(node_slug))
    return DatabaseResponse.DELETED


def __to_node_data(request: NodeDataRequest) -> NodeData:
    return NodeData(**request.model_dump())

# endregion
