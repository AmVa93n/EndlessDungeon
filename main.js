let $game, $player, $entrance, $exit = null // shorthand for current instances of important classes

window.onload = function() {
    Scene.main = document.getElementById('main')
    Scene.title = document.getElementById('titleScene')
    Scene.howToPlay = document.getElementById('instructions')
    Scene.highScores = document.getElementById('highscores')
    Scene.gameOver = document.getElementById('gameoverScene')
    Input.setupClickListeners()
    Input.setupKeyboardListeners()
    Scene.change('title')
}

class Scene {
    static change(newScene) {
        if (!this.current) this.current = this[newScene]
        this.current.style.display = 'none'
        this[newScene].style.display = 'flex'
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
            case 'highScores':
                toPlay = 'title-bgm'; break
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
        let btnstart = document.querySelectorAll('.btn-start') // start / restart
        btnstart.forEach(btn => {
            btn.addEventListener('click', () => {
            Audio.playSound('cursor',0.5)
            setTimeout(()=>{Scene.startGame()}, 300)
            })
        })
        let btntotitle = document.querySelectorAll('.btn-backtotitle') // back to title
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
    }
    static setupKeyboardListeners() {
        window.addEventListener("keydown", () => {
            if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.key)) event.preventDefault()
            this.keys[event.key] = true
        })
        window.addEventListener("keyup", () => {
            if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(event.key)) event.preventDefault()
            this.keys[event.key] = false
        })
    }
    static keys = {"ArrowUp": false, "ArrowDown": false, "ArrowLeft": false, "ArrowRight": false}
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
        let audio = document.getElementById(id)
        let increment = 0.05;
        let interval = 2000 / (maxVol / increment);
        audio.volume = 0;
        audio.play();
        let fadeAudio = setInterval(() => {
            if (audio.volume < maxVol) {
                audio.volume = Math.min(audio.volume + increment, maxVol);
            } else {
                clearInterval(fadeAudio);
            }
        }, interval);
    }
    static fadoutBgm(id) {
        let audio = document.getElementById(id)
        let increment = 0.05;
        let interval = 1000 / (audio.volume / increment);
        let fadeAudio = setInterval(() => {
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
        var scoreList = Object.keys(localStorage)
        var data = scoreList.map(scoreId => {
            let parsed = JSON.parse(localStorage.getItem(scoreId))
            return {name: parsed.name, level: parsed.level, score: parsed.score}
        })
        data.sort((a, b) => b.score - a.score);
        var rowName = [...document.querySelectorAll('.hs-name')]
        var rowLevel = [...document.querySelectorAll('.hs-level')]
        var rowScore = [...document.querySelectorAll('.hs-score')]
    
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
        'hourglass': {minLvl: 10, chance: 18},
        //'shield': {minLvl: 1, chance: 100},'sword': {minLvl: 1, chance: 100},'bomb': {minLvl: 1, chance: 100},'hourglass': {minLvl: 1, chance: 100},
    }
}

class GameSession {
    constructor() {
        this.floor = document.getElementById('gamespace')
        this.fadeout = document.querySelector('#main .fadeout')
        this.sepia = document.querySelector('.sepia-layer')
        this.score = 0
        this.level = 0
        this.decorations = []
        this.obstacles = []
        this.enemies = []
        this.items = []
        this.timeCount = 0
    }
    startLevel(levelNumber) {
        if (levelNumber > 1) this.updateScore()
        this.createLevel(levelNumber)
        $entrance.animFrame = 0
        $entrance.isClosing = true
        if (levelNumber == 1) Audio.playSound('door',0.5)
        $player.isEntering = true
        $game.fadeout.style.opacity = 0 
    }
    createLevel(levelNumber) {
        if (levelNumber == 1) this.initElements()
        if (levelNumber > 1) {
            this.scrollMap()
            this.setNextExit()
            this.clearPreviousLevel()
        }
        this.createDecorations()
        this.createItems(levelNumber)
        this.createEnemies(levelNumber)
        this.createObstacles()
        this.level = levelNumber
        document.getElementById('lvl').textContent = this.level
    }
    initElements() {
        $entrance = new Entrance()
        $exit = new Exit()
        $player = new Player()
        document.getElementById('score').textContent = 0
        document.getElementById('hpbar').style.width = `96px`
    }
    scrollMap() {
        $entrance.direction = $entrance.reverseDir($exit.direction)
        $entrance.locate($entrance.getX($exit), $entrance.getY($exit))
        $player.locate($entrance.x+5, $entrance.y)
    }
    setNextExit() {
        $exit.direction = $exit.getDirection($entrance.direction)
        var newExitX = $exit.getX($exit.direction)
        var newExitY = $exit.getY($exit.direction)
        $exit.locate(newExitX, newExitY)
        $exit.animFrame = 0
    }
    clearPreviousLevel() {
        for (let obj of this.enemies.concat(this.obstacles, this.decorations, this.items)) obj.removeElement()
        this.decorations = []
        this.obstacles = []
        this.enemies = []
        this.items = []
        let elements = document.querySelectorAll('.enemy'); // failsafe in case some elements remained
        elements.forEach(e => e.remove()); 
    }
    createDecorations() {
        var decorTypes = ['crack','gravel','gravel2']
        for (let decorType of decorTypes) {
            let decorCount = this.randomize(1,5)
            for (let spawned = 0, failed = 0; spawned < decorCount && failed < 100;) {
                let x = this.spawnX(48)
                let y = this.spawnY(48)
                if (!this.isAreaFree(x, y, 48, 48, 0)) {
                    failed++
                    continue
                }
                this.decorations.push(new Decoration(x, y, decorType))
                spawned++
            }
        }
    }
    createItems(levelNumber) {
        let itemList = Object.keys(Data.items).filter(i => Data.items[i].minLvl <= levelNumber)
        for (let item of itemList) {
            if (!this.randomChance(Data.items[item].chance)) continue
            let x = this.spawnX(48)
            let y = this.spawnY(48)
            if (!this.isAreaFreeOfItems(x, y, 48, 48)) continue
            this.items.push(new Item(x, y, item))
        }
    }
    createEnemies(levelNumber) {
        var enemiesCount = 3 + Math.floor(levelNumber / 4) // 1 enemy added every 4 levels (minimum 3)
        for (let spawned = 0, failed = 0; spawned < enemiesCount && failed < 100;) {
            let enemyList = Object.keys(Data.enemies).filter(e => Data.enemies[e].minLvl <= levelNumber)
            let enemyType = enemyList[this.randomize(0, enemyList.length-1)]
            let x = this.spawnX(48)
            let y = this.spawnY(48)
            if (!this.isAreaFree(x, y, 48, 48, 0)) {
                failed++
                continue
            }
            this.enemies.push(new Enemy(x, y, enemyType))
            spawned++
            failed = 0
        }
    }
    createObstacles() {
        var obstacleTypes = ['pillar-H','pillar-broken-H','pillar-broken','rubble','rubble2','hole']
        for (let obstType of obstacleTypes) {
            let obstacleCount = this.randomize(1,3)
            for (let spawned = 0, failed = 0; spawned < obstacleCount && failed < 100;) {
                let x = this.spawnX(48)
                let y = this.spawnY(48)
                if (!this.isAreaFree(x, y, 48, 48, 50)) {
                    failed++
                    continue
                }
                this.obstacles.push(new Obstacle(x, y, obstType))
                spawned++
                failed = 0
            }
        }
    }
    spawnX(w) {
        var max = $game.floor.clientWidth - w
        var min = w
        return this.randomize(min, max)
    }
    spawnY(h) {
        var max = $game.floor.clientHeight - h
        var min = h
        return this.randomize(min, max)
    }
    isAreaFree(x, y, w, h, padding) {
        var objects = this.getAllObjects()
        if (this.isBlockingDoor(x, y, w, h, $entrance) || this.isBlockingDoor(x, y, w, h, $exit)) return false
        return !objects.some(obj => {
            let spacing = obj instanceof Decoration || obj instanceof Item ? 0 : padding
            return y - spacing < obj.y + obj.height 
                && y + h + spacing > obj.y 
                && x - spacing < obj.x + obj.width 
                && x + w + spacing > obj.x
        })
    }
    isAreaFreeOfItems(x, y, w, h) {
        return !this.items.some(obj => {
            return y < obj.y + obj.height 
                && y + h > obj.y 
                && x < obj.x + obj.width 
                && x + w > obj.x
        })
    }
    isBlockingDoor(x, y, w, h, door) {
        let doorPadding = door.getPadding()
        return y < doorPadding.y + doorPadding.height && y + h > doorPadding.y 
            && x < doorPadding.x + doorPadding.width && x + w > doorPadding.x
    }
    randomize(min, max) {
        return (Math.floor(Math.random() * (max - min + 1))) + min
    }
    randomChance(percentage) {
        return Math.random() * 100 < percentage
    }
    update() {
        if (this.timeCount > 0) {
            this.timeCount --
            if (this.timeCount == 0) Item.unfreezeTime()
        }
        for (let enemy of this.enemies) enemy.update()
        for (let item of this.items) item.update()
        $player.update()
        $exit.update()
        $entrance.update()
    }
    getAllObjects() {
        return this.enemies.concat(this.obstacles, this.decorations, this.items, $entrance, $exit, $player)
    }
    removeAll() {
        for (let obj of this.getAllObjects()) obj.removeElement()
    }
    updateScore() {
        var levelScore = 0
        for (let enemy of this.enemies) levelScore += enemy.points
        if (this.doubleScore) {
            levelScore *= 2
            this.doubleScore = false
        }
        this.score += levelScore
        document.getElementById('score').textContent = this.score
    }
    updateHealthBar() {
        var hpbar = document.getElementById('hpbar')
        var percentage = Math.floor($player.health / $player.maxHp * 100)
        var newWidth = Math.floor(96 * percentage / 100)
        hpbar.style.width = `${newWidth}px`
    }
    updateInventory() {
        document.getElementById('inv-shields').textContent = $player.shields
        document.getElementById('inv-swords').textContent = $player.swords
        document.getElementById('inv-bombs').textContent = $player.bombs
    }
}

class GameObject {
    constructor(x, y, width, height, tag) {
        this.x = x
        this.y = y
        this.width = width
        this.height = height
        if (!tag) tag = 'div'
        this.element = document.createElement(tag)
        this.element.style.position = 'absolute'
        this.element.style.width =  `${this.width}px`
        this.element.style.height = `${this.height}px`
        Scene.main.appendChild(this.element)
    }
    move(direction) {
        switch(direction) {
            case 8: this.y -= this.speed ;break
            case 2: this.y += this.speed ;break
            case 4: this.x -= this.speed ;break
            case 6: this.x += this.speed
        }
    }
    locate(x, y) {
        this.x = x
        this.y = y
        this.updatePosition()
        this.updateImage()
    }
    update() {
        this.updatePosition()
        this.updateImage()
    }
    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }
    updateStep() {
        this.stepCount --
        if (this.stepCount == 0) {
            this.stepFrame++
            if (this.stepFrame == 4) this.stepFrame = 0
            this.stepCount = 10
        }
    }
    updateAnimation() {
        this.animCount --
        if (this.animCount == 0) {
            this.animFrame++
            this.animCount = 10
        }
    }
    isCollided(obj) {
        return this.y < obj.y + obj.height && this.y + this.height > obj.y 
            && this.x < obj.x + obj.width && this.x + this.width > obj.x
    }
    wouldCollide(direction, obj) {
        var step = direction == 8 || direction == 4 ? -1 : 1
        var collision = this.y + step < obj.y + obj.height &&
                        this.y + this.height + step > obj.y &&
                        this.x + step < obj.x + obj.width &&
                        this.x + this.width + step > obj.x

            switch(direction) {
                case 8: return collision && this.y > obj.y
                case 2: return collision && this.y < obj.y
                case 4: return collision && this.x > obj.x
                case 6: return collision && this.x < obj.x
            }
    }
    wouldReachBorder(direction) {
        switch(direction) {
            case 8: return this.y - this.speed <= 50 
            case 2: return this.y + this.speed >= $game.floor.clientHeight 
            case 4: return this.x - this.speed <= 50
            case 6: return this.x + this.speed >= $game.floor.clientWidth 
        }
    }
    removeElement() {
        this.element.remove()
    }
    getPadding() {
        let padding = {x: this.x, y: this.y, width: 48, height: 48}
        switch(this.direction) {
            case 8:
                padding.y = this.y - this.height
                padding.width = this.width; break
            case 2: 
                padding.y = this.y + this.height
                padding.width = this.width; break
            case 6:
                padding.x = this.x + this.width
                padding.height = this.height; break
            case 4:
                padding.x = this.x - this.width
                padding.height = this.height; break
        }
        return padding
    }
    reverseDir(direction) {
        switch(direction) {
            case 8: return 2
            case 2: return 8
            case 6: return 4
            case 4: return 6
        }
    }
}

