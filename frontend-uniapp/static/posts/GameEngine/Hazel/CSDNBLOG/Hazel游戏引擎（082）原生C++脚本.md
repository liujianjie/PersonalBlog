> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目标

  需要给实体添加**脚本组件**，需先实现用cpp语言来编写脚本

  1. 脚本组件
  2. cpp脚本功能类

- 此节所作

  给摄像机实体添加脚本组件，在引擎内的Scene视口中引擎人员和游戏开发人员都可以**控制摄像机移动**

- 为什么需要添加cpp脚本组件

  - 引擎开发人员需要给引擎某个实体**添加脚本功能**，从而实现**测试时候**能运行想要的脚本功能。

    比如：像Unity那样在Scene界面，摄像机可以自由移动，这是**内置脚本功能**，肯定是使用原生**cpp语言来实现**的

  - 使用这引擎的游戏开发人员有的人不喜欢用c#，想用cpp来实现脚本编写。

- 如何出发

  像前面说的，先从API设计开始，再实现内容

  ```cpp
  class CameraController : public ScriptableEntity
  {
  public:
      void OnCreate(){}
      void OnDestroy(){}
      void OnUpdate(Timestep ts){
          // 获取当前挂载CameraController脚本的实体的TransformComponent组件
          auto& transform = GetComponent<TransformComponent>().Transform;
      }
  };
  // 实体添加脚本组件并且脚本组件关联对应的脚本功能类
  m_CameraEntity.AddComponent<NativeScriptComponent>().Bind<CameraController>();
  ```

- 实现难点

  - 在CameraController脚本类内获取**挂载了这个脚本的Camear实体的Transform组件**。
  - 在Scene视口实现执行摄像机的控制脚本（用户按下wsad，摄像机的脚本能狗响应）。

# 实现在Scene视口操作摄像机移动

## 文字+代码描述

- 声明class CameraController继承ScriptableEntity

  ```cpp
  class CameraController : public ScriptableEntity {
      void OnCreate(){}
      void OnDestroy() {}
      void OnUpdate(Timestep ts) { auto& transform = GetComponent<TransformComponent>().Transform;}
  ```

- 摄像机实体添加NativeScriptComponent脚本组件,并传入CameraController给**Bind()函数**

  ```cpp
  m_CameraEntity.AddComponent<NativeScriptComponent>().Bind<CameraController>();
  ```

- NativeScriptComponent脚本组件接收到CameraController**作为参数T**

  将3个function属性（create,Onupdate,destroy）都绑定为**T中的3个对应函数**（create,Onupdate,destroy

  并且1个function（InstantiateFunction）用来**实例化ScriptableEntity派生类**。

  ```cpp
  struct NativeScriptComponent {
      ScriptableEntity* Instance = nullptr;
      // 关键地方//////////////////////////
      std::function<void()> InstantiateFunction;
      std::function<void()> DestroyInstanceFunction;
      std::function<void(ScriptableEntity*)> OnCreateFunction;
      std::function<void(ScriptableEntity*)> OnDestroyFunction;
      std::function<void(ScriptableEntity*, Timestep)> OnUpdateFunction;
      template<typename T>
      void Bind() {
          // 这里绑定的函数功能是：根据T动态实例化Instanse。
          InstantiateFunction = [&]() {Instance = new T(); };// 引用值捕获Instance（捕获了CameraController，所以实例化CameraController）
          DestroyInstanceFunction = [&]() {delete (T*)Instance; Instance = nullptr; };// 为什么一定要转换为T，因为是在继承的情况下，起提示作用
          // 这里是绑定T的函数
          OnCreateFunction = [](ScriptableEntity* instance) {((T*)instance)->OnCreate(); };
          OnDestroyFunction = [](ScriptableEntity* instance) {((T*)instance)->OnDestroy(); };
          OnUpdateFunction = [](ScriptableEntity* instance, Timestep ts) {((T*)instance)->OnUpdate(ts); };
      }
  };
  ```

