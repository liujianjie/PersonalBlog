> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  用抽象类封装渲染图形API的上下文，应该可以根据不同渲染API，设置不同渲染的上下文。

- 我认为的渲染上下文

  就是图形OpenGL、DX API要将图形渲染到哪个窗口上去，我目前认为上下文是窗口，但可能不止是窗口

- 类图

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306260037540.png)



# 项目相关

## 代码

- GraphicsContext

  ```cpp
  #pragma once
  namespace Hazel {
  	class GraphicsContext{
  	public:
  		virtual void Init() = 0;
  		virtual void SwapBuffers() = 0;
  	};
  }
  ```

- OpenGLContext

  ```cpp
  #pragma once
  #include "Hazel/Renderer/GraphicsContext.h"
  struct GLFWwindow;
  namespace Hazel {
  	class OpenGLContext : public GraphicsContext{
  	public:
  		OpenGLContext(GLFWwindow* windowHandle);
  		virtual void Init() override;
  		virtual void SwapBuffers() override;
  	private:
  		GLFWwindow* m_WindowHandle;
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "OpenGLContext.h"
  #include <GLFW/glfw3.h>
  #include <glad/glad.h>
  namespace Hazel {
  	OpenGLContext::OpenGLContext(GLFWwindow* windowHandle)
  		: m_WindowHandle(windowHandle)
  	{
  		HZ_CORE_ASSERT(windowHandle, "Window handle is null!")
  	}
  	void OpenGLContext::Init(){
  		// 将我们窗口的上下文设置为当前线程的主上下文
  		glfwMakeContextCurrent(m_WindowHandle);
  		// 获取显卡OpenGL函数定义的地址
  		int status = gladLoadGLLoader((GLADloadproc)glfwGetProcAddress);
  		HZ_CORE_ASSERT(status, "Failed to initialize Glad!");
  	}
  	void OpenGLContext::SwapBuffers(){
  		glfwSwapBuffers(m_WindowHandle);// 交换缓冲
  	}
  }
  ```

- WindowsWindow

  ```cpp
  class WindowsWindow : public Window{
      .....
  	private:
  		GLFWwindow* m_Window;
  		GraphicsContext* m_Context;
      .....
  ```

  ```cpp
  void WindowsWindow::Init(const WindowProps& props)
  {
      ......
      // 2.1window创建窗口
      m_Window = glfwCreateWindow((int)props.Width, (int)props.Height, m_Data.Title.c_str(), nullptr, nullptr);
      ///////////////////////////////////////////////////////////////////////////////////////
      // 创建渲染上下文对象////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////////////////
      m_Context = new OpenGLContext(m_Window);// m_Context = new D3DContext(m_Window);
      m_Context->Init();
      /*
          设置窗口关联的用户数据指针。这里GLFW仅做存储，不做任何的特殊处理和应用。
          window表示操作的窗口句柄。
          pointer表示用户数据指针。
      */
      glfwSetWindowUserPointer(m_Window, &m_Data);
      ......
  ```


## 效果

不变，和022节效果一样

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306260037800.png)



