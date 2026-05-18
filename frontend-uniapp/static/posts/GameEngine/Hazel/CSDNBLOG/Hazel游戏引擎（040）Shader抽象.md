> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  完成Shader的抽象，因为目前只有Shader类，应该像顶点数组、顶点缓冲一样完善Shader的抽象

- 类结构

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022047717.png)

  同之前抽象的结构一样：Shader是一个抽象类，有一个静态的Create方法，返回Shader指针，在这个函数中根据不同的预定义，实例化OpenGLShader还是DxShader(图中未画）。

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022047723.png)

# 项目改变

## 关键代码

- 动态指针强转

  ```cpp
  std::dynamic_pointer_cast<Hazel::OpenGLShader>(m_FlatShader)->UploadUniformFloat3("u_Color", m_SquareColor);
  ```

  因为要执行OpenGLShader（子类）**独有的函数**UploadUniformFloat3，而Shader（父类）里没有这个函数UploadUniformFloat3，所以需要**动态指针强转**，转为派生类的指针类型。

- 由于上传的是vec3，所以fragment的代码uniform接受的是vec3，而color是vec4类型，所以要补充最后A通道

  ```cpp
  std::string blueShaderfragmentSrc = R"(
  			#version 330 core
  
  			layout(location = 0) out vec4 color;
  
  			in vec3 v_Position;
  
  			uniform vec3 u_Color;
  
  			void main(){
  				color = vec4(u_Color, 1.0f);	// 补充最后A通道
  			}			
  		)";
  		
  ```

- 使用imgui对应效果图的**颜色选择器**

  ```cpp
  virtual void OnImgGuiRender()override {
      ImGui::Begin("Settings");
      ImGui::ColorEdit3("Square Color",glm::value_ptr(m_SquareColor));
      ImGui::End();
  }
  ```

## 具体代码

- Shader父类

  ```cpp
  #pragma once
  #include <string>
  namespace Hazel {
  	class Shader
  	{
  	public:
  		virtual ~Shader() = default;
  
  		virtual void Bind() const = 0;
  		virtual void UnBind() const = 0;
  
  		static Shader* Create(const std::string& vertexSrc, const std::string& fragmentSrc);
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "Shader.h"
  #include <glad/glad.h>
  #include "Renderer.h"
  #include "Platform/OpenGL/OpenGLShader.h"
  namespace Hazel {
  
  	Shader* Shader::Create(const std::string& vertexSrc, const std::string& fragmentSrc) {
  		switch (Renderer::GetAPI())
  		{
  		case RendererAPI::API::None: HZ_CORE_ASSERT(false, "RendererAPI:None is currently not supported!"); return nullptr;
  		case RendererAPI::API::OpenGL: return new OpenGLShader(vertexSrc, fragmentSrc);
  		}
  		HZ_CORE_ASSERT(false, "UnKnown RendererAPI!");
  		return nullptr;
  	}
  }
  ```

- OpenGlShader子类

  ```cpp
  #pragma once
  #include "Hazel/Renderer/Shader.h"
  #include <string>
  #include <glm/glm.hpp>
  namespace Hazel {
  	class OpenGLShader : public Shader
  	{
  	public:
  		OpenGLShader(const std::string& vertexSrc, const std::string& fragmentSrc);
  		virtual ~OpenGLShader();
  
  		virtual void Bind() const override;
  		virtual void UnBind() const override;
  
  		void UploadUniformInt(const std::string& name, int value);
  
  		void UploadUniformFloat(const std::string& name, float value);
  		void UploadUniformFloat2(const std::string& name, const glm::vec2& value);
  		void UploadUniformFloat3(const std::string& name, const glm::vec3& value);
  		void UploadUniformFloat4(const std::string& name, const glm::vec4& value);
  		
  		void UploadUniformMat3(const std::string& name, const glm::mat3& matrix);
  		void UploadUniformMat4(const std::string& name, const glm::mat4& matrix);
  	private:
  		uint32_t m_RendererID;
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "OpenGLShader.h"
  #include <glad/glad.h>
  #include <glm/gtc/type_ptr.hpp>
  namespace Hazel {
  	OpenGLShader::OpenGLShader(const std::string& vertexSrc, const std::string& fragmentSrc)
  	{
  		.......
  	}
  	OpenGLShader::~OpenGLShader()
  	{
  		glDeleteProgram(m_RendererID);
  	}
  	void OpenGLShader::Bind() const
  	{
  		glUseProgram(m_RendererID);
  	}
  	void OpenGLShader::UnBind() const
  	{
  		glUseProgram(0);
  	}
  	void OpenGLShader::UploadUniformInt(const std::string& name, int value)
  	{
  		GLint location = glGetUniformLocation(m_RendererID, name.c_str());
  		glUniform1i(location, value);
  	}
  	.......
  }
  ```

