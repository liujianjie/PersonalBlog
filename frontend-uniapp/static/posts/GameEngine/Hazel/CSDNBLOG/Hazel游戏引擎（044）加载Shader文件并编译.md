> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  由于之前的着色器代码是写在Sandbox中的，属于硬编码，并且不好扩展和编写和美观等。

  想设计成从**文件加载**着色器代码，所以需要写相关代码**读取文件内容**，最终得到相应着色器代码

- 如何实现

  - 使用面向对象处理，将Shader代码加载作为Shader类的行为。

  - 将shader代码放到assert文件夹下，成为资源，用Shader类的函数代码加载解析这个文件（使用C++的fstream类读取文件内容）
  - 得到着色器代码字符串后再编译、链接、删除，

# 关键代码

- OpenGlShader的字符串读取放在string里，解析结果放在map的value中

  ```c++
  std::string OpenGLShader::ReadFile(const std::string& filepath)
  {
      std::string result;
      std::ifstream in(filepath, std::ios::in, std::ios::binary);// 二进制读取？为什么还是保持字符串的形式？
      if (in) {
          in.seekg(0, std::ios::end);			// 将指针放在最后面
          result.resize(in.tellg());			// 初始化string的大小, in.tellg()返回位置
          in.seekg(0, std::ios::beg);			// in指回头部
          in.read(&result[0], result.size());	// in读入放在result指向的内存中
      }
      else {
          HZ_CORE_ERROR("不能打开文件:{0}", filepath);
      }
      return result;
  }
  std::unordered_map<GLenum, std::string> OpenGLShader::PreProcess(const std::string& source)
  {
      std::unordered_map<GLenum, std::string> shaderSources;
  
      std::string typeToken = "#type";
      size_t typeTokenLen = typeToken.size();
      size_t findCurPos = source.find(typeToken, 0);
      size_t findNextPos = findCurPos;
      while (findNextPos != std::string::npos) {
          size_t curlineEndPos = source.find_first_of("\r\n", findCurPos);///r/n写错为/r/n
          HZ_CORE_ASSERT(curlineEndPos != std::string::npos, "解析shader失败" );
          size_t begin = findCurPos + typeTokenLen + 1;
  
          std::string type = source.substr(begin, curlineEndPos - begin);// 获取到是vertex还是fragment
          HZ_CORE_ASSERT(ShaderTypeFromString(type), "无效的shader的类型	");
  
          size_t nextLinePos = source.find_first_not_of("\r\n", curlineEndPos);
          findNextPos = source.find(typeToken, nextLinePos);
          // 获取到具体的shader代码
          shaderSources[ShaderTypeFromString(type)] = source.substr(nextLinePos, findNextPos - (nextLinePos == std::string::npos ? source.size() - 1 : nextLinePos));
  
          findCurPos = findNextPos;
      }
      return shaderSources;
      /*
  			用find，而不是find_firtst_of，因为
  			find返回完全匹配的字符串的的位置；
  			find_first_of返回 被查 匹配字符串中某个字符的第一次出现位置。
  
  			std::string::npos是一个非常大的数
  			source.substr(0, source.size() + 10000)截取到从头到末尾，不会报错
  		*/
  }
  ```

- 图解释解析代码的各个位置

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022055276.png)


# 遇到的错误

- 错误信息

  由于OpenGlShader子类有自己的Unpload函数，而父类Shader没有，所以需要动态指针强转指针类型为派生类指针指向派生类。

  在SandboxApp代码中

  ```cpp
  std::dynamic_pointer_cast<Hazel::OpenGLShader>(m_SquareTexCoordShader);
  ```

  使用了**动态指针强转**，泛型类型是OpenGLShader，那么SandboxApp就需要引入OpenGLShader.h

  1. 而OpenGLShader头文件#include <glad/glad3.h>文件
  2. 当前的应用处于Sandbox项目中
  3. 而这个Sandbox项目**并不包含**#include <glad/glad3.h>这个文件，所以会**报错**。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022054814.png)

  并且由于我在OpenGlShader.h文件中#include<GLFW/glfw3.h>头文件，也会报下面的错

  ![bug1_2](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022054273.png)

