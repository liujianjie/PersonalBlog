> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 提示

  此节和082节内容差不多

- 这节目的

  将上一节在NativeScriptComponent写的function执行的功能替换为**虚函数**(OnCreate、OnUpdate、OnDestroy)和**函数指针**（Instantiate、Destroy）

- 为什么

  之前的视频有讲过，有人在GitHub给cherno提意见**说虚函数降低性能**，所以上一节他刻意避免了使用虚函数，但是这节他说虚函数**并不会降低太多性能**，而且在引擎很多类都写了虚函数。

  使用函数指针是因为不用function使得代码更**简洁**

# 实现在scene视口操作摄像机移动

## 文字+代码描述

- ScriptableEntity的函数定义为虚函数

  ```cpp
  class ScriptableEntity {
      public:
      virtual ~ScriptableEntity() {}
  
      template<typename T>
      T& GetComponent() {
          return m_Entity.GetComponent<T>(); // 根据Entity类找到关联的组件
      }
      protected:
      /////////////////////////////////////////////////////
      // 这里，虚函数/////////////////////////////////////////////////////
      virtual void OnCreate() {}
      virtual void OnDestroy() {}
      virtual void OnUpdate(Timestep ts) {}
      private:
      Entity m_Entity; 
      friend class Scene;// 为了在scene中设置m_Entity
  };
  ```

- 声明class CameraController继承ScriptableEntity

  ```cpp
  class CameraController : public ScriptableEntity {
      void OnCreate(){}
      void OnDestroy() {}
      void OnUpdate(Timestep ts) { auto& transform = GetComponent<TransformComponent>().Transform;}
  ```

- 摄像机实体添加NativeScriptComponent脚本组件,并传入CameraController给Bind()函数

  ```cpp
  m_CameraEntity.AddComponent<NativeScriptComponent>().Bind<CameraController>();
  ```

- NativeScriptComponent脚本组件接受到CameraController作为参数T，1个函数指针用来指定初始化派生类，1个函数指针用来销毁派生类。

  ```cpp
  struct NativeScriptComponent {
      ScriptableEntity* Instance = nullptr;
      // 函数指针
      // 函数指针名称：InstantiateScript、指向无参数、返回ScriptableEntity指针的函数
      ScriptableEntity* (*InstantiateScript)();
      // 函数指针名称：DestroyScript、指向NativeScriptComponent指针参数、无返回参数的函数
      void(*DestroyScript)(NativeScriptComponent*);
      template<typename T>
      void Bind() {
          // 这里绑定的函数功能是：根据T动态实例化Instanse
          InstantiateScript = []() {return static_cast<ScriptableEntity*>(new T()); };// 引用值捕获Instance
          DestroyScript = [](NativeScriptComponent* nsc) {delete nsc->Instance; nsc->Instance = nullptr; };
      }
  };
  ```

- 在Scene.cpp的OnUpdate函数中。

  遍历所属这个场景所拥有NativeScriptComponent脚本组件的**实体ID**，并且用lambda迭代循环实体列表，参数是**实体的ID**和NativeScriptComponent脚本组件实例对象的引用nsc。

  - 用nsc执行函数指针实例化**Instance**，即ScriptableEntity *Instance = new CameraController();

  - 再用nsc.Instance->m_Entity = Entity{ entity, this };

    指定CameraController脚本的m_Entity是**实体ID**，==让脚本与实体关联起来==

  - 由虚函数**动态**指定调用CameraController脚本的OnCreate、OnUpdate函数

    ```cpp
    // 引擎运行的时候更新脚本。
    {   //  [=]是隐式值捕获，捕获ts
        m_Registry.view<NativeScriptComponent>().each([=](auto entity, auto& nsc) {
            if (!nsc.Instance) {
                // 实例化CameraController
                nsc.Instance = nsc.InstantiateScript();
                nsc.Instance->m_Entity = Entity{ entity, this };
                // 执行CameraController脚本的OnCreate函数，由虚函数指定
                nsc.Instance->OnCreate();
            }
            // 执行CameraController脚本的OnUpdate函数
            nsc.Instance->OnUpdate(ts);
        });
    ```

  - 在CameraController.OnUpdate函数中获取摄像机实体的transform组件

    ```cpp
    void OnUpdate(Timestep ts) {
    // 获取当前挂载CameraController脚本的实体的TransformComponent组件
    auto& transform = GetComponent<TransformComponent>().Transform;
    ```