- Sandapp

  ```cpp
  #include <Hazel.h>
  #include "imgui/imgui.h"
  #include "Platform/OpenGL/OpenGLShader.h"
  #include <glm/gtc/matrix_transform.hpp>
  #include <glm/gtc/type_ptr.hpp>
  class ExampleLayer :public Hazel::Layer {
  public:
  	ExampleLayer() : Layer("Example"), m_Camera(-1.6f, 1.6f, -0.9f, 0.9f) ,m_CameraPosition(0.0f)
  	{
  		......
  		// 新增内容：渲染正方形
  		float squareVertices[3 * 4] = {
  			-0.75f, -0.75f, 0.0f,
  			 0.75f, -0.75f, 0.0f,
  			 0.75f,  0.75f, 0.0f,
  			-0.75f,  0.75f, 0.0f
  		};
  		// 1.创建顶点数组
  		m_SquareVA.reset(Hazel::VertexArray::Create());
  		// 2.创建顶点缓冲区
  		std::shared_ptr<Hazel::VertexBuffer> squareVB;
  		squareVB.reset(Hazel::VertexBuffer::Create(squareVertices, sizeof(squareVertices)));
  		// 2.1设置顶点缓冲区布局
  		squareVB->SetLayout({
  			{Hazel::ShaderDataType::Float3, "a_Position"}
  			});
  		// 1.1顶点数组添加顶点缓冲区，并且在这个缓冲区中设置布局
  		m_SquareVA->AddVertexBuffer(squareVB);
  		// 3.索引缓冲
  		uint32_t squareIndices[] = { 0, 1, 2, 2, 3, 0 };
  		std::shared_ptr<Hazel::IndexBuffer> squareIB;
  		squareIB.reset(Hazel::IndexBuffer::Create(squareIndices, sizeof(squareIndices) / sizeof(uint32_t)));
  		// 1.2顶点数组设置索引缓冲区
  		m_SquareVA->SetIndexBuffer(squareIB);
  		// 4.着色器
  		std::string blueShaderVertexSrc = R"(
  			#version 330 core
  			
  			layout(location = 0) in vec3 a_Position;
  			uniform mat4 u_ViewProjection;
  			uniform mat4 u_Transform;
  
  			out vec3 v_Position;
  
  			void main(){
  				v_Position = a_Position;
  				gl_Position = u_ViewProjection * u_Transform * vec4(a_Position, 1.0);
  			}			
  		)";
  		std::string blueShaderfragmentSrc = R"(
  			#version 330 core
  			
  			layout(location = 0) out vec4 color;
  
  			in vec3 v_Position;
  			
  			uniform vec3 u_Color;
  				
  			void main(){
  				color = vec4(u_Color, 1.0f);	
  			}			
  		)";
  		m_FlatShader.reset(Hazel::Shader::Create(blueShaderVertexSrc, blueShaderfragmentSrc));
  	}
  	void OnUpdate(Hazel::Timestep ts) override {
  		......
  		Hazel::Renderer::BeginScene(m_Camera);
  		// 正方形
  		glm::mat4 sqtransfrom = glm::translate(glm::mat4(1.0f), m_SquarePosition);
  		Hazel::Renderer::Submit(m_FlatShader, m_SquareVA, sqtransfrom);
  		// 渲染一组正方形
  		// 设置这一组正方形的颜色，通过imgui来设置
          // 强转////////////////////////////////////////////////////////////////////
  		std::dynamic_pointer_cast<Hazel::OpenGLShader>(m_FlatShader)->UploadUniformFloat3("u_Color", m_SquareColor);
  		// 缩放
  		static glm::mat4 scale = glm::scale(glm::mat4(1.0f), {0.05f, 0.05f, 0.05f});
  		for (int i = 0; i < 20; i++) {
  			for (int j = 0; j < 20; j++) {
  				glm::vec3 pos(i * 0.08f, j * 0.08f, 0.0f);
  				glm::mat4 smallsqtransfrom = glm::translate(glm::mat4(1.0f), pos) * scale;
  				Hazel::Renderer::Submit(m_FlatShader, m_SquareVA, smallsqtransfrom);
  			}
  		}
  		// 三角形
  		Hazel::Renderer::Submit(m_Shader, m_VertexArray);
  		Hazel::Renderer::EndScene();
  	}
  	.....
      // 颜色选择器////////////////////////////////////////////////////////
  	virtual void OnImgGuiRender()override {
  		ImGui::Begin("Settings");
  		ImGui::ColorEdit3("Square Color",glm::value_ptr(m_SquareColor));
  		ImGui::End();
  	}
  private:
  	std::shared_ptr<Hazel::Shader> m_Shader;				// shader类 指针
  	std::shared_ptr<Hazel::VertexArray> m_VertexArray;		// 顶点数组类 指针
  
  	std::shared_ptr<Hazel::Shader> m_FlatShader;			// shader类 指针
  	std::shared_ptr<Hazel::VertexArray> m_SquareVA;			// 顶点数组类 指针
  
  	Hazel::OrthographicCamera m_Camera;
  
  	// 为完成移动旋转的属性
  	glm::vec3 m_CameraPosition;
  	float m_CameraMoveSpeed = 5.0f;
  
  	float m_CameraRotation = 0.0f;
  	float m_CameraRotationSpeed = 180.0f;
  
  	// 矩形的世界矩阵的属性
  	glm::vec3 m_SquarePosition = { -1.0f, -1.0f, -1.0f };
  	float m_SquareMoveSpeed = 5.0f;
  
  	// 矩形的颜色
  	glm::vec3 m_SquareColor = { 0.0f, 0.0f, 0.0f };
  };
  class Sandbox : public Hazel::Application {
  public:
  	Sandbox() {
  		PushLayer(new ExampleLayer());
  		//PushOverlay(new Hazel::ImGuiLayer());
  	}
  	~Sandbox() {
  	}
  };
  Hazel::Application* Hazel::CreateApplication() {
  	return new Sandbox();
  }
  ```

  

