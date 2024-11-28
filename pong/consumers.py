import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PongConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = 'pong_room'
        self.room_group_name = f'game_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add( self.room_group_name, self.channel_name)
        await self.accept()
        

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard( self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        await self.channel_layer.group_send( self.room_group_name, {
                'type': 'game_message',
                'message': data['message']
            }
        )

    # Receive message from room group
    async def game_message(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
