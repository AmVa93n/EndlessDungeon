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
        const direction = this.reverseDir(exit.direction)
        switch(direction) {
            case 6: return 0
            case 4: return Scene.main.clientWidth - this.width
            case 8:
            case 2: return exit.x
        }
    }

    getY(exit) {
        const direction = this.reverseDir(exit.direction)
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
        let frame
        switch(this.animFrame) {
            case 0: frame = 60; break
            case 1: frame = 120; break
            case 2: frame = 180; break
            case 3: frame = 0; break
        }
        let dir
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
        let options
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
                const max = Scene.main.clientWidth - this.width*3.5
                const min = this.width*2.5
                return $game.randomize(min, max)
        }
    }

    getY(direction) {
        switch(direction) {
            case 2: return 0
            case 8: return Scene.main.clientHeight - this.height
            case 6:
            case 4: 
                const max = Scene.main.clientHeight - this.height*3.5
                const min = this.height*2.5
                return $game.randomize(min, max)
        }
    }

    update() {
        if (this.canOpen()) {
            Audio.playSound('amulet')
            $player.useItem('amulet')
            this.openDelay = 60
        }
        if (this.openDelay > 0) {
            this.openDelay --
            if (this.openDelay == 0) this.open()
        }
        super.update()
        this.updateAnimation()
    }

    canOpen() {
        if (!$player) return
        if (!this.isCollided($player)) return false
        if (!$player.hasAmulet) return false
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
        let frame
        switch(this.animFrame) {
            case 0: frame = 0; break
            case 1: frame = 180; break
            case 2: frame = 120; break
            case 3: frame = 60; break
        }
        let dir
        switch(this.direction) {
            case 2: dir = 0; break
            case 4: dir = 180; break
            case 6: dir = 120; break
            case 8: dir = 60; break
        }
        this.element.style.backgroundPosition = `${frame}px ${dir}px`
    }

    open() {
        if ($game.isInTransition) return
        this.isOpening = true
        Audio.playSound('door',0.5)
        $player.isExiting = true
        $player.speed = 1 // in case player has x2 speed
        Item.unfreezeTime()
        $game.fadeout.style.opacity = 1 
        $game.isInTransition = true
    }
}

class Trap extends GameObject {
    constructor(x, y) {
        super(x, y, 48, 48)
        this.element.style.backgroundImage = `url('./spritesheets/spikes.png')`
        this.trapCount = $game.randomize(100,300)
        this.spikesOut = $game.randomChance(50)
        if (this.spikesOut) this.element.style.backgroundPositionY = '48px'
        this.element.style.zIndex = -1
    }

    update() {
        this.updateTrapInterval()
        if (this.canImpale()) $player.takeDamage(5)
    }

    updateTrapInterval() {
        if ($game.timeCount > 0) return // time frozen
        if (this.trapCount > 0) {
            this.trapCount --
            if (this.trapCount == 0) {
                this.spikesOut = !this.spikesOut
                Audio.playSound('spikes',0.1)
                if (this.spikesOut) {
                    this.element.classList.add('spikes-pullout')
                    this.element.classList.remove('spikes-retract')
                } else {
                    this.element.classList.add('spikes-retract')
                    this.element.classList.remove('spikes-pullout')
                }
                this.trapCount = 300
            }
        }
    }

    canImpale() {
        return this.spikesOut && this.isCollided($player) && !$player.downCount && !$player.safeCount 
        && ['48px','96px'].includes(window.getComputedStyle(this.element).backgroundPositionY) // only impale when spikes are visibly out
    }

    isCollided(obj) {
        const realX = this.x + 10
        const realY = this.y + 10
        const realWidth = 28
        const realHeight = 28
        return realY < obj.y + obj.height && realY + realHeight > obj.y 
            && realX < obj.x + obj.width && realX + realWidth > obj.x
    }
}

class Obstacle extends GameObject {
    constructor(x, y, fileName) {
        super(x, y, 48, 48)
        this.element.style.backgroundImage = `url('./images/${fileName}.png')`
        this.isHighObstacle = fileName.includes('-H')
        if (this.isHighObstacle) { // 48x96 pixels
            this.element.style.backgroundPosition = `0px 48px`
            this.createUpperHalf(fileName)
        }
    }

    createUpperHalf(fileName) {
        this.upperHalf = document.createElement('div')
        this.upperHalf.style.backgroundImage = `url('./images/${fileName}.png')`
        this.upperHalf.style.width = '48px'
        this.upperHalf.style.height = '48px'
        this.upperHalf.style.position = 'absolute'
        this.upperHalf.style.top = '-100%'
        this.upperHalf.style.zIndex = 900
        this.element.appendChild(this.upperHalf)
    }

    remove() {
        this.removeElement()
        const index = $game.obstacles.indexOf(this)
        if (index != -1) $game.obstacles.splice(index, 1)
    }
}

class Decoration extends GameObject {
    constructor(x, y, fileName) {
        super(x, y, 48, 48)
        this.element.style.backgroundImage = `url('./images/${fileName}.png')`
        this.element.style.zIndex = -1
    }
}