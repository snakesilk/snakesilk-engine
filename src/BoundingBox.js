class BoundingBox
{
    constructor(pos, size, offset)
    {
        this.position = pos;
        this.offset = offset;

        this.w = size.x;
        this.h = size.y;
        this.width = size.x;
        this.height = size.y;

        this._w = this.w / 2;
        this._h = this.h / 2;
    }

    get x() {
        return this.position.x + this.offset.x;
    }

    set x(v) {
        this.position.x = v - this.offset.x;
    }

    get y() {
        return this.position.y + this.offset.y;
    }

    set y(v) {
        this.position.y = v - this.offset.y;
    }

    get left() {
        return this.x - this._w;
    }

    set left(v) {
        this.x = v + this._w;
    }

    get right() {
        return this.x + this._w;
    }

    set right(v) {
        this.x = v - this._w;
    }

    get top() {
        return this.y + this._h;
    }

    set top(v) {
        this.y = v - this._h;
    }

    get bottom() {
        return this.y - this._h;
    }

    set bottom(v) {
        this.y = v + this._h;
    }
}

module.exports = BoundingBox;