class Player extends GameObject {
    constructor() {
        super($entrance.x + 5, $entrance.y, 48, 48)
        this.element.style.backgroundImage = "url('./spritesheets/player.png')"
        this.direction = 8
        this.speed = 1
        this.stepCount = 10
        this.stepFrame = 0
        this.maxHp = 50
        this.health = this.maxHp
        this.shields = 0
        this.swords = 0
        this.bombs = 0
        this.isExiting = false
        this.isEntering = false
        this.transitionCount = 40
    }
    move(direction) {
        this.direction = direction
        this.updateStep()
        if (!this.canMove(direction)) return
        super.move(direction)
    }
    canMove(direction) {
        if (this.isExiting) return true
        if ($game.obstacles.some(obs => this.wouldCollide(direction, obs))) return false
        if (this.isCollided($entrance) && direction != $entrance.direction) return false
        if (this.wouldReachBorder(direction)) {
            if (this.wouldCollide(direction, $exit)) {
                if (this.isCollided($exit)) return false
                return true
            } 
            return false
        }
        return true
    }
    setImage(fileName) {
        this.element.style.backgroundImage = `url('./spritesheets/${fileName}.png')`
    }
    update() {
        if (this.safeCount > 0) this.safeCount --
        this.updateMove()
        super.update()
        if (this.isExiting) this.updateExitAnimation()
        if (this.isEntering) this.updateEnterAnimation()
    }
    updateMove() {
        if (this.downCount > 0) {
            this.downCount --
            if (this.downCount == 0) {
                this.setImage('player')
                this.safeCount = 60
            }
            return
        }
        if (this.isExiting || this.isEntering) return
        this.updateInput()
    }
    updateInput() {
        for (let keyName in Input.keys) {
            if (Input.isKeyDown(keyName)) {
                let direction
                switch(keyName) {
                    case "ArrowUp": direction = 8; break
                    case "ArrowDown": direction = 2; break
                    case "ArrowLeft": direction = 4; break
                    case "ArrowRight": direction = 6
                }
                this.move(direction)
            }
        }
    }
    updateImage() {
        var step
        switch(this.stepFrame) {
            case 0: step = 0; break
            case 3:
            case 1: step = 96; break
            case 2: step = 48; break
        }
        var dir
        switch(this.direction) {
            case 2: dir = 0; break
            case 4: dir = 144; break
            case 6: dir = 96; break
            case 8: dir = 48; break
        }
        this.element.style.backgroundPosition = `${step}px ${dir}px`
    }
    updateExitAnimation() {
        this.transitionCount --
        this.move(this.reverseDir($exit.direction))
        if (this.transitionCount == 0) {
            this.isExiting = false
            this.transitionCount = 40
            $game.startLevel($game.level + 1)
        }
    }
    updateEnterAnimation() {
        this.transitionCount --
        this.move($entrance.direction)
        if (this.transitionCount == 0) {
            this.isEntering = false
            this.transitionCount = 40
            $game.isPaused = false
        }
    }
    takeDamage(damage) {
        if (this.isDurable) damage /= 2
        this.health -= damage
        $game.updateHealthBar()
        Audio.playSound('hurt'+ $game.randomize(1,2))
        $player.setImage('player-down')
        $player.downCount = 60
        let damageOverlay = document.createElement('img');
        damageOverlay.src = './images/damage-overlay.png'
        damageOverlay.classList.add('damage');
        this.element.appendChild(damageOverlay);
        setTimeout(() => {damageOverlay.remove();}, 1000);
        if (this.health <= 0) Scene.endGame()
    }
    collectItem(item) {
        if (item.element.classList.contains('item-collected')) return
        Audio.playSound('collect',0.5)
        switch(item.itemType) {
            case 'shield': this.shields ++; break
            case 'sword': this.swords ++; break
            case 'bomb': this.bombs ++; break
        }
        item.element.classList.add('item-collected')
        item.element.style.opacity = 0
        setTimeout(() => {item.remove()}, 500)
        $game.updateInventory()
    }
    parry() {
        Audio.playSound('shield')
        this.shields --
        this.useItem('shield')
        this.safeCount = 60
        $game.updateInventory()
    }
    slash() {
        Audio.playSound('sword')
        this.swords --
        this.useItem('sword')
        $game.updateInventory()
    }
    detonate() {
        Audio.playSound('bomb')
        this.bombs --
        this.useItem('bomb')
        var bombArea = {x: this.x - 48, y: this.y - 48, width: this.width + 48*2, height: this.height + 48*2}
        var affectedMonsters = $game.enemies.filter(e => e.isCollided(bombArea))
        for (let e of affectedMonsters) e.die()
        $game.updateInventory()
    }
    useItem(itemType) {
        let itemUsed = document.createElement('img');
        itemUsed.src = `./images/${itemType}.png`
        itemUsed.classList.add('item-used');
        this.element.appendChild(itemUsed);
        setTimeout(() => {itemUsed.remove();}, 1000);
    }
}

