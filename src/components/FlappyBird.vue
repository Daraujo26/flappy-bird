<template>
    <div id="game-container">
        <img id="game-background" src="@/assets/flappy-bird-assets/sprites/background-day.png">
        <img id="flappy-bird" :src="currentBirdImg">
        <div id="ground-container" ref="groundContainer">
            <img id="game-ground" src="@/assets/flappy-bird-assets/sprites/base.png" class="ground">
            <img id="game-ground-2" src="@/assets/flappy-bird-assets/sprites/base.png" class="ground">
        </div>
    </div>
</template>

<script>
import downFlap from '@/assets/flappy-bird-assets/sprites/yellowbird-downflap.png'
import midFlap from '@/assets/flappy-bird-assets/sprites/yellowbird-midflap.png'
import upFlap from '@/assets/flappy-bird-assets/sprites/yellowbird-upflap.png'

export default {
    data() {
        return {
            currentBirdImg: midFlap,
            flappyBirdImgs: [downFlap, midFlap, upFlap],
            groundOffset: 0
        }
    },
    mounted() {
        this.animateBird()
        this.scrollGround()
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
            const speed = 0.25; // Speed of the ground scrolling
            const animate = () => {
                this.groundOffset = this.groundOffset - speed;
                if (this.groundOffset <= -100) {
                    this.groundOffset = 0; // Reset offset to loop the background
                }
                this.$refs.groundContainer.style.transform = `translateX(${this.groundOffset}%)`;
                requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        }
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
    width: 100%; 
    height: 95vh; 
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
    left: 48%;
    transform: translateX(-50%);
    z-index: 2;
    top: 50%;
    width: 6vh;
    transform: translateY(-50%);
}

/* #game-ground {
    left: 50%;
    transform: translateX(-50%);
    position: absolute;
    z-index: 2;
    height: 17vh;
    width: 55vh;
    bottom: 0;
} */

.ground {
    width: 50%; /* Each takes half of the container's width */
    height: 100%; /* Full height of the container */
}

#ground-container {
    position: absolute;
    bottom: 0;
    width: calc(200% - 6px); /* 100% for each image, minus the border of the game-background if it affects width */
    height: 17vh;
    display: flex;
    z-index: 3; /* Ensures it's above the game background */
}
</style>