const GAME_WIDTH = 800;
const GAME_HEIGHT = 700;
const COUNT_OF_JELLY_FISH_ROW = 2;
const COUNT_OF_JELLY_FISH_COL = 4;
const JELLY_FISH_IMG_HEIGHT = 519;
const JELLY_FISH_IMG_WIDTH = 256;
const HIT_JELLYFISH = 5;
const MISS_JELLYFISH = 6;
const STUCK_ON_PIPE_JELLYFISH = 7;
const NONE = 1;

var mainScreenImage =  document.getElementById("img_mainScreen");


function myRand(up, low) {
    return Math.floor(Math.random() * (up - low + 1) + low);
}

const GAMESTATE = {
    PAUSED: 0,
    RUNNING: 1,
    MENU: 2,
    GAMEOVER: 3
};
///////////////////////////////////////////////////////// Pipes Class ///////////////////////////////////////////////////////////////////////////

class Pipes {
    constructor(game) {

        this.imageup = document.getElementById("img_pipeup");
        this.imageDown = document.getElementById("img_pipe");

        this.width = 65;
        this.height = GAME_HEIGHT / 3;
        this.canUserClick = false;
        this.isOpen = true;
        this.closeInterval = 10;
        this.closeIntervalCount = 0;

        this.position = {
            x: GAME_WIDTH - GAME_WIDTH / 3,
            y: GAME_HEIGHT - this.height
        };

        ////taget////


        this.target =
        {
            width: this.width,
            height: GAME_HEIGHT / 3,
            x: GAME_WIDTH - GAME_WIDTH / 3,
            y: GAME_HEIGHT / 2 - this.height / 2
        };

        this.safe =
        {
            width: this.width / 4,
            height: GAME_HEIGHT,
            x: GAME_WIDTH - GAME_WIDTH / 3 - 15,
            y: 0
        };


    }

    draw(ctx) {
        ctx.drawImage(
            this.imageDown,
            this.position.x,
            this.position.y,
            this.width,
            this.height
        );


        ctx.drawImage(this.imageup,
            this.position.x,
            0, this.width,
            this.height);
        if (this.canUserClick == true) {
            this.closeIntervalCount++;
            if (this.closeIntervalCount == this.closeInterval) {
                this.closeIntervalCount = 0;
                this.height = GAME_HEIGHT / 3;
                this.position.y = GAME_HEIGHT - this.height;
                this.canUserClick = false;
                this.isOpen = true;
            }


        }
    }
    close() {
        this.playPipeSound();
        this.canUserClick = true;
        this.height = GAME_HEIGHT / 2;
        this.position.y = GAME_HEIGHT / 2;
        this.isOpen = false;

    }

    update(deltaTime) {}


    playPipeSound() {
        var audio = new Audio("sounds/swooshingSound.mp3");

        audio.play();
    }

}

///////////////////////////////////////////////////////// Jellyfish Class ///////////////////////////////////////////////////////////////////////////
class Jellyfish {

    constructor(game) {
        this.image = document.getElementById("img_Jellyfish");
        this.size = { width: 120, height: 120 };
        this.game = game;
        this.isActive = true;
        this.isFallen = false;

        ////animation///
        this.srcX;
        this.srcY;
        this.currentFrameX = 0;
        this.currentFrameY = 0;
        this.counter = 0;
        this.reset();
    }

    reset() {
        var startPos = myRand(this.game.globalLimit.down - 2, this.game.globalLimit.up + 2);
        this.position = { x: myRand(3, 0), y: startPos };
        this.speed = { x: myRand(3, 2), y: myRand(5, 2) };

    }
    updateFrame() {
        this.currentFrameX = ++this.currentFrameX % 4;
        this.currentFrameY = ++this.currentFrameY % 2;
        this.srcX = this.currentFrameX * 129;
        this.srcY = this.currentFrameY * 126;
        //  ctx.clearRect(0,0,145,139);
    }


    draw(ctx) {
        ctx.drawImage(
            this.image,
            this.srcX,
            this.srcY,
            145,
            145,
            this.position.x,
            this.position.y,
            this.size.width,
            this.size.height
        );

    }

    jellyfishsDead() {
        this.position.y += 2;
        this.position.x = this.game.pipes.position.x - this.size.width;
        if (this.position.y >= GAME_HEIGHT) {
            this.isFallen = false;
            this.reset();
        }
    }

