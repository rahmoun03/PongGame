import json
import random
import asyncio
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer # type: ignore

player_queue = []

class MultiplayerConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        player_queue.append(self)
        self.width = 800
        self.height = 400
        self.speed = 5
        self.paddle = {
            "height": 80,
            "width": 10
        }
        self.group_room = None
        self.role = None
        self.ball = {}
        self.player1 = {}
        self.player2 = {}
        self.score = {}
        print(self.scope["user"], " are connected")
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
            self.width = data["width"]
            self.height = data["height"]
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

                opponent.role = "player2"
                self.role = "player1"

                # add the players to the same group
                await self.channel_layer.group_add(
                    self.group_room,
                    self.channel_name
                )
                await opponent.channel_layer.group_add(
                    opponent.group_room,
                    opponent.channel_name
                )


                await self.channel_layer.group_send(
                    self.group_room,
                    {
                        "type": "start",
                        "player1": self.player1,
                        "player2": self.player2,
                        "ball": self.ball,
                        "score": self.score,
                        "paddle": self.paddle,
                    }
                )


        if data["type"] == "update_paddle":
            if self.role == "player1":
                self.player1["direction"] = data["direction"]
            else:
                self.player2["direction"] = data["direction"]
    
            await self.channel_layer.group_send(
                self.group_room,
                {
                    "type": "update_paddle",
                    "role": self.role,
                    "player1": self.player1,
                    "player2": self.player2
                }
            )

        
        if data["type"] == "resize":
            self.width = data["width"]
            self.height = data["height"]
            self.restart_game()
            await self.channel_layer.group_send(
                self.group_room,
                {
                    "type": "start",
                    "player1": self.player1,
                    "player2": self.player2,
                    "ball": self.ball,
                    "score": self.score,
                    "paddle": self.paddle,
                }
            )

        
        if data["type"] == "start_game":
            asyncio.create_task(self.start_game())
                



    async def start_game(self):
        while True:
            #update_paddle paddle
            self.move_paddel(self.player1)
            self.move_paddel(self.player2)
            
            await self.send_update()
            await asyncio.sleep(0.015)

    async def send_update(self):
        await self.send(json.dumps(
            {
                "type": "update",
                "player1": self.player1,
                "player2": self.player2,
                "ball": self.ball,
                "score": self.score,
            }))

    def move_paddel(self, player):
            player["y"] += player["direction"] * self.speed

            if player["y"] < 0:
                player["y"] = 0
            if player["y"] > self.height - self.paddle["height"]:
                player["y"] = self.height - self.paddle["height"]


    async def update_paddle(self, event):
        self.player1["direction"] = event["player1"]["direction"]
        self.player2["direction"] = event["player2"]["direction"]




    async def start(self, event):
        if (event["ball"]["dx"] < 0 and self.ball["dx"] > 0 ) or (event["ball"]["dx"] > 0 and self.ball["dx"] < 0 ):
            self.ball["dx"] *= -1
        
        if (event["ball"]["dy"] < 0 and self.ball["dy"] > 0 ) or (event["ball"]["dy"] > 0 and self.ball["dy"] < 0 ):
            self.ball["dy"] *= -1
    
        
        await self.send(json.dumps({
            "type": "start",
            "player1": self.player1,
            "player2": self.player2,
            "ball": self.ball,
            "score": self.score,
            "paddle": self.paddle,
        }))


    def restart_game(self):

        self.paddle["height"] = self.height / 5  # Dynamic height based on screen size
        self.paddle["width"] = self.width / 80  # Dynamic width based on screen size
        ball_radius = self.height / 40  # Dynamic ball radius
        self.speed = self.height / 50
        ball_dx = self.width / 150  # Adjust ball speed according to width
        ball_dy = self.height / 150  # Adjust ball speed according to height


        self.player1 = {
            "x": self.paddle["width"] / 2,
            "y": (self.height / 2) - self.paddle["height"],
            "direction": 0
        }
        self.player2 = {
            "x": self.width - self.paddle["width"] - (self.paddle["width"] / 2),
            "y": (self.height / 2) - self.paddle["height"],
            "direction": 0
            }
        self.ball = {
            "x" : self.width / 2 ,
            "y" : self.height / 2,
            "dx": ball_dx if random.randint(0, 1) > 0.5 else -ball_dx,
            "dy": ball_dy if random.randint(0, 1) > 0.5 else -ball_dy,
            "radius": ball_radius
        }
        self.score = {
            "player1": 0,
            "player2": 0
        }
    