## 图画描述

用类图+活动图描述的，不符合软件工程规范，大意是这样。

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302311866.png)

# 问题

- 简要说明

  为什么不在Bind函数里，执行ScriptableEntity* Instance = new CameraController();和Instance->OnCreate函数，反正他们也只运行一次。

- 详细文字复述一遍

  为什么不在实体**添加脚本组件**的时候就确定ScriptableEntity的派生类CameraController脚本、和执行OnCreate函数

  ```cpp
  // 这里
  m_CameraEntity.AddComponent<NativeScriptComponent>().Bind<CameraController>();
  ```

  而要用**函数指针**在**Scene里调用指定派生类**。

  ```cpp
  // 这里
  m_Registry.view<NativeScriptComponent>().each([=](auto entity, auto& nsc) {
          if (!nsc.Instance) {
              // 实例化CameraController
              nsc.Instance = nsc.InstantiateScript();
  ```

- 解答

  Cherno好像是说等CameraController脚本构造函数、OnCreate函数可能需要一些**实体的组件的变量**，而这些实体组件**还没初始化**，所以等统一初始化好了再指定派生类，即调用派生类的构造函数、Oncreate函数。

# 相关代码

- ScriptableEntity.h

  ```cpp
  #pragma once
  #include "Entity.h"
  namespace Hazel {
  	class ScriptableEntity {
  	public:
  		virtual ~ScriptableEntity() {}
  
  		template<typename T>
  		T& GetComponent() {
  			return m_Entity.GetComponent<T>(); // 根据Entity类找到关联的组件
  		}
  	protected:
  		virtual void OnCreate() {}
  		virtual void OnDestroy() {}
  		virtual void OnUpdate(Timestep ts) {}
  	private:
  		Entity m_Entity; 
  		friend class Scene;// 为了在scene中设置m_Entity
  	};
  }
  ```

- Components.h

  ```cpp
  struct NativeScriptComponent {
      ScriptableEntity* Instance = nullptr;
      // 用函数指针
      ScriptableEntity* (*InstantiateScript)();// 这函数返回ScriptableEntity指针，函数无参数，InstantiateScript的*代表为指针
      void(*DestroyScript)(NativeScriptComponent*);
      template<typename T>
      void Bind() {
          // 这里绑定的函数功能是：根据T动态实例化Instanse
          InstantiateScript = []() {return static_cast<ScriptableEntity*>(new T()); };// 引用值捕获Instance
          DestroyScript = [](NativeScriptComponent* nsc) {delete nsc->Instance; nsc->Instance = nullptr; };
      }
  };
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
  {   //  [=]是隐式值捕获，捕获ts
      m_Registry.view<NativeScriptComponent>().each([=](auto entity, auto& nsc) {
          if (!nsc.Instance) {
              nsc.Instance = nsc.InstantiateScript();
              nsc.Instance->m_Entity = Entity{ entity, this };
              // 执行CameraController脚本的OnCreate函数，由虚函数指定
              nsc.Instance->OnCreate();
          }
          // 执行CameraController脚本的OnUpdate函数
          nsc.Instance->OnUpdate(ts);
      });
  ```

# Cherno说的修复地方

## 元祖引用

这个不懂。

```cpp
auto& [transform, camera] = group.get<TransformComponent, CameraComponent>(entity);

if (camera.primary) {
    mainCamera = &camera.camera;
    cameraTransform = &transform.Transform;
}
```

说什么group.get返回tuple，tuple里面的元素是引用，无需再写个&，所以要改成

```cpp
auto [transform, camera] = group.get<TransformComponent, CameraComponent>(entity);

if (camera.primary) {
    mainCamera = &camera.camera;
    cameraTransform = &transform.Transform;
}
```

