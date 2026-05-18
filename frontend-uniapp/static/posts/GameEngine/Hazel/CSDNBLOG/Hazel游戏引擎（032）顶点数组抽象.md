> 文中若有代码、术语等错误，欢迎指正

[toc]



# 前言

- 此节目的

  - 为了封装抽象OpenGL的**顶点数组**
  - 为了渲染层中没有创建顶点数组的原始OpenGL函数代码

- 顶点数组介绍

  得先理解它，然后才能更好的封装抽象

  - 顶点数组是一种包含状态的实体，他们实际上不包含任何实际数据

    包含实际数据的是顶点缓冲区包含顶点、索引缓冲区包含索引

    **顶点数组**实际上包含的只是对顶点缓冲区和索引缓冲区的**引用**，以及顶点属性布局指针

    **顶点数组**有点像指针，指向现有的顶点缓冲区和索引缓冲区。

  - 一个顶点数组可以有**多个**顶点缓冲包含不同的信息

  图示：

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306262324837.png)

- 从API设计抽象顶点数组类

  ```cpp
  std::shared_ptr<VertexArray> m_VertexArray.reset(VertexArray::Create());
  m_VertexArray->AddVertexBuffer(vertexBuffer);
  m_VertexArray->SetIndexBuffer(indexBuffer);
  m_VertexArray->Bind();
  ```

- 此节完成后的类图

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306290007081.png)

  解释

  - 动态多态

    VertexArray有静态Create函数，返回VertexArray*，可以调用return new OpenGLVertexArray，基类指针指向子类对象，C++的动态多态。

  - 为什么没有D3DVertexArray

    因为Directx**没有**顶点数组，这里依旧写成继承关系是为了完整统一性，以及Vulkan可能有

# 项目相关

## 代码

- VertexArray

  ```cpp
  #pragma once
  #include <memory>
  #include "Hazel/Renderer/Buffer.h"
  namespace Hazel {
  	class VertexArray{
  	public:
  		virtual ~VertexArray() {}
  		virtual void Bind() const = 0;
  		virtual void Unbind() const = 0;
  		virtual void AddVertexBuffer(const std::shared_ptr<VertexBuffer>& vertexBuffer) = 0;// 添加顶点缓冲对象
  		virtual void SetIndexBuffer(const std::shared_ptr<IndexBuffer>& indexBuffer) = 0;	// 设置索引缓冲对象，一般只有一个
  		virtual const std::vector<std::shared_ptr<VertexBuffer>>& GetVertexBuffers() const = 0;
  		virtual const std::shared_ptr<IndexBuffer>& GetIndexBuffer() const = 0;
  		static VertexArray* Create();// 基类指针指向子类对象
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "VertexArray.h"
  #include "Renderer.h"
  #include "Platform/OpenGL/OpenGLVertexArray.h"
  namespace Hazel {
  	VertexArray* VertexArray::Create(){
  		switch (Renderer::GetAPI()){
  		case RendererAPI::None:    HZ_CORE_ASSERT(false, "RendererAPI::None is currently not supported!"); return nullptr;
  		case RendererAPI::OpenGL:  return new OpenGLVertexArray();
  		}
  		HZ_CORE_ASSERT(false, "Unknown RendererAPI!");
  		return nullptr;
  	}
  }
  ```

