<template>
    <div id="game-container" ref="gameContainer">
        <img id="game-background" src="@/assets/flappy-bird-assets/sprites/background-day.png">
        <img id="flappy-bird" :src="currentBirdImg"
            :style="{ top: birdYPosition + '%', transform: `rotate(${birdRotation}deg)` }">
        <img id="get-ready-img" src="@/assets/flappy-bird-assets/sprites/message.png">
        <div id="ground-container" ref="groundContainer">
            <img v-for="ground in grounds" :key="ground.key" :src="ground.src" class="ground" :style="ground.style">
        </div>

        <div id="score-display"
            style="position: absolute; top: 5%; left: 50%; transform: translateX(-50%); display: flex;">
            <img v-for="(digit, index) in score.toString().split('')" :key="index" :src="getScoreImagePath(digit)"
                alt="Score Digit" style="height: 64px;">
        </div>


        <div v-for="pipe in pipes" :key="pipe.id" class="pipe-container" :style="{ left: pipe.left + 'px' }">
            <img src="@/assets/flappy-bird-assets/sprites/pipe-green.png" class="pipe top-pipe"
                :style="{ height: pipe.topHeight + 'px' }">
            <img src="@/assets/flappy-bird-assets/sprites/pipe-green.png" class="pipe bottom-pipe"
                :style="{ height: pipe.bottomHeight + 'px' }">
        </div>
        <GameOver v-if="gameOver" :finalScore="score" @restart-game="resetGame" />
    </div>
</template>

<script>

import GameOver from './pop_ups/GameOver.vue';
import downFlap from '@/assets/flappy-bird-assets/sprites/yellowbird-downflap.png';
import midFlap from '@/assets/flappy-bird-assets/sprites/yellowbird-midflap.png';
import upFlap from '@/assets/flappy-bird-assets/sprites/yellowbird-upflap.png';
import groundImage from '@/assets/flappy-bird-assets/sprites/base.png';

