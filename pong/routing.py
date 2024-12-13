from django.urls import path
from . import consumers
from . import local
from . import online
from . import multiplayer as multi
from . import train
from . import ai_mode


websocket_urlpatterns = [
    path('ws/ai/', ai_mode.AIConsumer.as_asgi()),
    path('ws/online/', multi.MultiplayerConsumer.as_asgi()),
    path('ws/local/', local.LocalConsumer.as_asgi()),
    path('ws/train/', train.TrainConsumer.as_asgi()),

]
