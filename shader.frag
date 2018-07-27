precision mediump float;

varying vec2 vTextureCoord;
varying vec4 vColor;

uniform sampler2D uSampler;
uniform float time;

const float PI = 3.1415926535;

const vec2 resolution = vec2(800,600);


vec4 GetColorSimple()
{
    vec2 uvs = vTextureCoord.xy;
    return texture2D(uSampler, uvs);
}

vec4 Sepia(in vec4 color)
{
    return vec4(
          clamp(color.r * 0.393 + color.g * 0.769 + color.b * 0.189, 0.0, 1.0),
          clamp(color.r * 0.349 + color.g * 0.686 + color.b * 0.168, 0.0, 1.0),
          clamp(color.r * 0.272 + color.g * 0.534 + color.b * 0.131, 0.0, 1.0),
          color.a
    );
}

vec4 Sepia()
{
    vec4 color = GetColorSimple();
    return Sepia(color);
}

vec4 GrayScale(in vec4 color)
{
    float lum = (color.r + color.g + color.b ) / 3.0;
    return vec4(lum, lum, lum, 1);
}

vec4 GrayScale()
{
    vec4 color = GetColorSimple();
    return GrayScale(color);
}

vec4 Vignet()
{
    vec2 uvs = vTextureCoord.xy;
    vec4 Color = texture2D(uSampler, uvs);
    float dist = distance(uvs, vec2(0.4,0.3));
    Color.rgb *= smoothstep(0.45, 0.38, dist);
    return Color;
}

vec4 Stripes()
{
    vec2 uvs = vTextureCoord.xy;
    vec4 fg = texture2D(uSampler, uvs);

    fg.r += cos(uvs.y*0.002 + time*0.5);
    return fg;
}

vec4 Wiggle()
{
    vec2 uvs = vTextureCoord.xy;
    uvs.x += sin(uvs.y * 8. * PI + time) / 100.;
    uvs.y += sin(uvs.x * 7. * PI + time) / 80.;
    return texture2D(uSampler, uvs);
}

vec4 Pixelize()
{
    float offset = fract(time/10.);
    vec2 uvs = vTextureCoord.xy;
    vec3 tc = vec3(1.0, 0.0, 0.0);
    if (uvs.x < (offset-0.001))
    {
        float dx = 5.*(1./resolution.x);
        float dy = 5.*(1./resolution.y);
        vec2 coord = vec2(dx*floor(uvs.x/dx), dy*floor(uvs.y/dy));
        tc = texture2D(uSampler, coord).rgb;
    }
    else if (uvs.x>=(offset+0.001))
    {
        tc = texture2D(uSampler, uvs).rgb;
    }
	return vec4(tc, 1.0);
}

vec4 Swirl()
{
    vec2 uvs = vTextureCoord.xy;
    vec2 tc = uvs * resolution;
    tc -= resolution / 2.0;
    float dist = length(tc);
    float radius = 250.;
    float angle = 0.75;

    if (dist < radius) 
    {
        float percent = (radius - dist) / radius;
        float theta = percent * percent * angle * time;
        float s = sin(theta);
        float c = cos(theta);
        tc = vec2(dot(tc, vec2(c, -s)), dot(tc, vec2(s, c)));
    }
    tc += resolution / 2.0;
    vec3 color = texture2D(uSampler, tc / resolution).rgb;
    return vec4(color, 1.0);
}

vec4 FishEye()
{
    vec2 uvs = vTextureCoord.xy;

    float aperture = 178.0;
    float apertureHalf = 0.5 * aperture * (PI / 180.0);
    float maxFactor = sin(apertureHalf);

    vec2 xy = 2.0 * uvs - 1.0;
    float d = length(xy);
    if (d < (2.0-maxFactor))
    {
        d = length(xy * maxFactor);
        float z = sqrt(1.0 - d * d);
        float r = atan(d, z) / PI;
        float phi = atan(xy.y, xy.x);

        uvs.x = r * cos(phi) + 0.5;
        uvs.y = r * sin(phi) + 0.5;
    }
    return texture2D(uSampler, uvs);
}

vec4 Edges()
{
    vec2 uvs = vTextureCoord.xy;
    vec2 texOffset = 1. / resolution;
    vec2 tc0 = uvs.st + vec2(-texOffset.s, -texOffset.t);
    vec2 tc1 = uvs.st + vec2(         0.0, -texOffset.t);
    vec2 tc2 = uvs.st + vec2(+texOffset.s, -texOffset.t);
    vec2 tc3 = uvs.st + vec2(-texOffset.s,          0.0);
    vec2 tc4 = uvs.st + vec2(         0.0,          0.0);
    vec2 tc5 = uvs.st + vec2(+texOffset.s,          0.0);
    vec2 tc6 = uvs.st + vec2(-texOffset.s, +texOffset.t);
    vec2 tc7 = uvs.st + vec2(         0.0, +texOffset.t);
    vec2 tc8 = uvs.st + vec2(+texOffset.s, +texOffset.t);

    vec4 col0 = texture2D(uSampler, tc0);
    vec4 col1 = texture2D(uSampler, tc1);
    vec4 col2 = texture2D(uSampler, tc2);
    vec4 col3 = texture2D(uSampler, tc3);
    vec4 col4 = texture2D(uSampler, tc4);
    vec4 col5 = texture2D(uSampler, tc5);
    vec4 col6 = texture2D(uSampler, tc6);
    vec4 col7 = texture2D(uSampler, tc7);
    vec4 col8 = texture2D(uSampler, tc8);

    vec4 sum = 8.0 * col4 - (col0 + col1 + col2 + col3 + col5 + col6 + col7 + col8);
    return vec4(sum.rgb, 1.0);


    if(((sum.r + sum.g + sum.b ) / 3.0) > 0.2){
        return vec4(0.0, .0, .0, 1.);
    }
    return vec4(.0);
}

vec4 Wave()
{
    vec2 uvs = vTextureCoord.xy;
    vec2 center = vec2(0.5,0.5);

    float waveTime = mod(time/3., 4.);

    float distance = distance(uvs, center);
    if ( (distance <= (waveTime + .1)) && 
        (distance >= (waveTime - .1)) ) 
    {
        float diff = (distance - waveTime); 
        float powDiff = 1.0 - pow(abs(diff*10.), 
                                    .8); 
        float diffTime = diff  * powDiff; 
        vec2 diffUV = normalize(uvs - center); 
        uvs = uvs + (diffUV * diffTime);
    } 
    return texture2D(uSampler, uvs);
}

void main(void)
{
    gl_FragColor = vec4(fract(time));

    //gl_FragColor = GrayScale();
    //gl_FragColor = Sepia();
    //gl_FragColor = Vignet();
    //gl_FragColor = Stripes();
    //gl_FragColor = Wiggle();
    gl_FragColor = Pixelize();
    //gl_FragColor = Swirl();
    //gl_FragColor = FishEye();
    //gl_FragColor = Edges();
    //gl_FragColor = Wave();
}