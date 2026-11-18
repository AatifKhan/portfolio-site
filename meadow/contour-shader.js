export const vertexSource = `#version 300 es
void main() {
    vec2 corner = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const fragmentSource = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uPointerStrength;
uniform float uDark;

out vec4 surfaceColor;

// A fixed material-space grain stays registered to the sculpture on resize.
const vec2 MATERIAL_SEED = vec2(17.81, 29.53);

float grain(vec2 position) {
    vec3 cell = fract(vec3(position.xyx) * 0.1031);
    cell += dot(cell, cell.yzx + 33.33);
    return fract((cell.x + cell.y) * cell.z);
}

float mound(float x, float center, float width) {
    float offset = (x - center) / width;
    return exp(-offset * offset);
}

float ridgeLip(float distanceToFold, float width) {
    float falloff = distanceToFold < width * .49 ? width * .31 : width * .77;
    return 1.0 - smoothstep(width * .075, falloff, abs(distanceToFold - width * .49));
}

float leeShadow(float distanceToFold, float length) {
    float lowerTerrace = 1.0 - smoothstep(-.008, -.001, distanceToFold);
    return lowerTerrace * exp(min(0.0, (distanceToFold + .008) / length));
}

// The uneven spacing and distinct shoulder profiles keep the relief terraced
// instead of turning it into a periodic wave across the viewport.
vec3 sculpture(vec2 uv, float aspect) {
    float portrait = 1.0 - smoothstep(0.58, 1.24, aspect);
    float x = mix(uv.x, 0.41 + uv.x * 0.42, portrait);
    float y = mix(uv.y, uv.y * .56 + .096, portrait);

    float bowl = .111 - .104 * mound(x, .37, .19)
                      + .122 * mound(x, .69, .17)
                      - .055 * mound(x, 1.01, .16);
    bowl += .014 * sin(x * 19.0 + .44) * mound(x, .39, .44);

    vec4 folds = y - bowl + vec4(
        .127 + .021 * mound(x, .22, .16),
        .090 - .014 * mound(x, .76, .24),
        .057 + .019 * sin(x * 10.0 + 1.60) + .020 * mound(x, .12, .18),
        .009 - .026 * mound(x, .55, .13)
    );
    float outerShoulder = y - bowl - .040 + .034 * mound(x, .15, .21);
    vec4 shoulders = smoothstep(
        vec4(-.016, -.014, -.012, -.014),
        vec4(.008, .006, .006, .008),
        folds
    );

    float height = dot(shoulders, vec4(.014, .021, .026, .030));
    height += .014 * smoothstep(-.026, .016, outerShoulder);

    float spur = y - (.055 + .126 * mound(x, .045, .19) - .024 * mound(x, .44, .15));
    float spurStrength = 1.0 - smoothstep(.11, .34, x);
    height += spurStrength * .024 * smoothstep(-.015, .006, spur);

    float summit = .874 + .35 * uv.x
        + .025 * mound(uv.x, .09, .12) - .024 * mound(uv.x, .24, .08);
    float upperFold = uv.y - summit;
    height += .018 * smoothstep(-.012, .005, upperFold);

    float rim = max(max(ridgeLip(folds.x, .016), ridgeLip(folds.y, .015)),
                    max(ridgeLip(folds.z, .012), ridgeLip(folds.w, .014)));
    rim = max(rim, .59 * ridgeLip(outerShoulder, .014));
    rim = max(rim, spurStrength * .79 * ridgeLip(spur, .013));
    rim = max(rim, .46 * ridgeLip(upperFold, .012));

    float crease = max(max(leeShadow(folds.z, .031), leeShadow(folds.w, .026)),
                       .59 * leeShadow(outerShoulder, .031));
    crease = max(crease, spurStrength * .85 * leeShadow(spur, .021));
    crease = max(crease, .47 * leeShadow(upperFold, .017));
    return vec3(height, rim, crease);
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    float aspect = uResolution.x / uResolution.y;
    vec3 relief = sculpture(uv, aspect);
    float height = relief.x;
    vec2 slope = vec2(dFdx(height), dFdy(height)) * uResolution.y;
    vec3 normal = normalize(vec3(-slope, 1.0));

    vec3 keyLight = normalize(vec3(-.53, .60, .66));
    float diffuse = dot(normal, keyLight) - keyLight.z;
    float bounced = max(0.0, dot(normal, normalize(vec3(.38, -.79, .49))) - .49);

    vec2 difference = (uPointer - uv) * vec2(aspect, 1.0);
    float spotlight = exp(-26.0 * dot(difference, difference)) * uPointerStrength;
    vec3 pointerLight = normalize(vec3(difference * 1.06 + vec2(-.11, .15), .17));
    float movingLight = dot(normal, pointerLight) - pointerLight.z;

    float elevation = height * 127.0 + .17;
    float contourDistance = abs(fract(elevation + .5) - .5);
    float antialias = max(fwidth(elevation), .012);
    float engraving = (1.0 - smoothstep(.027, .033 + antialias, contourDistance))
        * smoothstep(.18, .76, length(slope));

    vec2 materialPosition = uv * vec2(aspect, 1.0) + MATERIAL_SEED;
    float microtexture = grain(floor(materialPosition * 1180.0)) - .5;
    float mineralGrain = grain(floor(materialPosition * 227.0)) - .5;
    float textureShade = microtexture * .014 + mineralGrain * .004;
    float shade = diffuse * .24 + bounced * .055
        - relief.z * .060 - engraving * .010 + textureShade;

    // Preserve a quieter range around the masthead in both appearances.
    float upperCalm = mix(1.0, .54, smoothstep(.84, .99, uv.y));
    vec3 porcelain = vec3(.945, .927, .887);
    porcelain += upperCalm * vec3(shade);
    porcelain += relief.y * upperCalm * vec3(.083, .077, .061);
    porcelain += spotlight * upperCalm * (movingLight * .20 + relief.y * .014) * vec3(1.0, .89, .70);

    vec3 graphite = vec3(.089, .105, .126);
    graphite += upperCalm * vec3(diffuse * .071 + bounced * .18 - relief.z * .024
        - engraving * .010 + textureShade * .48);
    graphite += relief.y * upperCalm * vec3(.108, .138, .179);
    graphite += spotlight * upperCalm * (movingLight * .17 + relief.y * .019) * vec3(.68, .83, 1.0);

    surfaceColor = vec4(clamp(mix(porcelain, graphite, uDark), 0.0, 1.0), 1.0);
}
`;
