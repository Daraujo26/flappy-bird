<template>
    <div id="score-board">
        <ol>
            <li v-for="(score, index) in topScores" :key="index">{{ score.name }} - {{ score.score }}</li>
        </ol>
    </div>
    <div id="game-over-div">
        <img id="game-over-message" src="../../assets/flappy-bird-assets/sprites/gameover.png">
        <button id="restart-game" @click="restartGame">Restart</button>
        <input type="text" v-model="userName" placeholder="Your Name..." />
        <button id="submit-high-score" @click="submitScore">Submit High Score</button>
    </div>
</template>

<script>
import { db } from '../../firebase';
import { collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';

export default {
    props: ['finalScore'],
    data() {
        return {
            userName: '',
            topScores: [],
        };
    },
    async mounted() {
        await this.fetchTopScores();
    },
    methods: {
        restartGame() {
            this.$emit('restart-game');
        },
        async submitScore() {
            if (this.userName.trim() === '') {
                alert('Please enter your name.');
                return;
            }
            try {
                await addDoc(collection(db, "score"), {
                    name: this.userName,
                    score: this.finalScore,
                });
                alert('High score submitted successfully!');
                this.userName = '';
                await this.fetchTopScores();
            } catch (error) {
                console.error("Error submitting high score: ", error);
                alert('Failed to submit high score.');
            }
        },
        async fetchTopScores() {
            const scoresQuery = query(collection(db, "score"), orderBy("score", "desc"), limit(3));
            try {
                const querySnapshot = await getDocs(scoresQuery);
                this.topScores = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error("Error fetching top scores: ", error);
            }
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2;
}

#game-over-message {
    text-align: center;
    margin-bottom: 20px;
}

#score-board {
    position: absolute;
    left: 1%;
    top: 1%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: burlywood;
    border-radius: 5px;
    border: 2px solid black;
    padding: 5px;
    padding-right: 20px;
    width: auto;
    max-width: 400px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 3;
}

#restart-game,
#submit-high-score {
    margin: 10px 0;
}

input[type="text"] {
    margin-bottom: 10px;
    font-family: monospace;
    padding: 5px;
    font-size: 16px;
}

button {
    padding: 10px 20px;
    font-family: monospace;
    cursor: pointer;
    font-size: 16px;
    margin: 5px;
    background-color: gold;
}
</style>