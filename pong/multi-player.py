import json
import random
import asyncio
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer # type: ignore

player_queue = []

class MultiplayerConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.group_room = None
        self.width = 800
        self.height = 400
        self.paddle = {
            "height": 80,
            "width": 10
        }
        self.game_state = {
            "ball",
            "player1",
            "player2",
            "score",
        }
        print(f"{self.scope["user"]} are connected")
        self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, tex_data):
        data = json.loads(tex_data)
        if data["type"] == "join_room":
            # self.width = data["width"]
            # self.height = data["height"]
            if len(player_queue) >= 2 :
                if player_queue[0] == self:
                    opponent = player_queue[1]
                else:
                    opponent = player_queue[0]
                player_queue.remove(self)
                player_queue.remove(opponent)
                self.group_room = f"room_{uuid.uuid4().hex[:6]}"
                opponent.group_room = self.group_room




    def restart_game(self):
        player1 = {
            "name" : self.scope["user"],
            "x": 5,
            "y": (self.height / 2) - self.paddle["height"],
            "direction": 0
        }
        player2 = {
            "name" : "oponnet",
            "x": self.width - self.paddle - 5,
            "y": (self.height / 2) - self.paddle["height"],
            "direction": 0
            }
        ball = {
            "x" : self.width / 2 ,
            "y" : self.height / 2,
            "dx": 3 if random.randint(0, 1) > 0.5 else -3,
            "dy": 3 if random.randint(0, 1) > 0.5 else -3,
        }
        score = {
            "player1": 0,
            "player2": 0
        }