- 报错分析

  看Premake.lua文件

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022054343.png)

  这三个项目都被GameEngineLightWeight项目引用中，**并不向Sandbox项目提供**。

- 处理错误：解决方法

  - 解决无法包括glfw/glfw3.h

    删除在OpenGLShader.h的glfw/glfw3.h，而是放到OpenGLShader.cpp文件中#include <glad/glad.h>

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022054271.png)

    因为cpp文件被**编译**obj，在SandboxApp代码中并不包含OpenGLShader.cpp文件，也就不包含glad/glad.h。

  - 解决无法包括glad/glad.h

    OpenGlShader#include <glad/glad.h>是因为需要用到**Glenum**这个声明，所以在本文件**定义**GLenum并**删除**#include <glad/glad.h>即可

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022054285.png)

    这样Sandbox就无法包含glad/glad.h文件了

- 区分glm.hpp

  当OpenGLShader.h 引入<glm/glm.hpp>数学库文件，Sandbox**不报错**是因为

  - 在premake中**设置**了GameEngineLightWeight包含这个glm数学库文件。
  - 且Sandbox**引用**了GameEngineLightWeight项目，所以在Sandbox可以**直接包含**glm数学库文件

  而glad.h文件是属于GLAD项目中的，被GameEngineLightWeight**所引用**，所以能被GameEngineLightWeight包含，但是Sandbox项目没引用GLAD项目，所以Sandbox无法包含glad.h

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022054282.png)

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022054143.png)

# 代码修改

