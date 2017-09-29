
let game_id = location.hash;
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
		webSocketBridge.send({'type': 'create_game'})
	} else {
		console.log("Connecting to existing game");
		webSocketBridge.send({'type': 'join_game', 'game_id': game_id})
	}    
});

webSocketBridge.listen(function(action, stream) {
  game_id = action.game_id;
  console.log(action);
  console.log(stream);
  location.hash = game_id;
  displayMessage(action.msg)
});

function displayMessage(msg) {
	var newLine = document.createElement("p");
	newLine.appendChild(document.createTextNode(msg));
	var chatBox = document.getElementById('chatbox');
	chatBox.insertBefore(newLine, chatBox.childNodes[0]);
}

function sendMessage(username, msg) {
	webSocketBridge.send({'game_id': game_id, 
		'type': 'submit_word',
		'word': msg})
}

document.querySelector("#chatform").addEventListener("submit", function(e) {
    e.preventDefault();    //stop form from submitting
    var msg = e.target.elements.msg.value;
    var username = e.target.elements.username.value;
   	sendMessage(username, msg);
});









