import DetectionMode from "./base.mjs";

function sizeDifficulty(tokenData) {
    switch (tokenData.traits.size) {
        case "tiny": return 0.5;
        case "sm": return 0.8;
        case "med": return 1;
        case "lg": return 2;
        case "hg": return 4;
        case "grg": return 8;
        default: return 1;
    }
}

function targetTooStealthy(targetToken, sourceToken) {
    let distance = Math.sqrt(Math.pow((targetToken.center.x - sourceToken.center.x), 2) + Math.pow((targetToken.center.y - sourceToken.center.y),2));
    let hearableDistance = (sourceToken.actor.detectionModes.hearing * sizeDifficulty(targetToken) - targetToken.actor.detectionModes.stealthCapability / sizeDifficulty(targetToken));
    return (distance > hearableDistance);
}

/**
 * The detection mode for hearing.
 */
export default class DetectionModeHearing extends DetectionMode {
    constructor() {
        super({
            id: "hearing",
            label: "VISION5E.Hearing",
            type: DetectionMode.DETECTION_TYPES.SOUND,
            angle: false,
            imprecise: true,
            priority: 1,
        });
    }

    /** @override */
    static getDetectionFilter() {
        return this._detectionFilter ??= PingDetectionFilter.create({
            color: [1, 1, 1],
            alpha: 0.75,
        });
    }

    /** @override */
    _canDetect(visionSource, target) {
        const source = visionSource.object;

        if (!(target instanceof Token)
            || target.document.hasStatusEffect(CONFIG.specialStatusEffects.DEFEATED)
            || target.document.hasStatusEffect(CONFIG.specialStatusEffects.ETHEREAL)
            && !source.document.hasStatusEffect(CONFIG.specialStatusEffects.ETHEREAL)
            || target.document.hasStatusEffect(CONFIG.specialStatusEffects.INAUDIBLE)
            || target.document.hasStatusEffect(CONFIG.specialStatusEffects.PETRIFIED)
            || targetTooStealthy(target, source)) {
            return false;
        }

        if (source.document.hasStatusEffect(CONFIG.specialStatusEffects.DEFEATED)
            || source.document.hasStatusEffect(CONFIG.specialStatusEffects.DEAFENED)
            || source.document.hasStatusEffect(CONFIG.specialStatusEffects.PETRIFIED)
            || source.document.hasStatusEffect(CONFIG.specialStatusEffects.UNCONSCIOUS)) {
            return false;
        }

        return true;
    }

    /** @override */
    _testLOS(visionSource, mode, target, test) {
        return !CONFIG.Canvas.polygonBackends.sound.testCollision(
            { x: visionSource.x, y: visionSource.y },
            test.point,
            {
                type: "sound",
                mode: "any",
                source: visionSource,
                wallDirectionMode: PointSourcePolygon.WALL_DIRECTION_MODES.REVERSED,
                useThreshold: true,
            },
        );
    }
}

class PingDetectionFilter extends AbstractBaseFilter {
    /** @override */
    autoFit = false;

    /** @type {boolean} */
    animated = true;

    /** @override */
    static defaultUniforms = {
        color: [1, 1, 1],
        alpha: 1,
    };

    /** @override */
    static vertexShader = `
        attribute vec2 aVertexPosition;

        uniform mat3 projectionMatrix;
        uniform vec4 inputSize;
        uniform vec4 outputFrame;

        varying vec2 vFilterCoord;

        void main() {
            vFilterCoord = aVertexPosition;
            vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;
            gl_Position = vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
        }`;

    /** @override */
    static fragmentShader = `
        varying vec2 vFilterCoord;

        uniform vec3 color;
        uniform float alpha;
        uniform float time;

        ${this.CONSTANTS}
        ${this.WAVE()}

        void main(void) {
            float dist = distance(vFilterCoord, vec2(0.5)) * 2.0;
            gl_FragColor = vec4(color, 1.0) * alpha * wcos(0.0, 1.0, dist * 75.0, -time * 0.01 + 3.0 * step(dist, 1.0)) * (1.0 - dist);
        }`;

    /** @override */
    apply(filterManager, input, output, clear) {
        this.uniforms.time = this.animated && !canvas.photosensitiveMode ? canvas.app.ticker.lastTime : 0;
        filterManager.applyFilter(this, input, output, clear);
    }
}
