> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节所作

  - 需要在050节的基础上的Sandbox2D类再做一次封装，将去除关于着色器、顶点缓冲这些关于代码，只需使用简单的Api调用就能绘制**单个quad图形**。
  - **新建一个**Renderer2D类来渲染单个2Dquad图形，而不是用Rednerer类来渲染一个大场景。

- API设计

  ```cpp
  Hazel::Renderer2D::BeginScene(m_CameraController.GetCamera());
  Hazel::Renderer2D::DrawQuad({ 0.0f, 0.0f }, { 1.0f, 1.0f }, { 0.8f, 0.2f, 0.3f, 1.0f });
  Hazel::Renderer2D::EndScene();
  ```

  接上046所说的。

- 接着033渲染架构抽象的**增加Renderer2D类**的类图

  ![051.渲染架构抽象](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231819055.png)

# 2D渲染类的函数是静态的解释

1. OpenGL绘图是一个设置**状态顺序**的过程
2. 在2D渲染类中只是简单的调用设置OpenGL状态，并**不需要实例化**
3. **不需要**让一个2D渲染类开始场景，另一个2D渲染类绘制
4. 综上，只需要一个就行，所以静态即可

# 代码改变

- Sandbox2D.cpp

  ```cpp
  #include "Sandbox2D.h"
  #include "imgui/imgui.h"
  #include <glm/gtc/matrix_transform.hpp>
  #include <glm/gtc/type_ptr.hpp>
  #include <Hazel/Renderer/Renderer2D.h>
  Sandbox2D::Sandbox2D() : Layer("Sandbox2D"), m_CameraController(1280.0f / 720.0f, true){}
  void Sandbox2D::OnAttach(){
  	//Hazel::Renderer2D::Init();
  }
  void Sandbox2D::OnDetach(){}
  Sandbox2D::~Sandbox2D(){}
  void Sandbox2D::OnUpdate(Hazel::Timestep ts){
  	m_CameraController.OnUpdate(ts);
      // 只需这几个API即可渲染图形，状态初始化代码都被设置在Renderer2D类中
  	Hazel::RenderCommand::SetClearColor({ 0.1f, 0.1f, 0.1f, 1 });
  	Hazel::RenderCommand::Clear();
  	Hazel::Renderer2D::BeginScene(m_CameraController.GetCamera());
  	Hazel::Renderer2D::DrawQuad({0.0f, 0.0f}, {1.0f,1.0f}, m_FlatColor);
  	Hazel::Renderer2D::EndScene();
  }
  void Sandbox2D::OnImgGuiRender(){
  	ImGui::Begin("Settings");
  	ImGui::ColorEdit4("Square Color", glm::value_ptr(m_FlatColor));
  	ImGui::End();
  }
  void Sandbox2D::OnEvent(Hazel::Event& event){
  	// 事件
  	m_CameraController.OnEvent(event);
  }
  ```

- Renderer2D

  ```cpp
  #pragma once
  #include "OrthographicCamera.h"
  namespace Hazel {
  	class Renderer2D
  	{
  	public:
  		static void Init();
  		static void Shutdown();
  		static void BeginScene(const OrthographicCamera& camera);
  		static void EndScene();
  		// 源语
  		static void DrawQuad(const glm::vec2& position, const glm::vec2& size, const glm::vec4& color);
  		static void DrawQuad(const glm::vec3& position, const glm::vec2& size, const glm::vec4& color);
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "Renderer2D.h"
  #include "VertexArray.h"
  #include "Shader.h"
  #include "RenderCommand.h"
  #include <Platform/OpenGL/OpenGLShader.h>
  
  namespace Hazel {
      // 拥有033节以前的渲染器类作为属性
  	static struct Renderer2DStorage{
  		Ref<VertexArray> QuadVertexArray;
  		Ref<Shader> FlatColorShader;
  	};
  	static Renderer2DStorage* s_Data;
  	void Hazel::Renderer2D::Init(){
  		s_Data = new Renderer2DStorage();
  		// 渲染网格 flat
  		float flatVertices[3 * 4] = {
  			-0.75f, -0.75f, 0.0f,
  			0.75f, -0.75f, 0.0f,
  			0.75f,  0.75f, 0.0f,
  			-0.75f,  0.75f, 0.0f
  		};
  		// 1.创建顶点数组
  		s_Data->QuadVertexArray = (Hazel::VertexArray::Create());
  
  		// 2.创建顶点缓冲区
  		Hazel::Ref<Hazel::VertexBuffer> flatVB;
  		flatVB.reset(Hazel::VertexBuffer::Create(flatVertices, sizeof(flatVertices)));
  
  		// 2.1设置顶点缓冲区布局
  		flatVB->SetLayout({
  			{Hazel::ShaderDataType::Float3, "a_Position"}
  			});
  
  		// 1.1顶点数组添加顶点缓冲区，并且在这个缓冲区中设置布局
  		s_Data->QuadVertexArray->AddVertexBuffer(flatVB);
  
  		// 3.索引缓冲
  		uint32_t flatIndices[] = { 0, 1, 2, 2, 3, 0 };
  
  		Hazel::Ref<Hazel::IndexBuffer> flatIB;
  		flatIB.reset(Hazel::IndexBuffer::Create(flatIndices, sizeof(flatIndices) / sizeof(uint32_t)));
  
  		// 1.2顶点数组设置索引缓冲区
  		s_Data->QuadVertexArray->SetIndexBuffer(flatIB);
  		// 加载shader
  		s_Data->FlatColorShader = (Hazel::Shader::Create("assets/shaders/FlatColor.glsl"));
  	}
  	void Hazel::Renderer2D::Shutdown(){
  		delete s_Data; // 手动管理内存
  	}
  	void Hazel::Renderer2D::BeginScene(const OrthographicCamera& camera){
  		// 上传矩阵数据到glsl
  		std::dynamic_pointer_cast<OpenGLShader>(s_Data->FlatColorShader)->UploadUniformMat4("u_ViewProjection", camera.GetViewProjectionMatrix());
  		std::dynamic_pointer_cast<OpenGLShader>(s_Data->FlatColorShader)->UploadUniformMat4("u_Transform", glm::mat4(1.0f));
  	}
  	void Hazel::Renderer2D::EndScene(){}
  	void Hazel::Renderer2D::DrawQuad(const glm::vec2& position, const glm::vec2& size, const glm::vec4& color){
  		DrawQuad({ position.x, position.y, 0.0f }, size, color);
  	}
  	void Hazel::Renderer2D::DrawQuad(const glm::vec3& position, const glm::vec2& size, const glm::vec4& color){
  		s_Data->QuadVertexArray->Bind();		// 绑定顶点数组
  		s_Data->FlatColorShader->Bind();		// 绑定shader
  		std::dynamic_pointer_cast<OpenGLShader>(s_Data->FlatColorShader)->UploadUniformFloat4("u_Color", color);
  		RenderCommand::DrawIndexed(s_Data->QuadVertexArray);
  	}
  }
  ```

  