- 在Scene.cpp的OnUpdate函数中。

  遍历所属这个场景所拥有NativeScriptComponent脚本组件的**实体ID**，并且用lambda迭代循环实体列表，参数是**实体的ID**和NativeScriptComponent脚本组件实例对象的引用nsc。

  - 用nsc执行function**实例化**Instance，即ScriptableEntity *Instance = new CameraController();

  - 再用nsc.Instance->m_Entity = Entity{ entity, this };

    指定CameraController脚本的m_Entity是**实体ID**，==让脚本与实体关联起来==

  - 由function调用CameraController脚本的OnCreate、OnUpdate函数

    ```cpp
    // 引擎运行的时候更新脚本。
    {   //  [=]是隐式值捕获，捕获ts
        m_Registry.view<NativeScriptComponent>().each([=](auto entity, auto& nsc) {
            if (!nsc.Instance) {
                // 实例化CameraController
                nsc.InstantiateFunction();
                nsc.Instance->m_Entity = Entity{ entity, this };
                // 执行CameraController脚本的OnCreate函数
                nsc.OnCreateFunction(nsc.Instance);
            }
            // 执行CameraController脚本的OnUpdate函数
            nsc.OnUpdateFunction(nsc.Instance, ts);
        });
    }
    ```

  - 在CameraController.OnUpdate函数中获取摄像机实体的transform组件

    ```cpp
    void OnUpdate(Timestep ts) {
    // 获取当前挂载CameraController脚本的实体的TransformComponent组件
    auto& transform = GetComponent<TransformComponent>().Transform;
    ```


## 图画描述

用类图+活动图描述的，不符合软件工程规范，大意是这样。

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302310289.png)



# 相关代码

- ScriptableEntity.h

  ```cpp
  #pragma once
  #include "Entity.h"
  namespace Hazel {
  	class ScriptableEntity {
  	public:
  		template<typename T>
  		T& GetComponent() {
  			return m_Entity.GetComponent<T>(); // 根据Entity类找到关联的组件
  		}
  	private:
  		Entity m_Entity; // 拥有此脚本的实体
  		friend class Scene;
  	};
  }
  ```

- Components.h

  ```cpp
  struct NativeScriptComponent {
      ScriptableEntity* Instance = nullptr;
      // 关键地方//////////////////////////
      std::function<void()> InstantiateFunction;
      std::function<void()> DestroyInstanceFunction;
  
      std::function<void(ScriptableEntity*)> OnCreateFunction;
      std::function<void(ScriptableEntity*)> OnDestroyFunction;
      std::function<void(ScriptableEntity*, Timestep)> OnUpdateFunction;
  
      template<typename T>
      void Bind() {
          // 这里绑定的函数功能是：根据T动态实例化Instanse
          InstantiateFunction = [&]() {Instance = new T(); };// 引用值捕获Instance（捕获了CameraController，所以实例化CameraController）
          DestroyInstanceFunction = [&]() {delete (T*)Instance; Instance = nullptr; };// 为什么一定要转换为T，因为是在继承的情况下，起提示作用
  
          // 这里是绑定T的函数
          OnCreateFunction = [](ScriptableEntity* instance) {((T*)instance)->OnCreate(); };
          OnDestroyFunction = [](ScriptableEntity* instance) {((T*)instance)->OnDestroy(); };
          OnUpdateFunction = [](ScriptableEntity* instance, Timestep ts) {((T*)instance)->OnUpdate(ts); };
      }
  };
  
  ```

  - create function声明与定义 **同等**写法1

    ```cpp
    std::function<void()> OnCreateFunction;// 声明
    // 这里隐式捕获的是“Bind函数里的this指针“
    OnCreateFunction = [&]() {((T*)Instance)->OnCreate(); };// 定义形式1, 省略使用this调用全局的Instance属性
    nsc.OnCreateFunction();// 使用
    ```

  - create function声明与定义 **同等**写法2

    ```cpp
    std::function<void()> OnCreateFunction;// 声明
    // 这里隐式捕获的是“Bind函数里的this指针“
    OnCreateFunction = [&]() {((T*)this->Instance)->OnCreate(); };// 定义形式2, 显式使用this调用全局的Instance属性
    nsc.OnCreateFunction();// 使用
    ```

  - create function声明与定义 **错误**写法1

    ```cpp
    std::function<void()> OnCreateFunction;// 声明
    // 未捕获Bind函数的this指针，此时this是lamda函数作用域的this指针，无Instance属性
    OnCreateFunction = []() {((T*)this->Instance)->OnCreate(); };
    nsc.OnCreateFunction();// 使用
    ```

  - create function声明与定义 **错误**写法2

    ```cpp
    std::function<void()> OnCreateFunction;// 声明
    // Instance是全局的，不在Bind函数内不能捕获
    OnCreateFunction = [&Instance]() {((T*)Instance)->OnCreate(); };
    nsc.OnCreateFunction();// 使用
    ```

