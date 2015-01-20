Engine.assets.objects.Character = function()
{
    Engine.assets.Object.call(this);

    this.fireTimer = undefined;
    this.jumpTimer = undefined;

    this.fireTimeout = .25;
    this.direction = undefined;
    this.health = new Engine.assets.Energy(100);
    this.isFiring = false;
    this.isSupported = false;
    this.isSupportedUntil = {x1: undefined, x2: undefined};
    this.movementInhibitor = {
        t: undefined,
        b: undefined,
        l: undefined,
        r: undefined,
    };
    this.jumpForce = 155;
    this.jumpSpeed = 0;
    this.jumpTime = undefined;
    this.jumpDuration = .18;
    this.moveSpeed = 0;
    this.walkAcc = 600;
    this.walkSpeed = 90;
    this.walk = 0;
    this.weapon = undefined;

    this.setGravity(500);
}

Engine.assets.objects.Character.prototype = Object.create(Engine.assets.Object.prototype);
Engine.assets.objects.Character.constructor = Engine.assets.objects.Character;

Engine.assets.objects.Character.prototype.calculateMoveSpeed = function(dt)
{
    if (this.walk == 0) {
        this.moveSpeed = 0;
        return;
    }

    if (this.movementInhibitor.r && this.walk > 0) {
        if (this.movementInhibitor.r.y1 > this.model.position.y
        && this.movementInhibitor.r.y2 < this.model.position.y) {
            this.moveSpeed = 0;
            return;
        }
    }
    this.movementInhibitor.r = undefined;

    if (this.movementInhibitor.l && this.walk < 0) {
        if (this.movementInhibitor.l.y1 > this.model.position.y
        && this.movementInhibitor.l.y2 < this.model.position.y) {
            this.moveSpeed = 0;
            return;
        }
    }
    this.movementInhibitor.l = undefined;

    this.moveSpeed = Math.min(this.moveSpeed + this.walkAcc * dt, this.walkSpeed);
}

Engine.assets.objects.Character.prototype.equipWeapon = function(weapon)
{
    if (weapon instanceof Engine.assets.Weapon !== true) {
        throw new Error('Invalid weapon');
    }
    this.weapon = weapon;
    this.weapon.setUser(this);
}

Engine.assets.objects.Character.prototype.fire = function()
{
    if (!this.weapon) {
        return false;
    }

    if (!this.weapon.fire()) {
        return false;
    }

    clearTimeout(this.fireTimer);
    this.isFiring = true;

    this.fireTimer = setTimeout(
        function stopFire() {
            this.isFiring = false;
        }.bind(this),
        this.fireTimeout * 1000);

    return true;
}

Engine.assets.objects.Character.prototype.jumpStart = function()
{
    if (!this.isSupported) {
        return false;
    }
    this.jumpSpeed = this.jumpForce;
    this.jumpTime = this.time;
}

Engine.assets.objects.Character.prototype.jumpEnd = function()
{
    this.jumpSpeed = 0;
}

Engine.assets.objects.Character.prototype.moveLeftStart = function()
{
    this.walk--;
}

Engine.assets.objects.Character.prototype.moveLeftEnd = function()
{
    this.walk++;
}

Engine.assets.objects.Character.prototype.moveRightStart = function()
{
    this.walk++;
}

Engine.assets.objects.Character.prototype.moveRightEnd = function()
{
    this.walk--;
}

Engine.assets.objects.Character.prototype.setDirection = function(d)
{
    this.direction = d;
}

Engine.assets.objects.Character.prototype.setFireTimeout = function(seconds)
{
    this.fireTimeout = seconds;
}

Engine.assets.objects.Character.prototype.setJumpForce = function(force)
{
    this.jumpForce = force;
}

Engine.assets.objects.Character.prototype.setWalkspeed = function(speed)
{
    this.walkSpeed = speed;
}

Engine.assets.objects.Character.prototype.timeShift = function(t)
{
    this.calculateMoveSpeed(t);

    this.speed.x = (this.moveSpeed * this.walk);

    if (this.jumpSpeed > 0) {
        this.speed.y = this.jumpSpeed;
        if (this.time - this.jumpTime > this.jumpDuration) {
            this.jumpEnd();
        }
    }

    if (!this.isSupported) {
        this.speed.y -= (this.gravityForce * t);
    }
    else if (this.speed.y > 0
    || this.model.position.x < this.isSupportedUntil.x1
    || this.model.position.x > this.isSupportedUntil.x2) {
        this.isSupported = false;
    }
    //console.log('Move Speed: %f', this.moveSpeed);
    //console.log('Jump Force: %f', this.jumpSpeed);
    Engine.assets.Object.prototype.timeShift.call(this, t);
}

Engine.assets.objects.characters = {};
