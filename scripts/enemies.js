class Enemy extends GameObject {
    constructor(x, y, fileName) {
        super(x, y, 48, 48)
        this.element.style.backgroundImage = `url('./spritesheets/${fileName}.png')`
        this.element.classList.add('enemy')
        const data = Data.enemies[fileName]
        this.power = $game.randomize(data.minPower, data.maxPower) + Math.floor($game.level / 5) // increase base damage every 5 levels
        this.points = data.points
        this.speed = 1
        this.direction = $game.randomize(1, 4) * 2 
        this.stepCount = 10
        this.stepFrame = 0
        this.dirChangeInterval = $game.randomize(1, 3) * 60 // 1-3 sec
        this.dirChangeCount = this.dirChangeInterval
        this.stuckCount = 0
        if (fileName == 'bat') {
            this.isFlying = true
            this.element.style.zIndex = 899
        }
    }

    move(direction) {
        if ($game.timeCount > 0) return // time frozen
        this.direction = direction
        this.updateStep()
        if (!this.canMove(direction)) return
        super.move(direction)
    }

    canMove(direction) {
        const objects = $game.obstacles.concat($entrance,$exit,$chest)
        if (objects.some(obj => this.wouldCollide(direction, obj))) {
            this.setDirection()
            return false
        }
        if (this.wouldReachBorder(direction)) {
            this.setDirection()
            return false
        }
        const objectsPhasable = $game.enemies.concat($game.traps)
        const ownIndex = objectsPhasable.indexOf(this)
        objectsPhasable.splice(ownIndex, 1)
        if (objectsPhasable.some(obj => this.wouldCollide(direction, obj))) {
            if (this.phaseCount > 0) return true // phase if couldn't move 50 times due to emeny/trap
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
        if (this.stuckCount == 50) {
            this.phaseCount = 60
            this.stuckCount = 0
        }
        if (this.phaseCount > 0) this.phaseCount --
        this.updateDirection()
        this.move(this.direction)
        super.update()
        if (this.isCollided($player) && this.canAttack()) this.attack()
    }

    updateDirection() {
        if ($game.timeCount > 0) return // time frozen
        this.dirChangeCount --
        if (this.dirChangeCount == 0) this.setDirection()
    }

    attack() {
        switch($player.priority) {
            case 'shield':
                if ($player.shields > 0) {
                    $player.parry()
                    this.setDirection(this.reverseDir(this.direction))
                    return
                }; break
            case 'sword':
                if ($player.swords > 0) {
                    $player.slash()
                    this.die()
                    return
                }; break
            case 'bomb':
                if ($player.bombs > 0) {
                    $player.detonate()
                    return
                }
        }
        $player.takeDamage(this.power)
        $player.speed = 12
        $player.move(this.direction)
        $player.speed = $player.isFast ? 2 : 1
        this.setDirection(this.reverseDir(this.direction))
        this.points = 0
    }

    canAttack() {
        return !$player.downCount && !$player.safeCount
        && !$player.isExiting && !$player.isEntering // don't interrupt level transition 
        && !$chest.isOpening && !$chest.openDelay && !$exit.openDelay // don't interrupt delay
        && !$player.isAiming // don't interrupt aiming bow
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
        const index = $game.enemies.indexOf(this)
        if (index != -1) $game.enemies.splice(index, 1)
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
}