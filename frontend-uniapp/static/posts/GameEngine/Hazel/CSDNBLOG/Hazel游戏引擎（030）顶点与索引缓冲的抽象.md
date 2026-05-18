> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  对于OpenGL的`生成`**顶点缓冲**、**索引缓冲**这种原始代码抽象成类。

  Application里面有创建opengl的渲染代码，顶点缓冲、索引缓冲，想要application中不含这些OpenGL函数，就需要将这些操作封装成类。

- 如何设计类

  从想使用的API形式出发

  ```cpp
  VertexBuffer m_VertexBuffer = new VertexBuffer(vertices, sizeof(vertices));
  // 在m_VertexArray构造函数中完成创建顶点缓冲对象、绑定、与从CPU数据发送到GPU上
  ```

- 渲染接口的设计

  由于可以有多个渲染图形API：OpenGL、DX，若引擎支持两种渲染图形API，需要设计选择哪一个

  - 如果是在**编译时**确定选择

    缺点：如果更改渲染对象，需要重新编译引擎、且运行时不能切换

  - 如果是在**运行时**确定选择

    缺点：编译时两个渲染相关obj都要编译

    优点：能动态切换

    如何实现：采用C++的动态特性，基类指针指向子类对象实现**动态多态**

- 运行时确定渲染接口的类图：以顶点缓冲对象、索引缓冲对象为例

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306262322259.png)

  解读：

  如：VertexBuffer有静态Create函数，返回VertexBuffer*，根据选择**不同渲染图形API**调用return new OpenGLVertexBuffer还是DirectxVertexBuffer，基类指针指向子类对象，C++的动态多态。（但后面的章节会使用宏定义在编译时就确定了选择哪个渲染图形API)


# 项目相关

## 代码增加与修改

- Application

  ```cpp
  	private:
  		std::unique_ptr<Window> m_Window;
  		ImGuiLayer* m_ImGuiLayer;
  		bool m_Running = true;
  		LayerStack m_LayerStack;
  
  		unsigned int m_VertexArray;
  		std::unique_ptr<Shader> m_Shader;
  		std::unique_ptr<VertexBuffer> m_VertexBuffer;
  		std::unique_ptr<IndexBuffer> m_IndexBuffer;
  ```

  ```cpp
  ......
  // 使用OpenGL函数渲染一个三角形
  // 顶点数据
  float vertices[3 * 3] = {
      -0.5f, -0.5f, 0.0f,
      0.5f, -0.5f, 0.0f,
      0.0f,  0.5f, 0.0f
  };
  unsigned int indices[3] = { 0, 1, 2 }; // 索引数据
  ////////////////////////////////////////////////////////////////////////////////////
  // 0.生成顶点数组对象VAO、顶点缓冲对象VBO、索引缓冲对象EBO/////////////////////////////////
  glGenVertexArrays(1, &m_VertexArray);
  // 1. 绑定顶点数组对象
  glBindVertexArray(m_VertexArray);
  
  // 2.1顶点缓冲
  m_VertexBuffer.reset(VertexBuffer::Create(vertices, sizeof(vertices)));// 在这里
  
  // 2.2 设定顶点属性指针，来解释顶点缓冲中的顶点属性布局
  glEnableVertexAttribArray(0);// 开启glsl的layout = 0输入
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), nullptr);
  
  // 3.索引缓冲
  m_IndexBuffer.reset(IndexBuffer::Create(indices, sizeof(indices) / sizeof(uint32_t)));// 在这里
  ......
  ```

- Renderer

  ```cpp
  #pragma once
  namespace Hazel {
  	enum class RendererAPI
  	{
  		None = 0, OpenGL = 1
  	};
  	class Renderer{
  	public:
  		inline static RendererAPI GetAPI() { return s_RendererAPI; }
  	private:
  		static RendererAPI s_RendererAPI;
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "Renderer.h"
  namespace Hazel {
  	RendererAPI Renderer::s_RendererAPI = RendererAPI::OpenGL;
  }
  ```

