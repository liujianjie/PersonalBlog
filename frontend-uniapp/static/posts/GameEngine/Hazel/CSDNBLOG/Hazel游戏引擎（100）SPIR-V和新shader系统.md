> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 前前言

  - Cherno未来想做的

    当前项目以后Cherno打算支持vulkan，由于vulkan着色器代码也支持glsl语言，但是和Opengl的glsl**标准不一**。

    因为Vulkan中存在OpenGL的不存在的东西（反之亦然），所以着色器代码肯定不同。

  - vulkan和opengl的glsl对比-以Uniform为例

    - 主要不同

      在于，opengl支持uniform，vulkan不支持uniform，而是支持uniform**缓冲区**（push_constant、存储缓冲区）这比OpenGL的glsl更好。

      opengl的uniform

      ```glsl
      uniform mat4 m_transform;
      ```

      vulkan的uniform缓冲区

      ```glsl
      layout(std140, binding=2) uniform Transform{
          mat4 Transform;
      }
      ```

    - Opengl支持的uniform哪里不好

      场景有很多个物体，这样一个物体调用一次drawcall（不是批处理模式），每个物体需要显示都需要**上传**摄像机的投影视图矩阵，那么10000个物体就有10000个uniform更新，但其实摄像机的投影视图矩阵在当前帧不变的，这样就会造成性能的下降。

    - vulkan哪里好

      vulkan的uniform是在**GPU开辟的一块缓冲区**，每个物体需要摄像机的投影视图矩阵，只需将这块缓冲区放入投影矩阵的值，然后每个drawcall都去**访问**这块缓冲区，得到投影视图矩阵就行，性能更好。

    - 但后面我发现，OpenGL也有[uniform缓冲区](https://blog.csdn.net/qq_34060370/article/details/131026857)，不知是否我理解错了。

- 此节目的

  重新写shader系统，使其能支持vulkan和opengl两种glsl

- 如何实现

  使用SPIR-V，作为**中间表示语言**，即可支持vulkan也支持opengl的glsl

# 介绍SPIR-V

- 介绍SPIR-V

  vulkanApi要求以SPIR-V组件的形式提供着色器，而这个SPIR-V相当于“**中间表示语言**”

  1. 可以将写好的glsl、hlsl转换为SPIR-V
  2. 也可以将SPIR-V转换为glsl、hlsl。

  使得可以完成只写**一**次shader，自动生成**各种不同版本的shader语言**。

- SPIR-V什么工作方式：（可能我理解错了了）

  Cherno说，将vulkan的glsl用SPIR-V**编译**成SPIR-V**二进制**文件，然后可以用SPIR-V的**交叉编译**这个二进制文件可以成hlsl、metal，以及兼容OpenGL的glsl。

- 实现过程中的重要功能

  使用SPIR-V加入着色器**缓存**功能，不用每次都编译着色器，**节省时间**。

以上很有可能说的不正确，我有点迷糊，东拼西凑的写完以上内容，但大概意思是这样。

# 项目改变

- 下载vulkan

  [地址](https://vulkan.lunarg.com/sdk/home#windows)

  需要下载最新，安装的时候每个组件最好都点上，需要有这几个文件

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308122242275.png)

- 环境变量

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308122242277.png)

  特别是VULKAN_SDK，接下来的premake会获取这个环境变量

