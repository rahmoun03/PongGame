from django.urls import path
from . import consumers
from . import local_1vs
from . import online_1vs1
from . import ai_mode


websocket_urlpatterns = [
    path('ws/ai/', ai_mode.AIConsumer.as_asgi()),
    path('ws/online_1vs1/', online_1vs1.Remote1vs1Consumer.as_asgi()),
    path('ws/local_1vs1/', local_1vs.Local1vs1Consumer.as_asgi()),
]
