socket = new WebSocket("ws://" + window.location.host + "/chat/");

function displayMessage(msg) {
	var newLine = document.createElement("p");
	newLine.appendChild(document.createTextNode(msg));
	var chatBox = document.getElementById('chatbox');
	chatBox.insertBefore(newLine, chatBox.childNodes[0]);
}

function sendMessage(username, msg) {
	socket.send("[" + username + "] " + msg);
}

document.querySelector("#chatform").addEventListener("submit", function(e) {
    e.preventDefault();    //stop form from submitting
    var msg = e.target.elements.msg.value;
    var username = e.target.elements.username.value;
   	sendMessage(username, msg);
});

socket.onmessage = function(e) {
    displayMessage(e.data);
}

socket.onopen = function() {

}







