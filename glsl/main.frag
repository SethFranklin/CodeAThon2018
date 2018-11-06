
uniform highp vec3 Color;

varying highp vec3 FragNorm;
varying highp vec2 FragUV;
varying highp vec3 OrgNorm;

void main()
{

	gl_FragColor = vec4(((OrgNorm + 1.0) / 2.0) * max(dot(FragNorm, normalize(vec3(0, 0, 1.0))), 0.0), 1.0);

	//gl_FragColor = vec4((OrgNorm + 1.0) / 2.0, 1.0);

}