- 修改premake

  ```cpp
  ......
  outputdir = "%{cfg.buildcfg}-%{cfg.system}-%{cfg.architecture}"
  
  VULKAN_SDK = os.getenv("VULKAN_SDK")
  
  -- Include directories relative to root folder (solution directory)
  IncludeDir = {}
  IncludeDir["GLFW"] = "GameEngineLightWeight/vendor/GLFW/include"
  ......
  IncludeDir["ImGuizmo"] = "GameEngineLightWeight/vendor/ImGuizmo" 
  IncludeDir["VulkanSDK"] = "%{VULKAN_SDK}/Include"
  
  LibraryDir = {}
  
  LibraryDir["VulkanSDK"] = "%{VULKAN_SDK}/Lib"
  LibraryDir["VulkanSDK_Debug"] = "%{wks.location}/GameEngineLightWeight/vendor/VulkanSDK/Lib"
  
  Library = {}
  Library["Vulkan"] = "%{LibraryDir.VulkanSDK}/vulkan-1.lib"
  Library["VulkanUtils"] = "%{LibraryDir.VulkanSDK}/VkLayer_utils.lib"
  
  Library["ShaderC_Debug"] = "%{LibraryDir.VulkanSDK_Debug}/shaderc_sharedd.lib"
  Library["SPIRV_Cross_Debug"] = "%{LibraryDir.VulkanSDK_Debug}/spirv-cross-cored.lib"
  Library["SPIRV_Cross_GLSL_Debug"] = "%{LibraryDir.VulkanSDK_Debug}/spirv-cross-glsld.lib"
  Library["SPIRV_Tools_Debug"] = "%{LibraryDir.VulkanSDK_Debug}/SPIRV-Toolsd.lib"
  
  Library["ShaderC_Release"] = "%{LibraryDir.VulkanSDK}/shaderc_shared.lib"
  Library["SPIRV_Cross_Release"] = "%{LibraryDir.VulkanSDK}/spirv-cross-core.lib"
  Library["SPIRV_Cross_GLSL_Release"] = "%{LibraryDir.VulkanSDK}/spirv-cross-glsl.lib"
  
  group "Dependencies"
  	include "GameEngineLightWeight/vendor/GLFW"
  ......
  project "GameEngineLightWeight"
  	location "GameEngineLightWeight"
      
      includedirs{
  		......
  		"%{IncludeDir.ImGuizmo}",
  		"%{IncludeDir.VulkanSDK}"
  	}
          ......
  		filter "configurations:Debug"
  		......
  			links
  			{
  				"%{Library.ShaderC_Debug}",
  				"%{Library.SPIRV_Cross_Debug}",
  				"%{Library.SPIRV_Cross_GLSL_Debug}"
  			}
  		filter "configurations:Release"
  		......
  			links
  			{
  				"%{Library.ShaderC_Release}",
  				"%{Library.SPIRV_Cross_Release}",
  				"%{Library.SPIRV_Cross_GLSL_Release}"
  			}
  ```

  注意，项目要取消动态链接改为**静态链接**了，可能是vulkan的那几个lib文件是静态的

  ```cpp
  kind "StaticLib"
  -- staticruntime "on"
  staticruntime "off"
  ```

# 代码流程

## 给GPU的Uniform缓冲区上传数据