- EditorLayer.cpp

  ```cpp
  class CameraController : public ScriptableEntity {
      public:
      void OnCreate(){}
      void OnDestroy() {}
      void OnUpdate(Timestep ts) {
          // 获取当前挂载CameraController脚本的实体的TransformComponent组件
          auto& transform = GetComponent<TransformComponent>().Transform;
          float speed = 5.0f;
  
          if (Input::IsKeyPressed(KeyCode::A))
              transform[3][0] -= speed * ts;
          if (Input::IsKeyPressed(KeyCode::D))
              transform[3][0] += speed * ts;
          if (Input::IsKeyPressed(KeyCode::W))
              transform[3][1] += speed * ts;
          if (Input::IsKeyPressed(KeyCode::S))
              transform[3][1] -= speed * ts;
      }
  };
  m_CameraEntity.AddComponent<NativeScriptComponent>().Bind<CameraController>();
  ```

- Scene.cpp

  ```cpp
  // 引擎运行的时候更新脚本。
  {//  [=]是隐式值捕获，捕获ts
      m_Registry.view<NativeScriptComponent>().each([=](auto entity, auto& nsc) {
          if (!nsc.Instance) {
              nsc.InstantiateFunction();
              nsc.Instance->m_Entity = Entity{ entity, this };
              // 执行CameraController脚本的OnCreate函数
              nsc.OnCreateFunction(nsc.Instance);
          }
          // 执行CameraController脚本的OnUpdate函数
          nsc.OnUpdateFunction(nsc.Instance, ts);
      });
  }
  ```

# 涉及的C++知识

## delete

针对此节这段代码

```cpp
DestroyInstanceFunction = [&]() {delete (T*)Instance; Instance = nullptr; };// 为什么一定要转换为T，因为是在继承的情况下，起提示作用
```

写的demo

```cpp
#include <iostream>
using namespace std;
class ScriptableEntity {
public:
	virtual ~ScriptableEntity() { cout << "~ScriptableEntity()" << endl; }
};
class CameraController : public ScriptableEntity {
public:
	virtual ~CameraController() { cout << "~CameraController()" << endl; }
};
void main() {
	// s1是在栈上的，若*s = &s1;当显示删除delete s; s1的内存会被清除，但是出了main作用域，s1又会被清理一遍，所以会报错。
	//ScriptableEntity s1;
	//ScriptableEntity* s = &s1;
    //delete s;

	ScriptableEntity* sp1 = new ScriptableEntity;
	// 这两种删除方式都只会调用~ScriptableEntity()
	delete sp1;
	//delete (ScriptableEntity*)sp1;

	ScriptableEntity* sp2 = new CameraController;
	// 这两种删除方式都会调用 ~CameraController() 然后 ~ScriptableEntity()
	//delete sp2;
	delete (CameraController*)sp2;// 提示作用
}

```

## lambda简要

```cpp
#include <iostream>
using namespace std;
/*
捕获:
	将当前作用域的变量，可以放进lambda{}里使用。[c1]为值捕获，[&c1]为引用捕获
隐式捕获：
	在捕获的基础上可以简化代码，不用写出捕获哪个变量。
	[=]{return c1;} 表示隐式值捕获，捕获的变量即{}里用到的c1变量
	[&]{return c1;} 表示隐式引用捕获，捕获的变量即{}里用到的c1变量
*/
// 1.值捕获
void fcn1()
{
	size_t v1 = 42;
	auto f = [v1] {return v1; };
	//auto f = [v1]()mutable{return ++v1; }; // 加了mutable才可以修改
	v1 = 0;
	auto j = f();
	cout << j << endl; // 42
}
// 2.引用捕获
void fcn2()
{
	size_t v1 = 42;
	auto f = [&v1] {return v1; };
	v1 = 0;
	auto j = f();
	cout << j << endl;// 0
}
// 3.隐式捕获
void fcn3() {
	// 3.1隐式值捕获
	size_t v1 = 42;
	auto f1 = [=] {return v1; };
	//auto f1 = [v1]()mutable{return ++v1; }; // 加了mutable才可以修改
	v1 = 0;
	auto j1 = f1();
	cout << j1 << endl; // 42
	// 3.2隐式引用捕获
	size_t v2 = 42;
	auto f2 = [&] {return v2; };
	v2 = 0;
	auto j2 = f2();
	cout << j2 << endl; // 0
}
void main()
{
	fcn1();
	fcn2();
	fcn3();
}
```



​    
