from enum import Enum


class DatabaseResponse(Enum):
    CREATED = 'CREATED'
    UPDATED = 'UPDATED'
    REPLACED = 'REPLACED'
    DELETED = 'DELETED'
    ERROR = 'ERROR'
