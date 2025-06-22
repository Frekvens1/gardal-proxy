from typing import List

from fastapi import FastAPI

from modules.core_enums import DatabaseResponse
from modules.core_models import Slug
from modules.nodes.models import NodeData, NodeDataRequest, PartialNodeDataRequest
from modules.nodes.utils import get_node_by_slug, delete_node, get_nodes, replace_node, replace_partial_node


def initialize(app: FastAPI):
    # region { Node - Default }

    @app.get('/nodes', response_model=List[NodeData], operation_id='get_nodes')
    async def app_get_nodes() -> List[NodeData]:
        """
        :return: NodeData: Returns all nodes with data in a list
        """

        return get_nodes()

    @app.get('/node/{node_slug}', response_model=NodeData, operation_id='get_node')
    async def app_get_node(node_slug: Slug) -> NodeData:
        """
        :param node_slug: unique id for node
        :return: NodeData: Returns the node data
        """
        return get_node_by_slug(node_slug)

    @app.post('/node', operation_id='update_node')
    async def app_post_node_update(node_data: NodeDataRequest) -> DatabaseResponse:
        """
        :param node_data: NodeData to update or create node
        :return: {status: DatabaseResponse}
        """

        return replace_node(node_data)

    @app.put('/node', operation_id='update_node_partial')
    async def app_put_node_update_partial(partial_node_data: PartialNodeDataRequest) -> DatabaseResponse:
        """
        :param partial_node_data: Partial NodeData to update
        :return: {status: DatabaseResponse}
        """

        return replace_partial_node(partial_node_data)

    @app.delete('/node', operation_id='delete_node')
    async def app_post_node_delete(node_slug: Slug) -> DatabaseResponse:
        """
        :param node_slug: unique id for node
        :return: {status: DatabaseResponse}
        """

        return delete_node(node_slug)

    # endregion

