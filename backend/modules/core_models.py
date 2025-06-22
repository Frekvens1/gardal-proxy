import re
import ipaddress

from pydantic import GetCoreSchemaHandler, GetJsonSchemaHandler, BaseModel, create_model
from typing import Optional, Type, Any, Dict
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema

hostname_regex = re.compile(
    r'^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)'
    r'(?:\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*$'
)


def partial_model(base_model: Type[BaseModel], name_suffix: str = 'Partial') -> Type[BaseModel]:
    fields: Dict[str, Any] = {
        name: (Optional[field.annotation], None)
        for name, field in base_model.model_fields.items()
    }
    partial_model_name = base_model.__name__ + name_suffix
    return create_model(
        partial_model_name,
        __base__=base_model,
        __config__=getattr(base_model, '__config__', None),
        **fields
    )


class Slug(str):
    _pattern = re.compile(r'^[a-z0-9_\-]+$')

    @classmethod
    def __get_pydantic_core_schema__(
            cls, source_type: type, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:

        def validator(value: str, _info: core_schema.ValidationInfo) -> str:
            if not isinstance(value, str):
                raise TypeError('Slug must be a string')
            if not value:
                raise ValueError('Slug must not be empty')
            if not cls._pattern.fullmatch(value):
                raise ValueError('Slug may only contain lowercase letters, digits, underscores and hyphens')
            return cls(value)

        return core_schema.with_info_plain_validator_function(
            validator,
            serialization=core_schema.plain_serializer_function_ser_schema(lambda v: str(v))
        )

    @classmethod
    def __get_pydantic_json_schema__(
            cls, schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {
            'type': 'string',
            'pattern': cls._pattern.pattern,
            'title': 'Slug',
            'description': 'Lowercase slug with letters, digits, underscores or hyphens',
            'examples': ['example_slug', 'example-slug']
        }


class Protocol(str):
    allowed = {'http', 'https', 'tcp', 'udp'}

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: type, handler: GetCoreSchemaHandler):
        def validator(value: str, _info: core_schema.ValidationInfo) -> str:
            if not isinstance(value, str):
                raise TypeError('Protocol must be a string')
            if not value:
                raise ValueError('Protocol must not be empty')
            base = value.rstrip(':/')
            if base not in cls.allowed:
                raise ValueError(
                    f"Unsupported protocol '{value}'. Allowed: {', '.join(cls.allowed)}"
                )
            return cls(base)

        return core_schema.with_info_plain_validator_function(
            validator,
            serialization=core_schema.plain_serializer_function_ser_schema(lambda v: str(v)),
        )

    @classmethod
    def __get_pydantic_json_schema__(
            cls, schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {
            'type': 'string',
            'enum': list(cls.allowed),
            'title': 'Protocol',
            'description': 'Allowed protocols for traefik',
            'examples': ['http']
        }


class Hostname(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: type, handler: GetCoreSchemaHandler):
        def validator(value: str, _info: core_schema.ValidationInfo) -> str:
            if not isinstance(value, str):
                raise TypeError('Hostname must be a string')
            if not value:
                raise ValueError('Hostname must not be empty')
            if not (cls._is_valid_ip(value) or cls._is_valid_hostname(value)):
                raise ValueError('Hostname must be a valid hostname or IP address')
            return cls(value)

        return core_schema.with_info_plain_validator_function(
            validator,
            serialization=core_schema.plain_serializer_function_ser_schema(lambda v: str(v)),
        )

    @staticmethod
    def _is_valid_ip(value):
        try:
            ipaddress.ip_address(value)
            return True
        except ValueError:
            return False

    @staticmethod
    def _is_valid_hostname(value):
        return bool(hostname_regex.fullmatch(value))

    @classmethod
    def __get_pydantic_json_schema__(
            cls, schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {
            'type': 'string',
            'pattern': hostname_regex.pattern,
            'title': 'Hostname',
            'description': 'Either a Hostname, IPv4 or IPv6 address',
            'examples': ['127.0.0.1', '::1', 'example.com']
        }


class Port(int):
    _MIN_PORT = 1
    _MAX_PORT = 65535

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: type, handler: GetCoreSchemaHandler):
        def validator(value: int, _info: core_schema.ValidationInfo) -> int:
            if not isinstance(value, int):
                raise TypeError('Port must be an integer')
            if not (cls._MIN_PORT <= value <= cls._MAX_PORT):
                raise ValueError(
                    f"Port must be between {cls._MIN_PORT} and {cls._MAX_PORT}"
                )
            return cls(value)

        return core_schema.with_info_plain_validator_function(
            validator,
            serialization=core_schema.plain_serializer_function_ser_schema(lambda v: int(v)),
        )

    @classmethod
    def __get_pydantic_json_schema__(
            cls, schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {
            'type': 'integer',
            'title': 'Port',
            'description': 'Which port to use for TCP and UDP',
            'minimum': cls._MIN_PORT,
            'maximum': cls._MAX_PORT,
            'examples': [8080]
        }


class URLPath(str):
    _pattern = re.compile(r"^[A-Za-z0-9\-._~!$&'()*+,;=:@/]+$")

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: type, handler: GetCoreSchemaHandler):
        def validator(value: str, _info: core_schema.ValidationInfo) -> str:
            if not isinstance(value, str):
                raise TypeError('URL path must be a string')
            if not cls._pattern.fullmatch(value):
                raise ValueError(
                    "URL path contains invalid characters. Allowed: "
                    "A–Z, a–z, 0–9, '-', '_', '.', '~', '!', '$', '&', \"'\", "
                    "'(', ')', '*', '+', ',', ';', '=', ':', '@', '/'"
                )
            return cls(value)

        return core_schema.with_info_plain_validator_function(
            validator,
            serialization=core_schema.plain_serializer_function_ser_schema(lambda v: str(v)),
        )

    @classmethod
    def __get_pydantic_json_schema__(
            cls, schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return {
            'type': 'string',
            'pattern': cls._pattern.pattern,
            'title': 'URL Path',
            'description': (
                "A relative URL path used in routing or request construction.\n\n"
                "Accepted characters include:\n"
                "- Letters (A–Z, a–z)\n"
                "- Digits (0–9)\n"
                "- Special characters: '-', '_', '.', '~', '!', '$', '&', ''', "
                "'(', ')', '*', '+', ',', ';', '=', ':', '@', '/'"
            ),
            'examples': ['api/http/routers', '/user/profile', 'v2/data?id=1']
        }
