#version 300 es
precision mediump float;

in vec4 vPosition;
in vec4 vNormal;
in vec4 vTangent;
in vec2 vTexCoord;

out vec4 fPosition;
out vec4 fNormal;
out vec4 fTangent;
out vec2 fTexCoord;

uniform mat4 model_view;
uniform mat4 projection;

uniform vec4 light_position;
uniform vec4 light_color;
uniform vec4 ambient_light;

void
main() {
    gl_Position = projection * model_view * vPosition;
    fPosition = vPosition;
    fNormal = vNormal;
    fTangent = vTangent;
    fTexCoord = vTexCoord;
}