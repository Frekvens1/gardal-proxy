from pydantic.v1 import validate_arguments
from pymongo import MongoClient
from bson import ObjectId
import os

from pymongo.collection import Collection

client: MongoClient

users: Collection
sessions: Collection
resources: Collection
nodes: Collection


def initialize():
    connect()


def connect() -> bool:
    global users, sessions, resources, nodes
    global client

    client = MongoClient(
        host=os.environ['MONGO_URL'],
        port=int(os.environ['MONGO_PORT']),
        username=os.getenv('MONGO_USERNAME'),
        password=os.getenv('MONGO_PASSWORD'),
        authMechanism='DEFAULT'
    )

    if client is None:
        return False

    # Dynamic apps initialization
    users = client['gardal_proxy']['users']
    sessions = client['gardal_proxy']['sessions']
    resources = client['gardal_proxy']['resources']
    nodes = client['gardal_proxy']['nodes']

    return True


def get_client() -> MongoClient:
    if client is None:
        connect()

    return client


##############################
#     DATABASE FUNCTIONS     #
##############################

def get_databases() -> list[str]:
    return get_client().list_database_names()


@validate_arguments
def database_exists(database: str) -> bool:
    return database in get_client().list_database_names()


################################
#     COLLECTION FUNCTIONS     #
################################

@validate_arguments
def get_collections(database: str) -> list[str]:
    if not database_exists(database):
        return []

    return client[database].list_collection_names()


@validate_arguments
def collection_exists(database: str, collection: str) -> bool:
    if not database_exists(database):
        return False

    return collection in client[database].list_collection_names()


##########################
#     DATA FUNCTIONS     #
##########################

@validate_arguments
def item_exists(database: str, collection: str, item: str, value) -> bool:
    if not collection_exists(database, collection):
        return False

    return value in get_client()[database][collection].distinct(item)


def get_item(database: str, collection: str, item_id: str) -> dict:
    item = get_client()[database][collection].find_one({"_id": ObjectId(item_id)})
    if not item:
        return {}

    item['_id'] = str(item['_id'])
    return dict(item)


def collection_item(collection: Collection, item_id: str) -> dict:
    """
    Get item from collection
    :param collection: Cursor item which has navigated to desired collection
    :param item_id: _id of document
    :return: Item as dict and _id parsed to string
    """
    item = collection.find_one({"_id": ObjectId(item_id)})

    if not item:
        return {}

    item['_id'] = str(item['_id'])
    return dict(item)


def collection_items(collection: Collection, search: dict, field_filter: dict = None) -> list[dict]:
    """
    Get items from collection by search
    :param collection: Cursor item which has navigated to desired collection
    :param search: Get items by matching search: {'title': 'test'}
    :param field_filter: Only get fields of interest: {'title': 1} / {'panels': 0}
    :return: Items as list[dict] and _id parsed to string
    """
    items = list(collection.find(search, field_filter or {}))

    for item in items:
        item['_id'] = str(item['_id'])

    return items
