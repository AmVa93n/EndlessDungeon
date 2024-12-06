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
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
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
        if (this.isFlying) { // allow flying monsters to skip low obstacles and traps
            if (obj instanceof Obstacle && !obj.isHighObstacle) return false
            if (obj instanceof Trap) return false
        } 
        const step = direction == 8 || direction == 4 ? -1 : 1
        const collision = this.y + step < obj.y + obj.height &&
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
        const padding = {x: this.x, y: this.y, width: 48, height: 48}
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

    requiresSpacing() {
        return ![Decoration, Item, Trap].some(cls => this instanceof cls)
    }
}