class Enemy extends GameObject {
    constructor(x, y, fileName) {
        super(x, y, 48, 48)
        this.element.style.backgroundImage = `url('./spritesheets/${fileName}.png')`
        this.element.classList.add('enemy')
        var data = Data.enemies[fileName]
        this.power = $game.randomize(data.minPower, data.maxPower) + Math.floor($game.level / 5) // increase base damage every 5 levels
        this.points = data.points
        this.speed = 1
        this.direction = $game.randomize(1, 4) * 2 
        this.stepCount = 10
        this.stepFrame = 0
        this.dirChangeInterval = $game.randomize(1, 3) * 60 // 1-3 sec
        this.dirChangeCount = this.dirChangeInterval
        this.stuckCount = 0
    }
    move(direction) {
        if ($game.timeCount > 0) return // time frozen
        this.direction = direction
        this.updateStep()
        if (!this.canMove(direction)) return
        super.move(direction)
    }
    canMove(direction) {
        var objects = $game.obstacles.concat($entrance,$exit)
        if (objects.some(obj => this.wouldCollide(direction, obj))) {
            this.setDirection()
            return false
        }
        if (this.wouldReachBorder(direction)) {
            this.setDirection()
            return false
        }
        var enemies = [...$game.enemies]
        var ownIndex = enemies.indexOf(this)
        enemies.splice(ownIndex, 1)
        if (enemies.some(e => this.wouldCollide(direction, e))) {
            if (this.phaseCount > 0) return true
            this.setDirection()
            this.stuckCount ++
            return false
        }
        return true
    }
    setDirection(direction) {
        this.direction = direction || $game.randomize(1, 4) * 2
        this.dirChangeCount = this.dirChangeInterval
    }
    update() {
        if (this.isDying) return
        if (this.stuckCount == 100) {
            this.phaseCount = 60
            this.stuckCount = 0
        }
        if (this.phaseCount > 0) this.phaseCount --
        this.updateDirection()
        this.move(this.direction)
        super.update()
        if (this.isCollided($player)) this.attack()
    }
    updateDirection() {
        if ($game.timeCount > 0) return // time frozen
        this.dirChangeCount --
        if (this.dirChangeCount == 0) this.setDirection()
    }
    attack() {
        if ($player.downCount > 0) return
        if ($player.safeCount > 0) return
        if ($player.isExiting) return
        if ($player.isEntering) return
        if ($player.shields > 0) {
            $player.parry()
            this.setDirection(this.reverseDir(this.direction))
            return
        }
        if ($player.swords > 0) {
            $player.slash()
            this.die()
            return
        }
        if ($player.bombs > 0) {
            $player.detonate()
            return
        }
        $player.takeDamage(this.power)
        $player.speed = 12
        $player.move(this.direction)
        $player.speed = $player.isFast ? 2 : 1
        this.setDirection(this.reverseDir(this.direction))
        this.points = 0
    }
    die() {
        this.isDying = true
        setTimeout(()=>{
            Audio.playSound('enemyhurt')
            this.element.classList.add('dying')
            setTimeout(()=>{this.remove()},1000)
        },500)
    }
    remove() {
        this.removeElement()
        var index = $game.enemies.indexOf(this)
        if (index != -1) $game.enemies.splice(index, 1)
    }
    updateImage() {
        var step
        switch(this.stepFrame) {
            case 0: step = 0; break
            case 3:
            case 1: step = 96; break
            case 2: step = 48; break
        }
        var dir
        switch(this.direction) {
            case 2: dir = 0; break
            case 4: dir = 144; break
            case 6: dir = 96; break
            case 8: dir = 48; break
        }
        this.element.style.backgroundPosition = `${step}px ${dir}px`
    }
}

