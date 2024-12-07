import json
import random
import asyncio
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer # type: ignore

player_queue = []

class MultiplayerConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        player_queue.append(self)
        self.group_room = None
        self.width = 800
        self.height = 400
        self.speed = 5
        self.paddle = {
            "height": 80,
            "width": 10
        }
        self.game_state = {
            "role"
            "ball",
            "player1",
            "player2",
            "score",
        }
        print(f"{self.scope["user"]} are connected")
        await self.accept()

    async def disconnect(self, close_code):
        if self in player_queue:
            player_queue.remove(self)
        if self.group_room:
            await self.channel_layer.group_discard(
                self.group_room,
                self.channel_name
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data["type"] == "join_room":
            self.restart_game()
            if len(player_queue) >= 2 :
                if player_queue[0] == self:
                    opponent = player_queue[1]
                else:
                    opponent = player_queue[0]
                player_queue.remove(self)
                player_queue.remove(opponent)
                self.group_room = f"room_{uuid.uuid4().hex[:6]}"
                opponent.group_room = self.group_room

                opponent.game_state["role"] = "player2"
                self.game_state["role"] = "player1"

                # add the players to the same group
                await self.channel_layer.group_add(
                    self.group_room,
                    self.channel_name
                )
                await self.channel_layer.group_add(
                    self.group_room,
                    opponent.channel_name
                )


                await self.channel_layer.group_send(
                    self.group_room,
                    {
                        "type": "start",
                        "player1": self.game_state["player1"],
                        "player2": self.game_state["player2"],
                        "ball": self.game_state["ball"],
                        "score": self.game_state["score"],
                        "paddle": self.paddle,
                    }
                )


        if data["type"] == "update_paddle":
            if self.game_state["role"] == "player1":
                self.game_state["player1"]["direction"] = data["direction"]
            else:
                self.game_state["player2"]["direction"] = data["direction"]
    
            await self.channel_layer.group_send(
                self.group_room,
                {
                    "type": "update_paddle",
                    "role": self.game_state["role"],
                    "player1": self.game_state["player1"],
                    "player2": self.game_state["player2"]
                }
            )
        
        
        if data["type"] == "start_game":
            asyncio.create_task(self.start_game())
                



    async def start_game(self):
        while True:
            #update_paddle paddle
            self.game_state["player1"]["y"] += self.game_state["player1"]["direction"] * self.speed
            self.game_state["player2"]["y"] += self.game_state["player2"]["direction"] * self.speed

            if self.game_state["player1"]["y"] < 0:
                self.game_state["player1"]["y"] = 0
            if self.game_state["player1"]["y"] > self.height - self.paddle["height"]:
                self.game_state["player1"]["y"] = self.height - self.paddle["height"]
            if self.game_state["player2"]["y"] < 0:
                self.game_state["player2"]["y"] = 0
            if self.game_state["player2"]["y"] > self.height - self.paddle["height"]:
                self.game_state["player2"]["y"] = self.height - self.paddle["height"]
            await asyncio.sleep(0.015)


    def update_paddle(self, event):
        self.game_state["player1"] = event["player1"]
        self.game_state["player2"] = event["player2"]




    async def start(self, event):

        self.game_state["player1"] = event["player1"]
        self.game_state["player2"] = event["player2"]
        self.game_state["ball"] = event["ball"]
        self.game_state["score"] = event["score"]
        self.paddle = event["paddle"]

        # print(f"{self.game_state["player1"]["name"]} : start game")
        
        await self.send(json.dumps({
            "type": "start",
            "player1": event["player1"],
            "player2": event["player2"],
            "ball": event["ball"],
            "score": event["score"],
            "paddle": event["paddle"],
        }))


    def restart_game(self):
        player1 = {
            # "name" : self.scope["user"],
            "x": 5,
            "y": (self.height / 2) - self.paddle["height"],
            "direction": 0
        }
        player2 = {
            # "name" : "oponnet",
            "x": self.width - self.paddle["width"] - 5,
            "y": (self.height / 2) - self.paddle["height"],
            "direction": 0
            }
        ball = {
            "x" : self.width / 2 ,
            "y" : self.height / 2,
            "dx": 3 if random.randint(0, 1) > 0.5 else -3,
            "dy": 3 if random.randint(0, 1) > 0.5 else -3,
            "radius": 10
        }
        score = {
            "player1": 0,
            "player2": 0
        }

        self.game_state = {
            "player1": player1,
            "player2": player2,
            "ball": ball,
            "score": score
        }
