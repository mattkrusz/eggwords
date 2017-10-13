
let game_id = location.hash;
let storage = window.localStorage;
let player_id = storage.getItem("player_id");

if (game_id.length > 0) {
	game_id = game_id.substr(1);
	newgame = false;
} else {
	newgame = true;
}

const webSocketBridge = new channels.WebSocketBridge();
webSocketBridge.connect('/ws/game/');

webSocketBridge.socket.addEventListener('open', function() {
    console.log("Connected to WebSocket");
	if (newgame) {
		console.log("Creating new game");
		webSocketBridge.send({'type': 'create_game', 'player_id': player_id})
	} else {
		console.log("Connecting to existing game");
		webSocketBridge.send({'type': 'join_game', 'game_id': game_id, 'player_id': player_id})
	}    
});

webSocketBridge.listen(function(action, stream) {
  console.log(action);
  console.log(stream);

  if (action.type === 'JoinGameResponse' || action.type === 'NewGameResponse') {
	player_id = action.player_id;	
	game_id = action.game_id;	
	storage.setItem("player_id", player_id);
  }

  location.hash = game_id;
  displayMessage(action.msg);

});

function displayMessage(msg) {
	var newLine = document.createElement("p");
	newLine.appendChild(document.createTextNode(msg));
	var chatBox = document.getElementById('chatbox');
	chatBox.insertBefore(newLine, chatBox.childNodes[0]);
}

function sendMessage(username, msg) {
	let outbound = {'game_id': game_id, 
		'type': 'submit_word',
		'word': msg,
		'player_id': player_id
	};
	console.log(outbound);
	webSocketBridge.send(outbound);
}

document.querySelector("#chatform").addEventListener("submit", function(e) {
    e.preventDefault();    //stop form from submitting
    var msg = e.target.elements.msg.value;
    var username = e.target.elements.username.value;
   	sendMessage(username, msg);
});

document.querySelector("#startGame").addEventListener("click", function(e) {
    e.preventDefault();    //stop form from submitting
	let outbound = {'game_id': game_id, 
		'type': 'start_game'
	};
	console.log(outbound);
	webSocketBridge.send(outbound);
});








