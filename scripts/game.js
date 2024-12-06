class GameSession {
    constructor() {
        this.floor = document.getElementById('floor')
        this.fadeout = document.querySelector('#main .fadeout')
        this.sepia = document.querySelector('.sepia-layer')
        this.score = 0
        this.level = 0
        this.traps = []
        this.decorations = []
        this.obstacles = []
        this.enemies = []
        this.items = []
        this.shotArrows = []
        this.timeCount = 0
    }

    startLevel(levelNumber) {
        if (levelNumber > 1) {
            this.updateScore()
            this.resetBonuses()
        }
        this.createLevel(levelNumber)
        $entrance.animFrame = 0
        $entrance.isClosing = true
        if (levelNumber == 1) Audio.playSound('door',0.5)
        $player.isEntering = true
        $game.fadeout.style.opacity = 0 
    }

    createLevel(levelNumber) {
        this.floor.style.backgroundImage = `url(./textures/floor-texture${this.randomize(1,10)}.png)`
        if (levelNumber == 1) this.initElements()
        if (levelNumber > 1) {
            this.scrollMap()
            this.setNextExit()
            this.clearPreviousLevel()
        }
        this.createTraps()
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
        $chest = new Chest()
        document.getElementById('score').textContent = 0
        document.getElementById('hpbar-content').style.width = `100%`
        this.updateBonuses()
        this.updateInventory()
        this.updatePriority()
    }

    scrollMap() {
        $entrance.direction = $entrance.reverseDir($exit.direction)
        $entrance.locate($entrance.getX($exit), $entrance.getY($exit))
        $player.locate($entrance.x+5, $entrance.y)
    }

    setNextExit() {
        $exit.direction = $exit.getDirection($entrance.direction)
        const newExitX = $exit.getX($exit.direction)
        const newExitY = $exit.getY($exit.direction)
        $exit.locate(newExitX, newExitY)
        $exit.animFrame = 0
        let chestRelocated = false
        while (!chestRelocated) {
            const x = $chest.getX($exit.direction)
            const y = $chest.getY($exit.direction)
            if (this.isBlockingDoor(x, y, 48, 48, $entrance) || this.isBlockingDoor(x, y, 48, 48, $exit)) continue
            $chest.locate(x, y)
            $chest.animFrame = 0
            chestRelocated = true
        }
    }

    clearPreviousLevel() {
        for (let obj of this.enemies.concat(this.obstacles, this.decorations, this.items, this.traps)) obj.removeElement()
        this.decorations = []
        this.obstacles = []
        this.enemies = []
        this.items = []
        this.traps = []
        const elements = document.querySelectorAll('.enemy'); // failsafe in case some elements remained
        elements.forEach(e => e.remove()); 
    }

    createTraps() {
        const trapCount = this.randomize(2,3)
        while (this.traps.length < trapCount) {
            const x = this.spawnX(48)
            const y = this.spawnY(48)
            if (!this.isAreaFree(x, y, 48, 48, 0)) continue
            this.traps.push(new Trap(x, y))
        }
    }

    createDecorations() {
        const decorTypes = ['crack','gravel','gravel2']
        for (let decorType of decorTypes) {
            const decorCount = this.randomize(1,5)
            for (let spawned = 0, failed = 0; spawned < decorCount && failed < 100;) {
                const x = this.spawnX(48)
                const y = this.spawnY(48)
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
        let keySpawned = false
        while (!keySpawned) {
            const keyX = this.spawnX(48)
            const keyY = this.spawnY(48)
            if (!this.isAreaFreeOfItems(keyX, keyY, 48, 48)) continue
            this.items.push(new Item(keyX, keyY, 'key'))
            keySpawned = true
        }
        const itemList = Object.keys(Data.items).filter(i => Data.items[i].minLvl <= levelNumber)
        for (let item of itemList) {
            if (!this.randomChance(Data.items[item].chance)) continue
            const x = this.spawnX(48)
            const y = this.spawnY(48)
            if (!this.isAreaFreeOfItems(x, y, 48, 48)) continue
            this.items.push(new Item(x, y, item))
        }
    }

    createEnemies(levelNumber) {
        const enemiesCount = 2 + Math.floor(levelNumber / 4) // 1 enemy added every 4 levels (minimum 2)
        for (let spawned = 0, failed = 0; spawned < enemiesCount && failed < 100;) {
            const enemyList = Object.keys(Data.enemies).filter(e => Data.enemies[e].minLvl <= levelNumber)
            const enemyType = enemyList[this.randomize(0, enemyList.length-1)]
            const x = this.spawnX(48)
            const y = this.spawnY(48)
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
        for (let obstType of Data.obstacles) {
            const min = obstType.includes('-H') ? 0 : 1
            const max = obstType.includes('-H') ? 2 : 3
            const obstacleCount = this.randomize(min,max)
            for (let spawned = 0, failed = 0; spawned < obstacleCount && failed < 100;) {
                const x = this.spawnX(48)
                const y = this.spawnY(48)
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
        const max = $game.floor.clientWidth - w
        const min = 50
        return this.randomize(min, max)
    }

    spawnY(h) {
        const max = $game.floor.clientHeight - h
        const min = 50
        return this.randomize(min, max)
    }

    isAreaFree(x, y, w, h, spacing) {
        const objects = this.getAllObjects()
        if (this.isBlockingDoor(x, y, w, h, $entrance) || this.isBlockingDoor(x, y, w, h, $exit)) return false
        return !objects.some(obj => {
            const space = obj.requiresSpacing() ? spacing : 0
            return y - space < obj.y + obj.height 
                && y + h + space > obj.y 
                && x - space < obj.x + obj.width 
                && x + w + space > obj.x
        })
    }

    isAreaFreeOfItems(x, y, w, h) {
        const itemsAndChest = this.items.concat($chest)
        return !itemsAndChest.some(obj => {
            return y < obj.y + obj.height 
                && y + h > obj.y 
                && x < obj.x + obj.width 
                && x + w > obj.x
        })
    }

    isBlockingDoor(x, y, w, h, door) {
        const doorPadding = door.getPadding()
        return y < doorPadding.y + doorPadding.height && y + h > doorPadding.y 
            && x < doorPadding.x + doorPadding.width && x + w > doorPadding.x
    }

    randomize(min, max) {
        return (Math.floor(Math.random() * (max - min + 1))) + min
    }

    randomChance(percentage) {
        return Math.random() * 100 < percentage
    }

    getFloorThird(direction) {
        let x, y, w, h
        switch(direction) {
            case 8: x = 50, y = 50, w = $game.floor.clientWidth, h = $game.floor.clientHeight / 3; break
            case 2: x = 50, y = $game.floor.clientHeight * 2 / 3, w = $game.floor.clientWidth, h = $game.floor.clientHeight / 3; break
            case 4: x = 50, y = 50, w = $game.floor.clientWidth / 3, h = $game.floor.clientHeight; break
            case 6: x = $game.floor.clientWidth * 2 / 3, y = 50, w = $game.floor.clientWidth / 3, h = $game.floor.clientHeight
        }
        return {x: x, y: y, width: w, height: h}
    }

    update() {
        if (this.isPaused) return
        if (this.timeCount > 0) {
            this.timeCount --
            if (this.timeCount == 0) Item.unfreezeTime()
        }
        for (let enemy of this.enemies) enemy.update()
        for (let item of this.items) item.update()
        for (let trap of this.traps) trap.update()
        for (let arrow of this.shotArrows) arrow.update()
        $player.update()
        $exit.update()
        $entrance.update()
        $chest.update()
    }

    getAllObjects() {
        return this.enemies.concat(this.obstacles, this.decorations, this.items, this.traps, $entrance, $exit, $player, $chest)
    }

    removeAll() {
        for (let obj of this.getAllObjects()) obj.removeElement()
    }

    updateScore() {
        let levelScore = 0
        for (let enemy of this.enemies) levelScore += enemy.points
        if (this.doubleScore) levelScore *= 2
        this.score += levelScore
        document.getElementById('score').textContent = this.score
    }

    updateHealthBar() {
        const hpbar = document.getElementById('hpbar-content')
        const percentage = Math.floor($player.health / $player.maxHp * 100)
        hpbar.style.width = `${percentage}%`
    }

    updateInventory() {
        document.getElementById('inv-shields').textContent = $player.shields
        document.getElementById('inv-swords').textContent = $player.swords
        document.getElementById('inv-bombs').textContent = $player.bombs
        document.getElementById('inv-arrows').textContent = $player.arrows
        document.getElementById('inv-key').textContent = $player.hasKey ? 1 : 0
        document.getElementById('inv-amulet').textContent = $player.hasAmulet ? 1 : 0
    }

    updateBonuses() {
        if ($player.isFast) document.getElementById('bonus-speed').classList.add('bonus-active-g')
        else document.getElementById('bonus-speed').classList.remove('bonus-active-g')
        if ($player.isDurable) document.getElementById('bonus-damage').classList.add('bonus-active-b')
        else document.getElementById('bonus-damage').classList.remove('bonus-active-b')
        if (this.doubleScore) document.getElementById('bonus-score').classList.add('bonus-active-y')
        else document.getElementById('bonus-score').classList.remove('bonus-active-y')
    }

    resetBonuses() {
        $player.isFast = false
        $player.isDurable = false
        this.doubleScore = false
        this.updateBonuses()
    }

    updatePriority() {
        const shield = $player.shields > 0, sword = $player.swords > 0, bomb = $player.bombs > 0
        switch($player.priority) {
            case null:     $player.priority = shield ? 'shield' : sword ? 'sword'   : bomb ? 'bomb'   : null; break
            case 'shield': $player.priority = shield ? 'shield' : sword ? 'sword'   : bomb ? 'bomb'   : null; break
            case 'sword':  $player.priority = sword ? 'sword'   : shield ? 'shield' : bomb ? 'bomb'   : null; break
            case 'bomb':   $player.priority = bomb ? 'bomb'     : shield ? 'shield' : sword ? 'sword' : null; break
        }
        const hud = document.getElementById('priority-current')
        if ($player.priority) hud.style.backgroundImage = `url('./images/${$player.priority}.png')`
        else hud.style.backgroundImage = `none`

        const toggleR = document.getElementById('priority-toggleR')
        const toggleL = document.getElementById('priority-toggleL')
        if ($player.getToggleOptions().length < 2) {
            toggleR.classList.remove('toggle-active')
            toggleL.classList.remove('toggle-active')
        } else {
            toggleR.classList.add('toggle-active')
            toggleL.classList.add('toggle-active')
        }
    }

    pause() {
        document.getElementById("pause-layer").style.display = 'flex'
        document.getElementById('main-bgm').pause()
        this.isPaused = true
        document.getElementById('btn-pause').innerText = 'Resume'
    }

    resume() {
        document.getElementById("pause-layer").style.display = 'none'
        document.getElementById('main-bgm').play()
        this.isPaused = false
        document.getElementById('btn-pause').innerText = 'Pause'
    }
}