> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  - 为完成008事件系统设计的第四步，将事件从Application传递分发给Layer层。

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112027541.png)

  - 使引擎事件系统模块完整

- Layer的理解

  想象同Ps中一张图有多个层级，可以在层级上绘制图画

- Layer的设计

  - 数据结构：vector

  - 渲染顺序

    **从前往后**渲染各个层的图像，这样后面渲染的会覆盖前面渲染的图像，在屏幕的最顶层。

  - 处理事件顺序

    **从后往前**依次处理事件，当一个事件被一个层处理完不会传递给前一个层，结合渲染顺序，这样在屏幕最顶层的（也就是在vector最后的layer）图像**最先**处理事件。

  - 例子解释

    比如常见的3D游戏有UI。

    渲染顺序：将3D图形先渲染，再渲染2DUI，这样屏幕上2DUI永远在3D图形上方，显示正确；

    事件顺序：点击屏幕的图形，应该是2DUI最先处理，如果是相应UI事件，处理完后**不传递**给前一个3D层，若不是自己的UI事件，**才传递**给前一个3D层。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112027198.png)

  

# 增加Layer后的主要类图

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112027851.png)

注意区分LayerStack、Layer以及ExampleLayer

- LayerStack

  管理Layer层的类

- Layer

  所有层的父类，定义了虚函数

- Examplayer

  真正需要更新和处理事件的层，被添加到LayerStack的vector中

# 项目相关

## 代码

- Layer

  ```cpp
  #pragma once
  #include "Hazel/Core.h"
  #include "Hazel/Events/Event.h"
  namespace Hazel {
  	class HAZEL_API Layer
  	{
  	public:
  		Layer(const std::string& name = "Layer");
  		virtual ~Layer();
  		virtual void OnAttach() {} // 应用添加此层执行
  		virtual void OnDetach() {} // 应用分离此层执行
  		virtual void OnUpdate() {} // 每层更新
  		virtual void OnEvent(Event& event) {}// 每层处理事件
  		inline const std::string& GetName() const { return m_DebugName; }
  	protected:
  		std::string m_DebugName;
  	};
  }
  ```

- LayerStack

  ```cpp
  #pragma once
  namespace Hazel {
  	class HAZEL_API LayerStack{
  	public:
  		LayerStack();
  		~LayerStack();
  		void PushLayer(Layer* layer);	// vector在头部添加一个层
  		void PushOverlay(Layer* overlay);// 在vector末尾添加一个覆盖层，在屏幕的最上方的层
  		void PopLayer(Layer* layer);	// vector弹出指定层
  		void PopOverlay(Layer* overlay);// vector弹出覆盖层
  		std::vector<Layer*>::iterator begin() { return m_Layers.begin(); }
  		std::vector<Layer*>::iterator end() { return m_Layers.end(); }
  	private:
  		std::vector<Layer*> m_Layers;
  		std::vector<Layer*>::iterator m_LayerInsert;
  	};
  }
  ```

  ```cpp
  namespace Hazel {
  	LayerStack::LayerStack(){
  		m_LayerInsert = m_Layers.begin();
  	}
  	LayerStack::~LayerStack(){
  		for (Layer* layer : m_Layers)
  			delete layer;
  	}
  	void LayerStack::PushLayer(Layer* layer){
  		// emplace在vector容器指定位置之前插入一个新的元素。返回插入元素的位置
  		// 插入 1 2 3，vector是 3 2 1
  		m_LayerInsert = m_Layers.emplace(m_LayerInsert, layer);
  	}
  	void LayerStack::PushOverlay(Layer* overlay){
  		m_Layers.emplace_back(overlay);
  	}
  	void LayerStack::PopLayer(Layer* layer){
  		auto it = std::find(m_Layers.begin(), m_Layers.end(), layer);
  		if (it != m_Layers.end()){
  			m_Layers.erase(it);
  			m_LayerInsert--;	// 指向Begin
  		}
  	}
  	void LayerStack::PopOverlay(Layer* overlay){
  		auto it = std::find(m_Layers.begin(), m_Layers.end(), overlay);
  		if (it != m_Layers.end())
  			m_Layers.erase(it);
  	}
  }
  ```

- SandboxApp

  ```cpp
  class ExampleLayer : public Hazel::Layer{
  public:
  	ExampleLayer()
  		: Layer("Example"){}
  	void OnUpdate() override{
  		HZ_INFO("ExampleLayer::Update");	// 最终会被输出
  	}
  	void OnEvent(Hazel::Event& event) override{
  		HZ_TRACE("{0}", event);	// 最终会被输出
  	}
  };
  class Sandbox : public Hazel::Application{
  public:
  	Sandbox(){
  		PushLayer(new ExampleLayer());
  	}
  	~Sandbox(){}
  };
  ```

