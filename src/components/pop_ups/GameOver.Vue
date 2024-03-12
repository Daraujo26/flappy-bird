<template>
    <div id="game-over-div">
        <img id="game-over-message" src="../../assets/flappy-bird-assets/sprites/gameover.png">
        <div id="score-board">
    
        </div>
        <button @click="restartGame">Restart</button>
        <button>Submit High Score</button>
    </div>
</template>

<script>

export default {
    methods: {
        restartGame() {
            this.$emit('restart-game');
        }
    }
}
</script>

<style>
#game-over-div {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
}

#game-over-message {
    text-align: center;
}
</style>