    update(deltaTime) {
        if (this.isActive == false) return;


        this.counter++;
        if (this.counter % 8 == 0) this.updateFrame();


        if (this.isFallen == true) {
            this.jellyfishsDead();
            return;
        }

        ////////update the jellyfish position //////////  
        if (this.position.y <= this.game.globalLimit.up || this.position.y >= this.game.globalLimit.down) {
            if (this.position.y == this.game.globalLimit.up) {
                this.position.y = this.game.globalLimit.up + 1;
            }
            this.speed.y = this.speed.y * (-1);
        }
        var add = this.speed.y;
        if (this.position.y + add > this.game.globalLimit.down && this.position.y + add < this.game.globalLimit.up)
            this.position.y = (this.game.globalLimit.down + this.game.globalLimit.up) / 2;
        else
            this.position.y = this.position.y + this.speed.y;

        this.position.x = this.position.x + this.speed.x;



        ///////// check if the jellyfish passed the pipes ///////
        if (this.position.x > this.game.pipes.position.x + this.game.pipes.width + this.size.width) {
            this.playJellyfishMissSound();
            this.game.live.livesCounter--;

            this.game.live.heartsSize[this.game.live.livesCounter] = 0;
            this.reset();

        }

        let res = detectCollision(
            this,
            this.game.pipes,
            this.game.pipes.canUserClick
        );

        if (res == HIT_JELLYFISH) { /// user HIT the jellysifh ///
            this.playjellyfishSound();
            this.reset();
            this.game.hit.countHit++;
            if (this.game.hit.countHit % 3 == 0 &&
                this.game.alljellyfish.length < this.game.maxJellyfish) {
                var temp = new Jellyfish(this.game);
                this.game.alljellyfish.push(temp);
                this.game.gameObjects.push(temp
                );
            }
        }
        if (res == STUCK_ON_PIPE_JELLYFISH) {// user STUCK the jellysifh on the pipe ///
            this.isFallen = true;
        }
    }

    playjellyfishSound() {
        var audio1 = new Audio("sounds/hitSound.mp3");
        audio1.play();
    }

    playJellyfishMissSound() {
        var audio2 = new Audio("sounds/missSound.mp3");
        audio2.play();
    }

}



///////////////////////////////////////////////////////////// detectCollision /////////////////////////////////////////////////////////////
function detectCollision(jellyfishs, pipes, isClick) {

    let leftSideOfObject = pipes.target.x;
    let rightSideOfObject = pipes.target.x + pipes.target.width;
    let bottomOfObject = pipes.target.height + pipes.target.y;
    let topOfObject = pipes.target.y;

    let leftSideOfSafe = leftSideOfObject - 20;

    let centerjellyfishs = { x: jellyfishs.position.x + jellyfishs.size.width / 2, y: jellyfishs.position.y + jellyfishs.size.height / 2 };


    if (     /// check if user HIT the jellysifh ///
        leftSideOfObject < centerjellyfishs.x &&
        rightSideOfObject > centerjellyfishs.x &&
        bottomOfObject > centerjellyfishs.y &&
        topOfObject < centerjellyfishs.y &&
        isClick == true
    ) {
        return HIT_JELLYFISH;
    }


    if (  ///  check if jellysifh STUCK on the pipe ///
        leftSideOfSafe <= centerjellyfishs.x &&
        leftSideOfObject > centerjellyfishs.x &&
        isClick == true
    ) {

        return STUCK_ON_PIPE_JELLYFISH;
    }
    return NONE;//miss the jellyfishs
}



////////////////////////////////////////////////////////// InputHandler //////////////////////////////////////////////////////////
class InputHandler {
    constructor(pipes, game) {
        document.addEventListener("keydown", (event) => {
            switch (event.keyCode) {
                case 27: //ESC
                    game.togglePause();
                    break;

                case 32: //SPACE
                    game.start();
                    break;

                case 82://R
                    game.restart();
                    break;

                case 13: //ENTER
                    if (pipes.canUserClick == false && game.gamestate == GAMESTATE.RUNNING)
                        pipes.close();

                    break;
                default:
                    break;
            }
        });

    }
}

///////////////////////////////////////////////////////// Game Class ///////////////////////////////////////////////////////////////////////////

class Game {
    constructor() {

        this.gamestate = GAMESTATE.MENU;
        this.maxJellyfish = 4;
        this.hit = {
            countHit: 0,
            position: {
                x: 10,
                y: 10
            }
        };
        this.globalLimit = {
            up: GAME_HEIGHT / 3,
            down: (2 * GAME_HEIGHT) / 3 - 80
        }

        this.pipes = new Pipes(this);
        this.gameObjects = [this.pipes];

        this.alljellyfish = [
            new Jellyfish(this)
        ];

        this.gameObjects.push(this.alljellyfish[0]);

        this.live = {
            heartImage: document.getElementById("img_heart"),
            heartsSize: [35, 35, 35],
            livesCounter: 3,
            position: {
                x: 45,
                y: 5
            }
        };

        new InputHandler(this.pipes, this);
    }

