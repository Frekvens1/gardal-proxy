import os

server_info = {
    'port': os.environ.get('VALKEY_PORT'),
    'password': os.environ.get('VALKEY_PASSWORD'),
}
