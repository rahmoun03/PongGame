import json
import random
import asyncio
import uuid
from channels.generic.websocket import AsyncWebsocketConsumer # type: ignore


# class GameSettings:
WINNING_SCORE = 5
BALL_SPEED_INCREASE = 1.05
FRAME_DELAY = 0.015
PADDLE_HEIGHT = 0.5
PADDLE_DEEP = 0.5
PADDLE_WIDTH = 4 
TABLE_HIEGHT = 45
TABLE_WIDTH = 28
BALL_SPEED = 0.2

class AIState:
    IDLE = "idle"
    CHASE = "chase"
    RECOVER = "recover"

def decide_ai_state(ball):
    if ball["z"] > (TABLE_HIEGHT / 4):  # Ball far away
        return AIState.IDLE
    elif ball["z"] <= (TABLE_HIEGHT / 4) and ball["dz"] < 0:  # Ball moving toward AI
        return AIState.CHASE
    else:
        return AIState.RECOVER


class AIConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.is_active = True
        self.target_x = 0
        self.width = 800
        self.height = 400
        self.speed = 1
        self.paddle = {
            "height": 0.5,
            "width": 5,
            "deep": 0.5
        }
        self.group_room = f"room_{random.randint(1, 999)}"
        self.ball = {}
        self.player1 = {}
        self.player2 = {}
        self.score = {}
        self.table = {}
        print(self.scope["user"], " are connected")
        await self.channel_layer.group_add(self.group_room, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.group_room:
            await self.channel_layer.group_discard(
                self.group_room,
                self.channel_name
            )
        # Should also notify the other player about disconnection

    async def receive(self, text_data):

        data = json.loads(text_data)
        print("data {", data, "}")
        if data["type"] == "countdown":
            self.width = data["width"]
            self.height = data["height"]
            await self.restart_game()
           
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
                self.player1["direction"] = data["direction"]

        if data["type"] == "start_game":
            print(self.scope["user"], "start the game play")
            asyncio.create_task(self.start_game())
            asyncio.create_task(self.ai_logic())

    async def start(self, event):
        await self.send(text_data=json.dumps({
            "type": "start",
            "player1": self.player1,
            "player2": self.player2,
            "ball": self.ball,
            "score": self.score,
            "paddle": self.paddle,
            "table" : self.table_config
        }))
        print(self.scope["user"], ": sending game stats")


    async def start_game(self):
        while self.is_active:
            #update_paddle paddle
            self.move_paddel(self.player1)
            self.simulate_keypress(self.player2)
            self.move_paddel(self.player2)
            
            ##
            self.move_ball()
            await self.check_goals()
            if self.score["player1"] >= WINNING_SCORE or self.score["player2"] >= WINNING_SCORE:
                await self.send_game_over()
                break
            await self.send_update()
            await asyncio.sleep(0.016)

    async def send_game_over(self):
        await self.channel_layer.group_send(self.group_room, {
            "type" : "game_over"
        })
    
    async def game_over(self, event):
        if(self.is_active):
            print("game over : ", self.score)
            await self.send(text_data=json.dumps(
            {
                "type": "game_over",
                "score": self.score,
                "winner": "WIN" if self.score["player1"] >= WINNING_SCORE else "LOSE"
            }))
        self.is_active = False


    async def send_update(self):
        await self.send(text_data=json.dumps(
            {
                "type": "update",
                "player1": self.player1,
                "player2": self.player2,
                "ball": self.ball,
                "score": self.score,
            }))


    def move_paddel(self, player):
        player["x"] += player["direction"] * self.speed

        if player["x"] < -(TABLE_WIDTH / 2) + (self.paddle["width"] / 2) + 1:
            player["x"] = -(TABLE_WIDTH / 2) + (self.paddle["width"] / 2 ) + 1
        if player["x"] > (TABLE_WIDTH / 2) - (self.paddle["width"] / 2) - 1:
            player["x"] = (TABLE_WIDTH / 2) - (self.paddle["width"]  / 2) - 1

    async def ai_logic(self):
        # x = 1 
        while self.is_active:
            # print(x)
            # x += 1
            if decide_ai_state(self.ball) == AIState.CHASE:
                self.target_x = self.predict_ball_position()
                self.target_x = self.add_imperfection(self.target_x)
                # print(f"GO TO : {target_x} from : ", self.player2["x"])
            elif decide_ai_state(self.ball) == AIState.IDLE:
                self.player2["direction"] = 0
            await asyncio.sleep(1)  # Refresh view every second

    def add_imperfection(self, target_x):
        error_margin = random.uniform(-1, 1)  # Add randomness to prediction
        return target_x + error_margin

    def simulate_keypress(self, player):
        if player["x"] < self.target_x :
            player["direction"] = 1  # Simulate "right arrow" keypress
        elif player["x"] > self.target_x:
            player["direction"] = -1  # Simulate "left arrow" keypress
        else:
            player["direction"] = 0  # No keypress

        if player["x"] - (PADDLE_WIDTH / 2) < self.target_x < player["x"] + (PADDLE_WIDTH / 2):
            player["direction"] = 0

    def predict_ball_position(self):
        future_z = self.ball["z"]
        future_x = self.ball["x"]
        dx = self.ball["dx"]
        dz = self.ball["dz"]

        while abs(future_z) < TABLE_HIEGHT / 2:
            # Calculate time to the next wall collision
            if dx > 0:
                time_to_wall = (((TABLE_WIDTH / 2) - 1) - (future_x + self.ball["radius"])) / dx
            else:
                time_to_wall = ((-(TABLE_WIDTH / 2) + 1) - (future_x - self.ball["radius"])) / abs(dx)

            # Predict z position during this time 
            potential_future_z = future_z + dz * time_to_wall

            # Check if the ball stays within the bounds of the table height
            if abs(potential_future_z) >= TABLE_HIEGHT / 2:
                # The ball reaches the end of the table (goal area)
                break
  
            # Update future_x and future_z after wall bounce
            future_x += dx * time_to_wall
            future_z = potential_future_z
            dx *= -1  # Reverse the direction of dx upon wall collision

        return future_x

    
    async def check_goals(self):
        # print(self.role , ": was here")
        if self.ball["z"] + self.ball["radius"] >= (TABLE_HIEGHT / 2):
            await self.reset_ball("player2")
        elif self.ball["z"] - self.ball["radius"] <= -(TABLE_HIEGHT / 2):
            await self.reset_ball("player1")

    async def reset_ball(self, player):
        dx = 1 if random.randint(0,1) > 0.5 else -1
        dz = 1 if random.randint(0,1) > 0.5 else -1

        await self.channel_layer.group_send(self.group_room, {
            "type" : "goal",
            "who" : player,
            "dx": dx,
            "dz": dz
        })
    
    async def goal(self, event):
        self.score[event["who"]] += 1
        self.ball["x"] = 0
        self.ball["z"] = 0
        self.ball["dx"] = BALL_SPEED * event["dx"]
        self.ball["dz"] = BALL_SPEED * event["dz"]

        await self.send(text_data=json.dumps({
            "type" : "goal",
            "player1": self.player1,
            "player2": self.player2,
            "ball": self.ball,
            "score": self.score
        }))


    def move_ball(self):
        self.ball["x"] += self.ball["dx"]
        self.ball["z"] += self.ball["dz"]


        WALL_DAMPENING = 1
        if self.ball["x"] - self.ball["radius"] <= -(TABLE_WIDTH / 2) + 1 or self.ball["x"] + self.ball["radius"] >= (TABLE_WIDTH / 2) - 1:
            print("hit the wall at : ", self.ball["z"])
            self.ball["dx"] *= -WALL_DAMPENING

                 # check for paddle and ball collision  PLAYER 1
        if (self.ball["z"] + self.ball["radius"] >= self.player1['z'] - (self.paddle["deep"] / 2)
            and self.player1["x"] - (self.paddle["width"] / 2) <= self.ball["x"] <= self.player1["x"] + (self.paddle["width"] / 2)):
            #check for left paddle corner
            if self.ball["x"] < (self.player1["x"] - (self.paddle["width"] / 2)) + (self.paddle["width"] / 10):
                self.ball["dx"] *= -1 if self.ball["dx"] > 0 else 1 #Bounce the ball back
            
            #check for right paddle corner
            elif self.ball["x"] > (self.player1["x"] + (self.paddle["width"] / 2)) - (self.paddle["width"] / 10):
                self.ball["dx"] *= -1 if self.ball["dz"] < 0 else  1 #Bounce the ball back
            
            self.ball["dz"] *= -1
            self.ball["dz"] *= 1.05 # Ball speed increase after hit
            # velocity.x += (keys.ArrowLeft ? -0.5 : 0) * playerSpeed;
            # velocity.x += (keys.ArrowRight ? 0.5 : 0) * playerSpeed;
            self.ball["dx"] += ( 0.5 if self.player1["direction"] == 1 else 0) * self.speed
            self.ball["dx"] += (-0.5 if self.player1["direction"] == -1 else 0) * self.speed

                 # check for paddle and ball collision  PLAYER 2
        if (self.ball["z"] - self.ball["radius"] <= self.player2['z'] +  (self.paddle["deep"] / 2)
            and self.player2["x"] - (self.paddle["width"] / 2) <= self.ball["x"] <= self.player2["x"] + (self.paddle["width"] / 2)):
            #check for left paddle corner
            if self.ball["x"] < (self.player2["x"] - (self.paddle["width"] / 2)) + (self.paddle["width"] / 10):
                self.ball["dx"] *= -1 if self.ball["dx"] > 0 else 1 #Bounce the ball back
            
            #check for right paddle corner
            elif self.ball["x"] > (self.player2["x"] + (self.paddle["width"] / 2)) - (self.paddle["width"] / 10):
                self.ball["dx"] *= -1 if self.ball["dz"] < 0 else  1 #Bounce the ball back
            
            self.ball["dz"] *= -1
            # self.ball["dx"] *= 1.05 # Ball speed increase after hit
            self.ball["dx"] += ( 0.5 if self.player2["direction"] == 1 else 0) * self.speed
            self.ball["dx"] += (-0.5 if self.player2["direction"] == -1 else 0) * self.speed
        



    async def restart_game(self):

        self.paddle["height"] = PADDLE_HEIGHT  # Dynamic height based on screen size
        self.paddle["width"] = PADDLE_WIDTH  # Dynamic width based on screen size
        self.paddle["deep"] = PADDLE_DEEP
        ball_radius = 0.5  # Dynamic ball radius
        self.speed = 0.5
        self.ball_dx = BALL_SPEED  # Adjust ball speed according to width
        self.ball_dz = BALL_SPEED  # Adjust ball speed according to height

        self.table_config = {
            "tableWidth": TABLE_WIDTH,  # Use actual values
            "tableHeight": TABLE_HIEGHT,
        }

        self.player1 = {
            "x": 0,
            "y": 0.1,
            "z": (TABLE_HIEGHT / 2),
            "direction": 0
        }

        self.player2 = {
            "x": 0,
            "y": 0.1,
            "z": -(TABLE_HIEGHT / 2),
            "direction": 0
        }

        self.ball = {
            "x" : 0,
            "y" : 0.1,
            "z" : 0,
            "dx": self.ball_dx if random.randint(0, 1) > 0.5 else -self.ball_dx,
            "dz": self.ball_dz if random.randint(0, 1) > 0.5 else -self.ball_dz,
            "radius": ball_radius
        }

        self.score = {
            "player1": 0,
            "player2": 0
        }
