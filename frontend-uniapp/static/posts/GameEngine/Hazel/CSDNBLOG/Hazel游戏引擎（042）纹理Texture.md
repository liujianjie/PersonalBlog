> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  为了给图形表面赋予纹理Texture

- 如何实现

  - 顶点属性中需要有这个顶点的**UV**

  - **stb_img**加载图片数据

  - 片段着色器根据当前片段的UV**采样**图片，从而得到当前片段的纹理信息

    当图形所有的片段着色器运行完，效果就是图形表面被覆上一张图片

- 具体说明纹理

  - 是属于材质Material的一部分
  - 纹理需要被**采样**
    1. 一组顶点位置包围了一个区域
    2. 需要为这个区域上色，这些颜色可以从纹理里来
    3. 而如何获得纹理的颜色，则需要使用采样方式
  - 纹理不止可以包含颜色，还可以包含**高度**什么的，可以不用法线与光源计算就可以得到更逼真一点的模型。

- 类结构

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022052683.png)


# 例子1：在物体上显示纹理坐标的颜色

## 代码

```c++
// 二、渲染正方形的纹理颜色。这里纹理坐标是基于左下角为中心算的，负的为0，正的为1，比如(-0.5f, 0.5f)的坐标纹理是(0.0f, 1.0f)，可以看结果图，更好理解
float squareVertices[5 * 4] = {
    -0.5f, -0.5f, 0.0f, 0.0f, 0.0f,
    0.5f, -0.5f, 0.0f, 1.0f, 0.0f,
    0.5f,  0.5f, 0.0f, 1.0f, 1.0f,
    -0.5f,  0.5f, 0.0f, 0.0f, 1.0f
};
......
    // 2.1设置顶点缓冲区布局
    squareVB->SetLayout({
        {Hazel::ShaderDataType::Float3, "a_Position"},
        {Hazel::ShaderDataType::Float2, "a_TexCoord"}
    });
......
    // 4.着色器
    std::string squareShaderVertexSrc = R"(
			#version 330 core

			layout(location = 0) in vec3 a_Position;
			layout(location = 1) in vec2 a_TexCoord;

			uniform mat4 u_ViewProjection;
			uniform mat4 u_Transform;

			out vec3 v_Position;
			out vec2 v_TexCoord;

			void main(){
				v_TexCoord = a_TexCoord;
				gl_Position = u_ViewProjection * u_Transform * vec4(a_Position, 1.0);
			}			
		)";
std::string squareShaderfragmentSrc = R"(
			#version 330 core

			layout(location = 0) out vec4 color;

			in vec2 v_TexCoord;

			uniform vec3 u_Color;

			void main(){
				color = vec4(v_TexCoord, 0.0f, 1.0f);	
			}			
		)";
m_SquareShader.reset(Hazel::Shader::Create(squareShaderVertexSrc, squareShaderfragmentSrc));
......
    // 1.带纹理颜色的正方形
    Hazel::Renderer::Submit(m_SquareShader, m_SquareVertexArray);
```

## 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022052470.png)

# 例子2：在物体上显示纹理图片

## 关键代码及解释

- OpenGLTexture2D加载纹理

  ```cpp
  #include "hzpch.h"
  #include "OpenGLTexture.h"
  #include "stb_image.h"
  #include <glad/glad.h>
  namespace Hazel {
  	OpenGLTexture2D::OpenGLTexture2D(const std::string& path):
  		m_Path(path)
  	{// 根据路径加载图片
  		int width, height, channels;
  		// stbi_set_flip_vertically_on_load(1);// 设置垂直翻转，由于OpenGL是从上往下的，所以要设置
  		/*
  		路径，加载完返回大小，通道rgb、rbga，返回的字符串指针指向的就是读取的纹理图片数据！
  		*/
  		stbi_uc* data = stbi_load(path.c_str(), &width, &height, &channels, 0);
  		HZ_CORE_ASSERT(data, "Failed to load image");
  		m_Width = width;
  		m_Height = height;
  		/*是纹理、要1个、生成纹理缓冲区返回id给变量*/ // 是GL_TEXTURE_2D，写错过GL_TEXTURE
  		glCreateTextures(GL_TEXTURE_2D, 1, &m_RendererID);
  		/*告诉OpenGLm_RendererID的纹理存储的是rbg8位，宽高的缓冲区*/
  		glTextureStorage2D(m_RendererID, 1, GL_RGB8, m_Width, m_Height);
  		/*告诉opengl，纹理缩小时用线性过滤*/
  		glTextureParameteri(m_RendererID, GL_TEXTURE_MIN_FILTER, GL_LINE);
  		/*告诉opengl，纹理放大时用周围颜色的平均值过滤*/
  		glTextureParameteri(m_RendererID, GL_TEXTURE_MIN_FILTER, GL_LINE);
  		/*指定截取子区域，将纹理图片数据给上传OpenGL。m_RendererID后一个参数是级别。。。啥东西？*/
  		glTextureSubImage2D(m_RendererID, 0, 0, 0, m_Width, m_Height, GL_RGB, GL_UNSIGNED_BYTE, data);
  		/*设置完OpenGL后可以释放，生成的字符串*/
  		stbi_image_free(data);
  	}
  	OpenGLTexture2D::~OpenGLTexture2D()
  	{
  		glDeleteTextures(1, &m_RendererID);
  	}
  	void OpenGLTexture2D::Bind(uint32_t slot) const
  	{
  		glBindTextureUnit(slot, m_RendererID);
  	}
  }
  
  ```