export default {
    components: { GameOver },
    data() {
        return {
            currentBirdImg: midFlap,
            awaitingStart: true,
            flappyBirdImgs: [downFlap, midFlap, upFlap],
            birdYPosition: 50,
            birdRotation: 0,
            gameActive: false,
            gameOver: false,
            gravityIntervalId: null,
            rotationTimeout: null,
            groundOffset: 0,
            grounds: [
                { key: 1, src: groundImage, style: { left: '0%' } },
                { key: 2, src: groundImage, style: { left: '100%' } }
            ],
            pipes: [],
            nextPipeId: 0,
            pipeMoveInterval: null,
            score: 0,
        };
    },
    mounted() {
        window.addEventListener('keydown', this.handleJump);
    },
    beforeUnmount() {
        this.endGame();
        window.removeEventListener('keydown', this.handleJump);
    },
    methods: {
        startGame() {
            clearInterval(this.gravityIntervalId);
            clearInterval(this.pipeMoveInterval);
            clearInterval(this.groundMoveInterval);

            this.gameActive = true;
            this.gameOver = false;
            this.gravityIntervalId = this.simulateGravity();
            this.animateBird();
            this.moveGround();
            this.movePipes();
        },
        getScoreImagePath(digit) {
            // had to do this to resolve path issues
            return require(`@/assets/flappy-bird-assets/sprites/${digit}.png`);
        },
        animateBird() {
            let index = 0;
            this.birdFlapInterval = setInterval(() => {
                if (!this.gameActive) return;
                this.currentBirdImg = this.flappyBirdImgs[index];
                index = (index + 1) % this.flappyBirdImgs.length;
            }, 250);
        },
        handleJump(event) {
            if (event.code === 'Space') {
                if (this.awaitingStart) {
                    this.gameActive = true;
                    this.awaitingStart = false;
                    this.gravityIntervalId = this.simulateGravity();
                    this.animateBird();
                    this.moveGround();
                    this.movePipes();
                } else if (!this.gameOver) {
                    this.updateBirdPosition();
                }
            }
        },
        simulateGravity() {
            return setInterval(() => {
                if (!this.gameActive || this.gameOver) return;
                this.birdYPosition += 3.25;
                if (this.birdYPosition >= 80) {
                    this.birdYPosition = 80;
                    this.endGame();
                }
            }, 100);
        },
        updateBirdPosition() {
            this.birdYPosition -= 17;
            if (this.birdYPosition < 0) this.birdYPosition = 0;

            this.birdRotation = -25;
            clearTimeout(this.rotationTimeout);
            this.rotationTimeout = setTimeout(() => {
                this.birdRotation = 0;
            }, 100);

            setTimeout(() => {
                this.checkCollision();
            }, 50);
        },
        calculateBirdPosition() {
            const gameWidth = this.$refs.gameContainer.clientWidth;
            const gameHeight = this.$refs.gameContainer.clientHeight;

            const birdWidth = (7 / 100) * gameHeight;
            const birdHeight = birdWidth;
            const birdLeft = (40 / 100) * gameWidth;
            const birdTop = (this.birdYPosition / 100) * gameHeight;

            return {
                left: birdLeft,
                top: birdTop,
                right: birdLeft + birdWidth,
                bottom: birdTop + birdHeight
            };
        },

        calculatePipeRects(pipe) {
            const gameHeight = this.$refs.gameContainer.clientHeight;
            const pipeWidth = 52;

            const topPipeBottom = pipe.topHeight;
            const bottomPipeTop = gameHeight - pipe.bottomHeight;

            return {
                top: {
                    left: pipe.left,
                    top: 0,
                    right: pipe.left + pipeWidth,
                    bottom: topPipeBottom
                },
                bottom: {
                    left: pipe.left,
                    top: bottomPipeTop,
                    right: pipe.left + pipeWidth,
                    bottom: gameHeight
                }
            };
        },

        checkCollision() {
            const birdBounds = this.calculateBirdBounds();
            this.pipes.forEach(pipe => {
                const pipeBounds = this.calculatePipeBounds(pipe);
                if (this.isOverlapping(birdBounds, pipeBounds.top) || this.isOverlapping(birdBounds, pipeBounds.bottom)) {
                    this.endGame();
                }
            });
        },

        calculateBirdBounds() {
            const birdLeft = (40 / 100) * this.$refs.gameContainer.clientWidth;
            const birdTop = (this.birdYPosition / 100) * this.$refs.gameContainer.clientHeight;
            const birdWidth = (7 / 100) * this.$refs.gameContainer.clientHeight;
            const birdHeight = birdWidth;

            return {
                left: birdLeft,
                top: birdTop,
                right: birdLeft + birdWidth,
                bottom: birdTop + birdHeight
            };
        },

        calculatePipeBounds(pipe) {
            const pipeWidth = 52;
            const gameHeight = this.$refs.gameContainer.clientHeight;

            return {
                top: {
                    left: pipe.left,
                    top: 0,
                    right: pipe.left + pipeWidth,
                    bottom: pipe.topHeight,
                },
                bottom: {
                    left: pipe.left,
                    top: gameHeight - pipe.bottomHeight,
                    right: pipe.left + pipeWidth,
                    bottom: gameHeight,
                }
            };
        },

        isOverlapping(rect1, rect2) {
            return !(rect1.right < rect2.left ||
                rect1.left > rect2.right ||
                rect1.bottom < rect2.top ||
                rect1.top > rect2.bottom);
        },

        moveGround() {
            const groundSpeed = 2; // ground and pipes move at the same speed
            const viewWidth = this.$refs.gameContainer.offsetWidth;
            const totalGroundWidth = this.$refs.groundContainer.scrollWidth;

            this.groundMoveInterval = setInterval(() => {
                if (!this.gameActive || this.gameOver) return;

                this.groundOffset -= groundSpeed; // moves ground to the left

                // checks if the ground has moved enough that it needs to be reset.
                if (Math.abs(this.groundOffset) >= totalGroundWidth - viewWidth) {
                    this.groundOffset = 0; // resetting ground position for a continuous loop.
                }

                this.$refs.groundContainer.style.transform = `translateX(${this.groundOffset}px)`;
            }, 1000 / 60); // the divide 60 signs 60 fps to make game smoother
        },
        movePipes() {
            const groundSpeed = 2
            let minSpawnDistance = 300; // spacing between the pipes

            this.pipeMoveInterval = setInterval(() => {
                if (!this.gameActive || this.gameOver) return;

                // spawning new pipes based on the last pipe's position.
                if (this.pipes.length === 0 || (this.pipes[this.pipes.length - 1].left + minSpawnDistance < this.$refs.gameContainer.clientWidth)) {
                    this.spawnPipe();
                }

                // logic to move pipes left
                this.pipes.forEach(pipe => {
                    pipe.left -= groundSpeed;

                    // scoring mechanism
                    const birdPosition = 40;
                    if (!pipe.scored && pipe.left < birdPosition) {
                        this.score += 1;
                        pipe.scored = true;
                        console.log(this.score)
                    }
                });

                // delete pipes that have moved off screen
                this.pipes = this.pipes.filter(pipe => pipe.left > -60)
            }, 1000 / 60);
        },
        spawnPipe() {

            const gapSize = 25;
            const groundHeightVh = 17;
            const minTopHeight = 50; // minimum height for top pipes to ensure visibility
            const minBottomHeight = 80; // minimum height for bottom pipes to prevent hiding

            // finds the available space for pipes, adjusting for the vh unit
            const gameHeightPx = this.$refs.gameContainer.clientHeight; // total height of the game container in pixels
            const groundHeightPx = (gameHeightPx * groundHeightVh) / 100; // convert vh to pixels for calculation
            const availableSpaceForPipes = gameHeightPx - groundHeightPx - gapSize;

            // randomly determine height to get different gap locations
            let topPipeHeight = Math.floor(Math.random() * (availableSpaceForPipes - minBottomHeight - minTopHeight)) + minTopHeight;
            let bottomPipeHeight = availableSpaceForPipes - topPipeHeight;

            // height requirements
            if (bottomPipeHeight < minBottomHeight) {
                bottomPipeHeight = minBottomHeight;
                topPipeHeight = availableSpaceForPipes - bottomPipeHeight;
            }

            // check to ensure total pipe configuration does not pass available space
            if (topPipeHeight + gapSize + bottomPipeHeight > availableSpaceForPipes) {
                const excessHeight = topPipeHeight + gapSize + bottomPipeHeight - availableSpaceForPipes;
                topPipeHeight -= excessHeight / 2;
                bottomPipeHeight -= excessHeight / 2;
            }

            // push the new pipe configuration, making sure both top and bottom pipes fit well within the game area
            this.pipes.push({
                id: this.nextPipeId++,
                left: this.$refs.gameContainer.clientWidth, // starting off screen to the right
                topHeight: topPipeHeight,
                bottomHeight: bottomPipeHeight,
            });
        },
        endGame() {
            this.gameActive = false;
            this.gameOver = true;

            // clear intervals
            clearInterval(this.gravityIntervalId);
            clearInterval(this.pipeMoveInterval);
            clearInterval(this.groundMoveInterval);

            // reset intervals
            this.gravityIntervalId = null;
            this.pipeMoveInterval = null;
            this.groundMoveInterval = null;
        },
        resetGame() {
            this.gameActive = false;
            this.gameOver = false;
            this.awaitingStart = true; // make sure game is waiting for a start command
            this.birdYPosition = 50;
            this.birdRotation = 0;
            this.groundOffset = 0;
            this.pipes = [];
            this.nextPipeId = 0;
            this.score = 0;

            // clear intervals
            clearInterval(this.gravityIntervalId);
            clearInterval(this.pipeMoveInterval);
            clearInterval(this.groundMoveInterval);

            // reset timers
            this.gravityIntervalId = null;
            this.pipeMoveInterval = null;
            this.groundMoveInterval = null;
        },
    },
};
</script>