- Application

  ```cpp
  void Application::PushLayer(Layer* layer){
      m_LayerStack.PushLayer(layer);
  }
  
  void Application::PushOverlay(Layer* layer){
      m_LayerStack.PushOverlay(layer);
  }
  // 回调glfw窗口事件的函数
  void Application::OnEvent(Event& e){
      // 4.用事件调度器，拦截自己层想要拦截的事件并处理
      EventDispatcher dispatcher(e);
      dispatcher.Dispatch<WindowCloseEvent>(BIND_EVENT_FN(OnWindowClose));
  
      // 从后往前顺序处理事件
      for (auto it = m_LayerStack.end(); it != m_LayerStack.begin(); ){
          (*--it)->OnEvent(e);
          if (e.Handled)// 处理完就不要传入前一个层
              break;
      }
  }
  void Application::Run(){
      while (m_Running){
          glClearColor(1, 0, 1, 1);
          glClear(GL_COLOR_BUFFER_BIT);
  
          // 从前往后顺序更新层
          for (Layer* layer : m_LayerStack)
              layer->OnUpdate();
  
          m_Window->OnUpdate();	// 更新glfw
      }
  }
  ```

## 项目流程

- 文字

  1. Application定义了LayerStack对象m_LayerStack
  2. 在Sandbox构造函数中，执行PushLayer(new ExampleLayer());，将ExampleLayer放入m_LayerStack的vector中
  3. Application的OnEvent函数从后往前顺序遍历m_LayerStack的vector，得到ExampleLayer对象，并把事件e作为参数执行它的OnEvent函数，所以一直在控制台输出**窗口事件**
  4. Application的OnUpdate函数从前往后遍历m_LayerStack的vector，得到ExampleLayer对象，并执行它的OnUpdate函数，所以一直在控制台输出**"ExampleLayer::Update"**

- 图示

  以下是以活动图的样子绘制的，并不符合活动图的规范，但大意是这样

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306172149918.png)

## 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112027551.png)

# LayerStack类的错误

LayerStack的vector管理layer有错

- 简化的例子

  ```cpp
  #include <iostream>
  #include <vector>
  using namespace std;
  
  void Test1() {
  	vector<int> vec;
  	std::vector<int>::iterator m_LayerInsertIndex = vec.begin();// 头部插入位置
  	// 在头部插入1 2，此时vector 2 1
  	m_LayerInsertIndex = vec.emplace(m_LayerInsertIndex, 1);
  	m_LayerInsertIndex = vec.emplace(m_LayerInsertIndex, 2);
  	// 在尾部插入4，  此时vector 2 1 4
  	vec.emplace_back(4);
  	// 在头部插入3,   此时vector并不是 3 2 1 4，而是会报错
  	//m_LayerInsertIndex = vec.emplace(m_LayerInsertIndex, 3);
  	for (int i = 0; i < vec.size(); i++) {
  		cout << vec[i] << endl; 
  	}
  }
  int main() {
  	Test1();
  	return 0;
  }
  
  ```

- 报错结果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112027553.png)

- 分析原因

  不太准确，个人猜测可能在尾部插入元素（emplace_back）使vector在**内存位置**发生改变，会破坏m_LayerInsertIndex这个迭代器无效吧

- 解决方法

  在尾部插入元素（emplace_back）后让m_LayerInsertIndex迭代器重新指向头部

  ```cpp
  #include <iostream>
  #include <vector>
  using namespace std;
  
  void Test1() {
  	vector<int> vec;
  	std::vector<int>::iterator m_LayerInsertIndex = vec.begin();// 头部插入位置
  	// 在头部插入1 2，此时vector 2 1
  	m_LayerInsertIndex = vec.emplace(m_LayerInsertIndex, 1);
  	m_LayerInsertIndex = vec.emplace(m_LayerInsertIndex, 2);
  	// 在尾部插入4，  此时vector 2 1 4
  	vec.emplace_back(4);
  	// 在头部插入3,   此时vector并不是 3 2 1 4，而是会报错
  	m_LayerInsertIndex = vec.begin(); // 需要重新让头部迭代器指向头部
  	m_LayerInsertIndex = vec.emplace(m_LayerInsertIndex, 3);
  	for (int i = 0; i < vec.size(); i++) {
  		cout << vec[i] << endl; 
  	}
  }
  int main() {
  	Test1();
  	return 0;
  }
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306112027076.png)