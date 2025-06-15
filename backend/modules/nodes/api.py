from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from starlette.responses import JSONResponse

from modules.core_models import Unid
from modules.nodes.models import NodeData
from modules.nodes.utils import get_node_by_unid, delete_node, get_nodes, replace_node


def initialize(app: FastAPI):
    # region { Node - Default }

    @app.get('/nodes', response_model=list[NodeData])
    async def app_get_nodes() -> list[NodeData]:
        """
        :return: NodeData: Returns all nodes with data in a list
        """

        return get_nodes()

    @app.get("/node/{node_unid}", response_model=NodeData)
    async def app_get_node(node_unid: str) -> NodeData:
        """
        :return: NodeData: Returns the node data
        """
        return get_node_by_unid(node_unid)

    @app.post("/node/update")
    async def app_post_user_update(node_data: NodeData) -> JSONResponse:
        """
        :param node_data: NodeData to update or create node
        :return: {status: DatabaseResponse}
        """

        return JSONResponse(content=jsonable_encoder({
            'status': replace_node(node_data)
        }))

    @app.delete("/user/delete")
    async def app_post_user_delete(node_unid: Unid) -> JSONResponse:
        """
        :param node_unid: unid for node
        :return: {status: DatabaseResponse}
        """

        return JSONResponse(content=jsonable_encoder({
            'status': delete_node(node_unid.unid)
        }))

    # endregion
