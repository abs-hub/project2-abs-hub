# Project 2: Flack

This project utilizes python, handlebars, JavaScript, Socket.io and uses python libraries like Flask, render_template, flask_socketio. This objective behind this project was to learn how we could make single page application.

# Requirements
https://cs50.harvard.edu/web/2019/summer/projects/2/#requirements

## Getting Started
This is a simple chat application inspired by Slack. It utilizes socket.io for sending and receiving messages.
There is no database setup needed. All data is stored in a global dict- channels.

### Prerequisites

Get your environment setup. Make sure you install latest copy of python v 3.6 or higher. Run following command in your terminal to install all necessary packages.

```
pip3 install -r requirements.txt
```
Set the environment variables as below. I have also included these settings in envSettings.txt.
```
export FLASK_APP=application.py
export FLASK_DEBUG=0
export SECRET_KEY=my_cust_secret_key
```

## Usage

* Login and Logout.
* Channel Creation.
* View all channel list.
* View max up to 100 messages.
* Send message in any channel.
* View users present/viewing that channel.
* Message count in each channel.
* Delete Own message.

## Personal Touch

* Delete one's own message from the respective channel using index as a key.
* Play sound when someone sends a message in your selected channel.
* Logout functionality.

## Tools and frameworks used to build

* [IntelliJ IDEA Ultimate](https://www.jetbrains.com/idea/) - The IDE used for development and code styling/formatting.
* [iTerm2](https://www.iterm2.com/) - Terminal.
* [Bootstrap v4.3.1](https://getbootstrap.com/) - Used this primarily for styling.
* [font-awesome v4.7](https://fontawesome.com/v4.7.0/) - Used to show icons.
* Python v3.7.3
* Flask 1.1.1
* Jinja2 - layout template.
* SocketIO 2.2 - to send and receive messages to and from server.
* handlebars.js 4.1.2 - for templating using JavaScript.
* SASS - to convert SCSS to CSS

## Some sample screenshots
##### Login
![Alt text](/../master/examples/login_chat.png?raw=true "Login")
##### Chat UI
![Alt text](/../master/examples/message_conv_del.png?raw=true "Flack")

### Project Files
1. application.py - this is the core file which interacts with the frontend. Below are few of the core functions:
    * on_connect()- This is when "connect" is emitted from JavaScript
    * new_channel()- When user adds a new channel, "new channel" is emitted from JavaScript which is then taken care by this function.
    * change_channel()- Called when user clicked # channel for joining some other channel. Removes user from the channel emitted via JavaScript.
    * on_send_message()- Broadcasts the the message sent to all user in that channel, also broadcasts channels to view the updated message count. Once message count reaches 100, the first message will be removed from server and also from frontend to keep consistency. 
    * on_del_message()- Remove message by index number for the respective channel, also broadcasts channels to get the updated message count.

2. templates/layout.htm- Jinja 2 for templating and re-usability.
3. templates/index.html- rendered at root, utilizes bootstrap, fontawesome, handlebars.
3. static/imgs/favicon.ico- required favicon.ico for the website.
4. static/style.scss- main sassy css used for the application.
5. static/style.css- compiled version of the scss.
6. static/main.js- JavaScript file which handles user interactions and emits it to Server.
7. requirements.txt- required libraries to be installed before running application.
8. README.md- this file.
9. knock_brush.mp3- sound file played when message is sent.  
