var mainScene, startScene, gameoverScene, gameSpace
var $scene = null // reference to current scene displayed on screen
var $game, $player, $entrance, $exit = null // reference to current instances of each class in the game session
const KEYS = {"ArrowUp": false, "ArrowDown": false, "ArrowLeft": false, "ArrowRight": false}

window.onload = function() {
    mainScene = document.getElementById('main')
    startScene = document.getElementById('start')
    gameoverScene = document.getElementById('gameover')
    gameSpace = document.getElementById('gamespace')
    setupListeners()
    switchScene(startScene)
}

function setupListeners() {
    document.getElementById('btn-start').addEventListener('click', () =>
        newGame()
    )
    document.getElementById('btn-restart').addEventListener('click', () =>
        newGame()
    )
    window.addEventListener("keydown", () => {
        event.preventDefault()
        KEYS[event.key] = true
    })
    window.addEventListener("keyup", () => {
        event.preventDefault()
        KEYS[event.key] = false
    })
}

function switchScene(newScene) {
    if (!$scene) $scene = newScene
    $scene.style.display = 'none'
    newScene.style.display = 'block'
    $scene = newScene
}

function newGame() {
    switchScene(mainScene)
    $game = new GameSession()
    $game.createLevel(1)
    $game.interval = setInterval(gameTick, 17)
}

function endGame() {
    clearInterval($game.interval)
    $game.removeAll()
    switchScene(gameoverScene)
    document.getElementById('final-score').textContent = $game.score
}

function gameTick() {
    $game.update()
    for (let enemy of $game.enemies) enemy.update()
    $player.update()
    $exit.update()
    $entrance.update()
}

function reverseDir(direction) {
    switch(direction) {
        case 8: return 2
        case 2: return 8
        case 6: return 4
        case 4: return 6
    }
}

function randomize(min, max) {
    return (Math.floor(Math.random() * (max - min + 1))) + min
}

class GameSession {
    constructor() {
        this.score = 0
        this.level = 0
        this.isLevelClear = false
        this.enemyCountInterval = 3
        this.obstacles = []
        this.enemies = []
    }
    createLevel(levelNumber) {
        if (levelNumber == 1) {
            $entrance = new Entrance()
            $exit = new Exit()
            $player = new Player()
        }
        if (levelNumber > 1) {
            this.scrollMap()
            this.setNextExit()
            for (let obstacle of this.obstacles) obstacle.remove()
            for (let enemy of this.enemies) enemy.remove()
        }
        this.createEnemies(levelNumber)
        this.createObstacles()
        if (levelNumber > 1) {
            $entrance.animFrame = 0
            $entrance.isClosing = true
            $player.isEntering = true
        }
        this.level = levelNumber
        document.getElementById('lvl').textContent = this.level
    }
    scrollMap() {
        $entrance.direction = reverseDir($exit.direction)
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
    createEnemies(levelNumber) {
        var enemiesCount = Math.floor(levelNumber / this.enemyCountInterval) // 1 enemy added every X levels
        if (enemiesCount == 0) enemiesCount = 1 // default to 1
        while (this.enemies.length < enemiesCount) {
            let x = this.spawnX(48)
            let y = this.spawnY(48)
            if (!this.isAreaFree(x, y, 48, 48, 0)) continue
            this.enemies.push(new Enemy(x, y))
        }
    }
    createObstacles() {
        var obstacleTypes = ['pillar-H','pillar-broken-H','pillar-broken','rubble','hole']
        for (let obstType of obstacleTypes) {
            let obstacleCount = randomize(1,3)
            for (let i = 0; i < obstacleCount; i++) {
                let x = this.spawnX(48)
                let y = this.spawnY(48)
                if (!this.isAreaFree(x, y, 48, 48, 48)) continue
                this.obstacles.push(new Obstacle(x, y, obstType))
            }
        }
    }
    spawnX(w) {
        var max = gameSpace.clientWidth - w
        var min = w
        return randomize(min, max)
    }
    spawnY(h) {
        var max = gameSpace.clientHeight - h
        var min = h
        return randomize(min, max)
    }
    isAreaFree(x, y, w, h, padding) {
        var objects = this.getAllObjects()
        return !objects.some(obj => {
            return y - padding < obj.y + obj.height 
                && y + h + padding > obj.y 
                && x - padding < obj.x + obj.width 
                && x + w + padding > obj.x
        })
    }
    update() {
        document.getElementById('enemies').textContent = this.enemies.length
    }
    nextLevel() {
        this.updateScore()
        this.createLevel(this.level + 1)
    }
    getAllObjects() {
        var objects = this.enemies.concat(this.obstacles)
        objects.push($entrance)
        objects.push($exit)
        objects.push($player)
        return objects
    }
    removeAll() {
        for (let obj of this.getAllObjects()) obj.remove()
    }
    updateScore() {
        this.score += this.enemies.length * this.level
        document.getElementById('score').textContent = this.score
    }
    isKeyDown(keyName) {
        return KEYS[keyName]
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
        mainScene.appendChild(this.element)
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
            this.stepCount = 5
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
        var step = direction == 8 || direction == 4 ? - 1 : 1
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
            case 2: return this.y + this.speed >= gameSpace.clientHeight 
            case 4: return this.x - this.speed <= 50
            case 6: return this.x + this.speed >= gameSpace.clientWidth 
        }
    }
    remove() {
        this.element.remove()
    }
}

