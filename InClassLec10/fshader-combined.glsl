#version 300 es
precision mediump float;
precision lowp int;

in vec4 color;
in vec4 fPosition;
in vec4 fAmbientDiffuseColor;
in vec4 fNormal;
in vec4 fSpecularColor;
in float fSpecularExponent; //note this is a float, not a vec4

uniform int mode; //0: unlit, 1:Gouraud, 2: Phong, 3: Cel
uniform mat4 model_view;
uniform mat4 projection;
uniform vec4 light_position;
uniform vec4 light_color;
uniform vec4 ambient_light;

const vec4[] colorPallet = vec4[](vec4(0,0,0,1), vec4(0.2,0,0,1), vec4(0.4,0,0,1), vec4(0.6,0,0,1), vec4(0.8,0.5,0.5,1), vec4(1,1,1,1));

out vec4 fColor;

void main()
{
	vec4 amb = vec4(0,0,0,1);
	vec4 diff = vec4(0,0,0,1);
	vec4 spec = vec4(0,0,0,1);

	if(mode == 0){ //Unlit
		fColor = color;

	}else if (mode == 1){ //Gouraud
		fColor = color;
	} else if (mode == 2){ //Phong
       vec4 veyepos = model_view * fPosition; //get vertex from model to eye space
       vec3 L = normalize(light_position.xyz - veyepos.xyz);
       vec3 V = normalize(-veyepos.xyz);
       vec3 N = normalize((model_view * fNormal).xyz);
       vec3 R = reflect(-L, N); // vector from light source, reflected across normal

       vec4 amb = fAmbientDiffuseColor * ambient_light;
       vec4 diff = max(dot(L,N), 0.0) * fAmbientDiffuseColor * light_color;
       vec4 spec = pow(max(dot(R,V), 0.0), fSpecularExponent) * fSpecularColor * light_color;

       if(dot(L,N) < 0.0){
           spec = vec4(0.0,0.0,0.0,1.0); //no glare beyond the horizon
       }

       fColor = amb + diff + spec;
       //fColor = vec4(N, 1.0);
    } else if (mode == 3) {
        vec4 veyepos = model_view * fPosition; //get vertex from model to eye space
        vec3 L = normalize(light_position.xyz - veyepos.xyz);
        vec3 V = normalize(-veyepos.xyz);
        vec3 N = normalize((model_view * fNormal).xyz);
        vec3 R = reflect(-L, N); // vector from light source, reflected across normal

        vec4 amb = fAmbientDiffuseColor * ambient_light;
        vec4 diff = max(dot(L,N), 0.0) * fAmbientDiffuseColor * light_color;
        vec4 spec = pow(max(dot(R,V), 0.0), fSpecularExponent) * fSpecularColor * light_color;

        if(dot(L,N) < 0.0){
            spec = vec4(0.0,0.0,0.0,1.0); //no glare beyond the horizon
        }

        fColor = colorPallet[int(float(amb.x + diff.x + spec.x) * 6.0) - 1];
    }

}