- OpenGLShader.cpp

  ```cpp
  #include "hzpch.h"
  #include "OpenGLShader.h"
  #include <fstream>
  #include <glad/glad.h>
  #include <glm/gtc/type_ptr.hpp>
  namespace Hazel {
  	static GLenum ShaderTypeFromString(const std::string& type) {
  		if (type == "vertex") {
  			return GL_VERTEX_SHADER;
  		}
  		if (type == "fragment" || type == "pixel") {
  			return GL_FRAGMENT_SHADER;
  		}
  		HZ_CORE_ASSERT(false, "不知道的shader类型");
  		return 0;
  	}
  	OpenGLShader::OpenGLShader(const std::string& filepath)
  	{
  		std::string source = ReadFile(filepath);
  		HZ_CORE_ASSERT(source.size(), "GLSL读取的字符串为空");
  		auto shaderSources = PreProcess(source);
  		Compile(shaderSources);
  	}
  	OpenGLShader::OpenGLShader(const std::string& vertexSrc, const std::string& fragmentSrc)
  	{
  		std::unordered_map<GLenum, std::string> shaderSources;
  		shaderSources[GL_VERTEX_SHADER] = vertexSrc;
  		shaderSources[GL_FRAGMENT_SHADER] = fragmentSrc;
  		Compile(shaderSources);
  	}
  	std::string OpenGLShader::ReadFile(const std::string& filepath)
  	{
  		std::string result;
  		std::ifstream in(filepath, std::ios::in, std::ios::binary);// 二进制读取？为什么还是保持字符串的形式？
  		if (in) {
  			in.seekg(0, std::ios::end);			// 将指针放在最后面
  			result.resize(in.tellg());			// 初始化string的大小, in.tellg()返回位置
  			in.seekg(0, std::ios::beg);			// in指回头部
  			in.read(&result[0], result.size());	// in读入放在result指向的内存中
  		}
  		else {
  			HZ_CORE_ERROR("不能打开文件:{0}", filepath);
  		}
  		return result;
  	}
  	std::unordered_map<GLenum, std::string> OpenGLShader::PreProcess(const std::string& source)
  	{
  		std::unordered_map<GLenum, std::string> shaderSources;
  
  		std::string typeToken = "#type";
  		size_t typeTokenLen = typeToken.size();
  		size_t findCurPos = source.find(typeToken, 0);
  		size_t findNextPos = findCurPos;
  		while (findNextPos != std::string::npos) {
  			size_t curlineEndPos = source.find_first_of("\r\n", findCurPos);///r/n写错为/r/n
  			HZ_CORE_ASSERT(curlineEndPos != std::string::npos, "解析shader失败" );
  			size_t begin = findCurPos + typeTokenLen + 1;
  
  			std::string type = source.substr(begin, curlineEndPos - begin);// 获取到是vertex还是fragment
  			HZ_CORE_ASSERT(ShaderTypeFromString(type), "无效的shader的类型	");
  
  			size_t nextLinePos = source.find_first_not_of("\r\n", curlineEndPos);
  			findNextPos = source.find(typeToken, nextLinePos);
  			// 获取到具体的shader代码
  			shaderSources[ShaderTypeFromString(type)] = source.substr(nextLinePos, findNextPos - (nextLinePos == std::string::npos ? source.size() - 1 : nextLinePos));
  
  			findCurPos = findNextPos;
  		}
  		return shaderSources;
  		/*
  			用find，而不是find_firtst_of，因为
  			find返回完全匹配的字符串的的位置；
  			find_first_of返回被查匹配字符串中某个字符的第一次出现位置。
  
  			std::string::npos是一个非常大的数
  			source.substr(0, source.size() + 10000)截取到从头到末尾，不会报错
  		*/
  	}
  	void OpenGLShader::Compile(const std::unordered_map<GLenum, std::string>& shaderSources)
  	{
  		GLuint program = glCreateProgram();
  		std::vector<GLenum> glShaderIDs(shaderSources.size());
  		for (auto &kv : shaderSources) {
  			GLenum type = kv.first;
  			const std::string& source = kv.second;
  			// Create an empty vertex shader handle
  			GLuint shader = glCreateShader(type);
  			// Send the vertex shader source code to GL
  			// Note that std::string's .c_str is NULL character terminated.
  			const GLchar* sourceCStr = source.c_str();
  			glShaderSource(shader, 1, &sourceCStr, 0);
  			// Compile the vertex shader
  			glCompileShader(shader);
  			GLint isCompiled = 0;
  			glGetShaderiv(shader, GL_COMPILE_STATUS, &isCompiled);
  			if (isCompiled == GL_FALSE)
  			{
  				GLint maxLength = 0;
  				glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &maxLength);
  				// The maxLength includes the NULL character
  				std::vector<GLchar> infoLog(maxLength);
  				glGetShaderInfoLog(shader, maxLength, &maxLength, &infoLog[0]);
  				// We don't need the shader anymore.
  				glDeleteShader(shader);
  				// Use the infoLog as you see fit.
  				// In this simple program, we'll just leave
  				HZ_CORE_ERROR("{0} ", infoLog.data());
  				HZ_CORE_ASSERT(false, "shader 编译失败!");
  				break;
  			}			
  			// Attach our shaders to our program
  			glAttachShader(program, shader);
  			glShaderIDs.push_back(shader);
  		}
  		m_RendererID = program;
  		// Link our program
  		glLinkProgram(program);
  		// Note the different functions here: glGetProgram* instead of glGetShader*.
  		GLint isLinked = 0;
  		glGetProgramiv(program, GL_LINK_STATUS, (int*)&isLinked);
  		if (isLinked == GL_FALSE)
  		{
  			GLint maxLength = 0;
  			glGetProgramiv(program, GL_INFO_LOG_LENGTH, &maxLength);
  			// The maxLength includes the NULL character
  			std::vector<GLchar> infoLog(maxLength);
  			glGetProgramInfoLog(program, maxLength, &maxLength, &infoLog[0]);
  			// We don't need the program anymore.
  			glDeleteProgram(program);
  			// Don't leak shaders either.
  			for (auto id : glShaderIDs) {
  				glDeleteShader(id);
  			}
  			// Use the infoLog as you see fit.
  			// In this simple program, we'll just leave
  			HZ_CORE_ERROR("{0} ", infoLog.data());
  			HZ_CORE_ASSERT(false, "shader link failure!");
  			return;
  		}
  		// Always detach shaders after a successful link.
  		for (auto id : glShaderIDs) {
  			glDetachShader(program, id);
  		}
  	}
  ......
  }
  ```

- SandboxApp.cpp

  ```cpp
  //m_SquareTexCoordShader.reset(Hazel::Shader::Create(squareTexCoordShaderVertexSrc, squareTexCoordShaderfragmentSrc));
  m_SquareTexCoordShader.reset(Hazel::Shader::Create("asserts/shaders/Texture.glsl"));
  ```

