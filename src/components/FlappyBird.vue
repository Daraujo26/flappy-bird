<template>
    <div id="game-container">
        <img id="game-background" src="@/assets/flappy-bird-assets/sprites/background-day.png">
        <img id="flappy-bird" :src="currentBirdImg" :style="{ top: birdYPosition + '%', transform: `rotate(${birdRotation}deg)` }">
        <img id="get-ready-img" src="@/assets/flappy-bird-assets/sprites/message.png">
        <div id="ground-container" ref="groundContainer">
            <img id="game-ground" src="@/assets/flappy-bird-assets/sprites/base.png" class="ground">
            <img id="game-ground-2" src="@/assets/flappy-bird-assets/sprites/base.png" class="ground">
        </div>
        <GameOver v-if="gameOver" @restart-game="resetGame"/>
    </div>
</template>

<script>
import GameOver from './pop_ups/GameOver.vue'

import downFlap from '@/assets/flappy-bird-assets/sprites/yellowbird-downflap.png'
import midFlap from '@/assets/flappy-bird-assets/sprites/yellowbird-midflap.png'
import upFlap from '@/assets/flappy-bird-assets/sprites/yellowbird-upflap.png'

export default {
    components: { GameOver },
    data() {
        return {
            currentBirdImg: midFlap,
            flappyBirdImgs: [downFlap, midFlap, upFlap],
            groundOffset: 0,
            birdYPosition: 50,
            birdRotation: 0,
            gravityIntervalId: null,
            startRotation: true,
            rotationTimeout: null,
            gameActive: false,
            gameOver: false,
        }
    },
    mounted() {
        this.animateBird();
        this.scrollGround();
        window.addEventListener('keydown', this.updateBirdPosition);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.updateBirdPosition);
        clearInterval(this.gravityIntervalId);
        clearTimeout(this.rotationTimeout);
    },
    methods: {
        animateBird() {
            let index = 0
            setInterval(() => {
                this.currentBirdImg = this.flappyBirdImgs[index]
                index = (index + 1) % this.flappyBirdImgs.length
            }, 250)
        },
        scrollGround() {
            const speed = 2.0; // speed of the ground
            const frame = () => {
                // this prevents a reference error when compiling
                if (this.$refs.groundContainer) {
                    this.groundOffset -= speed;
                    let groundWidth = this.$refs.groundContainer.offsetWidth / 2; // the container holds 2 full widths of the ground image
                    if (this.groundOffset <= -groundWidth) {
                        this.groundOffset = 0;
                    }
                    this.$refs.groundContainer.style.transform = `translateX(${this.groundOffset}px)`;
                    requestAnimationFrame(frame);
                } else {
                    console.log('groundContainer reference not found');
                }
            };
            requestAnimationFrame(frame);
        },
        updateBirdPosition(event) {
            if (event.code === 'Space') {
                if (!this.gameActive) {
                    this.gameActive = true
                    this.gravityIntervalId = setInterval(this.simulateGravity, 100);
                }

                this.birdYPosition -= 17; // jump
                this.birdRotation = -25; // jump rotate animation

                this.startRotation = false;
                clearTimeout(this.rotationTimeout)
                this.rotationTimeout = setTimeout(() => {
                    this.startRotation = true
                }, 500);
            

                //
                // bird cant jump out of the background
                if (this.birdYPosition < 0) {
                    this.birdYPosition = 0
                }
            }
        },
        simulateGravity() {
            if (this.gameActive) {
                const gravity = 3.25; // fall speed
                this.birdYPosition += gravity;

                if (this.startRotation) {
                    this.birdRotation += 40;
                    this.birdRotation = Math.min(this.birdRotation, 90);
                }

                // Prevent the bird from falling below the ground level
                if (this.birdYPosition >= 80) { 
                    this.birdYPosition = 80;
                    this.birdRotation = 0;
                    this.endGame();
                }
            }
        },
        endGame() {
            this.gameActive = false
            this.gameOver = true
            clearInterval(this.gravityIntervalId);
        },
        resetGame() {
            this.gameActive = false;
            this.gameOver = false;
            this.birdYPosition = 50; 
            this.birdRotation = 0; 
            
            clearInterval(this.gravityIntervalId);
            clearTimeout(this.rotationTimeout);
        },
    }
}
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
    /* This gets the width of the background image so it doesn't spill out of the sides */
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
    transition: transform 0.2s, top 0.2s;
}

.ground {
    width: 50%;
    height: 100%; 
}

#ground-container {
    position: absolute;
    bottom: 0;
    width: calc(200% - 6px);
    height: 17vh;
    display: flex;
    z-index: 3;
}
</style>