- 增加VertexBuffer与IndexBuffer类同放在Buffer文件中

  ```cpp
  #pragma once
  namespace Hazel {
  	class VertexBuffer{
  	public:
  		virtual ~VertexBuffer(){}
  		virtual void Bind() const = 0;
  		virtual void Unbind() const = 0;
  		static VertexBuffer* Create(float* vertices, uint32_t size);
  	};
  	class IndexBuffer {
  	public:
  		virtual ~IndexBuffer() {}
  		virtual void Bind() const = 0;
  		virtual void Unbind() const = 0;
  		virtual uint32_t GetCount() const = 0;
  		static IndexBuffer* Create(uint32_t* indices, uint32_t size);
  	};
  }		
  ```

  ```cpp
  #include "hzpch.h"
  #include "Buffer.h"
  // 根据不同平台而创建不同的。。。
  #include "Renderer.h"
  #include "Platform/OpenGL/OpenGLBuffer.h"
  namespace Hazel {
  	VertexBuffer* VertexBuffer::Create(float* vertices, uint32_t size){
  		switch (Renderer::GetAPI()) {
  			case RendererAPI::None: HZ_CORE_ASSERT(false, "RendererAPI:None is currently not supported!"); return nullptr;
  			case RendererAPI::OpenGL: return new OpenGLVertexBuffer(vertices, size);
  		}
  		HZ_CORE_ASSERT(false, "Unknown RendererAPI!");
  		return nullptr;
  	}
  	IndexBuffer* IndexBuffer::Create(uint32_t* indices, uint32_t size){
  		switch (Renderer::GetAPI()) {
  			case RendererAPI::None: HZ_CORE_ASSERT(false, "RendererAPI:None is currently not supported!"); return nullptr;
  			case RendererAPI::OpenGL: return new OpenGLIndexBuffer(indices, size);
  		}
  		HZ_CORE_ASSERT(false, "Unknown RendererAPI!");
  		return nullptr;
  	}
  }
  ```

- OpenGLBuffer

  ```cpp
  #pragma once
  #include "Hazel/Renderer/Buffer.h"
  namespace Hazel {
  	class OpenGLVertexBuffer : public VertexBuffer{
  	public:
  		OpenGLVertexBuffer(float* vertices, uint32_t size);
  		virtual ~OpenGLVertexBuffer();
  
  		virtual void Bind() const;
  		virtual void Unbind() const;
  	private:
  		uint32_t m_RendererID;
  	};
  	class OpenGLIndexBuffer : public IndexBuffer{
  	public:
  		OpenGLIndexBuffer(uint32_t* indices, uint32_t count);
  		virtual ~OpenGLIndexBuffer();
  		virtual void Bind() const;
  		virtual void Unbind() const;
  		virtual uint32_t GetCount() const { return m_Count; }
  	private:
  		uint32_t m_RendererID;
  		uint32_t m_Count;
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "OpenGLBuffer.h"
  #include <glad/glad.h>
  namespace Hazel {
  	// VertexBuffer /////////////////////////////////////////////////////////////
  	OpenGLVertexBuffer::OpenGLVertexBuffer(float* vertices, uint32_t size){
  		// 1.创建顶点缓冲对象
  		glCreateBuffers(1, &m_RendererID);
  		// 2.绑定顶点缓冲对象
  		glBindBuffer(GL_ARRAY_BUFFER, m_RendererID);
  		// 3. 把我们的CPU的顶点数据复制到GPU顶点缓冲中，供OpenGL使用
  		glBufferData(GL_ARRAY_BUFFER, size, vertices, GL_STATIC_DRAW);
  	}
  	OpenGLVertexBuffer::~OpenGLVertexBuffer(){
  		glDeleteBuffers(1, &m_RendererID);
  	}
  	void OpenGLVertexBuffer::Bind() const{
  		glBindBuffer(GL_ARRAY_BUFFER, m_RendererID);
  	}
  	void OpenGLVertexBuffer::Unbind() const{
  		glBindBuffer(GL_ARRAY_BUFFER, 0);
  	}
  	// IndexBuffer //////////////////////////////////////////////////////////////
  	OpenGLIndexBuffer::OpenGLIndexBuffer(uint32_t* indices, uint32_t count)
  		: m_Count(count){		
  		// 1.创建顶点缓冲对象
  		glCreateBuffers(1, &m_RendererID);
  		// 2.绑定顶点缓冲对象
  		glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, m_RendererID);
  		// 3. 复制我们的CPU的索引数据到GPU索引缓冲中，供OpenGL使用
  		glBufferData(GL_ELEMENT_ARRAY_BUFFER, count * sizeof(uint32_t), indices, GL_STATIC_DRAW);
  	}
  	OpenGLIndexBuffer::~OpenGLIndexBuffer(){
  		glDeleteBuffers(1, &m_RendererID);
  	}
  	void OpenGLIndexBuffer::Bind() const{
  		glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, m_RendererID);
  	}
  	void OpenGLIndexBuffer::Unbind() const{
  		glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0);
  	}
  }
  ```

## 效果

不变，证明抽象顶点缓冲、索引缓冲类成功

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306262322660.png)