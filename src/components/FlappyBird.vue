<template>
    <div id="game-container" ref="gameContainer">
        <img id="game-background" src="@/assets/flappy-bird-assets/sprites/background-day.png">
        <img id="flappy-bird" ref="flappyBird" :src="currentBirdImg"
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

// sounds
import wingSoundPath from '@/assets/flappy-bird-assets/audio/wing.ogg';
import pointSoundPath from '@/assets/flappy-bird-assets/audio/point.ogg';
import hitSoundPath from '@/assets/flappy-bird-assets/audio/hit.ogg';

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
            preventRotation: false,
            allowAnimations: false,
            isJumping: false,
            wingSound: new Audio(wingSoundPath),
            pointSound: new Audio(pointSoundPath),
            hitSound: new Audio(hitSoundPath),
        };
    },
    mounted() {
        window.addEventListener('keydown', this.handleJump);
        this.$refs.gameContainer.addEventListener('touchstart', this.handleJump);
        this.allowAnimations = true;
        this.animateBird();
        this.moveGround();
    },
    beforeUnmount() {
        this.endGame();
        window.removeEventListener('keydown', this.handleJump);
        this.$refs.gameContainer.removeEventListener('touchstart', this.handleJump);
    },
    birdYPosition() {
        this.$nextTick(() => {
            this.updateHitboxPosition();
        });
    },

    methods: {
        startGame() {
            clearInterval(this.gravityIntervalId);
            clearInterval(this.pipeMoveInterval);
            clearInterval(this.groundMoveInterval);

            this.gameActive = true;
            this.gameOver = false;
            this.allowAnimations = false;
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
                if (!this.allowAnimations && !this.gameActive) return;
                this.currentBirdImg = this.flappyBirdImgs[index];
                index = (index + 1) % this.flappyBirdImgs.length;
            }, 250);
        },
        handleJump(event) {
            if (!event || event.type === 'touchstart' || event.code === 'Space') {
                if (this.awaitingStart) {
                    this.isJumping = true;
                    this.gameActive = true;
                    this.awaitingStart = false;
                    this.allowAnimations = this.gameOver;
                    this.gravityIntervalId = this.simulateGravity();
                    this.animateBird();
                    this.moveGround();
                    this.movePipes();

                    setTimeout(() => this.isJumping = false, 500);
                } else if (!this.gameOver) {
                    this.wingSound.play();
                    this.updateBirdPosition();
                }
            }
        },
        simulateGravity() {
            return setInterval(() => {
                if (!this.gameActive || this.gameOver) return;
                this.birdYPosition += 4; // gravity strength

                // tilt of the bird while falling
                if (!this.preventRotation) {
                    this.birdRotation += 25;
                    if (this.birdRotation > 90) this.birdRotation = 90;
                }

                if (this.birdYPosition >= 80) {
                    this.birdYPosition = 80;
                    this.endGame();
                }
                this.checkCollision();
            }, 100);
        },
        updateBirdPosition() {
            this.updateHitboxPosition()
            this.birdYPosition -= 14;
            if (this.birdYPosition < 0) this.birdYPosition = 0;

            this.birdRotation = -20; // bird tilts 20 degrees on jump
            this.preventRotation = true;
            clearTimeout(this.rotationTimeout);
            this.rotationTimeout = setTimeout(() => {
                this.preventRotation = false;
                this.birdRotation = 0;
            }, 500);

            setTimeout(() => {
                this.checkCollision();
            }, 10);
        },
        updateHitboxPosition() {
            if (this.hitbox && this.$refs.flappyBird) {
                const birdElement = this.$refs.flappyBird;
                const birdRect = birdElement.getBoundingClientRect();

                // initial hitbox alignment
                this.hitbox.style.width = `${birdRect.width}px`;
                this.hitbox.style.height = `${birdRect.height}px`;
                this.hitbox.style.left = `${birdRect.left}px`;
                this.hitbox.style.top = `${birdRect.top}px`;
            }
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

        checkCollision() {
            const birdRect = this.$refs.flappyBird.getBoundingClientRect();
            const gameRect = this.$refs.gameContainer.getBoundingClientRect();

            // Translate bird's rect to game container coordinates
            const birdTop = birdRect.top - gameRect.top;
            const birdBottom = birdTop + birdRect.height;
            const birdLeft = birdRect.left - gameRect.left;
            const birdRight = birdLeft + birdRect.width;

            this.pipes.forEach(pipe => {
                const pipeX = pipe.left;
                const pipeRight = pipeX + 52; // Pipe width
                const topPipeBottom = pipe.topHeight;
                const bottomPipeTop = gameRect.height - pipe.bottomHeight;

                // Enhance the precision for top pipe collision
                if (birdRight > pipeX && birdLeft < pipeRight) {
                    // For top pipe, check if bird's bottom is higher than the pipe's bottom boundary
                    if (birdTop < topPipeBottom) {
                        this.triggerCollision();
                        return;
                    }
                    // For bottom pipe, check if bird's top is lower than the pipe's top boundary
                    if (birdBottom > bottomPipeTop) {
                        this.triggerCollision();
                        return;
                    }
                }
            });

            // Check for collision with the ground
            if (birdBottom >= gameRect.height) {
                this.triggerCollision();
            }
        },
        triggerCollision() {
            console.log('Collision Detected');
            this.hitSound.play();
            this.endGame();
            this.gameActive = false;
            this.gameOver = true;
        },
        moveGround() {
            const groundSpeed = 2; // ground and pipes move at the same speed
            const viewWidth = this.$refs.gameContainer.offsetWidth;
            const totalGroundWidth = this.$refs.groundContainer.scrollWidth;
            clearInterval(this.groundMoveInterval);

            this.groundMoveInterval = setInterval(() => {
                if (!this.allowAnimations && !this.gameActive) return;

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
                if (!this.gameActive) return;

                // spawning new pipes based on the last pipe's position.
                if (this.pipes.length === 0 || (this.pipes[this.pipes.length - 1].left + minSpawnDistance < this.$refs.gameContainer.clientWidth)) {
                    this.spawnPipe();
                }

                // logic to move pipes left
                this.pipes.forEach(pipe => {
                    pipe.left -= groundSpeed;

                    // scoring mechanism
                    const scorePosition = 120;
                    if (!pipe.scored && pipe.left < scorePosition) {
                        this.score += 1;
                        pipe.scored = true;
                        this.pointSound.play();
                    }
                });

                // delete pipes that have moved off screen
                this.pipes = this.pipes.filter(pipe => pipe.left > -60)
            }, 1000 / 60);
        },
        spawnPipe() {
            const gapSize = 60; // gap size between the pipes
            const groundHeightVh = 17; // ground height in vh (viewport height percentage)

            // min and max height for the top pipe as percentage of game container height
            const minHeightPercent = 10;
            const maxHeightPercent = 70;

            // viewport to pixels
            const gameHeightPx = this.$refs.gameContainer.clientHeight;
            const groundHeightPx = (gameHeightPx * groundHeightVh) / 100;

            // find the max space for the pipes, subtracting the ground height and gap size
            const maxPipeSpacePx = gameHeightPx - groundHeightPx - gapSize;

            // randomly determine the top pipe's height within the allowed range, converting percentage to pixels
            let topPipeHeightPx = Math.floor(Math.random() * ((maxPipeSpacePx * maxHeightPercent / 100) - (maxPipeSpacePx * minHeightPercent / 100) + 1) + (maxPipeSpacePx * minHeightPercent / 100));

            // this is so the bottom pipe's height does not extend into the ground
            let bottomPipeHeightPx = maxPipeSpacePx - topPipeHeightPx;

            if (bottomPipeHeightPx > maxPipeSpacePx * maxHeightPercent / 100) {
                bottomPipeHeightPx = maxPipeSpacePx * maxHeightPercent / 100;
                topPipeHeightPx = maxPipeSpacePx - bottomPipeHeightPx;
            }

            this.pipes.push({
                id: this.nextPipeId++,
                left: this.$refs.gameContainer.clientWidth,
                topHeight: topPipeHeightPx,
                bottomHeight: bottomPipeHeightPx,
                scored: false
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
            this.allowAnimations = true;

            // clear intervals
            clearInterval(this.gravityIntervalId);
            clearInterval(this.pipeMoveInterval);
            clearInterval(this.groundMoveInterval);
            clearInterval(this.birdFlapInterval);

            // reset timers
            this.gravityIntervalId = null;
            this.pipeMoveInterval = null;
            this.groundMoveInterval = null;

            this.moveGround();
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