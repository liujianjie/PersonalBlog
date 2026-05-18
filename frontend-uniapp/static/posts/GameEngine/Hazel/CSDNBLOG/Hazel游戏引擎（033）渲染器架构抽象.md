> 文中若有代码、术语等错误，欢迎指正



[toc]

# 前言

- 此节目的

  Application绘制层存在OpenGL->gl开头的原始函数代码，想删掉它，并用封装的渲染架构来调用drawcall命令(glDrawElements)。

- **渲染器架构**抽象前要讨论**它**的工作方式才能更好设计

  - 渲染一个**物体**需要什么

    材质信息、转换矩阵信息等

  - 渲染一个**场景**需要什么

    光的信息、环境的信息、摄像机等

  - 渲染一个场景中两个物体的大概流程

    - 文字描述

      绘制一个场景，并且这个场景中有两个物体，应该是从一台相机上**查看**场景，场景负责**渲染**2个物体，渲染这2个物体拥有共有场景的环境信息、光的信息

    - 总结描述

      开始场景（设置场景的信息）->绘制物体（设置物体的信息=提交物体到场景）->结束场景

      结束场景后的一步代表提交到场景的物体要渲染。

      - 在多线程游戏引擎中，关于结束场景后

        不会立即渲染，只是被提交到渲染中，就像命令队列一样，可以在单独的渲染线程上进行计算

- API设计

  ```cpp
  // 光、环境、摄像机暂未有，这里只是一个通用设计
  Renderer::BeginScene(camera, lights, environment);
  m_Shader1->Bind();
  Renderer::Submit(VertexArray1);// 给场景提交要渲染的物体
  m_Shader2->Bind();
  Renderer::Submit(VertexArray2);// 给场景提交要渲染的物体
  Renderer::EndScene();
  Renderer::Flush();
  ```

- 此节完成后的类图

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306262325494.png)

  解释：

  - 照样动态多态

    RendererCommand有静态RendererAPI*，在cpp中可以根据选择的渲染API，来基类指针指向子类对象OpenGlRendererAPI、D3DRendererAPI，C++的动态多态。

  - 此节并未写D3DRendererAPI类，但为了完整，还是这样画的类图

# 项目相关

## 代码修改

- RenderCommand

  ```cpp
  #pragma once
  #include "RendererAPI.h"
  namespace Hazel {
  	class RenderCommand{
  	public:
  		inline static void SetClearColor(const glm::vec4& color){
  			s_RendererAPI->SetClearColor(color);
  		}
  		inline static void Clear(){
  			s_RendererAPI->Clear();
  		}
  		inline static void DrawIndexed(const std::shared_ptr<VertexArray>& vertexArray){
  			s_RendererAPI->DrawIndexed(vertexArray);
  		}
  	private:
  		static RendererAPI* s_RendererAPI;
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "RenderCommand.h"
  #include "Platform/OpenGL/OpenGLRendererAPI.h"
  namespace Hazel {
      // 默认先指向OpenGLRendererAPI子类
  	RendererAPI* RenderCommand::s_RendererAPI = new OpenGLRendererAPI; // 基类指针指向子类对象
  }
  ```

- Renderer

  ```cpp
  #pragma once
  #include "RenderCommand.h"
  namespace Hazel {
  	class Renderer{
  	public:
  		static void BeginScene();	// 开始场景
  		static void EndScene();		// 结束场景
  		static void Submit(const std::shared_ptr<VertexArray>& vertexArray);// 提交物体的顶点数组
  		inline static RendererAPI::API GetAPI() { return RendererAPI::GetAPI(); }
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "Renderer.h"
  namespace Hazel {
  	void Renderer::BeginScene(){}
  	void Renderer::EndScene(){}
  	void Renderer::Submit(const std::shared_ptr<VertexArray>& vertexArray){
  		vertexArray->Bind();					// 顶点数组绑定
  		RenderCommand::DrawIndexed(vertexArray);// 调用drawcall
  	}
  }
  ```

- RendererAPI

  ```cpp
  #pragma once
  #include <glm/glm.hpp>
  #include "VertexArray.h"
  namespace Hazel {
  	class RendererAPI{
  	public:
  		enum class API{
  			None = 0, OpenGL = 1
  		};
  	public:
  		virtual void SetClearColor(const glm::vec4& color) = 0;	// 设置清除后的颜色
  		virtual void Clear() = 0;								// 清除哪些缓冲
  		virtual void DrawIndexed(const std::shared_ptr<VertexArray>& vertexArray) = 0;
  		inline static API GetAPI() { return s_API; }
  	private:
  		static API s_API;
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "RendererAPI.h"
  namespace Hazel {
  	RendererAPI::API RendererAPI::s_API = RendererAPI::API::OpenGL;
  }
  ```

- OpenGLRendererAPI

  ```cpp
  #pragma once
  #include "Hazel/Renderer/RendererAPI.h"
  namespace Hazel {
  	class OpenGLRendererAPI : public RendererAPI{
  	public:
  		virtual void SetClearColor(const glm::vec4& color) override;// 设置清除后的颜色	
  		virtual void Clear() override;								// 清除哪些缓冲
  		// 通过顶点数组绘制
  		virtual void DrawIndexed(const std::shared_ptr<VertexArray>& vertexArray) override;
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "OpenGLRendererAPI.h"
  #include <glad/glad.h>
  namespace Hazel {
  	void OpenGLRendererAPI::SetClearColor(const glm::vec4& color){
  		glClearColor(color.r, color.g, color.b, color.a);
  	}
  	void OpenGLRendererAPI::Clear(){
  		glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
  	}
  	void OpenGLRendererAPI::DrawIndexed(const std::shared_ptr<VertexArray>& vertexArray){
  		glDrawElements(GL_TRIANGLES, vertexArray->GetIndexBuffer()->GetCount(), GL_UNSIGNED_INT, nullptr);
  	}
  }
  ```

- Application

  ```cpp
  void Application::Run(){
      while (m_Running){
          /////////////////////////////////////////////////////////
          RenderCommand::SetClearColor({ 0.1f, 0.1f, 0.1f, 1 });
          RenderCommand::Clear();
  
          Renderer::BeginScene();
          // 绘制四边形
          m_BlueShader->Bind();// 绑定着色器
          Renderer::Submit(m_SquareVA);
  
          // 绘制三角形
          m_Shader->Bind();// 绑定着色器
          Renderer::Submit(m_VertexArray);
          
          Renderer::EndScene();
          .......
  ```

## 效果

没变

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306262325499.png)

