class Scene {
    static change(newScene) {
        if (!this.current) this.current = this[newScene]
        this.current.style.display = 'none'
        if (this.current == this.main) this.hud.style.display = 'none'
        this[newScene].style.display = 'flex'
        if (this[newScene] == this.main) this.hud.style.display = 'flex'
        let toPlay
        let toPause = []
        switch(newScene) {
            case 'title': 
                toPlay = 'title-bgm'
                toPause = ['main-bgm','gameover-bgm']; break
            case 'main': 
                toPlay = 'main-bgm'
                toPause = ['title-bgm','gameover-bgm']; break
            case 'howToPlay':
                toPlay = 'title-bgm'; break
            case 'highScores':
                toPlay = 'title-bgm'
                toPause = ['gameover-bgm']; break
            case 'gameOver': 
                toPlay = 'gameover-bgm'
                toPause = ['main-bgm']; break
        }
        toPause.forEach(bgm => {if (!document.getElementById(bgm).paused) Audio.fadoutBgm(bgm)});
        if (toPlay && document.getElementById(toPlay).paused) Audio.fadeinBgm(toPlay, 0.2)
        this.current = this[newScene]
    }

    static startGame() {
        this.change('main')
        $game = new GameSession() 
        $game.startLevel(1)
        $game.interval = setInterval(()=>{$game.update()}, 17)
    }
    
    static endGame() {
        clearInterval($game.interval)
        $game.fadeout.style.opacity = 1
        setTimeout(()=> {
            $game.removeAll()
            this.change('gameOver')
            document.querySelector('#gameoverScene .fadeout').style.opacity = 0
        },680)
        document.getElementById('final-score').textContent = $game.score
        document.getElementById('final-level').textContent = $game.level
    }
}

class Input {
    static setupClickListeners() {
        const btnstart = document.querySelectorAll('.btn-start') // start / restart
        btnstart.forEach(btn => {
            btn.addEventListener('click', () => {
            Audio.playSound('cursor',0.5)
            setTimeout(()=>{Scene.startGame()}, 300)
            })
        })
        const btntotitle = document.querySelectorAll('.btn-backtotitle') // back to title
        btntotitle.forEach(btn => {btn.addEventListener('click', () => {
            Audio.playSound('cursor',0.5)
            setTimeout(()=>{Scene.change('title')}, 300)
            })
        })
        document.getElementById('btn-instructions').addEventListener('click', () => { // how to play
            Audio.playSound('cursor',0.5)
            setTimeout(()=>{Scene.change('howToPlay')}, 300)
        })
        document.getElementById('btn-highscores').addEventListener('click', () => { // highscores
            Audio.playSound('cursor',0.5)
            Data.updateHighscores()
            setTimeout(()=>{Scene.change('highScores')}, 300)
        })
        document.getElementById('btn-submit-score').addEventListener('click', () => { // submit score
            Audio.playSound('cursor',0.5)
            setTimeout(()=>{document.getElementById('submit-box').style.display = 'block'}, 300)
        }) 
        document.getElementById('btn-submit').addEventListener('click', () => { // confirm submit
            Audio.playSound('cursor',0.5)
            Data.submitScore()
        })
        document.getElementById('btn-cancel').addEventListener('click', () => { // cancel submit
            Audio.playSound('cursor',0.5)
            document.getElementById('submit-box').style.display = 'none'
        })
        document.getElementById('priority-toggleL').addEventListener('click', () => {
            $player.togglePriority(-1)
        })
        document.getElementById('priority-toggleR').addEventListener('click', () => {
            $player.togglePriority(1)
        })
        document.getElementById('btn-pause').addEventListener('click', () => { // pause
            Audio.playSound('cursor',0.5)
            !$game.isPaused ? $game.pause() : $game.resume()
        })
    }

    static setupKeyboardListeners() {
        window.addEventListener("keydown", () => {
            if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(event.key)) event.preventDefault()
            this.keys[event.key] = true
        })
        window.addEventListener("keyup", () => {
            if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(event.key)) event.preventDefault()
            this.keys[event.key] = false
        })
    }

    static keys = {"ArrowUp": false, "ArrowDown": false, "ArrowLeft": false, "ArrowRight": false, " ": false}

    static isKeyDown(keyName) {
        return this.keys[keyName]
    }
}

