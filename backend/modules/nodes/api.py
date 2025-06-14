from typing import List

from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from pydantic import TypeAdapter
from starlette.responses import JSONResponse

from modules.core_models import Unid
from modules.nodes.models import ServerNode
from modules.nodes.utils import get_node_by_unid, delete_node, get_nodes, replace_node


def initialize(app: FastAPI):
    # region { Node - Default }

    @app.get('/nodes', response_model=list[ServerNode])
    async def app_get_nodes() -> list[ServerNode]:
        """
        :return: ServerNode: Returns all ServerNode objects in a list
        """

        return get_nodes()

    @app.get("/node/{node_unid}", response_model=ServerNode)
    async def app_get_node(node_unid: str) -> ServerNode:
        """
        :return: ServerNode: Returns information about the node
        """
        return get_node_by_unid(node_unid)

    @app.post("/node/update")
    async def app_post_user_update(request: ServerNode) -> JSONResponse:
        """
        :param request: JSONObject containing updated ServerNode data
        :return: {status: True/False} if it exists in database
        """

        return JSONResponse(content=jsonable_encoder({
            'status': replace_node(request)
        }))

    @app.delete("/user/delete")
    async def app_post_user_delete(node_unid: Unid) -> JSONResponse:
        """
        :param node_unid: JSONObject containing 'recruitment_code', which contains a recruitment code
        :return: {status: True/False} if it exists in database
        """

        return JSONResponse(content=jsonable_encoder({
            'status': delete_node(node_unid.unid)
        }))

    # endregion
