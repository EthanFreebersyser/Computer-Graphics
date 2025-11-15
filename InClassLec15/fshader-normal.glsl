#version 300 es

precision highp float;

in vec2 ftexCoord;
in vec3 vT; //parallel to surface in eye space
in vec3 vN; //perpendicular to surface in eye space
in vec4 position;

uniform vec4 light_position;
uniform vec4 light_color;
uniform vec4 ambient_light;
uniform sampler2D colorMap;
uniform sampler2D normalMap;

out vec4  fColor;

void main()
{

	//TODO don't forget to re-normalize normal and tangent vectors on arrival
    vec4 vNN = vec4(normalize(vN), 0.0);
    vec4 vTN = vec4(normalize(vT), 0.0);

	//TODO binormal is cross of normal and tangent vectors in eye space
    vec4 binormal = vec4(cross(vNN.xyz, vTN.xyz), 0.0);

	//TODO construct a change of coordinate frame mat4 with columns of
	//Tangent, Binormal, Normal, (0,0,0,1)
	//This will transform from local space (normal map values) to eye space
    mat4 cocf = mat4(vTN, binormal, vNN, vec4(0.0,0.0,0.0,1.0));

	vec3 L = normalize(light_position - position).xyz;
	vec3 E = normalize(-position).xyz;

	//TODO read from normal map
	//values stored in normal texture is [0,1] range, we need [-1, 1] range
    vec4 nM = (texture(normalMap, ftexCoord) * 2.0) - 1.0;

	//TODO multiply change of coordinate frame matrix by normal map value
	//to convert from local space to eye space
    nM = cocf * nM;

	vec4 amb = texture(colorMap, ftexCoord) * ambient_light;
	//TODO calculate diffuse term using our eye-space vectors and the color map value
    vec4 diff = max(dot(L,nM.xyz),0.0) * texture(colorMap, ftexCoord) ;

	//bricks aren't shiny, so we'll skip the specular term on this one
	fColor = amb + diff;

}