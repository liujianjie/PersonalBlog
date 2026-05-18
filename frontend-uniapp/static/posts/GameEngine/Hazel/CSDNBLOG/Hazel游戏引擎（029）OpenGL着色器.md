> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  使用shader，让渲染的三角形有颜色，并且光于shader的代码抽象到Shader类中（目前只是初步的抽象类）

- 关于Shader

  - 告诉GPU如何处理我们从CPU发送到GPU的顶点数据

  - 着色器(Shader)是运行在GPU上的小程序，分别对应渲染管理不同阶段。
  - 着色器是一种非常独立的程序，因为它们之间不能相互通信；它们之间唯一的沟通只有通过输入和输出。

- 相关网站

  https://www.khronos.org/opengl/wiki/Shader_Compilation

# 项目相关

## 代码

- 增加Shader类

  ```cpp
  #pragma once
  #include <string>
  	class Shader{
  	public:
  		Shader(const std::string& vertexSrc, const std::string& fragmentSrc);
  		~Shader();
  		void Bind() const;
  		void Unbind() const;
  	private:
  		uint32_t m_RendererID;
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "Shader.h"
  #include <glad/glad.h>
  namespace Hazel {
  	Shader::Shader(const std::string& vertexSrc, const std::string& fragmentSrc){
  		// 1.1.创建顶点着色器对象
  		GLuint vertexShader = glCreateShader(GL_VERTEX_SHADER);
  		// Send the vertex shader source code to GL
  		// Note that std::string's .c_str is NULL character terminated.
  		// 1.2.附加顶点着色器源码到顶点着色器对象中
  		const GLchar* source = vertexSrc.c_str();
  		glShaderSource(vertexShader, 1, &source, 0);
  		// 1.3.编译顶点着色器对象
  		glCompileShader(vertexShader);
  		// 1.4.检查是否编译成功
  		GLint isCompiled = 0;
  		glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &isCompiled);
  		if (isCompiled == GL_FALSE){
  			// 1.4.2编译失败可以打印报错信息
  			GLint maxLength = 0;
  			glGetShaderiv(vertexShader, GL_INFO_LOG_LENGTH, &maxLength);
  			// The maxLength includes the NULL character
  			std::vector<GLchar> infoLog(maxLength);
  			glGetShaderInfoLog(vertexShader, maxLength, &maxLength, &infoLog[0]);
  			// We don't need the shader anymore.
  			glDeleteShader(vertexShader);
  			HZ_CORE_ERROR("{0}", infoLog.data());
  			HZ_CORE_ASSERT(false, "Vertex shader compilation failure!");
  			return;
  		}
  		// 片段着色器一样
  		// 2.1.创建片段着色器对象
  		GLuint fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
  		// Send the fragment shader source code to GL
  		// Note that std::string's .c_str is NULL character terminated.
  		// 2.2.附加片段着色器源码到片段着色器对象中
  		source = fragmentSrc.c_str();
  		glShaderSource(fragmentShader, 1, &source, 0);
  		// 2.3.编译片段着色器对象
  		glCompileShader(fragmentShader);
  		// 2.4.检查是否编译成功
  		glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &isCompiled);
  		if (isCompiled == GL_FALSE){
  			// 2.4.2编译失败可以打印报错信息
  			GLint maxLength = 0;
  			glGetShaderiv(fragmentShader, GL_INFO_LOG_LENGTH, &maxLength);
  			// The maxLength includes the NULL character
  			std::vector<GLchar> infoLog(maxLength);
  			glGetShaderInfoLog(fragmentShader, maxLength, &maxLength, &infoLog[0]);
  			// We don't need the shader anymore.
  			glDeleteShader(fragmentShader);
  			// Either of them. Don't leak shaders.
  			glDeleteShader(vertexShader);
  			HZ_CORE_ERROR("{0}", infoLog.data());
  			HZ_CORE_ASSERT(false, "Fragment shader compilation failure!");
  			return;
  		}
  		// Vertex and fragment shaders are successfully compiled.
  		// Now time to link them together into a program.
  		// Get a program object.
  		// 3.1创建着色器程序对象
  		m_RendererID = glCreateProgram();
  		GLuint program = m_RendererID;
  		// 3.2附加着色器对象给着色器程序对象
  		glAttachShader(program, vertexShader);
  		glAttachShader(program, fragmentShader);
  		// 3.3链接着色器程序对象
  		glLinkProgram(program);
  		// 3.4可以检查链接是否成功
  		// Note the different functions here: glGetProgram* instead of glGetShader*.
  		GLint isLinked = 0;
  		glGetProgramiv(program, GL_LINK_STATUS, (int*)&isLinked);
  		if (isLinked == GL_FALSE){
  			GLint maxLength = 0;
  			glGetProgramiv(program, GL_INFO_LOG_LENGTH, &maxLength);
  			// The maxLength includes the NULL character
  			std::vector<GLchar> infoLog(maxLength);
  			glGetProgramInfoLog(program, maxLength, &maxLength, &infoLog[0]);
  			// We don't need the program anymore.
  			glDeleteProgram(program);
  			// Don't leak shaders either.
  			glDeleteShader(vertexShader);
  			glDeleteShader(fragmentShader);
  			HZ_CORE_ERROR("{0}", infoLog.data());
  			HZ_CORE_ASSERT(false, "Shader link failure!");
  			return;
  		}
  		// 4.删除着色器对象
  		// Always detach shaders after a successful link.
  		glDetachShader(program, vertexShader);
  		glDetachShader(program, fragmentShader);
  	}
  	Shader::~Shader(){
  		glDeleteProgram(m_RendererID);
  	}
  	void Shader::Bind() const{
  		glUseProgram(m_RendererID);
  	}
  	void Shader::Unbind() const{
  		glUseProgram(0);
  	}
  }
  ```

