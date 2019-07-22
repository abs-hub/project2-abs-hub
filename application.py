import os

from flask import Flask, render_template
from flask_socketio import SocketIO, emit, join_room, leave_room

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# Define global variable channel and store information as a dict
channels = {}

MAX_MESSAGES = 100


@app.route("/")
def index():
    """ This is the default route of the application
        If first time, User will be prompted for username and this would be stored in localstorage """

    return render_template("index.html")


# This function will check if channel exists and build channel JSON
def build_channel_skeleton(channel_name):
    if channel_name not in channels and channel_name is not None:
        channels[channel_name] = {"Users": [], "Messages": []}


# This function will refresh indexes
def refresh_indexes(messages):
    for index, msg in enumerate(messages):
        msg["idx"] = index;


@socketio.on("connect")
def on_connect():
    # Emit all channels on connect
    emit('channels', channels, broadcast=True)


@socketio.on("new channel")
def new_channel(data):
    """ User has added new channel,
        read it from data """

    # Get new channel name and convert it to lower case
    channel_name = data["channel"].lower()
    # Ensure channel name is unique
    build_channel_skeleton(channel_name)
    emit('channels', channels, broadcast=True)


@socketio.on('join channel')
def on_join(data):
    """ New user has joined a channel
        read channel information and emit messages and
        users information for the current room """

    # Get user information
    username = data['user']
    selected_channel = data["channel"].lower()
    build_channel_skeleton(selected_channel)
    print(channels)
    join_room(selected_channel)
    users = channels[selected_channel]["Users"]
    if username not in users:
        users.append(username)
    messages = channels[selected_channel]["Messages"]
    emit('users', users, room=selected_channel)
    emit('messages', messages, room=selected_channel)
    emit('channels', channels, broadcast=True)


@socketio.on('change channel')
def change_channel(data):
    """ User has clicked channel li for
        joining some other channel. Time to remove them from
        channel dict """

    # Get user information
    username = data['user']
    # Get selected channel
    selected_channel = data["channel"].lower()
    leave_room(selected_channel)
    users = channels[selected_channel]["Users"]
    if username in users:
        users.remove(username)
    emit('users', users, room=selected_channel)


@socketio.on('submit message')
def on_send_message(data):
    """ Broadcast the the message sent to all user in that channel,
        also broadcast channels to view the updated message count """

    # Get channel information
    selected_channel = data["channel"].lower()
    messages = channels[selected_channel]["Messages"]
    message_dict = {"user": data['user'], "timestamp": data['timestamp'], "text": data['text'], "idx": len(messages)}
    messages.append(message_dict)
    # pop out first message if len of messages exceeds MAX_MESSAGES
    if len(messages) > MAX_MESSAGES:
        messages.pop(0)
        # refresh indexes
        refresh_indexes(messages)
    emit('message', {"message": messages, "channel": selected_channel, "username": data['user']},
         room=selected_channel)
    emit('channels', channels, broadcast=True)


@socketio.on('delete message')
def on_del_message(data):
    """ Remove message by index number for the respective channel
        Broadcast channels to get the updated message count """

    selected_channel = data["channel"].lower()
    message_index = data["message_index"]
    messages = channels[selected_channel]["Messages"]
    messages.pop(int(message_index))
    # refresh indexes
    refresh_indexes(messages)
    emit('message delete', messages, room=selected_channel)
    emit('channels', channels, broadcast=True)