- 写vulkan的glsl

  ```glsl
  // 纹理的glsl
  #type vertex
  #version 450 core
  
  layout(location = 0) in vec3 a_Position;
  layout(location = 1) in vec4 a_Color;
  layout(location = 2) in vec2 a_TexCoord;
  layout(location = 3) in float a_TexIndex;
  layout(location = 4) in float a_TilingFactor;
  layout(location = 5) in int a_EntityID;
  
  //////////////////////////////////////////////////
  // uniform缓冲区///////////////////////////////////
  // 使用0号缓冲区///////////////////////////////////
  layout(std140, binding = 0) uniform Camera{ // std140是布局
  	mat4 u_ViewProjection;
  };
  // uniform mat4 u_ViewProjection;
  struct VertexOutput {
  	vec4 Color;
  	vec2 TexCoord;
  	float TexIndex;
  	float TilingFactor;
  };
  layout(location = 0) out VertexOutput Output;
  layout(location = 4) out flat int v_EntityID; // 4 是因为TilingFactor 是3
  //out vec4 v_Color;
  //out vec2 v_TexCoord;
  //out float v_TexIndex;
  //out float v_TilingFactor;
  //out flat int v_EntityId;
  
  void main() {
  	/*v_Color = a_Color;
  	v_TexCoord = a_TexCoord;
  	v_TexIndex = a_TexIndex;
  	v_TilingFactor = a_TilingFactor;
  	v_EntityId = a_EntityId;*/
  	Output.Color = a_Color;
  	Output.TexCoord = a_TexCoord;
  	Output.TexIndex = a_TexIndex;
  	Output.TilingFactor = a_TilingFactor;
  	v_EntityID = a_EntityID;
  	
  	gl_Position = u_ViewProjection * vec4(a_Position, 1.0);
  }
  
  #type fragment
  #version 450 core
  
  layout(location = 0) out vec4 color;
  layout(location = 1) out int color2;
  
  struct VertexOutput {
  	vec4 Color;
  	vec2 TexCoord;
  	float TexIndex;
  	float TilingFactor;
  };
  layout(location = 0) in VertexOutput Input;
  layout(location = 4) in flat int v_EntityID; // 4 是因为TilingFactor 是3
  
  //in vec4 v_Color;
  //in vec2 v_TexCoord;
  //in float v_TexIndex;
  //in float v_TilingFactor;
  //in flat int v_EntityId;
  
  layout(binding = 0) uniform sampler2D u_Textures[32];
  //uniform sampler2D u_Textures[32];
  
  void main() {
  	 color = texture(u_Textures[int(Input.TexIndex)], Input.TexCoord * Input.TilingFactor) * Input.Color;
  	 color2 = v_EntityID;// 给顶点包围的区域每个像素都设置为实体ID
  }
  ```

  - std140是什么

    是一种布局，[点这](https://blog.csdn.net/qq_34060370/article/details/131026857)了解

  - 注意被注释的是OpenGL的Glsl写法

- 新建UniformBuffer类

  ```cpp
  #pragma once
  #include "Hazel/Core/Core.h"
  
  namespace Hazel {
  	class UniformBuffer
  	{
  	public:
  		virtual ~UniformBuffer(){}
  		virtual void SetData(const void* data, uint32_t size, uint32_t offset = 0) = 0;
  		
  		static Ref<UniformBuffer> Create(uint32_t size, uint32_t binding);
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "OpenGLUniformBuffer.h"
  #include <glad/glad.h>
  
  namespace Hazel {
      //////////////////////////////////////////////////////////////////
      // Uniform缓冲区/////////////////////////////////
  	OpenGLUniformBuffer::OpenGLUniformBuffer(uint32_t size, uint32_t binding)
  	{
  		// GPU创建缓冲区，并且返回缓冲区号m_RendererID
  		glCreateBuffers(1, &m_RendererID);
  		// 声明缓冲区的数据
  		glNamedBufferData(m_RendererID, size, nullptr, GL_DYNAMIC_DRAW); // TODO:investigate usage hint
  		// 将在glsl上设置的bingding 0号缓冲区与真正的缓冲区m_RendererID联系起来
  		glBindBufferBase(GL_UNIFORM_BUFFER, binding, m_RendererID);
  		/*	 
  			glsl代码中声明使用0号的uniform缓冲区
  			layout(std140, binding = 0) uniform Camera
  		*/
  	}
  	OpenGLUniformBuffer::~OpenGLUniformBuffer()
  	{
  		glDeleteBuffers(1, &m_RendererID);
  	}
      ////////////////////////////////////////////////////////////////////////
      // 上传数据给缓冲区///////////////////////////////////////////////////////
  	void OpenGLUniformBuffer::SetData(const void* data, uint32_t size, uint32_t offset)
  	{
  		// 上传数据给m_RendererID号缓冲区吧，实则给GPU的bingding号缓冲区
  		glNamedBufferSubData(m_RendererID, offset, size, data);
  	}
  }
  
  ```

  由上，**glBindBufferBase**，将使glsl上设置的**bingding 0号**缓冲区与真正的缓冲区**m_RendererID**联系起来

- Renderer2D.cpp上传摄像机的投影视图矩阵给Uniform缓冲区

  ```cpp
  struct Renderer2DData
  {
  	.....
      struct CameraData
      {
          glm::mat4 ViewProjection;
      };
      CameraData CameraBuffer;
      Ref<UniformBuffer> CameraUniformBuffer;
  };
  
  void Renderer2D::Init()
  {
      .....
  	// 初始化CameraUniformBuffer实例，在构造函数中就将调用上面的glBindBufferBase函数
      s_Data.CameraUniformBuffer = UniformBuffer::Create(sizeof(Renderer2DData::CameraData), 0);
  }
  void Renderer2D::BeginScene(const EditorCamera& camera)
  {
      HZ_PROFILE_FUNCTION();
  
      s_Data.CameraBuffer.ViewProjection = camera.GetViewProjection();
      
      ////////////////////////////////////////////////////////////////////////
      // 上传数据给缓冲区///////////////////////////////////////////////////////
      // 使用CameraUniformBuffer的SetData才真正的上传投影视图矩阵给GPU的Uniform缓冲区
      s_Data.CameraUniformBuffer->SetData(&s_Data.CameraBuffer, sizeof(Renderer2DData::CameraData));
  
      StartBatch();
  }
  ```

  给CameraUniformBuffer的m_RendererID缓冲区上传数据，也是上传到glsl上声明使用0号uniform缓冲区上

  layout(std140, binding = 0) uniform Camera

## SPIR-V编译

- 将vulkan的glsl**编译**成SPIR-V二进制文件，并且保存在本地作为**缓存**

  ```cpp
  void OpenGLShader::CompileOrGetVulkanBinaries(const std::unordered_map<GLenum, std::string>& shaderSources)
  {
      GLuint program = glCreateProgram();
  
      shaderc::Compiler compiler;
      shaderc::CompileOptions options;
      options.SetTargetEnvironment(shaderc_target_env_vulkan, shaderc_env_version_vulkan_1_2);
      const bool optimize = true;
      if (optimize) {
          // 优化：性能优先
          options.SetOptimizationLevel(shaderc_optimization_level_performance);
      }
      // 生成二进制的缓存目录
      std::filesystem::path cacheDirectory = Utils::GetCacheDirectory();
  
      auto& shaderData = m_VulkanSPIRV;
      shaderData.clear();
      for (auto&& [stage, source] : shaderSources)
      {
          std::filesystem::path shaderFilePath = m_FilePath;
          std::filesystem::path cachedPath = cacheDirectory / (shaderFilePath.filename().string() + Utils::GLShaderStageCachedOpenGLFileExtension(stage));
  
          std::ifstream in(cachedPath, std::ios::in | std::ios::binary);
          // 缓存是否存在
          if (in.is_open()) {// 存在打开加载
              in.seekg(0, std::ios::end);
              auto size = in.tellg();
              in.seekg(0, std::ios::beg);
  
              auto& data = shaderData[stage];// ?
              data.resize(size / sizeof(uint32_t));
              in.read((char*)data.data(), size);
          }
          else {
              /////////////////////////////////////////////////////////////////////
              // 将Vulkan的glsl编译成SPIR-V二进制文件
              shaderc::SpvCompilationResult module = compiler.CompileGlslToSpv(source, Utils::GLShaderStageToShaderC(stage), m_FilePath.c_str(), options);
              if (module.GetCompilationStatus() != shaderc_compilation_status_success) {
                  HZ_CORE_ERROR(module.GetErrorMessage());
                  HZ_CORE_ASSERT(false);
              }
  
              shaderData[stage] = std::vector<uint32_t>(module.cbegin(), module.cend());
  
              std::ofstream out(cachedPath, std::ios::out | std::ios::binary);
              if (out.is_open()) {
                  auto& data = shaderData[stage];
                  out.write((char*)data.data(), data.size() * sizeof(uint32_t));
                  out.flush();
                  out.close();
              }
          }
      }
      for (auto&& [stage, data] : shaderData)
          Reflect(stage, data);
  }
  ```

- 将Vulkan的glsl的SPIR-V二进制文件**转换**为OpenGL的glsl源文件字符串

  再将OpenGL的glsl源文件字符串**转换**为SPIR-V二进制文件，并且保存在本地作为缓存

  ```cpp
  void OpenGLShader::CompileOrGetOpenGLBinaries()
  {
      auto& shaderData = m_OpenGLSPIRV;
  
      shaderc::Compiler compiler;
      shaderc::CompileOptions options;
      options.SetTargetEnvironment(shaderc_target_env_vulkan, shaderc_env_version_vulkan_1_3);
      const bool optimize = true;
      if (optimize) {
          // 优化：性能优先
          options.SetOptimizationLevel(shaderc_optimization_level_performance);
      }
      // 生成二进制的缓存目录
      std::filesystem::path cacheDirectory = Utils::GetCacheDirectory();
  
      shaderData.clear();
      m_OpenGLSourceCode.clear();
      for (auto&& [stage, spirv] : m_VulkanSPIRV)
      {
          std::filesystem::path shaderFilePath = m_FilePath;
          std::filesystem::path cachedPath = cacheDirectory / (shaderFilePath.filename().string() + Utils::GLShaderStageCachedOpenGLFileExtension(stage));
  
          std::ifstream in(cachedPath, std::ios::in | std::ios::binary);
          // 缓存是否存在
          if (in.is_open()) {// 存在打开加载
              in.seekg(0, std::ios::end);
              auto size = in.tellg();
              in.seekg(0, std::ios::beg);
  
              auto& data = shaderData[stage];// ?
              data.resize(size / sizeof(uint32_t));
              in.read((char*)data.data(), size);
          }
          else {
              /////////////////////////////////////////////////////////////////////
              // 将Vulkan的glsl的SPIR-V二进制文件转换为OpenGL的glsl源文件字符串
              spirv_cross::CompilerGLSL glslCompiler(spirv);
              m_OpenGLSourceCode[stage] = glslCompiler.compile();
              auto& source = m_OpenGLSourceCode[stage];
              /////////////////////////////////////////////////////////////////////
              // 再将OpenGL的glsl源文件字符串转换为SPIR-V二进制文件，并且保存在本地作为缓存
              shaderc::SpvCompilationResult module = compiler.CompileGlslToSpv(source, Utils::GLShaderStageToShaderC(stage), m_FilePath.c_str(), options);
              if (module.GetCompilationStatus() != shaderc_compilation_status_success) {
                  HZ_CORE_ERROR(module.GetErrorMessage());
                  HZ_CORE_ASSERT(false);
              }
  
              shaderData[stage] = std::vector<uint32_t>(module.cbegin(), module.cend());
  
              std::ofstream out(cachedPath, std::ios::out | std::ios::binary);
              if (out.is_open()) {
                  auto& data = shaderData[stage];
                  out.write((char*)data.data(), data.size() * sizeof(uint32_t));
                  out.flush();
                  out.close();
              }
          }
      }
  }
  ```

- 用OpenGL的API**编译链接**OpenGL版本的glsl的SPIR-V二进制文件

  与原始编译链接OpenGL的GLSL着色器代码不太一样

  ```cpp
  void OpenGLShader::CreateProgram()
  {
      GLuint program = glCreateProgram();
  
      std::vector<GLuint> shaderIDs;
      for (auto&& [stage, spirv] : m_OpenGLSPIRV)
      {
          GLuint shaderID = shaderIDs.emplace_back(glCreateShader(stage));
          glShaderBinary(1, &shaderID, GL_SHADER_BINARY_FORMAT_SPIR_V, spirv.data(), spirv.size() * sizeof(uint32_t));
          glSpecializeShader(shaderID, "main", 0, nullptr, nullptr);
          glAttachShader(program, shaderID);
      }
  
      glLinkProgram(program);
  
      GLint isLinked;
      glGetProgramiv(program, GL_LINK_STATUS, &isLinked);
      if (isLinked == GL_FALSE)
      {
          GLint maxLength;
          glGetProgramiv(program, GL_INFO_LOG_LENGTH, &maxLength);
  
          std::vector<GLchar> infoLog(maxLength);
          glGetProgramInfoLog(program, maxLength, &maxLength, infoLog.data());
          HZ_CORE_ERROR("Shader linking failed ({0}):\n{1}", m_FilePath, infoLog.data());
  
          glDeleteProgram(program);
  
          for (auto id : shaderIDs)
              glDeleteShader(id);
      }
  
      for (auto id : shaderIDs)
      {
          glDetachShader(program, id);
          glDeleteShader(id);
      }
      m_RendererID = program;
  }
  ```

# 项目遇到耗费我一天半的BUG

## BUG信息以及解决方法

- 错误如下

  0x00007FFE06F0FDB6 (atio6axx.dll)处(位于 GameEngine-Editor.exe 中)引发的异常: 0xC0000005: 写入位置 0x0000000000000008 时发生访问冲突。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308122246998.png)

