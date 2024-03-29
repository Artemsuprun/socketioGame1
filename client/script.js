const socket = io();

let canvas = document.getElementById('game');
let ctx = canvas.getContext('2d');
const padding = canvas.width/20;

/*
function onResize() { if (window.devicePixelRatio > 1) {
    canvas.width = canvas.clientWidth * 2;
    canvas.height = canvas.clientHeight * 2;
    ctx.scale(2, 2);
  }
  else {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
}
onResize();
window.addEventListener("resize", onResize);
*/

function setUp() {
  //canvas.width = 1000;
  //canvas.height = 1000;
}

class blob {
  constructor(x, y, r, id=-1, color) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.id = id;
    this.color = [color[0], color[1]];
  }
}
playerColors = [ 
  ["black", "azure"],
  ["grey", "black"],
  ["dodgerblue", "black"],
  ["lightgreen", "black"],
  ["brown", "grey"],
  ["cyan", "black"],
  ["darkgreen", "azure"],
  ["blueviolet", "floralwhite"],
  ["gold", "darkslategrey"],
  ["hotpink", "darkslategray"]
];
playerColor = playerColors[Math.floor(Math.random()*playerColors.length)];

startSize = 10;
locX = padding + (Math.floor(Math.random()*(canvas.width-padding*2)));
locY = padding + (Math.floor(Math.random()*(canvas.height-padding*2)));
player = new blob(locX, locY, startSize, 0, playerColor);

// start
socket.on('connect', function () {
  socket.emit('start', player);
  if (player.id == 0) {
    player.id = socket.id;
  }
});


// Movement ---------------------------------------
let LEFT = false;
let RIGHT = false;
let UP = false;
let DOWN = false;
function movePlayer() {
  if (LEFT && player.x > padding) {
    player.x -= 1;
  }
  if (RIGHT && player.x < (canvas.width-padding)) {
    player.x += 1;
  }
  if (UP && player.y > padding) {
    player.y -= 1;
  }
  if (DOWN && player.y < (canvas.height-padding)) {
    player.y += 1;
  }
}
document.addEventListener("keydown", function (e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    RIGHT = true;
  }
  else if (e.key === "Left" || e.key === "ArrowLeft") {
    LEFT = true;
  }
  else if (e.key === "Up" || e.key === "ArrowUp") {
    UP = true;
  }
  else if (e.key === "Down" || e.key === "ArrowDown") {
    DOWN = true;
  }
});
document.addEventListener("keyup", function (e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    RIGHT = false;
  }
  else if (e.key === "Left" || e.key === "ArrowLeft") {
    LEFT = false;
  }
  else if (e.key === "Up" || e.key === "ArrowUp") {
    UP = false;
  }
  else if (e.key === "Down" || e.key === "ArrowDown") {
    DOWN = false;
  }
});
// END OF Movement ---------------------------------------

feed = [];
feedSize = 20;
function drawFeed() {
  ctx.beginPath();
  // remove eaten feed
  for (let i = feed.length-1; i >= 0; i--) {
    if (Math.hypot(player.x - feed[i].x, player.y - feed[i].y) < player.r) {
      c = (2 * Math.PI * player.r) + (2 * Math.PI * feed[i].r);
      player.r = c / (2*Math.PI);
      feed.splice(i, 1);
    }
  }
  // generate the missing feed
  for (let i = feed.length; i < feedSize; i++) {
    feedColor = playerColors[Math.floor(Math.random()*playerColors.length)];
    locX = padding + (Math.floor(Math.random()*(canvas.width-padding*2)));
    locY = padding + (Math.floor(Math.random()*(canvas.height-padding*2)));
    feed[i] = new blob(locX, locY, 2, -1, feedColor);
  }
  // draw the feed
  for (let i = 0; i < feed.length; i++) {
    ctx.beginPath();
    ctx.arc(feed[i].x, feed[i].y, feed[i].r, 0, Math.PI * 2);
    ctx.fillStyle = feed[i].color[0];
    ctx.fill();
    ctx.closePath();
  }
  ctx.closePath();
}

others = [];
function drawOther() {
  for (let i = 0; i < others.length; i++) {
    // draws player
    ctx.beginPath();
    ctx.arc(others[i].x, others[i].y, others[i].r, 0, Math.PI * 2);
    ctx.fillStyle = others[i].color[0];
    ctx.fill();
    ctx.closePath();
    
    // draws name
    ctx.font = "10px Arial";
    ctx.fillStyle = others[i].color[1];
    ctx.textAlign = "center";
    ctx.fillText((others[i].id.substring(0, 5)), others[i].x, others[i].y);
  } 
}

function drawPlayer() {
  // draw circle
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fillStyle = player.color[0];
  ctx.fill();
  ctx.closePath();
  
  // draws name
  ctx.font = "10px Arial";
  ctx.fillStyle = player.color[1];
  ctx.textAlign = "center";
  ctx.fillText((player.id.substring(0, 5)), player.x, player.y);
}

function camera() {
  //const zoom = ((startSize/player.r)*2 > 1) ? (startSize/player.r)*2 : 1;
  const zoom = 2;
  ctx.resetTransform();
  ctx.scale(zoom, zoom);
  ctx.translate((canvas.width/2/zoom)-player.x,(canvas.height/2/zoom)-player.y);
}

function drawGrid() {
  ctx.beginPath();
  for (let i = 0; i < canvas.width-padding; i += padding) {
    ctx.moveTo(0.5 + i + padding, padding);
    ctx.lineTo(0.5 + i + padding, canvas.height - padding);
  }
  for (let i = 0; i < canvas.height-padding; i += padding) {
    ctx.moveTo(padding, 0.5 + i + padding);
    ctx.lineTo(canvas.width - padding, 0.5 + i + padding);
  }
  
  ctx.strokeStyle = "silver";
  ctx.stroke();
  ctx.closePath();
}

function draw() {
  // implement camera
  camera();
  
  // clear frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // darw grid lines
  drawGrid();
  
  // check for eaten players/food
  for (let i = others.length-1; i >= 0; i--) {
    if (Math.hypot(player.x - others[i].x, player.y - others[i].y) < player.r + others[i].r - 2) {
      if (player.r > others[i].r) {
        player.r += .5;
        others.splice(i, 1);
      }
      else if (player.r < others[i].r) {
        others[i].r = .5;
        player = null;
        locX = padding + (Math.floor(Math.random()*(canvas.width-padding*2)));
        locY = padding + (Math.floor(Math.random()*(canvas.height-padding*2)));
        player = new blob(locX, locY, startSize, socket.id, playerColor);
      }
    }
  }
  
  // hunger effect
  if (player.r > startSize) {
    player.r -= 0.02;
  }
  
  // draw feed
  drawFeed();
  
  // draw other Players
  drawOther();
  
  // draw player
  drawPlayer();
  
  // movement
  movePlayer();

  // send server current location
  socket.emit('update', player);
}


// server sends list of players and feed positions
socket.on('heartbeat', function(blobs) {
  // remove our instance in the list
  for (let i = 0; i < blobs.length; i++) {
    if (blobs[i].id == socket.id) {
      blobs.splice(i, 1);
    }
  }
  // copy server list to our list
  others.splice(0, others.length);
  others = blobs.slice();
});


setUp();

let interval = setInterval(draw, 30);

