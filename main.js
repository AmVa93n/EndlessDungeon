var mainScene, startScene, gameoverScene
var $scene = null // current scene displayed on screen
var $game = null // current game instance
var $player = null // current player instance

window.onload = function() {
    mainScene = document.getElementById('main')
    startScene = document.getElementById('start')
    gameoverScene = document.getElementById('gameover')
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
            case "ArrowUp": direction = 8
            case "ArrowDown": direction = 2
            case "ArrowLeft": direction = 4
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
    $game = new Game()
    $player = new Player()
    $game.interval = setInterval(gameTick(),17)
    switchScene(mainScene)
}

function gameEnd() {
    clearInterval($game.interval)
    switchScene(gameoverScene)
}

function gameTick() {
    $game.update()
}

class Game {
    constructor() {
        this.score = 0
        this.level = 0
        this.enemies = []
    }
    update() {
        for (let enemy of this.enemies) enemy.update()
    }
    createLevel(levelNumber) {
        this.createExit()
        var multiplier = Math.floor(levelNumber / 5)
        var enemiesNumber = Math.floor(Math.random() * multiplier) + 1
        for (let i = 0; i < enemiesNumber; i++) {
            this.createEnemy()
        }
    }
    createExit() {
        this.exit = document.createElement("img")
        this.exit.src = './assets/exit.png'
        mainScene.appendChild(this.exit)
    }
    createEnemy() {
        this.enemies.push(new Enemy())
    }
}

class Player {
    constructor(initialX, initialY) {
        this.x = initialX
        this.y = initialY
        this.element = document.createElement("img")
        this.element.src = './assets/player.png'
        mainScene.appendChild(this.element)
        this.health = 10
        this.render()
    }
    move(direction) {
        switch(direction) {
            case 8: this.y -- ;break
            case 2: this.y ++ ;break
            case 4: this.x -- ;break
            case 6: this.x ++
        }
        this.render()
    }
    teleport(x, y) {
        this.x = x
        this.y = y
        this.render()
    }
    render() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }
    loseHealth(damage) {
        this.health -= damage
        if (this.health <= 0) gameEnd()
    }
}

class Enemy {
    constructor(initialX, initialY) {
        this.x = initialX
        this.y = initialY
        this.element = document.createElement("img")
        this.element.src = './assets/enemy.png'
        mainScene.appendChild(this.element)
        this.damage = 1
    }
    update() {
        var direction = (Math.floor(Math.random() * 4) + 1) * 2
        this.move(direction)
        this.render()
        if (this.isCollided()) this.attack()
    }
    move(direction) {
        switch(direction) {
            case 8: this.y -- ;break
            case 2: this.y ++ ;break
            case 4: this.x -- ;break
            case 6: this.x ++
        }
    }
    isCollided() {
        var playerRect = $player.element.getBoundingClientRect();
        var enemyRect = this.element.getBoundingClientRect();
        return playerRect.left < enemyRect.right && playerRect.right > enemyRect.left &&
        playerRect.top < enemyRect.bottom && playerRect.bottom > enemyRect.top
    }
    attack() {
        $player.loseHealth(this.damage)
    }
}