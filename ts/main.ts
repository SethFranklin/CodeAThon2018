
/// <reference path = "gl-matrix.d.ts" />

declare var Promise: any;

var canvas : HTMLCanvasElement;
var gl : WebGLRenderingContext;
var Int : any;

var MainShader : Shader;

window.onload = function() : void
{


	canvas = <HTMLCanvasElement> document.getElementById("canvas");
	gl = canvas.getContext("webgl");

	if (!gl)
	{

		alert("Your browser doesn't support WebGL");

		return;

	}

	gl.enable(gl.DEPTH_TEST);

	gl.enable(gl.CULL_FACE);
	gl.cullFace(gl.BACK);

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gl.viewport(0, 0, canvas.width, canvas.height);

	Input.Start();

	Int = setInterval(Update, 16.666666667);

}

function Update()
{

	// Update

	// End of Update, render

	Input.PushBackInputs();

	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

}

window.onunload = function() : void
{

	

}

window.onresize = function() : void
{

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	gl.viewport(0, 0, canvas.width, canvas.height);

}

window.onkeydown = function(Event) : void
{

	Input.KeyDownEvent(Event.keyCode);

}

window.onkeyup = function(Event) : void
{

	Input.KeyUpEvent(Event.keyCode);
	
}

window.onclick = function() : void
{

	
	
}

window.onmousemove = function(Event) : void
{

	

}

class Model // Doesn't do model matrix: Chunk.shader.UniformMat4("Model", this.ModelMatrix);
{

	private VBO : WebGLBuffer;
	private VertCount : number;
	private ModelMatrix : Float32Array;

	public constructor()
	{

		this.VBO = gl.createBuffer();

	}

	public UpdateMesh(Verticies : number[]) : void
	{

		this.VertCount = Verticies.length / 8;

		gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(Verticies), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

	}

	public Render() : void
	{

		gl.bindBuffer(gl.ARRAY_BUFFER, this.VBO);

		gl.enableVertexAttribArray(MainShader.PositionLocation);
		gl.vertexAttribPointer(MainShader.PositionLocation, 3, gl.FLOAT, false, 32, 0);

		gl.enableVertexAttribArray(MainShader.NormalLocation);
		gl.vertexAttribPointer(MainShader.NormalLocation, 3, gl.FLOAT, false, 32, 12);

		gl.enableVertexAttribArray(MainShader.UVLocation);
		gl.vertexAttribPointer(MainShader.UVLocation, 2, gl.FLOAT, false, 32, 24);

		gl.drawArrays(gl.TRIANGLES, 0, this.VertCount);

		gl.bindBuffer(gl.ARRAY_BUFFER, null);

	}

	public Delete() : void
	{

		gl.bindBuffer(gl.ARRAY_BUFFER, null);
		gl.deleteBuffer(this.VBO);

	}

}

class Input
{

	private static DownNow : boolean[] = [];
	private static DownBefore : boolean[] = [];

	public static Start() : void
	{

		Input.DownNow.length = 256; // 256 different keycodes
		Input.DownBefore.length = 256;

		for (var i : number = 0; i < 256; i++) // Fils it with false statements
		{

			Input.DownNow[i] = false;
			Input.DownBefore[i] = false;

		}

	}

	public static PushBackInputs() : void
	{

		Input.DownBefore = Input.DownNow.slice(0);

	}

	public static IsKeyDown(Key : number) : boolean
	{

		return (Input.DownNow[Key]);

	}

	public static IsKeyPressed(Key : number) : boolean
	{

		return (Input.DownNow[Key] && !Input.DownBefore[Key]);

	}

	public static IsKeyReleased(Key : number) : boolean
	{

		return (!Input.DownNow[Key] && Input.DownBefore[Key]);

	}

	public static KeyUpEvent(Key : number) : void
	{

		Input.DownNow[Key] = false;

	}

	public static KeyDownEvent(Key : number) : void
	{

		Input.DownNow[Key] = true;

	}

}

class Shader
{

	private ID : WebGLProgram;
	private UniformMap : any = {};
	public PositionLocation : GLint;
	public NormalLocation : GLint;
	public UVLocation : GLint;

