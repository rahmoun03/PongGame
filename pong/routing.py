from django.urls import path
from . import consumers
from . import local
from . import online



websocket_urlpatterns = [
    path('ws/ai/', consumers.AIConsumer.as_asgi()),
    path('ws/online/', online.MultiplayerConsumer.as_asgi()),
    path('ws/local/', local.LocalConsumer.as_asgi()),
    # path('ws/tournament/', consumers.Consumer.as_asgi()),

]
