Engine.Loader.XML.TextureParser =
class TextureParser
{
    constructor(loader)
    {
        this.loader = loader;
        this.resourceLoader = loader.resourceLoader;
        this.resourceManager = loader.resourceManager;
    }

    getEffect(effectNode) {
        const name = effectNode.name;
        if (name === 'color-replace') {
            const toCol = Engine.Conversion.hexToVec3;
            const colorIn = toCol(effectNode.attr('in').value);
            const colorOut = toCol(effectNode.attr('out').value);

            return function colorReplace(canvas) {
                return Engine.CanvasUtil.colorReplace(canvas,
                    colorIn, colorOut);
            }
        }
    }

    getEffects(effectNodes) {
        return Promise.all(effectNodes.map(node => {
            return this.getEffect(node);
        }));
    }

    getTexture(textureNode)
    {
        return textureNode.attr('url')
            ? this.loadTexture(textureNode)
            : this.resourceManager.getAsync('texture', textureNode.attr('id').value);
    }

    loadTexture(textureNode) {
        const url = textureNode.attr('url').toURL();

        return Promise.all([
            this.resourceLoader.loadImage(url),
            textureNode.find('effects > *').then(nodes => this.getEffects(nodes)),
        ])
        .then(([canvas, effects]) => {
            const scaleAttr = textureNode.attr('scale');
            const scale = scaleAttr
                ? scaleAttr.toFloat()
                : this.loader.textureScale;

            if (scale !== 1) {
                effects.push(function(canvas) {
                    return Engine.CanvasUtil.scale(canvas, scale);
                });
            }

            effects.forEach(effect => {
                canvas = effect(canvas);
            });

            const texture = new THREE.Texture(canvas);
            texture.magFilter = THREE.LinearFilter;
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            texture.needsUpdate = true;
            return texture;
        });
    }
}
