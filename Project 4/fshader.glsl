#version 300 es
precision mediump float;
precision lowp int;

in vec4 fPosition;
in vec4 fNormal;
in vec4 fAmbientDiffuseColor;
in vec4 fSpecularColor;
in float fSpecularExponent;

uniform mat4 model_view;
uniform mat4 projection;

uniform vec4 light_position[5];
uniform vec4 light_color[5];
uniform vec3 light_direction[5];
uniform float light_cutoff[5];

uniform vec4 ambient_light;

out vec4 fColor;

void main() {
    vec4 diff = vec4(0.0);
    vec4 spec = vec4(0.0);

    vec4 veyepos = model_view * fPosition; //get vertex from model to eye space
    vec3 N = normalize((model_view * fNormal).xyz);

    for (int i = 0; i < 5; i++){
        vec3 L = normalize(light_position[i].xyz - veyepos.xyz);
        vec3 V = normalize(-veyepos.xyz);
        vec3 R = reflect(-L, N); // vector from light source, reflected across normal

        vec3 nlight_dir = normalize(light_direction[i].xyz);
        vec3 light_to_frag = normalize((veyepos - light_position[i]).xyz);
        float light_angle = dot(nlight_dir, light_to_frag);

        if (light_angle > light_cutoff[i]){
            diff += max(dot(L,N), 0.0) * fAmbientDiffuseColor * light_color[i];
            spec += pow(max(dot(R,V), 0.0), fSpecularExponent) * fSpecularColor * light_color[i];
        } else {
            diff += vec4(0, 0, 0, 1);
            spec += vec4(0, 0, 0, 1);
        }

        if(dot(L,N) < 0.0){
            spec += vec4(0.0,0.0,0.0,1.0); //no glare beyond the horizon
        }

        fColor += diff + spec;
        //fColor = vec4(N, 1.0);
    }
    vec4 amb = fAmbientDiffuseColor * ambient_light;
    fColor += amb;
}
