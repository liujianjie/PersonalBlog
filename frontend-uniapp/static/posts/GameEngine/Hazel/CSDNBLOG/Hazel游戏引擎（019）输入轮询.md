> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  在引擎程序中**任何位置**都能询问本应用是否有**输入事件**（按键是否按下、鼠标是否点击、鼠标位置等）。

- 分析

  目前引擎程序已能获得GLFW窗口事件，但是通过Application的OnEvent**分发**给所属的Layer层，

  这并不能实现在程序任何位置都能知道此时是否有输入事件。

- 如何实现

  - 方法一

    自己写一套检测输入事件系统，因为现在能接收GLFW窗口事件，当检测到一个按键按下事件时，将这个按键设置为按下，当检测到按键松开时，将这个按键设置为释放。

    这是一个方式，但是自己根据GLFW窗口事件来实现，有点麻烦

  - 方法二

    通过GLFW**已经提供的输入事件检测函数**来检测输入事件，并封装为一个类供引擎程序**全局**使用（代表此类应是单例静态的对象）。

    此节用方法二

# 项目相关

## 代码

- Input

  ```cpp
  #pragma once
  #include "Hazel/Core.h"
  namespace Hazel {
  	class HAZEL_API Input{
  	public:
  		inline static bool IsKeyPressed(int keycode) { return s_Instance->IsKeyPressedImpl(keycode); }
  		inline static bool IsMouseButtonPressed(int button) { return s_Instance->IsMouseButtonPressedImpl(button); }
  		inline static std::pair<float, float> GetMousePosition() { return s_Instance->GetMousePositionImpl(); }
  		inline static float GetMouseX() { return s_Instance->GetMouseXImpl(); }
  		inline static float GetMouseY() { return s_Instance->GetMouseYImpl(); }
  	protected:
  		virtual bool IsKeyPressedImpl(int keycode) = 0;
  
  		virtual bool IsMouseButtonPressedImpl(int button) = 0;
  		virtual std::pair<float, float> GetMousePositionImpl() = 0;
  		virtual float GetMouseXImpl() = 0;
  		virtual float GetMouseYImpl() = 0;
  	private:
  		static Input* s_Instance;// 声明静态单例全局对象
  	};
  }
  ```

- WindowsInput

  ```cpp
  #pragma once
  #include "Hazel/Input.h"
  namespace Hazel {
  	class WindowsInput : public Input{
  	protected:
  		virtual bool IsKeyPressedImpl(int keycode) override;
  
  		virtual bool IsMouseButtonPressedImpl(int button) override;
  		virtual std::pair<float, float> GetMousePositionImpl() override;
  		virtual float GetMouseXImpl() override;
  		virtual float GetMouseYImpl() override;
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "WindowsInput.h"
  #include "Hazel/Application.h"
  #include <GLFW/glfw3.h>
  namespace Hazel {
  	// 父类指针指向子类对象
  	Input* Input::s_Instance = new WindowsInput();// 定义静态单例全局对象
  	bool WindowsInput::IsKeyPressedImpl(int keycode){
  		// 获取GLFW原生窗口void*，转为GLFWwindow*
  		auto window = static_cast<GLFWwindow*>(Application::Get().GetWindow().GetNativeWindow());
  		// 用已有的GLFW函数来获取按键状态
  		auto state = glfwGetKey(window, keycode);
  		return state == GLFW_PRESS || state == GLFW_REPEAT;
  	}
  	bool WindowsInput::IsMouseButtonPressedImpl(int button){
  		auto window = static_cast<GLFWwindow*>(Application::Get().GetWindow().GetNativeWindow());
  		auto state = glfwGetMouseButton(window, button);
  		return state == GLFW_PRESS;
  	}
  	std::pair<float, float> WindowsInput::GetMousePositionImpl(){
  		auto window = static_cast<GLFWwindow*>(Application::Get().GetWindow().GetNativeWindow());
  		double xpos, ypos;
  		glfwGetCursorPos(window, &xpos, &ypos);
  
  		return { (float)xpos, (float)ypos };
  	}
  	float WindowsInput::GetMouseXImpl(){
  		// C++17写法
  		auto [x, y] = GetMousePositionImpl();
  		return x;
  		// C++14以下
  		//auto x = GetMousePositionImpl();
  		//return std::get<0>(x);
  	}
  	float WindowsInput::GetMouseYImpl(){
  		auto [x, y] = GetMousePositionImpl();
  		return y;
  	}
  }
  ```

## 测试效果

- Application

  ```cpp
  void Application::Run()
  {
      while (m_Running)
      {
          glClearColor(1, 0, 1, 1);
          glClear(GL_COLOR_BUFFER_BIT);
  
          // 从前往后顺序更新层
          for (Layer* layer : m_LayerStack)
              layer->OnUpdate();
  		//////////////////////////////////////////////////////////
          // 测试：全局输入事件检测////////////////////////////////////
          /////////////////////////////////////////////////////////
          auto [x, y] = Input::GetMousePosition();
  			HZ_CORE_TRACE("{0}, {1}", x, y);
          m_Window->OnUpdate();	// 更新glfw
      }
  }
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306260023101.png)