- OpenGLVertexArray

  ```cpp
  #pragma once
  #include "Hazel/Renderer/VertexArray.h"
  namespace Hazel {
  	class OpenGLVertexArray : public VertexArray{
  	public:
  		OpenGLVertexArray();
  		virtual ~OpenGLVertexArray();
  		virtual void Bind() const override;
  		virtual void Unbind() const override;
  		virtual void AddVertexBuffer(const std::shared_ptr<VertexBuffer>& vertexBuffer) override;// 添加顶点缓冲对象
  		virtual void SetIndexBuffer(const std::shared_ptr<IndexBuffer>& indexBuffer) override;	// 设置索引缓冲对象，一般只有一个
  		virtual const std::vector<std::shared_ptr<VertexBuffer>>& GetVertexBuffers() const { return m_VertexBuffers; }
  		virtual const std::shared_ptr<IndexBuffer>& GetIndexBuffer() const { return m_IndexBuffer; }
  	private:
  		uint32_t m_RendererID;
  		std::vector<std::shared_ptr<VertexBuffer>> m_VertexBuffers;// 拥有的顶点缓冲对象列表
  		std::shared_ptr<IndexBuffer> m_IndexBuffer;					// 拥有的索引缓冲对象
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "OpenGLVertexArray.h"
  #include <glad/glad.h>
  namespace Hazel {
  	// 将自定义的Shader类型转换为OpenGL定义的类型
  	static GLenum ShaderDataTypeToOpenGLBaseType(ShaderDataType type){
  		switch (type)
  		{
  		case Hazel::ShaderDataType::Float:    return GL_FLOAT;
  		case Hazel::ShaderDataType::Float2:   return GL_FLOAT;
  		case Hazel::ShaderDataType::Float3:   return GL_FLOAT;
  		case Hazel::ShaderDataType::Float4:   return GL_FLOAT;
  		case Hazel::ShaderDataType::Mat3:     return GL_FLOAT;
  		case Hazel::ShaderDataType::Mat4:     return GL_FLOAT;
  		case Hazel::ShaderDataType::Int:      return GL_INT;
  		case Hazel::ShaderDataType::Int2:     return GL_INT;
  		case Hazel::ShaderDataType::Int3:     return GL_INT;
  		case Hazel::ShaderDataType::Int4:     return GL_INT;
  		case Hazel::ShaderDataType::Bool:     return GL_BOOL;
  		}
  		HZ_CORE_ASSERT(false, "Unknown ShaderDataType!");
  		return 0;
  	}
  	OpenGLVertexArray::OpenGLVertexArray(){
  		glCreateVertexArrays(1, &m_RendererID);
  	}
  	OpenGLVertexArray::~OpenGLVertexArray(){
  		glDeleteVertexArrays(1, &m_RendererID);
  	}
  	void OpenGLVertexArray::Bind() const{
  		glBindVertexArray(m_RendererID);
  	}
  	void OpenGLVertexArray::Unbind() const{
  		glBindVertexArray(0);
  	}
  	void OpenGLVertexArray::AddVertexBuffer(const std::shared_ptr<VertexBuffer>& vertexBuffer){
  		HZ_CORE_ASSERT(vertexBuffer->GetLayout().GetElements().size(), "Vertex Buffer has no layout!");
  		// 绑定顶点数组对象
  		glBindVertexArray(m_RendererID);
  		// 绑定顶点缓冲对象
  		vertexBuffer->Bind();
  		uint32_t index = 0;
  		const auto& layout = vertexBuffer->GetLayout();
  		for (const auto& element : layout){
  			glEnableVertexAttribArray(index);
  			glVertexAttribPointer(index,
  				element.GetComponentCount(),
  				ShaderDataTypeToOpenGLBaseType(element.Type),
  				element.Normalized ? GL_TRUE : GL_FALSE,
  				layout.GetStride(),
  				(const void*)element.Offset);
  			index++;
  		}
  		m_VertexBuffers.push_back(vertexBuffer);
  	}
  	void OpenGLVertexArray::SetIndexBuffer(const std::shared_ptr<IndexBuffer>& indexBuffer){
  		glBindVertexArray(m_RendererID);
  		indexBuffer->Bind();
  		m_IndexBuffer = indexBuffer;
  	}
  }
  ```