- sandbox.cpp

  ```cpp
  // 三、渲染正方形的纹理。
  float squareTexCoordVertices[5 * 4] = {
  -0.5f, -0.5f, 0.0f, 0.0f, 0.0f,
  0.5f, -0.5f, 0.0f, 1.0f, 0.0f,
  0.5f,  0.5f, 0.0f, 1.0f, 1.0f,
  -0.5f,  0.5f, 0.0f, 0.0f, 1.0f
  };
  ............
  // 4.着色器
  std::string squareTexCoordShaderVertexSrc = R"(
  #version 330 core
  
  layout(location = 0) in vec3 a_Position;
  layout(location = 1) in vec2 a_TexCoord;// 顶点的UV
  
  uniform mat4 u_ViewProjection;
  uniform mat4 u_Transform;
  
  out vec3 v_Position;
  out vec2 v_TexCoord;
  
  void main(){
  v_TexCoord = a_TexCoord;
  gl_Position = u_ViewProjection * u_Transform * vec4(a_Position, 1.0);
  }			
  )";
  std::string squareTexCoordShaderfragmentSrc = R"(
  #version 330 core
  
  layout(location = 0) out vec4 color;
  
  in vec2 v_TexCoord;
  
  uniform sampler2D u_Texture; // 采样纹理的纹理单元
  
  void main(){
  	color = texture(u_Texture, v_TexCoord);	// 采样
  	//color = vec4(v_TexCoord, 0.0f, 1.0f);	
  }			
  )";
  m_SquareTexCoordShader.reset(Hazel::Shader::Create(squareTexCoordShaderVertexSrc, squareTexCoordShaderfragmentSrc));
  // 只需绑定和上传一次，所以放在这里
  // 加载图片////////////////////////////////////////////////////
  m_SquareTexture = Hazel::Texture2D::Create("asserts/textures/Checkerboard.png"); // Create返回的是shared_ptr，所以只需要赋值=
  
  std::dynamic_pointer_cast<Hazel::OpenGLShader>(m_SquareTexCoordShader)->Bind();
  /*把fragment的u_Texture要采样的纹理槽为0
  因为下面的代码，把m_SquareTexture->Bind,设置了m_SquareTexture的m_RenderID绑定在OpenGL的0槽上！
  */
  std::dynamic_pointer_cast<Hazel::OpenGLShader>(m_SquareTexCoordShader)->UploadUniformInt("u_Texture", 0);
  每一帧
  // 0.带纹理的正方形
  m_SquareTexture->Bind();
  glm::mat4 squareTexCoordtransfrom = glm::translate(glm::mat4(1.0f), { 1.0f, 0.0f, 0.0f });
  Hazel::Renderer::Submit(m_SquareTexCoordShader, m_SquareTexCoordVertexArray, squareTexCoordtransfrom);
  ```

## 注意问题

### 图片模糊(采样方式)

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022052208.png)

由于图片是64*64的，很小，在矩形上被放大，而放大采用的采样的方式是线性插值，所以很模糊

```cpp
/*告诉opengl，纹理放大时用线性过滤*/
glTextureParameteri(m_RendererID, GL_TEXTURE_MAG_FILTER, GL_LINE);
需要改成
/*告诉opengl，纹理放大时用周围颜色的平均值过滤*/
glTextureParameteri(m_RendererID, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
```

### 图片被翻转

```cpp
stbi_set_flip_vertically_on_load(1);// 设置垂直翻转，由于OpenGL是从上往下的，所以要设置
```

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022052690.png)

# 项目引入stb

1. 拷贝代码

   https://github.com/nothings/stb/blob/master/stb_image.h

   到vendor文件夹下

   ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022052699.png)

2. stb_image.cpp文件定义宏

   ```cpp
   #include "hzpch.h"
   #define STB_IMAGE_IMPLEMENTATION
   #include "stb_image.h"
   
   ```

3. 修改premake.lua文件

   ```cpp
   IncludeDir["stb_image"] = "GameEngineLightWeight/vendor/stb_image"
   
   include "GameEngineLightWeight/vendor/GLFW"
   include "GameEngineLightWeight/vendor/Glad"
   include "GameEngineLightWeight/vendor/imgui"
   
   project "GameEngineLightWeight"
   	location "GameEngineLightWeight"
   	kind "StaticLib"
   	language "C++"
   	cppdialect "C++17"	
   	staticruntime "on"
   
   	targetdir ("bin/" .. outputdir .. "/%{prj.name}")
   	objdir ("bin-int/" .. outputdir .. "/%{prj.name}")
   
   	pchheader "hzpch.h"
   	pchsource "GameEngineLightWeight/src/hzpch.cpp"
   
   	files{
   		"%{prj.name}/src/**.h",
   		"%{prj.name}/src/**.cpp",
   		"%{prj.name}/vendor/stb_image/**.cpp",
   		"%{prj.name}/vendor/stb_image/**.h",
   		"%{prj.name}/vendor/glm/glm/**.hpp",
   		"%{prj.name}/vendor/glm/glm/**.inl"
   	}
   	defines{
   		"_CRT_SECURE_NO_WARNINGS"
   	}
   
   	includedirs{
   		"%{prj.name}/src",
   		"%{prj.name}/vendor/spdlog/include",
   		"%{IncludeDir.Glad}",
   		"%{IncludeDir.GLFW}",
   		"%{IncludeDir.ImGui}",
   		"%{IncludeDir.glm}",
   		"%{IncludeDir.stb_image}"
   	}
   ```