<style>
body {
    background-color: greenyellow;
    overflow: hidden;
}

#game-container {
    position: relative;
    background-color: greenyellow;
    height: 95vh;
    /* this gets the width of the background image so it wont spill out of the sides */
    width: calc(95vh * (288 / 512));
    margin: 0 auto;
    text-align: center;
    overflow: hidden;
    z-index: 1;
}

#game-background {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    height: 95vh;
    z-index: 2;
    border: 3px solid rgb(0, 168, 0);
}

#flappy-bird {
    position: absolute;
    left: 40%;
    transform: translateX(-50%);
    z-index: 2;
    top: 50%;
    width: 7vh;
    transform: translateY(-50%);
    transition: transform 0.1s, top 0.1s;
}

.ground {
    width: 50%;
    height: 100%;
    z-index: 3;
}

#ground-container {
    position: absolute;
    bottom: 0;
    width: calc(300% - 6px);
    height: 17vh;
    display: flex;
    z-index: 3;
}

#waiting-start-message {
    position: absolute;
    left: 50%;
    top: 40%;
    transform: translate(-50%, -50%);
    z-index: 2;
    width: 45vh;
}

.pipe-container {
    position: absolute;
    bottom: 0;
    z-index: 2;
}

.bottom-pipe,
.top-pipe {
    position: absolute;
    left: 0;
    width: 52px;
}

.bottom-pipe {
    bottom: 0;
}

.top-pipe {
    top: -95vh;
    transform: rotate(180deg);
}


.pipe img {
    display: block;
    height: auto;
    width: 100%;
    max-height: 100%;
    z-index: 2;
    object-fit: cover;
}

#score-display {
    z-index: 3;
}
</style>