- Application

  ```cpp
  std::shared_ptr<Shader> m_Shader;
  std::shared_ptr<VertexArray> m_VertexArray;
  
  std::shared_ptr<Shader> m_BlueShader;
  std::shared_ptr<VertexArray> m_SquareVA;
  ```

  ```cpp
  Application::Application(){
      .......
      // 渲染一个三角形所做的准备
      // 0.顶点数据
      float vertices[3 * 7] = {
          -0.5f, -0.5f, 0.0f, 0.8f, 0.2f, 0.8f, 1.0f,
          0.5f, -0.5f, 0.0f, 0.2f, 0.3f, 0.8f, 1.0f,
          0.0f,  0.5f, 0.0f, 0.8f, 0.8f, 0.2f, 1.0f
      };
      unsigned int indices[3] = { 0, 1, 2 }; // 索引数据
      // 1.生成顶点数组对象VAO
      m_VertexArray.reset(VertexArray::Create());///////////////////////////
      // 2.顶点缓冲
      std::shared_ptr<VertexBuffer> vertexBuffer;
      vertexBuffer.reset(VertexBuffer::Create(vertices, sizeof(vertices)));
      // 设定顶点属性指针，来解释顶点缓冲中的顶点属性布局
      BufferLayout layout = {
          { ShaderDataType::Float3, "a_Position" },
          { ShaderDataType::Float4, "a_Color" }
      };
      // 3.先设置顶点缓冲布局-计算好各个属性的所需的值
      vertexBuffer->SetLayout(layout);
      // 4.再给顶点数组添加顶点缓冲-设置各个属性的顶点属性指针
      m_VertexArray->AddVertexBuffer(vertexBuffer);///////////////////////////
      // 5.索引缓冲
      std::shared_ptr<IndexBuffer> indexBuffer;
      indexBuffer.reset(IndexBuffer::Create(indices, sizeof(indices) / sizeof(uint32_t)));
      // 6.给顶点数组设置索引缓冲
      m_VertexArray->SetIndexBuffer(indexBuffer);///////////////////////////
      // 着色器代码
      std::string vertexSrc = R"(
  			#version 330 core
  
  			layout(location = 0) in vec3 a_Position;
  			layout(location = 1) in vec4 a_Color;
  			out vec3 v_Position;
  			out vec4 v_Color;
  			void main()
  			{
  				v_Position = a_Position;
  				v_Color = a_Color;
  				gl_Position = vec4(a_Position, 1.0);	
  			}
  		)";
      std::string fragmentSrc = R"(
  			#version 330 core
  
  			layout(location = 0) out vec4 color;
  			in vec3 v_Position;
  			in vec4 v_Color;
  			void main()
  			{
  				color = vec4(v_Position * 0.5 + 0.5, 1.0);
  				color = v_Color;
  			}
  		)";
      m_Shader.reset(new Shader(vertexSrc, fragmentSrc));
  
      // 渲染一个quad所做的准备
      // 0.顶点数据
      float squareVertices[3 * 4] = {
          -0.75f, -0.75f, 0.0f,
          0.75f, -0.75f, 0.0f,
          0.75f,  0.75f, 0.0f,
          -0.75f,  0.75f, 0.0f
      };
      uint32_t squareIndices[6] = { 0, 1, 2, 2, 3, 0 }; // 索引数据
      // 1.生成顶点数组对象VAO
      m_SquareVA.reset(VertexArray::Create());
      // 2.顶点缓冲
      std::shared_ptr<VertexBuffer> squareVB;
      squareVB.reset(VertexBuffer::Create(squareVertices, sizeof(squareVertices)));
      // 设定顶点属性指针，来解释顶点缓冲中的顶点属性布局
      BufferLayout layout2 = {
          { ShaderDataType::Float3, "a_Position" }
      };
      // 3.先设置顶点缓冲布局-计算好各个属性的所需的值
      squareVB->SetLayout(layout2);
      // 4.再给顶点数组添加顶点缓冲-设置各个属性的顶点属性指针
      m_SquareVA->AddVertexBuffer(squareVB);
      // 5.索引缓冲
      std::shared_ptr<IndexBuffer> squareIB;
      squareIB.reset(IndexBuffer::Create(squareIndices, sizeof(squareIndices) / sizeof(uint32_t)));
      // 6.给顶点数组设置索引缓冲
      m_SquareVA->SetIndexBuffer(squareIB);
      // 着色器代码
      std::string blueShaderVertexSrc = R"(
  			#version 330 core
  			layout(location = 0) in vec3 a_Position;
  			out vec3 v_Position;
  			void main()
  			{
  				v_Position = a_Position;
  				gl_Position = vec4(a_Position, 1.0);	
  			}
  		)";
      std::string blueShaderFragmentSrc = R"(
  			#version 330 core
  			layout(location = 0) out vec4 color;
  			in vec3 v_Position;
  			void main()
  			{
  				color = vec4(0.2, 0.3, 0.8, 1.0);
  			}
  		)";
      m_BlueShader.reset(new Shader(blueShaderVertexSrc, blueShaderFragmentSrc));
      .......
  void Application::Run(){
       while (m_Running){
           glClearColor(0.1f, 0.1f, 0.1f, 1);
           glClear(GL_COLOR_BUFFER_BIT);
           // 绘制四边形
           m_BlueShader->Bind();// 绑定着色器
           m_SquareVA->Bind();// 绑定顶点数组对象，并绘制
           glDrawElements(GL_TRIANGLES, m_SquareVA->GetIndexBuffer()->GetCount(), GL_UNSIGNED_INT, nullptr);
  
           // 绘制三角形
           m_Shader->Bind();// 绑定着色器
           /////////////////////////////////////////////////////////////////////////
           m_VertexArray->Bind();// 绑定顶点数组对象，并绘制///////////////////////////
           glDrawElements(GL_TRIANGLES, m_VertexArray->GetIndexBuffer()->GetCount(), GL_UNSIGNED_INT, nullptr);
  
  ```

## 效果不变

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306262324847.png)