- Application

  ```cpp
  Application::Application()
  {
      HZ_CORE_ASSERT(!s_Instance, "引用已经存在");
      s_Instance = this;
  
      // 1.1Application创建窗口
      m_Window = std::unique_ptr<Window>(Window::Create());
      // 1.2Application设置窗口事件的回调函数
      m_Window->SetEventCallback(BIND_EVENT_FN(OnEvent));
  
      // 将ImGui层放在最后
      m_ImGuiLayer = new ImGuiLayer();
      PushOverlay(m_ImGuiLayer);
  
      // 使用OpenGL函数渲染一个三角形
      // 顶点数据
      float vertices[3 * 3] = {
          -0.5f, -0.5f, 0.0f,
          0.5f, -0.5f, 0.0f,
          0.0f,  0.5f, 0.0f
      };
      unsigned int indices[3] = { 0, 1, 2 }; // 索引数据
      // 0.生成顶点数组对象VAO、顶点缓冲对象VBO、索引缓冲对象EBO
      glGenVertexArrays(1, &m_VertexArray);
      glGenBuffers(1, &m_VertexBuffer);
      glGenBuffers(1, &m_IndexBuffer);
      // 1. 绑定顶点数组对象
      glBindVertexArray(m_VertexArray);
      // 2. 把我们的CPU的顶点数据复制到GPU顶点缓冲中，供OpenGL使用
      glBindBuffer(GL_ARRAY_BUFFER, m_VertexBuffer);
      glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
      // 3. 复制我们的CPU的索引数据到GPU索引缓冲中，供OpenGL使用
      glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, m_IndexBuffer);
      glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
      // 4. 设定顶点属性指针，来解释顶点缓冲中的顶点属性布局
      glEnableVertexAttribArray(0);// 开启glsl的layout = 0输入
      glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), nullptr);
      // 着色器代码
      std::string vertexSrc = R"(
  			#version 330 core
  
  			layout(location = 0) in vec3 a_Position;
  			out vec3 v_Position;
  			void main()
  			{
  				v_Position = a_Position;
  				gl_Position = vec4(a_Position, 1.0);	
  			}
  		)";
      std::string fragmentSrc = R"(
  			#version 330 core
  
  			layout(location = 0) out vec4 color;
  			in vec3 v_Position;
  			void main()
  			{
  				color = vec4(v_Position * 0.5 + 0.5, 1.0);
  			}
  		)";
      m_Shader.reset(new Shader(vertexSrc, fragmentSrc));
  	// 在头文件的std::unique_ptr<Shader> m_Shader;
  }
  void Application::Run(){
      while (m_Running)
      {
          glClearColor(0.1f, 0.1f, 0.1f, 1);
          glClear(GL_COLOR_BUFFER_BIT);
          // 5.绑定着色器
          m_Shader->Bind();
          // 6.绑定顶点数组对象，并绘制
          glBindVertexArray(m_VertexArray);
          glDrawElements(GL_TRIANGLES, 3, GL_UNSIGNED_INT, nullptr);
  
  ```

  - 解释

    - 片段着色器

      color = vec4(v_Position * 0.5 + 0.5, 1.0);

      顶点位置*0.5 + 0.5；

      这样顶点颜色不会是黑色，比如顶点颜色：-0.5->0.25

    - 着色器源码字符串被R包围

      ```cpp
      // 原始的-不美观
      string s = "#version 330 core\n"
      "asf\n"
      "adf\n"
      // 用R包围-好
      string s = R"(
      	#version 330 core
      	....
      )"
      ```

## 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306260045599.png)

- 说明

  三个顶点颜色被确定，其围成的区域片段的颜色将会根据三个顶点颜色线性插值

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306260045024.png)