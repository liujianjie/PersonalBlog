> 文中若有代码、术语等错误，欢迎指正



[toc]

# 前言

- 此节目的

  为了完成008计划窗口事件的**接收glfw窗口事件以及回调**部分

- 此节要完成

  使用glfw函数可以设置（拦截）真正窗口事件的回调函数，在回调函数中**转换**为我们自定义的事件，再**回调**给Application的OnEvent，OnEvent拦截对应的事件

- 图示部分

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112017901.png)

  图中是将Appilication的事件给Layer去处理，但本节是Application自己拦截事件并处理，修改后的图如下

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112017190.png)



# 如何确定GLFW窗口事件的回调函数参数

- 引出

  ```cpp
  glfwSetKeyCallback(m_Window, [](GLFWwindow* window, int key, int scancode, int action, int mods)
  ```

  如上代码，用lambda接收GLFW按键事件，可是为什么能确定lambda的**参数**

- 需要ctrl+左键点开glfwSetKeyCallback

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112016338.png)

# Application接收事件回调流程

## 原项目流程(12345)

对应第二张图按照1、2、3、4、5顺序

- Application

  ```cpp
  #include "hzpch.h"
  #include "Application.h"
  #include "Hazel/Log.h"
  #include <GLFW/glfw3.h>
  namespace Hazel {
  	#define BIND_EVENT_FN(x) std::bind(&Application::x, this, std::placeholders::_1)
  	Application::Application()
  	{
  		// 1.1Application创建窗口
  		m_Window = std::unique_ptr<Window>(Window::Create());
  		// 1.2Application设置窗口事件的回调函数
  		m_Window->SetEventCallback(BIND_EVENT_FN(OnEvent));
  	}
  	// 回调glfw窗口事件的函数
  	void Application::OnEvent(Event& e)
  	{
  		// 4.用事件调度器，拦截自己层想要拦截的事件并处理
  		EventDispatcher dispatcher(e);
  		dispatcher.Dispatch<WindowCloseEvent>(BIND_EVENT_FN(OnWindowClose));
  
  		HZ_CORE_TRACE("{0}", e);
  	}
  	void Application::Run()
  	{
  		while (m_Running)
  		{
  			glClearColor(1, 0, 1, 1);
  			glClear(GL_COLOR_BUFFER_BIT);
  			m_Window->OnUpdate();	// 更新glfw
  		}
  	}
  	// 5.执行Application的OnWinClose函数拦截处理event事件
  	bool Application::OnWindowClose(WindowCloseEvent& e)
  	{
  		m_Running = false;
  		return true;
  	}
  }
  ```

- WindowsWindow.cpp

  ```cpp
  // 2.1window创建窗口
  m_Window = glfwCreateWindow((int)props.Width, (int)props.Height, m_Data.Title.c_str(), nullptr, nullptr);
  // 设置glfw当前的上下文
  glfwMakeContextCurrent(m_Window);
  /*
  	设置窗口关联的用户数据指针。这里GLFW仅做存储，不做任何的特殊处理和应用。
  	window表示操作的窗口句柄。
  	pointer表示用户数据指针。
  */
  glfwSetWindowUserPointer(m_Window, &m_Data);
  SetVSync(true);	
  // 2.2设置glfw事件回调=接收glfw窗口事件
  glfwSetWindowSizeCallback(m_Window, [](GLFWwindow* window, int width, int height){
  	// glfwGetWindowUserPointer获取void*指针可以转换为由glfwSetWindowUserPointer自定义数据类型，
      WindowData& data = *(WindowData*)glfwGetWindowUserPointer(window);
      data.Width = width;
      data.Height = height;
  
  	// 2.3将glfw窗口事件转换为自定义的事件
      WindowResizeEvent event(width, height);
  	// 3.回调Application的OnEvent函数，并将事件作为其OnEvent的参数
      data.EventCallback(event);
  });
  ```

- 效果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112016342.png)

## 自己写的简单Demo与流程(123)

对应第二张图的1、2、3步（少了4、5步，可以回到[009.事件系统-自定义事件]()细看**整个**事件系统的设计与流程）

```cpp
#include <iostream>
#include <string>
#include <functional>
using namespace std;
using namespace std::placeholders;// 占位符空间

// 事件类定义//////////////////////////////////////////////////////////////
class Event {							// 事件基类
public:
	virtual void Say() { cout << "Event::Say()" << endl; }
	bool m_Handled;						// 事件是否处理完
};
class WindowCloseEvent : public Event {	// 窗口关闭事件子类
public:
	virtual void Say() { cout << "WindowEvent::Say()" << endl;}
};

// 窗口类定义//////////////////////////////////////////////////////////////
class Window {
public:
	using EventCallbackFn = std::function<void(Event&)>;	// 声明function类型void function(Event&)
	static Window* CreateWindow() {							// 模拟创建窗口
		return new Window;
	}
	void SetEventCallback(const EventCallbackFn& callback) {
		EventCallback = callback;							// 绑定Application::OnEvent
	}
	void SendEvent() {
		cout << "Window::模拟glfw窗口事件" << endl;
		// 2.将glfw窗口事件封装成自己系统的事件
		WindowCloseEvent windowe;
		// 3.回调Application的OnEvent函数，并将事件作为其OnEvent的参数
		EventCallback(windowe);
	}
	EventCallbackFn EventCallback;							// 定义function
};

// 应用层类定义//////////////////////////////////////////////////////////////
class Application {
public:
	Window* win;											// 持有的窗口类
	void OnEvent(Event& event) {
		event.Say();
		cout << "Application::OnEvent(Event& event)" << endl;
		// 4.Application的OnEvent，将事件传递给Application的所有Layer层的OnEvent
		// ......
	}
};
int main() {
	Application app;
	// 1.1Application对象创建窗口类，窗口类初始化了glfw窗口
	app.win = Window::CreateWindow();
	// 1.2Application设置窗口事件的回调函数
	app.win->SetEventCallback(bind(&Application::OnEvent, app, _1));// bind的argument1是函数地址，arug2是哪个类，arug3是调用OnEvent的参数
	// 1.3模拟glfw窗口事件
	app.win->SendEvent();
	return 0;
}
```

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112016344.png)

少了Application自己拦截处理事件

 

