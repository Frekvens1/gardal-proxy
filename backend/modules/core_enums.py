from enum import Enum


class DatabaseResponse(Enum):
    CREATED = 'CREATED'
    UPDATED = 'UPDATED'
    DELETED = 'DELETED'
    ERROR = 'ERROR'