- 错误原因

  **AMD显卡**运行由OpenGL的SPIR-V二进制编译的shader会报这个错，是AMD显卡的问题！

- 解决方法一

  显卡设置用英伟达显卡运行此程序解决

  ![](../图片/100.SPIR-V/202308132109595.png)

  ![](../图片/100.SPIR-V/202308132110937.png)

- 解决方法二：适合只有AMD显卡的电脑

  来自Github上Hazel的ISSUE：[点这](https://github.com/TheCherno/Hazel/issues/440)

  解决方法来自ISSUE fixed：[点这](https://github.com/TheCherno/Hazel/pull/522)

  写openglshader代码时，用Vulkan的SPIR-V二进制编译shader。

  大意是：使用 SpirV 和反射的唯一解决方案是使用 SpirV-Cross 为 OpenGL 生成的 sharder 源，而不是 spirV 二进制文件。

  For now the only solution i found to keep using SpirV and the reflection is by using sharder sources generated by SpirV-Cross for OpenGL instead fof the spirV binary.

  ```cpp
  GLuint program = glCreateProgram();
  
  std::vector<GLuint> glShadersIDs;
  
  int glShaderIDIndex = 0;
  for (auto&& [stage, spirv] : m_VulkanSPIRV) {
      spirv_cross::CompilerGLSL glslCompiler(spirv);
      auto& source = glslCompiler.compile();
  
      GLuint shader;
  
      shader = glCreateShader(stage);
  
      const GLchar* sourceCStr = source.c_str();
      glShaderSource(shader, 1, &sourceCStr, 0);
  
      glCompileShader(shader);
  
      int isCompiled = 0;
      glGetShaderiv(shader, GL_COMPILE_STATUS, &isCompiled);
      if (isCompiled == GL_FALSE) {
          int maxLength = 0;
          glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &maxLength);
  
          std::vector<char> infoLog(maxLength);
          glGetShaderInfoLog(shader, maxLength, &maxLength, &infoLog[0]);
  
          glDeleteShader(shader);
  
          HZ_CORE_ERROR("{0}", infoLog.data());
          HZ_CORE_ASSERT(false, "[OpenGL] Shader compilation failure!");
          break;
      }
      glAttachShader(program, shader);
      glShadersIDs[glShaderIDIndex++] = shader;
  }
  ```

  我还没完整运行起来。

  第二种方法比较靠谱：检测是amd显卡就换

## 我解决此BUG的路线

  - 以为是代码写错

    下载了TheCherno的项目并且修复好运行起来

    - 克隆Hazel项目到本地

      ```cmd
      git clone https://github.com/TheCherno/Hazel
      ```

      2023年2月8日补：

      上面的git命令因为缺少--recursive所以没成功拷贝子模块，用下面的命令，可以省去下面修 复子模块 的步骤

      ```cmd
      git clone --recursive https://github.com/TheCherno/Hazel
      ```

    - 回退到第100集版本

      到Hazel项目的提交历史复制SHA

      ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308122242303.png)

      运行以下命令,即可回退

      ```cmd
      git checkout sha
      ```

    - **修复子模块**

      将.gitmodules文件替换为正确的url地址

      ```cmd
      [submodule "Hazel/vendor/spdlog"]
      	path = Hazel/vendor/spdlog
      	url = https://github.com/gabime/spdlog
      [submodule "Hazel/vendor/GLFW"]
      	path = Hazel/vendor/GLFW
      	url = https://github.com/TheCherno/glfw
      [submodule "Hazel/vendor/imgui"]
      	path = Hazel/vendor/imgui
      	url = https://github.com/TheCherno/imgui
      [submodule "Hazel/vendor/glm"]
      	path = Hazel/vendor/glm
      	url = https://github.com/g-truc/glm
      [submodule "Hazel/vendor/yaml-cpp"]
      	path = Hazel/vendor/yaml-cpp
      	url = https://github.com/TheCherno/yaml-cpp
      [submodule "Hazel/vendor/ImGuizmo"]
      	path = Hazel/vendor/ImGuizmo
      	url = https://github.com/TheCherno/ImGuizmo
      ```

      再运行下载子模块git命令

      ```cmd
      git submodule init
      git submodule update
      ```

    - 然后拷贝vulkan的lib，重新指向premake脚本，即可

    运行发现还是报同样的错，遂放弃。

  - 以为是vulkan版本错误

    卸载最新的1.3.236.0版本

    - 安装1.2.170.0版本

      但是发现这个版本竟没有Cherno要求的shaderc_sharedd.lib，即后带d的lib文件，于是混用1.3.236.0的**shaderc_sharedd**.lib文件，运行不出意外还是报错，直接运行不起来，即卸载

      难怪Cherno的python脚本写了验证是否有shaderc_sharedd.lib文件

      ```python
      @classmethod
      def CheckVulkanSDKDebugLibs(cls):
          vulkanSDK = os.environ.get("VULKAN_SDK")
          shadercdLib = Path(f"{vulkanSDK}/Lib/shaderc_sharedd.lib")
      
          return shadercdLib.exists()
      ```

    - 安装1.3.216.0版本

      问题和上一样**没有shaderc_sharedd**.lib，混用1.3.236.0的shaderc_sharedd.lib文件，报错。即卸载

      ```cmd
      error LNK2001: 无法解析的外部符号 "protected: virtual void __cdecl spirv_cross::CompilerGLSL::declare_undefined_values(void)" (?declare_undefined_values@CompilerGLSL@spirv_cross@@MEAAXXZ)
      ```

- 收获

  1. 解决方法来自Hazel的GitHub的ISSUE，而我却忘记遇到bug应该在这里找类似的问题。
  2. 搜索谷歌问题有技巧，应该用**atio6axx.dll**关键字搜索，我用一整段错误信息搜索找不到合适解决方法。

  即：最好先好好查谷歌、GitHub的issue再折腾其它方法。

# 运行脚本安装Vulkan遇到的问题

- SyntaxError: (unicode error) 'utf-8' codec can't decode byte 0xa3

  python程序中使用了UTF-8编码，而没有在脚本上申明要使用UTF-8编码。说的更加直接一点，就是用了中文字符，一般我们习惯使用中文作为注释。

  在python脚本程序中，主动申明我们使用UTF-8编码方式。

  申明的方法如下，在程序最上面增加以下语句，尤其是第二句。

  ```python
  #!/usr/bin/python
  # -*- coding: UTF-8 -*-
  ```

- ssl.SSLEOFError: EOF occurred in violation of protocol (_ssl.c:1129)

  搜索一番发现是**因为电脑开了代理(科学上网工具)的原因**，但是实际上代理是可以正常使用的。

  方法：关闭科学上网

- 安装了Vulkan但是python脚本却**检测不到**

  确定在**环境变量**设置了VULKAN_SDK名称的环境变量

  ```cmd
  VULKAN_SDK
  D:\3DGameSDK\Vulkan\1.3.236.0
  ```

  如果设置了，还是检测不到，就**重启IDE**

