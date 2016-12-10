Engine.Conversion = {
    hexToVec3: function(hex) {
        const [r, g, b] = [
            parseInt(hex.substr(1, 2), 16),
            parseInt(hex.substr(3, 2), 16),
            parseInt(hex.substr(5, 2), 16),
        ];
        return new THREE.Vector3(r, g, b);
    },
}