class Entrance extends GameObject {
    constructor() {
        super($game.floor.clientWidth / 2 + 25, $game.floor.clientHeight + 40, 60, 60)
        this.direction = 8 // initial entrance on the bottom center
        this.element.style.backgroundImage = "url('./spritesheets/entrance.png')"
        this.isClosing = false
        this.animFrame = 0
        this.animCount = 10
    }
    getX(exit) {
        var direction = this.reverseDir(exit.direction)
        switch(direction) {
            case 6: return 0
            case 4: return Scene.main.clientWidth - this.width
            case 8:
            case 2: return exit.x
        }
    }
    getY(exit) {
        var direction = this.reverseDir(exit.direction)
        switch(direction) {
            case 2: return 0
            case 8: return Scene.main.clientHeight - this.height
            case 6: 
            case 4: return exit.y
        }
    }
    update() {
        super.update()
        this.updateAnimation()
    }
    updateAnimation() {
        if (!this.isClosing) return
        super.updateAnimation()
        if (this.animFrame == 4) {
            this.isClosing = false
        }
    }
    updateImage() {
        var frame
        switch(this.animFrame) {
            case 0: frame = 60; break
            case 1: frame = 120; break
            case 2: frame = 180; break
            case 3: frame = 0; break
        }
        var dir
        switch(this.direction) {
            case 2: dir = 0; break
            case 4: dir = 180; break
            case 6: dir = 120; break
            case 8: dir = 60; break
        }
        this.element.style.backgroundPosition = `${frame}px ${dir}px`
    }
}

