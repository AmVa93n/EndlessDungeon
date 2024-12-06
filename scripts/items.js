class Item extends GameObject {
    constructor(x, y, fileName) {
        super(x, y, 48, 48)
        this.element.style.backgroundImage = `url('./images/${fileName}.png')`
        this.element.style.zIndex = 800
        this.itemType = fileName
        this.element.classList.add('float')
    }

    update() {
        if ($player.downCount > 0) return
        if ($player.isExiting) return
        if ($player.isEntering) return
        if (!this.isCollided($player)) return
        if (['shield','sword','bomb','key','arrow'].includes(this.itemType)) $player.collectItem(this)
        else this.applyEffect()
    }

    isCollided(obj) {
        const realX = this.x + 8
        const realY = this.y + 8
        const realWidth = 32
        const realHeight = 32
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
                $player.speed = 2
                $game.updateBonuses(); break
            case 'potion-blue': // halve damage
                Audio.playSound('durable')
                $player.isDurable = true
                $game.updateBonuses(); break
            case 'potion-yellow': // double score
                Audio.playSound('bonus')
                $game.doubleScore = true
                $game.updateBonuses(); break
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
        const index = $game.items.indexOf(this)
        if (index != -1) $game.items.splice(index, 1)
    }
}

class Chest extends GameObject {
    constructor() {
        super(0, 0, 48, 48)
        this.x = this.getX($exit.direction)
        this.y = this.getY($exit.direction)
        this.element.style.backgroundImage = `url('./spritesheets/chest.png')`
        this.isClosing = false
        this.animFrame = 0
        this.animCount = 10
    }

    getX(exitDir) {
        const floorThird = $game.getFloorThird(exitDir)
        return $game.randomize(floorThird.x, floorThird.x + floorThird.width - this.width)
    }

    getY(exitDir) {
        const floorThird = $game.getFloorThird(exitDir)
        return $game.randomize(floorThird.y, floorThird.y + floorThird.height - this.height)
    }

    update() {
        if (this.canOpen()) {
            Audio.playSound('key')
            $player.useItem('key')
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
        if (!$player.hasKey) return false
        if (this.animFrame > 0) return
        return true
    }

    open() {
        this.isOpening = true
        Audio.playSound('chest')
    }

    updateAnimation() {
        if (!this.isOpening) return
        super.updateAnimation()
        if (this.animFrame == 4) {
            this.isOpening = false
            $player.collectAmulet()
        }
    }

    updateImage() {
        let frame
        switch(this.animFrame) {
            case 0: frame = 0; break
            case 1: frame = 144; break
            case 2: frame = 96; break
            case 3: frame = 48; break
        }
        this.element.style.backgroundPosition = `0px ${frame}px`
    }
}

class Arrow extends GameObject {
    constructor(x, y, realW, realH, direction) {
        super(x, y, 48, 48)
        this.element.style.backgroundImage = `url('./spritesheets/arrow.png')`
        this.element.style.zIndex = 899
        this.direction = direction
        this.realW = realW
        this.realH = realH
        this.speed = 5
    }

    update() {
        if (this.stopped) return
        if ($game.timeCount == 0) this.move(this.direction)
        super.update()
        for (let e of $game.enemies) {
            if (this.isCollided(e)) {
                Audio.playSound('arrow-hit')
                e.die()
                this.stopped = true
                setTimeout(()=>{this.remove()},500)
                return
            }
        }
        if ($game.obstacles.some(o => o.isHighObstacle && this.isCollided(o)) || this.wouldReachBorder(this.direction)) {
            Audio.playSound('arrow-block',0.5)
            this.stopped = true
            setTimeout(()=>{this.remove()},500)
            return
        }
    }

    isCollided(obj) {
        const realX = this.realW == 12 ? this.x + 18 : this.x
        const realY = this.realH == 12 ? this.y + 18 : this.y
        return realY < obj.y + obj.height && realY + this.realH > obj.y 
            && realX < obj.x + obj.width && realX + this.realW > obj.x
    }

    updateImage() {
        let dir
        switch(this.direction) {
            case 2: dir = 0; break
            case 4: dir = 144; break
            case 6: dir = 96; break
            case 8: dir = 48; break
        }
        this.element.style.backgroundPosition = `0px ${dir}px`
    }

    remove() {
        this.removeElement()
        const index = $game.shotArrows.indexOf(this)
        if (index != -1) $game.shotArrows.splice(index, 1)
    }
}