class Audio {
    static playSound(id, volume) {
        if (volume) document.getElementById(id).volume = volume
        document.getElementById(id).play()
    }

    static fadeinBgm(id, maxVol) {
        const audio = document.getElementById(id)
        const increment = 0.05;
        const interval = 2000 / (maxVol / increment);
        audio.volume = 0;
        audio.play();
        const fadeAudio = setInterval(() => {
            if (audio.volume < maxVol) {
                audio.volume = Math.min(audio.volume + increment, maxVol);
            } else {
                clearInterval(fadeAudio);
            }
        }, interval);
    }

    static fadoutBgm(id) {
        const audio = document.getElementById(id)
        const increment = 0.05;
        const interval = 1000 / (audio.volume / increment);
        const fadeAudio = setInterval(() => {
            if (audio.volume > 0) {
                audio.volume = Math.max(audio.volume - increment, 0);
            } else {
                audio.pause();
                audio.currentTime = 0;
                clearInterval(fadeAudio);
            }
        }, interval);
    }
}

class Data {
    static submitScore() {
        document.getElementById('submit-box').style.display = 'none'
        localStorage.setItem(Math.random(), JSON.stringify({
            name: document.getElementById('submit-name').value, 
            level: document.getElementById('final-level').textContent, 
            score: document.getElementById('final-score').textContent
        }));
        this.updateHighscores()
        Scene.change('highScores')
    }

    static updateHighscores() {
        const scoreList = Object.keys(localStorage)
        const data = scoreList.map(scoreId => {
            let parsed = JSON.parse(localStorage.getItem(scoreId))
            return {name: parsed.name, level: parsed.level, score: parsed.score}
        })
        data.sort((a, b) => b.score - a.score);
        const rowName = [...document.querySelectorAll('.hs-name')]
        const rowLevel = [...document.querySelectorAll('.hs-level')]
        const rowScore = [...document.querySelectorAll('.hs-score')]
    
        for (let i = 0; i < 10 ; i++) {
            if (!data[i]) continue
            rowName[i].textContent = data[i].name
            rowLevel[i].textContent = data[i].level
            rowScore[i].textContent = data[i].score
        }
    }

    static enemies = {
        'bat': {minLvl: 1, minPower: 1, maxPower: 3, points: 1},
        'slime': {minLvl: 2, minPower: 3, maxPower: 6, points: 2},
        'orc': {minLvl: 5, minPower: 6, maxPower: 10, points: 5},
        'skeleton': {minLvl: 7, minPower: 10, maxPower: 13, points: 10},
        'ghost': {minLvl: 10, minPower: 13, maxPower: 17, points: 15},
        'imp': {minLvl: 20, minPower: 17, maxPower: 21, points: 20},
        'minotaur': {minLvl: 30, minPower: 21, maxPower: 25, points: 25},
    }

    static items = {
        'potion-red': {minLvl: 2, chance: 35},
        'potion-green': {minLvl: 2, chance: 32},
        'potion-blue': {minLvl: 2, chance: 30},
        'potion-yellow': {minLvl: 2, chance: 15},
        'shield': {minLvl: 8, chance: 25},
        'sword': {minLvl: 8, chance: 22},
        'bomb': {minLvl: 12, chance: 20},
        'arrow': {minLvl: 2, chance: 30},
        'hourglass': {minLvl: 10, chance: 18},

        // --- TESTING ---
        //'shield': {minLvl: 1, chance: 100},
        //'sword': {minLvl: 1, chance: 100},
        //'bomb': {minLvl: 1, chance: 100},
        //'hourglass': {minLvl: 1, chance: 100},
        //'arrow': {minLvl: 1, chance: 100},
        //'potion-green': {minLvl: 1, chance: 100},
        //'potion-blue': {minLvl: 1, chance: 100},
        //'potion-yellow': {minLvl: 1, chance: 100},
    }

    static obstacles = ['pillar-H','pillar2-H','pillar3-H','pillar-broken-H','pillar-broken2-H','pillar-broken3-H','pillar-broken4-H',
    'pillar-broken','rubble','rubble2','hole']
}