class Exit extends GameObject {
    constructor() {
        super(0, 0, 60, 60)
        this.direction = this.getDirection(8)
        this.x = this.getX(this.direction)
        this.y = this.getY(this.direction)
        this.element.style.backgroundImage = "url('./spritesheets/exit.png')"
        this.isOpening = false
        this.animFrame = 0
        this.animCount = 10
    }
    getDirection(entranceDir) {
        var options
        switch(entranceDir) {
            case 8: options = [2,4,6]; break
            case 2: options = [8,4,6]; break
            case 6: options = [2,8,4]; break
            case 4: options = [2,8,6]; break
        }
        return options[Math.floor((Math.random() * 3))]
    }
    getX(direction) {
        switch(direction) {
            case 6: return 0
            case 4: return Scene.main.clientWidth - this.width
            case 8:
            case 2: 
                var max = Scene.main.clientWidth - this.width*3.5
                var min = this.width*2.5
                return $game.randomize(min, max)
        }
    }
    getY(direction) {
        switch(direction) {
            case 2: return 0
            case 8: return Scene.main.clientHeight - this.height
            case 6:
            case 4: 
                var max = Scene.main.clientHeight - this.height*3.5
                var min = this.height*2.5
                return $game.randomize(min, max)
        }
    }
    update() {
        if (this.canOpen()) this.open()
        super.update()
        this.updateAnimation()
    }
    canOpen() {
        if (!$player) return
        if (!this.isCollided($player)) return false
        switch(this.direction) {
            case 8: case 2: 
                if ($player.x < this.x || $player.x + $player.width > this.x + this.width) return false; break
            case 6: case 4: 
                if ($player.y < this.y || $player.y + $player.height > this.y + this.height) return false
        }
        if ($player.direction != this.reverseDir(this.direction)) return false
        return true
    }
    updateAnimation() {
        if (!this.isOpening) return
        super.updateAnimation()
        if (this.animFrame == 4) {
            this.isOpening = false
        }
    }
    updateImage() {
        var frame
        switch(this.animFrame) {
            case 0: frame = 0; break
            case 1: frame = 180; break
            case 2: frame = 120; break
            case 3: frame = 60; break
        }
        var dir
        switch(this.direction) {
            case 2: dir = 0; break
            case 4: dir = 180; break
            case 6: dir = 120; break
            case 8: dir = 60; break
        }
        this.element.style.backgroundPosition = `${frame}px ${dir}px`
    }
    open() {
        if ($game.isPaused) return
        this.isOpening = true
        Audio.playSound('door',0.5)
        $player.isExiting = true
        $player.isFast = false // in case player got green potion
        $player.speed = 1 
        $player.isDurable = false // in case player got blue potion
        Item.unfreezeTime()// unfreeze time
        $game.fadeout.style.opacity = 1 
        $game.isPaused = true
    }
}

