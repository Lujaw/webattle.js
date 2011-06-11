var Game = function(sock, ser) {
  var GAMEOPTS = {w: 640, h:480, color: '#000', speed: 4}
  this.getOpts = function getOpts(){
    return GAMEOPTS;
  };
  var ANGLES = {n: 0.0, e: 1.57079633, s: 3.1415926, w: 4.71238898} //north, east, south, west
  var REV_ANGLES = {0.0: 'n', 1.57079633: 'e', 3.1415926: 's', 4.71238898: 'w'}
  this.scene = sjs.Scene(GAMEOPTS);
  
  // keep all game objects in spritelists
  var players = sjs.SpriteList([]);
  var bullets = sjs.SpriteList([]);
  
  var socket = sock;
  var background = this.scene.Layer('background', GAMEOPTS);
  var bulletLayer = this.scene.Layer('bullets', {w: 640, h:480});
  var ground = this.scene.Sprite('assets/images/ground.png', background);
  ground.setW(window.innerWidth);
  ground.move(0, 160);

  var tank = new Tank(this.scene, background, this);
  tank.reset();
  
  var input  = new sjs.Input();

  var result = document.getElementById('result');

  // var cycle = new sjs.Cycle([[0, 0, 1]]);
  function paint() {
    
    // -------- HANDLE BULLETS ----------
    var bul;
    while(bul = bullets.iterate()) {
      bul.applyVelocity();
      bul.update();
      var cwt = bul.collidesWith(tank); // cache expensive operation
      if(bul.x < 0 || bul.y < 0 || bul.x > GAMEOPTS.w || bul.y > GAMEOPTS.h || bul.collidesWithArray(players) || cwt){
          bullets.remove(bul);
          // bul.remove();
          if (cwt){
            tank.reset()
          };
      };
    };
    // -----------------------------------
    
    if(input.keyboard.left) {
      if (!doesColideWest()){
        tank.move(-GAMEOPTS.speed, 0);
      };
      tank.scale(1, 1);
      tank.setAngle(ANGLES.w);
    }else if(input.keyboard.right) {
      if (!doesColideEast()){
        tank.move(GAMEOPTS.speed, 0);
      };
      tank.scale(-1, 1);
      tank.setAngle(ANGLES.e);
    }else if(input.keyboard.up) {
      if (!doesColideNorth()){
        tank.move(0, -GAMEOPTS.speed);
      };
      tank.scale(1, 1);
      tank.setAngle(ANGLES.n);
    }else if(input.keyboard.down) {
      if (!doesColideSouth()){
        tank.move(0, GAMEOPTS.speed);
      };
      tank.scale(-1, 1);
      tank.setAngle(ANGLES.s);
    }

    if(input.keyboard.space){
      tank.shoot();
    };

    tank.update();
    
    if(ticker.currentTick % 30 == 0) {
        result.innerHTML = ' ' + ticker.load + '%';
    }
    socket.send(ser.serialize(ser.MSG_PLAYER_POSITION, {x: tank.x, y: tank.y, a: REV_ANGLES[tank.angle]}));
  };
  
  // TODO: move to tank object
  var doesColideWest = function(){
    // with game world
    if((tank.x - GAMEOPTS.speed) <= 0.0){
      return true;
    };
    return false;
  };
  var doesColideEast = function(){
    if((tank.x + tank.w) >= GAMEOPTS.w){
      return true;
    };
    return false;
  };
  var doesColideNorth = function(){
    // with game world
    if((tank.y - GAMEOPTS.speed) <= 0.0){
      return true;
    };
    return false;
  };
  var doesColideSouth = function(){
    if((tank.y + tank.h) >= GAMEOPTS.h){
      return true;
    };
    return false;
  };
  
  // msg: {x : x position, y: y position, xv: x velocity, yv: y velocity}
  // send: optional parameter. If true then other players will receive info about bullet.
  // send is only used for locally created bullets
  this.addBullet = function(msg, send){
    var speed_multipl = 1.2;
    var b = this.scene.Sprite(null, bulletLayer);
    b.position(msg.x, msg.y);
    b.size(4, 4);
    b.setColor('#fff');
    b.xv = msg.xv;
    b.yv = msg.yv;
    b.update();
    bullets.add(b);
    if (send){
      socket.send(ser.serialize(ser.MSG_NEW_BULLET, {x: b.x, y: b.y, xv: b.xv, yv: b.yv}));
    };
    return b;
  };
  
  this.createPlayer = function(id){
    var tmpPlayer = this.scene.Sprite('assets/images/tank.png', background);
    tmpPlayer.move(50, 80);
    tmpPlayer.size(30, 30);
    tmpPlayer.id = id; //ugh, adding id property to sprite illegaly
    players.add(tmpPlayer);
    tmpPlayer.update();
    console.log("I haz " + players.length + " playerz now");
  };
  
  // msg is a hash of {i: id, x: x, y: y}
  this.updatePlayer = function(msg){
    var player;
    while (player = players.iterate()) {
      if(msg.i == player.id){
        player.setX(msg.x)
        player.setY(msg.y);
        player.setAngle(ANGLES[msg.a]);
        player.update();
      };
    };
  };
  
  this.removePlayer = function(id){
    var player;
    while (player = players.iterate()) {
    if(player.id == id){
      //player.remove();
      players.remove(player);
      break;
    };
    console.log("I haz " + players.lenght + " players now");
  };
  };
  var ticker = this.scene.Ticker(35, paint);
  ticker.run();
};
