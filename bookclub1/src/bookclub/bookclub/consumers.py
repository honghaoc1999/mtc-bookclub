from channels.generic.websocket import AsyncWebsocketConsumer
import json

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # we start with only one room, later we can fetch a group name from
        # multiple groups
        self.room_group_name = 'Test-Room'

        # self.channel_layer here is defined in settings.py CHANNEL_LAYERS
        print(self.channel_layer)
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        print("passed")
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        print('Disconnected!')

    async def receive(self, text_data):
        receive_dict = json.loads(text_data)
        # consumer receives the message from a peer
        message = receive_dict['message']
        action = receive_dict['action']

        if (action == 'new-offer') or (action == 'new_answer'):
            receiver_channel_name = receive_dict['message']['receiver_channel_name']
            receive_dict['message']['receiver_channel_name'] = self.channel_name
            await self.channel_layer.send(
                receiver_channel_name,
                # this dict has to have a field 'type' whose value is the function
                # the consumer uses to send the message to other peers
                {
                    # send.sdp here encodes send_sdp function.
                    # the '.' within send.sdp is not a typo.
                    # django encodes function name like this in this case
                    'type': 'send.sdp',
                    'receive_dict': receive_dict
                }
            )
            return
        # when consumer receives a signal from some peer, consumer can read
        # the unique channel name to identify the peer
        receive_dict['message']['receiver_channel_name'] = self.channel_name

        # then the consumer sends this message to all other peers in the group
        await self.channel_layer.group_send(
            self.room_group_name,
            # this dict has to have a field 'type' whose value is the function
            # the consumer uses to send the message to other peers
            {
                # send.sdp here encodes send_sdp function.
                # the '.' within send.sdp is not a typo.
                # django encodes function name like this in this case
                'type': 'send.sdp',
                'receive_dict': receive_dict
            }
        )

    async def send_sdp(self, event):
        receive_dict = event['receive_dict']

        await self.send(text_data=json.dumps(receive_dict))
