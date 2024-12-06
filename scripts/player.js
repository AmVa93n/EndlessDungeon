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
        this.arrows = 0
        this.priority = null
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
        if (this.wouldCollide(direction, $chest)) {
            if (this.isCollided($chest)) return false
            return true
        } 
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
        if (this.isExiting || this.isEntering) return // wait for level transition
        if (this.isAiming) return
        if ($chest.isOpening) return // wait for chest to open
        if ($chest.openDelay > 0) return // wait for chest to open
        if ($exit.openDelay > 0) return // wait for door to open
        this.updateInput()
    }

    updateInput() {
        for (let keyName in Input.keys) {
            if (Input.isKeyDown(keyName)) {
                if (keyName == " ") {
                    this.chargeBow()
                    return
                }
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
        let step
        switch(this.stepFrame) {
            case 0: step = 0; break
            case 3:
            case 1: step = 96; break
            case 2: step = 48; break
        }
        let dir
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
            $game.isInTransition = false
        }
    }

    takeDamage(damage) {
        if (this.isDurable) damage /= 2
        this.health -= damage
        $game.updateHealthBar()
        Audio.playSound('hurt'+ $game.randomize(1,2))
        $player.setImage('player-down')
        $player.downCount = 60
        const damageOverlay = document.createElement('img');
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
            case 'arrow': this.arrows +=3; break
            case 'key': this.hasKey = true
        }
        item.element.classList.add('item-collected')
        item.element.style.opacity = 0
        setTimeout(() => {item.remove()}, 500)
        $game.updateInventory()
        $game.updatePriority()
    }

    collectAmulet() {
        Audio.playSound('collect')
        const amulet = document.createElement('img');
        amulet.src = `./images/amulet.png`
        amulet.classList.add('item-used');
        $chest.element.appendChild(amulet);
        setTimeout(() => {amulet.remove();}, 1000);
        $player.hasAmulet = true
        $game.updateInventory()
    }

    parry() {
        Audio.playSound('shield')
        this.shields --
        this.useItem('shield')
        this.safeCount = 60
    }

    slash() {
        Audio.playSound('sword')
        this.swords --
        this.useItem('sword')
    }

    detonate() {
        Audio.playSound('bomb')
        this.bombs --
        this.useItem('bomb')
        const bombArea = {x: this.x - 48, y: this.y - 48, width: this.width + 48*2, height: this.height + 48*2}
        const affectedMonsters = $game.enemies.filter(e => e.isCollided(bombArea))
        for (let e of affectedMonsters) e.die()
    }

    chargeBow() {
        if (this.isAiming) return
        if (this.arrows == 0) return
        const bow = document.createElement('div')
        bow.style.backgroundImage = `url('./spritesheets/bow.png')`
        bow.style.width = '48px'
        bow.style.height = '48px'
        bow.style.position = 'absolute'
        bow.style.zIndex = 899
        this.element.appendChild(bow)
        switch(this.direction) {
            case 2:
                bow.style.top = '80%'
                bow.style.backgroundPositionY = '0px'; break
            case 4:
                bow.style.right = '80%'
                bow.style.backgroundPositionY = '144px'; break
            case 6:
                bow.style.left = '80%'
                bow.style.backgroundPositionY = '96px'; break
            case 8:
                bow.style.bottom = '80%'
                bow.style.backgroundPositionY = '48px'
        }
        Audio.playSound('bow',0.5)
        this.isAiming = true
        setTimeout(()=>{this.shootArrow(bow)},1000)
    }

    shootArrow(bow) {
        if ($game.isPaused) { // abort if game was paused during bow charge
            bow.remove()
            this.isAiming = false
            return
        }
        bow.style.backgroundPositionX = '48px'
        let x, y, w, h
        if (!this.direction) return // failsafe to solve a weird bug where arrow spawns with undefined direction
        switch(this.direction) {
            case 2: x = this.x, y = this.y + this.height, w = 12, h = 48; break
            case 8: x = this.x, y = this.y - this.height, w = 12, h = 48; break
            case 4: x = this.x - this.width, y = this.y, w = 48, h = 12; break
            case 6: x = this.x + this.width, y = this.y, w = 48, h = 12; break
        }
        Audio.playSound('arrow')
        $game.shotArrows.push(new Arrow(x, y, w, h, this.direction))
        this.arrows --
        $game.updateInventory()
        setTimeout(()=>{
            bow.remove()
            this.isAiming = false
        },500)
    }

    useItem(itemType) {
        const itemUsed = document.createElement('img');
        itemUsed.src = `./images/${itemType}.png`
        itemUsed.classList.add('item-used');
        this.element.appendChild(itemUsed);
        setTimeout(() => {itemUsed.remove();}, 1000);
        if (itemType == 'key') $player.hasKey = false
        if (itemType == 'amulet') $player.hasAmulet = false
        $game.updateInventory()
        $game.updatePriority()
    }

    togglePriority(direction) {
        const options = this.getToggleOptions()
        if (options.length < 2) return // not enough options to toggle
        Audio.playSound('cursor',0.5)
        const currentIndex = options.indexOf(this.priority)
        const newIndex = (currentIndex + direction + options.length) % options.length
        this.priority = options[newIndex]
        $game.updatePriority()
    }

    getToggleOptions() {
        const options = []
        if (this.shields > 0) options.push ('shield')
        if (this.swords > 0) options.push ('sword')
        if (this.bombs > 0) options.push ('bomb')
        return options
    }
}