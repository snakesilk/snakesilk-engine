function applyRatio(ratio, start, end) {
    return start + (end - start) * ratio;
}

function clamp(value, min, max) {
    if (value > max) {
        return max;
    } else if (value < min) {
        return min;
    } else {
        return value;
    }
}

function findRatio(pos, low, high) {
    return (pos - low) / (high - low);
}

function nextPowerOf(x, size = 2) {
    return Math.pow(size, Math.ceil(Math.log(x) / Math.log(size)));
}

function circleInRectangle(r, x, y, a, b, w, h) {
    const circle = {
        x: Math.abs(x - a),
        y: Math.abs(y - b),
    };

    if (circle.x > (w / 2 + r) || circle.y > (h / 2 + r)) {
        return false;
    }

    if (circle.x <= (w / 2) || circle.y <= (h / 2)) {
        return true;
    }

    const cornerDistanceSq = Math.pow(circle.x - w / 2, 2) +
                             Math.pow(circle.y - h / 2, 2);

    if (cornerDistanceSq <= Math.pow(r, 2)) {
        return true;
    }

    return false;
}

function circlesIntersect(r1, r2, x1, x2, y1, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const radii = r1 + r2;
    if (dx * dx + dy * dy < radii * radii) {
        return true;
    }
    return false;
}

function rectanglesIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    w1 /= 2;
    w2 /= 2;
    h1 /= 2;
    h2 /= 2;
    if (x1 + w1 > x2 - w2 && x1 - w1 < x2 + w2 &&
        y1 + h1 > y2 - h2 && y1 - h1 < y2 + h2) {
        return true;
    }
    return false;
}

module.exports = {
    applyRatio,
    clamp,
    findRatio,
    nextPowerOf,
    circlesIntersect,
    rectanglesIntersect,
};
