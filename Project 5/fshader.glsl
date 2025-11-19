#version 300 es
precision mediump float;

in vec4 fPosition;
in vec4 fNormal;
in vec4 fTangent;
in vec2 fTexCoord;

uniform sampler2D colorSampler;
uniform sampler2D cloudSampler;
uniform sampler2D nightSampler;
uniform sampler2D normalSampler;
uniform sampler2D specSampler;

uniform bool useColor;
uniform bool useClouds;
uniform bool useNight;
uniform bool useNormal;
uniform bool useSpec;

uniform mat4 model_view;
uniform mat4 projection;

uniform vec4 light_position;
uniform vec4 light_color;
uniform vec4 ambient_light;

vec4 fSpecularColor = vec4(1.0,1.0,1.0,0.0);

out vec4  fColor;

void main() {
    fColor = vec4(0.0,0.0,0.0,1.0);

    //same for all calls
    vec4 veyepos = model_view * fPosition; //get vertex from model to eye space
    vec3 L = normalize(light_position.xyz - veyepos.xyz);
    vec3 V = normalize(-veyepos.xyz);
    float softness = 0.2;

    //toggle cloudmap
    if (useClouds){
        vec4 cNormal = normalize((model_view * fNormal));

        vec4 cloudTex = texture(cloudSampler, fTexCoord);
        vec3 cloudColor = cloudTex.rgb;

        float dayWeight = clamp((dot(L, cNormal.xyz) + softness) / (2.0 * softness), 0.0, 1.0);

        vec3 ambC = ambient_light.rgb * cloudColor;
        //vec3 ambC = vec3(0.0);
        vec3 diffC = max(dot(L, cNormal.xyz), 0.0) * light_color.rgb * cloudColor;

        fColor = vec4((ambC + diffC) * dayWeight, cloudTex.a * dayWeight);
        return;
    }

    //toggle day map
    vec4 dayColor = vec4(0.0);
    if (useColor){
        dayColor = texture(colorSampler, fTexCoord);
    }

    //toggle night map
    vec4 nightColor = vec4(0.0);
    if (useNight){
        nightColor = texture(nightSampler, fTexCoord);
    }

    //toggle normal map
    vec4 N = vec4(0.0);
    if(useNormal){
        vec4 vN = vec4(normalize(model_view * fNormal).xyz, 0.0);
        vec4 vT = vec4(normalize(model_view * fTangent).xyz, 0.0);

        vec4 binormal = vec4(cross(vN.xyz, vT.xyz), 0.0);

        mat4 cocf = mat4(vT, binormal, vN, vec4(0.0,0.0,0.0,1.0));

        N = (texture(normalSampler, fTexCoord) * 2.0) - 1.0;

        N = cocf * N;
    } else {
        N = normalize((model_view * fNormal));
    }

    //can do this now that we have N
    vec3 R = reflect(-L, N.xyz); // vector from light source, reflected across normal

    //day night tranistion
    float dayWeight = clamp((dot(L, N.xyz) + softness) / (2.0 * softness), 0.0, 1.0);
    float nightWeight = 1.0 - dayWeight;

    //normal phong shading
    vec4 fAmbientDiffuseColor = dayColor;
    vec4 amb = fAmbientDiffuseColor * ambient_light * dayWeight;;
    vec4 diff = max(dot(L, N.xyz), 0.0) * fAmbientDiffuseColor * light_color * dayWeight;

    //toggle spec map
    vec4 spec;
    float fSpecularExponent = 1.0;
    if (useSpec){
        vec4 specTex = texture(specSampler, fTexCoord);
        fSpecularExponent = mix(1.0, 10.0, specTex.x);

        spec = pow(max(dot(R, V), 0.0), fSpecularExponent) * fSpecularColor * specTex.x * light_color * dayWeight;
    } else {
        spec = pow(max(dot(R,V), 0.0), fSpecularExponent) * fSpecularColor * light_color * dayWeight;
    }

    if (dot(L, N.xyz) < 0.0) {
        spec = vec4(0.0, 0.0, 0.0, 1.0); //no glare beyond the horizon
    }

    vec4 litColor = amb + diff + spec;

    vec4 unlitColor = nightColor * nightWeight;

    fColor = vec4((litColor + unlitColor).xyz, 1.0);
}