    restartGame() {
        this.hit.countHit = 0;
        this.gamestate = GAMESTATE.MENU;
        this.gameObjects = [this.pipes];

        this.alljellyfish = [
            new Jellyfish(this)
        ];
        this.gameObjects.push(this.alljellyfish[0]);
        this.live.heartsSize = [35, 35, 35],
            this.live.livesCounter = 3;

    }

    update(deltaTime) {
        if (this.live.livesCounter == 0) {
            this.gamestate = GAMESTATE.GAMEOVER;
        }
        if (
            this.gamestate == GAMESTATE.PAUSED ||
            this.gamestate == GAMESTATE.MENU ||
            this.gamestate == GAMESTATE.GAMEOVER
        )
            return;

        [...this.gameObjects].forEach((object) => object.update(deltaTime));

    }

    start() { /// start the game ///
        if (
            this.gamestate !== GAMESTATE.MENU
        )
            return;
        this.gamestate = GAMESTATE.RUNNING;
    }



    restart() { 
        this.restartGame();
    }


    togglePause() {   /// pause the game ///
        if (this.gamestate == GAMESTATE.PAUSED) {
            this.gamestate = GAMESTATE.RUNNING;
        } else {
            this.gamestate = GAMESTATE.PAUSED;
        }
    }

    draw(ctx) {
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);


        if (this.gamestate == GAMESTATE.PAUSED) {
            ctx.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fill();
            ctx.font = "50px Comic Sans MS";
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.fillText("PAUSED", GAME_WIDTH / 2, GAME_HEIGHT / 2);
        }

        if (this.gamestate == GAMESTATE.MENU) {
            this.buildMenu(ctx);
        }
        if (this.gamestate == GAMESTATE.GAMEOVER) {
            this.buildGameOver(ctx);
        }

        if (this.gamestate == GAMESTATE.RUNNING) {
            this.buildRuning(ctx);


            [...this.gameObjects].forEach((object) => object.draw(ctx));


        }
    }


  
    buildRuning(ctx) {
        ctx.font = "30px Comic Sans MS";
        ctx.fillStyle = "blue";
        ctx.fillText("SCORE", GAME_WIDTH - 80, 55);
        ctx.font = "40px Comic Sans MS";
        ctx.fillStyle = "blue";
        ctx.fillText(this.hit.countHit, GAME_WIDTH - 80, 100);

        ctx.drawImage(this.live.heartImage,
            this.live.position.x - 40,
            this.live.position.y,
            this.live.heartsSize[0],
            this.live.heartsSize[0]
        );

        ctx.drawImage(
            this.live.heartImage,
            this.live.position.x,
            this.live.position.y,
            this.live.heartsSize[1],
            this.live.heartsSize[1]
        );

        ctx.drawImage(
            this.live.heartImage,
            this.live.position.x + 40,
            this.live.position.y,
            this.live.heartsSize[2],
            this.live.heartsSize[2]
        );

    }
    buildMenu(ctx) {

        ctx.drawImage(
            mainScreenImage,
            0,
            0,
            GAME_WIDTH,
            GAME_HEIGHT
        );

        ctx.font = "36px Comic Sans MS";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText("PRESS SPACEBAR TO START", GAME_WIDTH / 2, GAME_HEIGHT / 3  );

        ctx.font = "30px Comic Sans MS";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText("ESC to PAUSE", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40);


        ctx.font = "30px Comic Sans MS";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText("ENTER to HIT", GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
    }

    buildGameOver(ctx) {

        ctx.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        ctx.fillStyle = "rgba(0,130,143,1)";
        ctx.fill();
        ctx.font = "50px Comic Sans MS";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", GAME_WIDTH / 2, GAME_HEIGHT / 2);


        ctx.font = "25px Comic Sans MS";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(
            "YOUR SCORE: " + this.hit.countHit,
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 50
        );

        ctx.font = "25px Comic Sans MS";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(
            "PRESS R TO MAIN SCREEN",
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 100
        );
    }

}

let canvas = document.getElementById("gameScreen");
let ctx = canvas.getContext("2d");


var game = new Game();
let lastTime = 0;



function gameLoop(timestamp) {
    let deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    game.update(deltaTime);
    game.draw(ctx);

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);





