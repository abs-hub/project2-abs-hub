document.addEventListener('DOMContentLoaded', () => {
  //Templates for channels, users and messages
  const channel_list_hb = Handlebars.compile(document.querySelector('#channel_list_hb').innerHTML);
  const channel_users_list_hb = Handlebars.compile(document.querySelector('#channel_users_list_hb').innerHTML);
  const channel_messages_list_hb = Handlebars.compile(document.querySelector('#channel_messages_list_hb').innerHTML);

  // Connect to websocket
  const socket = io.connect(`${location.protocol}//${document.domain}:${location.port}`);
  //If user not in local storage, open login form:
  if (!localStorage.getItem('username') || localStorage.getItem('username') === "") {
    //Listener for username keystrokes
    let username_input = document.querySelector('#username');
    username_input.addEventListener('keyup', (event) => {
      const new_user = username_input.value;
      if (event.key === "Enter" && new_user.length > 0) {
        localStorage.setItem('username', new_user);
        document.querySelector('#loggedin_username').innerHTML = new_user;
        $('#login_modal').modal('hide');
        handle_logout();
      }
    });

    //Show login modal
    $('#login_modal').modal('show');

  } else {
    $('#login_modal').modal('hide');
    document.querySelector('#loggedin_username').innerHTML = localStorage.getItem('username');
    handle_logout();
  }

  // When connected, configure buttons
  socket.on('connect', () => {
    // add events for new_channel button
    const new_channel_form = document.querySelector('#new_channel');
    new_channel_form.addEventListener('submit', (e) => {
      e.preventDefault();
      let c_name = new_channel_form.querySelector('input').value.trim();
      if (c_name) {
        socket.emit('new channel', {'channel': c_name});
        //join that channel after creation
        join_channel(c_name);
      }
      new_channel_form.querySelector('input').value = "";
      return false
    });

    //disable message input before join
    document.querySelector(".input-box_text").disabled = true;
    //join saved channel after page load
    if (localStorage.getItem('current_channel') && localStorage.getItem('username')) {
      join_channel(localStorage.getItem('current_channel'));
    }
  });

  //Receive channels update
  socket.on('channels', (data) => {
    channels_list(data);
  });

  //Receive users update
  socket.on('users', (data) => {
    document.querySelector('#user_list').innerHTML = channel_users_list_hb({'users': data});
  });

  //Receive channels messages on joining channel
  socket.on('messages', (data) => {
    const messages_list = document.querySelector('#messages');
    messages_list.innerHTML = channel_messages_list_hb({'messages': data});
    messages_list.scrollTop = messages_list.scrollHeight;
    populate_delete_button();
  });

  //Receive message in currently joined channel
  socket.on('message', (data) => {
    let messages = data.message;
    let selected_channel = data.channel;
    let username = data.username;

    //play sound only if user is viewing this channel
    if (localStorage.getItem('current_channel') && selected_channel == localStorage.getItem(
        'current_channel').toLowerCase() && localStorage.getItem('username') && username != localStorage.getItem(
        'username')) {
      let playPromise = document.querySelector('#myAudio').play();
      if (playPromise !== undefined) {
        playPromise.then(_ => {
          // Automatic playback started!
        })
            .catch(error => {
              // Auto-play was prevented
            });
      }
    }
    let message_container = document.querySelector('#messages');
    message_container.innerHTML = channel_messages_list_hb({'messages': messages});
    message_container.scrollTop = message_container.scrollHeight;
    populate_delete_button();
  });

  //refresh data on message delete
  socket.on('message delete', (data) => {
    const message_container = document.querySelector('#messages');
    message_container.innerHTML = channel_messages_list_hb({'messages': data});
    populate_delete_button();
  });

  //function used to clear out user information from localStorage
  function handle_logout() {
    if (!document.querySelector("#log_me_out")) {
      //create logout button
      let logout_button = document.createElement('a');
      logout_button.setAttribute("role", "button");
      logout_button.setAttribute("role", "button");
      logout_button.setAttribute("id", "log_me_out");
      logout_button.classList.add("btn", "btn-outline-warning", "logout-btn");
      logout_button.textContent = "Logout";
      logout_button.addEventListener('click', (e) => {
        e.preventDefault();
        const loggedin_user = localStorage.getItem('username');
        const selected_channel = localStorage.getItem('current_channel');
        if (loggedin_user) {
          localStorage.removeItem('username');
        }
        if (selected_channel) {
          localStorage.removeItem('current_channel');
        }
        document.querySelector('#loggedin_username').innerHTML = "Not Logged in";
        socket.emit('logout', {
          user: loggedin_user, channel: selected_channel
        });
        $('#login_modal').modal('show');
      });
      //append this button to user_logout span
      document.querySelector('#user_logout').appendChild(logout_button);
    }
  }

  //add event listener to all delete links identified by .del-message class, this method gets called whenever
  //some sends message, deletes message or changes channel
  function populate_delete_button() {
    document.querySelectorAll('.del-message').forEach((item) => {
      item.addEventListener('click', event => {
        event.preventDefault();
        let parentEle = item.parentElement;
        let message_index = item.dataset.message_index;
        parentEle.style.animationPlayState = 'running';
        parentEle.addEventListener('animationend', () => {
          parentEle.remove();
        });

        socket.emit('delete message', {
          channel: localStorage.getItem('current_channel'), message_index: message_index
        });
      });
    });
  }

  //populates link next to message if the message was sent by the current user.
  Handlebars.registerHelper('del_button', function (user, idx) {
    if (user === localStorage.getItem('username')) {
      return new Handlebars.SafeString(`<a href="#" class="text-danger del-message" data-message_index="${idx}">`
          + '<i class="fa fa-trash" aria-hidden="true"></i></a>');
    }
  });

  //this method will list all the channels rendered by handlebars
  function channels_list(channels) {
    document.querySelector('#channels_list').innerHTML = channel_list_hb({'channels': channels});
    //Listeners for channels names
    document.querySelector('#channels_list').querySelectorAll('li').forEach((item) => {
      item.addEventListener('click', event => {
        event.preventDefault();
        if (localStorage.getItem('current_channel') && localStorage.getItem('current_channel').toLowerCase()
            === item.dataset.cname) {
          return null
        }
        join_channel(item.dataset.cname);
        document.querySelector('#channels_list').querySelectorAll('li').forEach((item) => {
          item.classList.remove('active');
        });
        item.classList.add('active');
      });
      if (item.dataset.cname === localStorage.getItem('current_channel')) {
        item.classList.add('active');
      }
    })
  }

  //this method is called when the user clicks the channel link or creates new channel.
  function join_channel(channel) {
    // Leave current channel, if joined
    if (localStorage.getItem('current_channel') && localStorage.getItem('current_channel').toLowerCase() != channel) {
      socket.emit('change channel',
          {channel: localStorage.getItem('current_channel'), user: localStorage.getItem('username')});
    }
    //set local storage item to the channel joined/clicked by user
    localStorage.setItem('current_channel', channel.toLowerCase());
    socket.emit('join channel', {channel: channel, user: localStorage.getItem('username')});
    // message input
    let message_input = document.querySelector('#message_box');
    message_input.disabled = false;
    message_input.addEventListener('keyup', (event) => {
      if (event.key === "Enter" && message_input.value.length > 0) {
        const timestamp = new Date().toString().substring(0, 15);

        socket.emit('submit message', {
          channel: localStorage.getItem('current_channel'),
          user: localStorage.getItem('username'),
          'timestamp': timestamp,
          text: message_input.value
        });
        message_input.value = "";
      }
    });
    document.querySelector('.channel-menu_name').innerHTML = "# " + channel;
    populate_delete_button();
  }

});
