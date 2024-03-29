const express = require('express');
const path = require('path');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const port = 3000;
const host = '';

const app = express();
const server = createServer(app);
const io = new Server(server);

const players = [];
const userLimit = 10;
const food = [];

class blob {
  constructor(x, y, r, id=-1) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.id = id;
  }
}

// routing
app.use(express.static(path.join(__dirname, '../client')));

// socket stuff
io.on('connection', (socket) => {
  socket.on('start', (blob) => {
    // A player has joined the game
    blob.id = socket.id;
    players.push(blob);
  });

  socket.on('update', (blob) => {
    // a player sent their cords
    for (let i = 0; i < players.length; i++) {
      if (players[i].id == socket.id) {
        players[i].x = blob.x;
        players[i].y = blob.y;
        players[i].r = blob.r;
        break;
      }
    }
  });

  socket.on('disconnect', () => {
    // a player quit
    for (let i = players.length-1; i >= 0; i--) {
      if (players[i].id == socket.id) {
        players.splice(i, 1);
        break;
      }
    }
  });
});

// heartbeat
setInterval(heartbeat, 30);
function heartbeat() {
  io.emit('heartbeat', players);
}

// listen
server.listen(port, () => {
  console.log('server running at http://localhost:3000');
});