class Item extends GameObject {
    constructor(x, y, fileName) {
        super(x, y, 48, 48)
        this.element.style.backgroundImage = `url('./images/${fileName}.png')`
        this.element.style.zIndex = 800
        this.itemType = fileName
        this.element.classList.add('float')
        this.updatePosition()
    }
    update() {
        if ($player.downCount > 0) return
        if ($player.isExiting) return
        if ($player.isEntering) return
        if (!this.isCollided($player)) return
        if (['shield','sword','bomb'].includes(this.itemType)) $player.collectItem(this)
        else this.applyEffect()
    }
    isCollided(obj) {
        var realX = this.x + 8
        var realY = this.y + 8
        var realWidth = 32
        var realHeight = 32
        return realY < obj.y + obj.height && realY + realHeight > obj.y 
            && realX < obj.x + obj.width && realX + realWidth > obj.x
    }
    applyEffect() {
        if (this.element.classList.contains('item-collected')) return
        switch(this.itemType) {
            case 'potion-red': // heal 10 hp
                if ($player.health == $player.maxHp) return
                Audio.playSound('heal')
                $player.health += 10
                if ($player.health > $player.maxHp) $player.health = $player.maxHp
                $game.updateHealthBar(); break
            case 'potion-green': // double speed
                Audio.playSound('speed')
                $player.isFast = true
                $player.speed = 2; break
            case 'potion-blue': // halve damage
                Audio.playSound('durable')
                $player.isDurable = true; break
            case 'potion-yellow': // double score
                Audio.playSound('bonus')
                $game.doubleScore = true; break
            case 'hourglass': // freeze time for 10 seconds
                this.freezeTime(); break
        }
        this.element.classList.add('item-collected')
        this.element.style.opacity = 0
        setTimeout(() => {this.remove()}, 500)
    }
    freezeTime() {
        Audio.playSound('time',0.5)
        $game.sepia.style.top = `${this.y}px`
        $game.sepia.style.left = `${this.x}px`
        $game.sepia.classList.add('freeze-time');
        for (let item of $game.items) item.element.classList.remove('float')
        $game.timeCount = 430
    }
    static unfreezeTime() {
        $game.timeCount = 0
        $game.sepia.classList.remove('freeze-time')
        for (let item of $game.items) item.element.classList.add('float')
    }
    remove() {
        this.removeElement()
        var index = $game.items.indexOf(this)
        if (index != -1) $game.items.splice(index, 1)
    }
}

class Obstacle extends GameObject {
    constructor(x, y, fileName) {
        super(x, y, 48, 48)
        this.element.style.backgroundImage = `url('./images/${fileName}.png')`
        if (fileName.includes('-H')) { // 48x96 pixels
            this.element.style.backgroundPosition = `0px 48px`
            this.img = document.createElement('div')
            this.img.style.backgroundImage = `url('./images/${fileName}.png')`
            this.img.style.width = '48px'
            this.img.style.height = '48px'
            this.img.style.position = 'absolute'
            this.img.style.top = '-100%'
            this.img.style.zIndex = 900
            this.element.appendChild(this.img)
        }
        this.updatePosition()
    }
    remove() {
        this.removeElement()
        var index = $game.obstacles.indexOf(this)
        if (index != -1) $game.obstacles.splice(index, 1)
    }
}

class Decoration extends GameObject {
    constructor(x, y, fileName) {
        super(x, y, 48, 48)
        this.element.style.backgroundImage = `url('./images/${fileName}.png')`
        this.element.style.zIndex = -1
        this.updatePosition()
    }
}