
var bgcolor = 'darkblue';
var roadcolor = 'grey';
var road_strip_width;
var road_strip_height;
var gameVelocity = 0.1; //maybe increase this logarithmically
var road_width;
var road_start;
var playerHorizontalVelocity = 0.4;
var opponents = [];
//maybe localize next 3 to have cars with diff sizes?
var carWidth// = road_width/5;;
var carHeight// = carWidth*2;
var carVelocity// = 0;
var nextspawn_t = 5000;    

var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');

var player;
var ry = 0; //road y
var isdowna=false, isdownd = false; //monitors if a key is pressed down

function initiateCar(x,y,width, height, velocity, health, color='blue') {
    var car = {
        velocity:velocity, //represents horizontal velcoity for player and vertical velocity for opponents
        color: color,
        x: x,
        y: y,
        width: width,
        height: height,
        health: health,
    };

    return car;
}

function init() {
    canvas.width = document.body.clientWidth-50;
    canvas.height = document.body.clientHeight-50;

    road_strip_width = canvas.width/100; //3% of the road
    road_strip_height = canvas.height/40;
    road_strip_gap = 5*road_strip_height;

    road_width = canvas.width/3;
    road_start = canvas.width/2 - road_width/2;

    carWidth = road_width/5;;
    carHeight = carWidth*2;
    carVelocity = 0;

    player = initiateCar(
        canvas.width/2, canvas.height-carHeight/2-10, carWidth, carHeight, carVelocity, 100, 'black');
    
    //attach events
    document.addEventListener("keydown",function(event) {
        var key = event.key.toLocaleLowerCase();
        //console.log("AAAAA"+event.key);
        if(key == "a") { //left
            isdowna = true;
            player.velocity = -playerHorizontalVelocity;
        } else if(key == "d") { //right
            isdownd = true;
            player.velocity = playerHorizontalVelocity;
        }
    });
    document.addEventListener("keyup",function(event) {
        var key = event.key.toLocaleLowerCase();
        
        if(key == "a") { //left
            isdowna = false;
            if(isdownd != true)
                player.velocity =0//-= playerHorizontalVelocity;
            else player.velocity = playerHorizontalVelocity;
        } else if(key == "d") { //right
            isdownd = false;
            if(isdowna != true)
                player.velocity =0//+= playerHorizontalVelocity;
            else player.velocity = -playerHorizontalVelocity;
        }
    });
}

var old_time;
function drawAndUpdateScene(ctx, t) {

    if(old_time === undefined)
        old_time = t;
    dt = t - old_time;
    ctx.fillStyle = bgcolor;
    ctx.fillRect(0, 0, canvas.width, canvas.height );

    drawRoad();

    drawCar(player);

    drawOpponents();

    //then draw the rest of the cars too

    //now update
    updatePlayer(dt);

    updateOpponents(dt);

    updateRoad(gameVelocity, dt);

    window.requestAnimationFrame((t)=>{ drawAndUpdateScene(ctx, t); });
    old_time = t;
}

function drawOpponents() {
    for(var i=0;i<opponents.length;i++) {
        var car = opponents[i];
        drawCar(car);
    }
}

function drawCar(car) {
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x - car.width/2, car.y - car.height/2,
                    car.width, car.height);
}

function drawRoad() {
    ctx.fillStyle = roadcolor;
    ctx.fillRect(road_start, 0, road_width, canvas.height);
    
    var i = -road_strip_height+ry;
    while( i < canvas.height) {
        ctx.fillStyle = 'white';
        ctx.fillRect(canvas.width/2-road_strip_width/2, i, road_strip_width, road_strip_height)
        i+= road_strip_height + road_strip_gap;
    }
}

function updateRoad(vel, dt) {
    ry = (ry+vel*dt)%(road_strip_height+road_strip_gap);
}

var lastOpCreat_t = 0, o_created = 0;
function updateOpponents(dt) {
    //create new opponent with frequency 'opFreq'

    if(lastOpCreat_t > nextspawn_t && opponents.length < 5) {//nextspawn_t) { //change from constant
        opponents.push(
            //Maybe see cars with different widths and different velcoties
            //don't spawn on the same place.
            initiateCar(road_start+carWidth/2 + Math.random()*(road_width - carWidth),
                -carHeight,carWidth, carHeight, gameVelocity+Math.random(), 100, 'yellow')
        );
        o_created++;
        if(nextspawn_t >= 1000) {
            nextspawn_t -= 300;
            gameVelocity += 0.01
        }
        nextspawn_t -= Math.log(o_created);
        //console.log(nextspawn_t);
        lastOpCreat_t = 0;
    }

    var to_remove = []; //out of bound opponents
    for(var i=0;i<opponents.length;i++) {
        opponents[i].y += dt*opponents[i].velocity;

        //handle avoiding opponent car collisions
        for(var j=0;j<opponents.length;j++) {
            if(i==j) continue;
            if( opponents[i].x < opponents[j].x + opponents[j].width 
                && opponents[i].x > opponents[j].x - opponents[i].width
                && opponents[i].y + opponents[i].height< opponents[j].y + opponents[j].height 
                && opponents[i].y + opponents[i].height> opponents[j].y) {
                    opponents[i].y -= dt*opponents[i].velocity;
                    opponents[i].velocity
                        = Math.min(opponents[i].velocity,opponents[j].velocity);
                    opponents[j].velocity = opponents[i].velocity;
                }
        }

        //handle cars going out of bounds
        if(opponents[i].y - opponents[i].height > canvas.height) {
            to_remove.push(i);
        }
    }

    for(var i=0;i<to_remove.length;i++) {
        opponents.splice(to_remove[i],1);
    }
    lastOpCreat_t += dt;
}

function updatePlayer(dt) {
    var newpos = player.x + player.velocity*dt;
    if(newpos > road_start + player.width/2 && newpos < road_start + road_width - player.width/2) {
        player.x = newpos;
    }
}

init();
drawAndUpdateScene(ctx, 0);