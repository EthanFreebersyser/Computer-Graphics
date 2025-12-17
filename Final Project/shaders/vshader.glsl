#version 300 es
precision mediump float;
precision lowp int;

//Vertex in's
in vec4 vPosition;
in vec4 vAmbientDiffuseColor;
in vec4 vNormal;
in vec4 vSpecularColor;
in float vSpecularExponent; //note this is a float, not a vec4

in float vPatchIndex;

//Vertex outs
out vec4 fPosition;
out vec4 fAmbientDiffuseColor;
out vec4 fNormal;
out vec4 fSpecularColor;
out float fSpecularExponent; //note this is a float, not a vec4

flat out int fPatchIndex;

uniform mat4 model_view;
uniform mat4 projection;

uniform vec4 ambient_light;

void
main()
{
    gl_Position = projection * model_view * vPosition;
    //Vertex
    fPosition = vPosition;
    fAmbientDiffuseColor = vAmbientDiffuseColor;
    fNormal = vNormal;
    fSpecularColor = vSpecularColor;
    fSpecularExponent = vSpecularExponent;

    fPatchIndex = int(vPatchIndex);

}