class Player extends GameObject {
    constructor() {
        super($entrance.x + 5, $entrance.y, 48, 48)
        this.element.style.backgroundImage = "url('./assets/player.png')"
        this.element.style.width =  `${this.width}px`
        this.element.style.height = `${this.height}px`
        this.direction = 8
        this.speed = 1
        this.stepCount = 5
        this.stepFrame = 0
        this.health = 5
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
    loseHealth(damage) {
        this.health -= damage
        document.getElementById('hp').textContent = $player.health
        if (this.health <= 0) endGame()
    }
    update() {
        this.updateInput()
        super.update()
        if (this.isExiting) this.updateExit()
        if (this.isEntering) this.updateEnter()
    }
    updateInput() {
        if (this.isExiting || this.isEntering) return
        for (let keyName in KEYS) {
            if ($game.isKeyDown(keyName)) {
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
    updateExit() {
        this.transitionCount --
        $exit.fadeoutOpacity += 0.025
        $exit.fadeout.style.opacity = `${$exit.fadeoutOpacity}`
        this.move(reverseDir($exit.direction))
        if (this.transitionCount == 0) {
            this.isExiting = false
            this.transitionCount = 40
            $game.nextLevel()
        }
    }
    updateEnter() {
        this.transitionCount --
        $exit.fadeoutOpacity -= 0.025
        $exit.fadeout.style.opacity = `${$exit.fadeoutOpacity}`
        this.move($entrance.direction)
        if (this.transitionCount == 0) {
            this.isEntering = false
            this.transitionCount = 40
            $exit.fadeout.remove()
            $game.isPaused = false
        }
    }
}

class Enemy extends GameObject {
    constructor(x, y) {
        super(x, y, 48, 48)
        this.element.style.backgroundImage = "url('./assets/enemy.png')"
        this.element.style.width =  `${this.width}px`
        this.element.style.height = `${this.height}px`
        this.damage = 1
        this.speed = 1
        this.direction = randomize(1, 4) * 2 
        this.stepCount = 5
        this.stepFrame = 0
        this.dirChangeInterval = randomize(1, 3) * 60 // 1-3 sec
        this.framesTilDirChange = this.dirChangeInterval
    }
    move(direction) {
        this.direction = direction
        this.updateStep()
        if (!this.canMove(direction)) return
        super.move(direction)
    }
    canMove(direction) {
        var objects = $game.enemies.concat($game.obstacles)
        var ownIndex = objects.indexOf(this)
        objects.splice(ownIndex, 1)
        objects.push($entrance)
        objects.push($exit)
        if (objects.some(obj => this.wouldCollide(direction, obj))) {
            this.changeDirection()
            return false
        }
        if (this.wouldReachBorder(direction)) {
            this.changeDirection()
            return false
        }
        return true
    }
    changeDirection() {
        this.framesTilDirChange = this.dirChangeInterval
        this.direction = randomize(1, 4) * 2
    }
    update() {
        this.updateDirection()
        this.move(this.direction)
        super.update()
        if (this.isCollided($player)) this.attack()
    }
    updateDirection() {
        this.framesTilDirChange --
        if (this.framesTilDirChange == 0) this.changeDirection()
    }
    attack() {
        $player.loseHealth(this.damage)
        this.remove()
        
    }
    remove() {
        super.remove()
        var index = $game.enemies.indexOf(this)
        $game.enemies.splice(index, 1)
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
        super(gameSpace.clientWidth / 2 + 25, gameSpace.clientHeight + 40, 60, 60)
        this.direction = 8 // initial entrance on the bottom center
        this.element.style.backgroundImage = "url('./assets/entrance.png')"
        this.element.style.width =  `${this.width}px`
        this.element.style.height = `${this.height}px`
        this.isClosing = false
        this.animFrame = 0
        this.animCount = 10
    }
    getX(exit) {
        var direction = reverseDir(exit.direction)
        switch(direction) {
            case 6: return 0
            case 4: return mainScene.clientWidth - this.width
            case 8:
            case 2: return exit.x
        }
    }
    getY(exit) {
        var direction = reverseDir(exit.direction)
        switch(direction) {
            case 2: return 0
            case 8: return mainScene.clientHeight - this.height
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
        this.element.style.backgroundImage = "url('./assets/exit.png')"
        this.element.style.width =  `${this.width}px`
        this.element.style.height = `${this.height}px`
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
            case 4: return mainScene.clientWidth - this.width
            case 8:
            case 2: 
                var max = mainScene.clientWidth - this.width*3
                var min = this.width*2
                return randomize(min, max)
        }
    }
    getY(direction) {
        switch(direction) {
            case 2: return 0
            case 8: return mainScene.clientHeight - this.height
            case 6:
            case 4: 
                var max = mainScene.clientHeight - this.height*3
                var min = this.height*2
                return randomize(min, max)
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
        if ($player.direction != reverseDir(this.direction)) return false
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
        $player.isExiting = true
        this.startTransition()
        $game.isPaused = true
    }
    startTransition() {
        this.fadeout = document.createElement('div')
        this.fadeoutOpacity = 0
        mainScene.appendChild(this.fadeout)
        this.fadeout.style.backgroundColor = 'black'
        this.fadeout.style.opacity = 0
        this.fadeout.style.width = '760px'
        this.fadeout.style.height = '670px'
        this.fadeout.style.position = 'absolute'
        this.fadeout.style.top = 0
        this.fadeout.style.left = 0
        this.fadeout.style.zIndex = '9999'
    }
}

class Obstacle extends GameObject {
    constructor(x, y, fileName) {
        super(x, y, 48, 48)
        this.element.style.width =  `${this.width}px`
        this.element.style.height = `${this.height}px`
        if (fileName.includes('-H')) { // 48x96 pixels
            this.img = document.createElement('img')
            this.img.src = `./assets/${fileName}.png`
            this.img.width = 48
            this.img.height = 96
            this.img.style.maxHeight = '200%'
            this.img.style.position = 'absolute'
            this.img.style.top = '-100%'
            this.element.appendChild(this.img)
        } else { // 48x48 pixels
            this.element.style.backgroundImage = `url('./assets/${fileName}.png')`
        }
        this.updatePosition()
    }
    remove() {
        super.remove()
        var index = $game.obstacles.indexOf(this)
        $game.obstacles.splice(index, 1)
    }
}