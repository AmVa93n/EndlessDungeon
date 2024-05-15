var mainScene, startScene, gameoverScene, gameSpace
var $scene = null // reference to current scene displayed on screen
var $game = null // reference to current GameSession instance
var $player = null // reference to current Player instance

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
        let direction
        switch(event.key) {
            case "ArrowUp": direction = 8; break
            case "ArrowDown": direction = 2; break
            case "ArrowLeft": direction = 4; break
            case "ArrowRight": direction = 6
        }
        $player.move(direction)
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
    $player = new Player()
    $game.interval = setInterval(gameTick, 17)
}

function gameEnd() {
    clearInterval($game.interval)
    for (let img of [...mainScene.querySelectorAll('img')]) img.remove()
    switchScene(gameoverScene)
    document.getElementById('final-score').textContent = $game.score
}

function gameTick() {
    $game.update()
    for (let enemy of $game.enemies) enemy.update()
    $player.update()
}

function reverseDir(direction) {
    switch(direction) {
        case 8: return 2
        case 2: return 8
        case 6: return 4
        case 4: return 6
    }
}

class GameSession {
    constructor() {
        this.score = 0
        this.level = 0
        this.enemyCountInterval = 1
        this.entrance = new Entrance()
        this.exit = new Exit()
        this.createLevel(1)
    }
    createLevel(levelNumber) {
        if (levelNumber > 1) {
            this.scrollMap()
            this.setNextExit()
        }
        this.createEnemies(levelNumber)
        this.level = levelNumber
        document.getElementById('lvl').textContent = this.level
    }
    scrollMap() {
        this.entrance.direction = reverseDir(this.exit.direction)
        var newEntranceX = this.entrance.getX(this.exit)
        var newEntranceY = this.entrance.getY(this.exit)
        this.entrance.locate(newEntranceX, newEntranceY)
        $player.locate(this.entrance.x, this.entrance.y)
    }
    setNextExit() {
        this.exit.direction = this.exit.getDirection(this.entrance.direction)
        var newExitX = this.exit.getX(this.exit.direction)
        var newExitY = this.exit.getY(this.exit.direction)
        this.exit.locate(newExitX, newExitY)
    }
    createEnemies(levelNumber) {
        var enemiesCount = Math.floor(levelNumber / this.enemyCountInterval) // 1 enemy added every X levels
        if (enemiesCount == 0) enemiesCount = 1 // default to 1
        this.enemies = []
        for (let i = 0; i < enemiesCount;) {
            var newEnemy = new Enemy()
            //if (this.enemies.some(e => newEnemy.isCollided(e))) {
            //    newEnemy.element.remove()
            //    continue
            //}
            this.enemies.push(newEnemy)
            i++
        }
    }
    update() {
        document.getElementById('enemies').textContent = this.enemies.length
        document.getElementById('hp').textContent = $player.health
        document.getElementById('score').textContent = this.score
        if (this.isLevelCleared()) {
            this.score += this.enemies.length * this.level
            for (let enemy of this.enemies) enemy.element.remove()
            this.createLevel(this.level + 1)
        }
    }
    isLevelCleared() {
        return this.exit.isCollided($player)
    }
}

class GameObject {
    constructor() {
        this.element = document.createElement("img")
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
    }
    update() {
        this.updatePosition()
    }
    updatePosition() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }
    wouldCollide(direction, obj) {
        var step = direction == 8 || direction == 4 ? - this.speed : this.speed
        return this.y + step < obj.y + obj.height &&
            this.y + this.height + step > obj.y &&
            this.x + step < obj.x + obj.width &&
            this.x + this.width  + step > obj.x
    }
    isCollided(obj) {
        var thisRect = this.element.getBoundingClientRect();
        var objRect = obj.element.getBoundingClientRect();
        return thisRect.left < objRect.right && thisRect.right > objRect.left &&
        thisRect.top < objRect.bottom && thisRect.bottom > objRect.top
    }
    wouldCollideWithFrame(direction) {
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
        super()
        this.width = 50
        this.height = 50
        this.speed = 10
        this.x = $game.entrance.x
        this.y = $game.entrance.y
        this.element.src = './assets/player.png'
        this.health = 5
    }
    move(direction) {
        if (this.isCollided($game.entrance) && direction != $game.entrance.direction) return
        if (this.wouldCollideWithFrame(direction) && !this.wouldCollide(direction, $game.exit)) return
        super.move(direction)
    }
    loseHealth(damage) {
        this.health -= damage
        if (this.health <= 0) gameEnd()
    }
}

class Enemy extends GameObject {
    constructor() {
        super()
        this.width = 50
        this.height = 50
        this.x = this.startX()
        this.y = this.startY()
        this.element.src = './assets/enemy.png'
        this.damage = 1
        this.speed = 1
        this.direction = (Math.floor(Math.random() * 4) + 1) * 2
        this.dirChangeInterval = (Math.floor(Math.random() * 3) + 1) * 60 // 1-3 sec
        this.framesTilDirChange = this.dirChangeInterval
    }
    move(direction) {
        var objects = [...$game.enemies]
        var ownIndex = objects.indexOf(this)
        objects.splice(ownIndex, 1)
        objects.push($game.entrance)
        objects.push($game.exit)
        if (objects.some(obj => this.wouldCollide(direction, obj))) {
            this.changeDirection()
            return
        }
        if (this.wouldCollideWithFrame(direction)) {
            this.changeDirection()
            return
        }
        super.move(direction)
    }
    changeDirection() {
        this.framesTilDirChange = this.dirChangeInterval
        this.direction = (Math.floor(Math.random() * 4) + 1) * 2
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
    startX() {
        return (Math.floor(Math.random() * (gameSpace.clientWidth - this.width))) + this.width
    }
    startY() {
        return (Math.floor(Math.random() * (gameSpace.clientHeight - this.height))) + this.height
    }
}

class Entrance extends GameObject {
    constructor() {
        super()
        this.width = 50
        this.height = 50
        this.direction = 8 // initial entrance on the bottom center
        this.x = gameSpace.clientWidth / 2 + 25
        this.y = gameSpace.clientHeight + 52
        this.element.src = './assets/entrance.png'
        this.updatePosition()
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
}

class Exit extends GameObject {
    constructor() {
        super()
        this.width = 50
        this.height = 50
        this.element.src = './assets/exit.png'
        this.direction = this.getDirection(8)
        this.x = this.getX(this.direction)
        this.y = this.getY(this.direction)
        this.updatePosition()
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
                return Math.floor(Math.random() * (max - min + 1)) + min
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
                return Math.floor(Math.random() * (max - min + 1)) + min
        }
    }
}