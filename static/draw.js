
window.addEventListener('load', eventWindowLoaded, false);

function eventWindowLoaded() {
  canvasApp();
}

function canvasApp() {
  var host = vids_host;
  var port = vids_port;
  var user_name = vids_user_name;
  var room_name = vids_room_name;

  var ws = new WebSocket("ws://" + host + ":" + port + "/ws");

  var theCanvas = document.getElementById("canvas");
  var context = theCanvas.getContext("2d");
  var down = false;
  var positionLists = {};
  var W = 1, H = 1;
  var preX = -1, preY = -1;

  var colorTable = {"Black":"#000000", "White":"#ffffff", "Blue":"#0000ff", "Red":"#ff0000", "Green":"#00ff00"};

  var clearButton = document.getElementById("clearButton");
  clearButton.onclick = function() {
    ws.send(room_name+"@{\"name\":\"" + user_name + "\", \"action\": \"clear\"}");
  }

  var container = document.getElementById("canvasContainer");
  queue = null;
  wait = 300;
  // ページ読込時にCanvasサイズ設定 
  setCanvasSize();
  // リサイズ時にCanvasサイズを再設定 
  window.addEventListener("resize", function() {
    clearTimeout( queue );
    queue = setTimeout(function() {
      setCanvasSize();
    }, wait );
  }, false );
  // Canvasサイズをコンテナの100%に 
  function setCanvasSize() {
    theCanvas.width = container.offsetWidth;
    theCanvas.height = container.offsetHeight;
    W = theCanvas.width;
    H = theCanvas.height;
    console.log("w=" + W);
    console.log("h=" + H);
    initCanvas();
  }

  function initCanvas() {
    //console.log("inited");
    context.strokeStyle = "#000000";
    context.fillStyle   = "#ffffff";
    context.lineWidth = 2;
    context.fillRect(0, 0, theCanvas.width, theCanvas.height);
  }
  // データの受信
  ws.onmessage = function(m) {
    //console.log(m.data);
    data = JSON.parse(m.data);
    if( data.action == "clear"){
      initCanvas();
      return;
    }
    if( ! (data.name in positionLists) ){
      if(data.action != "mouseup"){
        data.action = "mousedown";
      }
    }
    if(data.action == "mousedown"){
      positionLists[data.name] = {X:data.X, Y:data.Y, Color:data.Color};
    }else if(data.action == "mousemove"){
      var pX = positionLists[data.name].X * W;
      var pY = positionLists[data.name].Y * H;
      context.strokeStyle = positionLists[data.name].Color;
      context.beginPath();
      context.moveTo(pX, pY);
      context.lineTo(data.X * W, data.Y * H);
      context.stroke();
      context.closePath();
      positionLists[data.name].X = data.X;
      positionLists[data.name].Y = data.Y;
    }
  };
  //mouse event
  theCanvas.addEventListener('mousedown', function(e) {
    down = true;
    var color = "Black";
    var colorList = document.getElementsByName("colorButton");
    for(var i = 0; i < colorList.length; i++){
      if(colorList[i].checked){
        color = colorList[i].value;
        break;
      }
    }
    ws.send(room_name+"@{\"name\":\"" + user_name + "\",\"action\": \"mousedown\"" + ",\"X\":" + e.layerX/W + ",\"Y\":" + e.layerY/H + ",\"Color\":\"" + colorTable[color] + "\"}");
  }, false);
  window.addEventListener('mousemove', function(e) {
    var X = e.clientX;
    var Y = e.clientY;
    if(down && X != preX && Y != preY){
      ws.send(room_name+"@{\"name\":\"" + user_name + "\", \"action\": \"mousemove\"" + ", \"X\":" + X/W + ", \"Y\":" + Y/H + "}");
      preX = X;
      preY = Y;
    }
  }, false);
  window.addEventListener('mouseup', function(e) {
    if(down){
      down = false;
      preX = -1;
      preY = -1;
    }
  }, false);
  //touch event
  theCanvas.addEventListener('touchstart', function(e) {
    down = true;
    var color = "Black"
    var colorList = document.getElementsByName("colorButton");
    for(var i = 0; i < colorList.length; i++){
      if(colorList[i].checked){
        color = colorList[i].value;
        break;
      }
    }
    ws.send(room_name+"@{\"name\":\"" + user_name + "\", \"action\": \"mousedown\"" + ", \"X\":" + e.layerX/W + ", \"Y\":" + e.layerY/H + ",\"Color\":\"" + colorTable[color] + "\"}");
  }, false);
  window.addEventListener('touchmove', function(e) {
    if(down){
      ws.send(room_name+"@{\"name\":\"" + user_name + "\", \"action\": \"mousemove\"" + ", \"X\":" + e.layerX/W + ", \"Y\":" + e.layerY/H + "}");
    }
  }, false);
  window.addEventListener('touchend', function(e) {
    if(down){
      down = false;
    }
  }, false);
  document.body.addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, false);
}