	constructor(Name : string, UniformList : string[])
	{

		var context = this;

		HTTPRequest("GET", window.location.href + "/../glsl/" + Name + ".vert").then(function(VertexSource : string)
		{

			HTTPRequest("GET", window.location.href + "/../glsl/" + Name + ".frag").then(function(FragmentSource : string)
			{

				var VertexShader : WebGLShader = gl.createShader(gl.VERTEX_SHADER);
				var FragmentShader : WebGLShader = gl.createShader(gl.FRAGMENT_SHADER);

				gl.shaderSource(VertexShader, VertexSource);
				gl.shaderSource(FragmentShader, FragmentSource);

				gl.compileShader(VertexShader);
				gl.compileShader(FragmentShader);

				var VertTest : GLenum = gl.getShaderParameter(VertexShader, gl.COMPILE_STATUS);
				var FragTest : GLenum = gl.getShaderParameter(FragmentShader, gl.COMPILE_STATUS);

				if (!VertTest)
				{

					console.log("Vertex Shader (" + Name + ".vert) Compile Error:\n" + gl.getShaderInfoLog(VertexShader));

				}

				if (!FragTest)
				{

					console.log("Fragment Shader (" + Name + ".frag) Compile Error:\n" + gl.getShaderInfoLog(FragmentShader));

				}

				var ShaderProgram : WebGLProgram = gl.createProgram();

				gl.attachShader(ShaderProgram, VertexShader);
				gl.attachShader(ShaderProgram, FragmentShader);

				gl.linkProgram(ShaderProgram);

				var ProgramTest : GLenum = gl.getProgramParameter(ShaderProgram, gl.LINK_STATUS);

				if (!ProgramTest)
				{

					console.log("Shader Program (" + Name + ") Compile Error:\n" + gl.getProgramInfoLog(ShaderProgram));

				}

				context.PositionLocation = gl.getAttribLocation(ShaderProgram, "Position");
				context.NormalLocation = gl.getAttribLocation(ShaderProgram, "Normal");
				context.UVLocation = gl.getAttribLocation(ShaderProgram, "UV");

				context.UniformMap = {};

				for (var Uniform : number = 0; Uniform < UniformList.length; Uniform++)
				{

					context.UniformMap[UniformList[Uniform]] = gl.getUniformLocation(ShaderProgram, UniformList[Uniform]);

				}

				gl.deleteShader(VertexShader);
				gl.deleteShader(FragmentShader);

				context.ID = ShaderProgram;

			}, function(Reject : string)
			{

				console.log(Reject);

			});

		}, function(Reject : string)
		{

			console.log(Reject);

		});

	}
	
	Use() : void
	{

		gl.useProgram(this.ID);

	}

	Delete() : void
	{

		gl.deleteProgram(this.ID);

	}

	UniformFloat(Name : string, Value : number) : void // Typescript allows overloading, but when compiled to javascript it doesn't work.
	{

		gl.uniform1f(this.UniformMap[Name], Value);

	}

	UniformInt(Name : string, Value : number) : void
	{

		gl.uniform1i(this.UniformMap[Name], Value);

	}

	UniformVec3(Name : string, Value : Float32Array) : void
	{

		gl.uniform3f(this.UniformMap[Name], Value[0], Value[1], Value[2]);

	}

	UniformVec2(Name : string, Value : Float32Array) : void
	{

		gl.uniform2f(this.UniformMap[Name], Value[0], Value[1]);

	}

	UniformMat4(Name : string, Value : Float32Array) : void
	{

		gl.uniformMatrix4fv(this.UniformMap[Name], false, Value);

	}

}

class Texture
{

	private ID : WebGLTexture;
	private WrapMode : GLenum;
	private FilterMode : GLenum;

	constructor(Name : string, NewWrap : GLenum, NewFilter : GLenum)
	{

		var context = this;

		context.ID = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.ID);

		context.WrapMode = NewWrap;
		context.FilterMode = NewFilter;

		var pixel = new Uint8Array([0, 0, 0, 0]); // Set color to pink while it loads

		gl.bindTexture(gl.TEXTURE_2D, context.ID);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

		var image = new Image();
		image.src = "/../3d-graphing/texture/" + Name + ".png";

		image.onload = function()
		{

			gl.bindTexture(gl.TEXTURE_2D, context.ID);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

			if (Texture.PowerOfTwo(image.width) && Texture.PowerOfTwo(image.height))
			{

				gl.generateMipmap(gl.TEXTURE_2D);

				

			}

		}

	}

	Use(Location : GLint) : void
	{

		gl.activeTexture(gl.TEXTURE0 + Location);
		gl.bindTexture(gl.TEXTURE_2D, this.ID);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, this.WrapMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, this.WrapMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, this.FilterMode);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.FilterMode);

	}

	Delete() : void
	{

		gl.deleteTexture(this.ID);

	}

	private static PowerOfTwo(a : number) : boolean
	{

		return (a & (a - 1)) == 0;

	}

}

function HTTPRequest(RequestType, URL) : Promise<any>
{

	return new Promise(function(Resolve, Reject)
	{

		var XMLHTTP : XMLHttpRequest = new XMLHttpRequest();

		XMLHTTP.open(RequestType, URL);

		switch (RequestType)
		{

			case "GET":	

				XMLHTTP.send();

				break;

		}

		XMLHTTP.onload = function()
		{

			if (XMLHTTP.status == 200) Resolve(XMLHTTP.response);
			else Reject(XMLHTTP.statusText);

		}

	});

}