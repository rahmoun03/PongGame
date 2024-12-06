import json
import random
import asyncio
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer

# Queue to hold waiting players
player_queue = []
max_speed = 10

class MultiplayerConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Add player to the queue and wait for a match
        print("USER : ", self.scope["user"], "connect to webSocket")

        player_queue.append(self)
        self.speed = 3
        self.score_limit = 3
        self.height = None
        self.width = None
        self.is_active = True
        self.game_room = None
        self.player_id = None
        self.role = None  # Will be 'player1' or 'player2'

        await self.accept()

    async def disconnect(self, close_code):
        print("USER : ", self.scope["user"], "leave WebSocket")
        self.is_active = False
        if self in player_queue:
            player_queue.remove(self)
        await self.channel_layer.group_discard(self.game_room, self.channel_name)


    async def receive(self, text_data):
        # print("USER : ", self.scope["user"], "receive update")
        data = json.loads(text_data)

        if data["type"] == "join_room":
            self.width = data["width"]
            self.height = data["height"]
            self.reset_game()
            if len(player_queue) >= 2:
                print("USER : ", self.scope["user"], " Enter to the room")
                # Pair the first two players in the queue
                if player_queue[0] == self:
                    opponent = player_queue[1]
                else:
                    opponent = player_queue[0]

                player_queue.remove(self)
                player_queue.remove(opponent)

                # Create a shared game room
                self.game_room = f"room_{uuid.uuid4().hex[:6]}"
                opponent.game_room = self.game_room

                # Assign player roles
                self.role = "player1"
                opponent.role = "player2"

                print(self.role," : ", self.scope["user"] , " vs " ,opponent.role, " : ", opponent.scope["user"])

                # self.ball["dx"] = opponent.ball["dx"]
                # self.ball["dy"] = opponent.ball["dy"]

                # Add players to the same channel group
                await self.channel_layer.group_add(self.game_room, self.channel_name)
                await opponent.channel_layer.group_add(self.game_room, opponent.channel_name)
                # data = {
                #     self.ball,
                #     self.players,
                # }
                # Notify players that the game has started
                await self.channel_layer.group_send(self.game_room, {
                    "type": "start",
                })


        if data["type"] == "start_game":
            # if(self.role == "player1"):
            asyncio.create_task(self.game_loop())

        if data["type"] == "update_paddle":
            direction = data["playerDirection"]
            # print("USER : ", self.scope["user"], "MOVE" if direction is not 0 else "..")
            if self.role == "player1":
                self.players["player1"]["playerDirection"] = direction
            elif self.role == "player2":
                self.players["player2"]["playerDirection"] = direction
            # Broadcast the updated paddle direction to the opponent
            # print(f"Broadcast from {self.role}")
            await self.channel_layer.group_send(self.game_room, {
                "type": "paddle_update",
                "players": self.players,
            })



    async def game_loop(self):
        print("USER : ", self.scope["user"], "Start The Loop")
        while self.is_active:
            self.update_game()
            if self.score["player1"] >= self.score_limit or self.score["player2"] >= self.score_limit:
                self.is_active = False
                await self.send_game_over()
                break
            await self.send_game_state()
            await asyncio.sleep(0.016)

    def reset_game(self):
        self.ball = {
            "x": self.width / 2,
            "y": self.height / 2,
            "dx": 3 if random.randint(0, 1) > 0.5 else -3,
            "dy": 3 if random.randint(0, 1) > 0.5 else -3,
            "radius": 10,
        }
        self.paddle_size = {"W": 10, "H": 80}
        self.players = {
            "player1": {"x": 5, "y": self.height / 2 - 40, "playerDirection": 0},
            "player2": {"x": self.width - 15, "y": self.height / 2 - 40, "playerDirection": 0},
        }
        self.score = {"player1": 0, "player2": 0}

    def update_game(self):
        self.ball["x"] += self.ball["dx"]
        self.ball["y"] += self.ball["dy"]
        self.ball["dx"] = max(-max_speed, min(max_speed, self.ball["dx"]))
        self.move_paddle("player1")
        self.move_paddle("player2")
        self.check_collision()
        self.check_goals()

    def move_paddle(self, player):
        paddle = self.players[player]
        paddle["y"] += paddle["playerDirection"] * self.speed
        paddle["y"] = max(0, min(self.height - self.paddle_size["H"], paddle["y"]))

    def check_collision(self):
        # check for top and bottom ball collision
        if(self.ball["y"] + self.ball["radius"] > self.height or self.ball["y"] - self.ball["radius"] < 0):
            self.ball["dy"] *= -1

        # check for paddle and ball collision  PLAYER 1
        if self.ball["x"] - self.ball["radius"] < self.players["player1"]['x'] + self.paddle_size["W"] and self.players["player1"]["y"] <= self.ball["y"] <= self.players["player1"]["y"] + self.paddle_size["H"]:
            #check for bottom paddle corner
            if self.ball["y"] > self.players["player1"]["y"] + (self.paddle_size["H"] -  (self.paddle_size["H"] / 10)):
                self.ball["dy"] *= -1 if self.ball["dy"] < 0 else 1 #Bounce the ball back
            
            #check for top paddle corner
            elif self.ball["y"] < self.players["player1"]["y"] + self.paddle_size["H"] / 10:
                self.ball["dy"] *= -1 if self.ball["dy"] > 0 else  1 #Bounce the ball back
            
            self.ball["dx"] *= -1
            self.ball["dx"] *= 1.05 # Ball speed increase after hit
            # self.ball["dx"] += (-0.5 if self.players["player1"]["playerDirection"] == 1 else 0) * self.speed
            # self.ball["dx"] += ( 0.5 if self.players["player1"]["playerDirection"] == -1 else 0) * self.speed

            


        # check for paddle and ball collision  PLAYER 2
        if self.ball["x"] + self.ball["radius"] > self.players["player2"]['x'] and self.players["player2"]["y"] <= self.ball["y"] <= self.players["player2"]["y"] + self.paddle_size["H"]:
            #check for bottom paddle corner
            if self.ball["y"] > self.players["player2"]["y"] + (self.paddle_size["H"] -  (self.paddle_size["H"] / 10)):
                self.ball["dy"] *= -1 if self.ball["dy"] < 0 else 1 #Bounce the ball back
            
            #check for top paddle corner
            elif self.ball["y"] < self.players["player2"]["y"] + self.paddle_size["H"] / 10:
                self.ball["dy"] *= -1 if self.ball["dy"] > 0 else  1 #Bounce the ball back
            
            self.ball["dx"] *= -1
            self.ball["dx"] *= 1.05 # Ball speed increase after hit
            # self.ball["dx"] += (-0.5 if self.players["player2"]["playerDirection"] == 1 else 0) * self.speed
            # self.ball["dx"] += ( 0.5 if self.players["player2"]["playerDirection"] == -1 else 0) * self.speed

    async def check_goals(self):
        if self.ball["x"] - self.ball["radius"] < 0:
            self.score["player2"] += 1
            self.reset_ball()
        elif self.ball["x"] + self.ball["radius"] > self.width:
            self.score["player1"] += 1
            self.reset_ball()

    def reset_ball(self):
        self.ball.update({
            "x": self.width / 2,
            "y": self.height / 2,
            "dx": 3 if random.randint(0, 1) else -3,
            "dy": 3
            })

    async def send_game_state(self):
        await self.channel_layer.group_send(self.game_room, {
            "type": "update",
            "players": self.players,
            "ball": self.ball,
            "score": self.score
            })

    async def send_game_over(self):
        await self.channel_layer.group_send(self.game_room, {
            "type": "game_over",
            "score": self.score,
            "winner": "player1" if self.score["player1"] >= self.score_limit else "player2"
            })
    
    async def paddle_update(self, event):
        if self.role == "player1":
            self.players["player2"] = event["players"]["player2"]
        elif self.role == "player2":
            self.players["player1"] = event["players"]["player1"]
        # self.players = event["players"]


    async def update(self, event):
        self.ball = event["ball"]
        await self.send(json.dumps({
            "type": "update",
            "players": self.players,
            "ball": event["ball"],
            "score": self.score
            }))

    async def game_over(self, event):
        await self.send(json.dumps({
            "type": "game_over",
            "score": event["score"],
            "winner": event["winner"]
            }))

    async def start(self, event):
        await self.send(json.dumps({
            "type": "start",
            "players": self.players,
            "ball": self.ball,
            "score": self.score,
            "paddle": self.paddle_size,
        }))

