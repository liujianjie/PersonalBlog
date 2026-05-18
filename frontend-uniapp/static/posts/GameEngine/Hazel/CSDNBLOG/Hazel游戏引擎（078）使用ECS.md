> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  将Entt提供的ECS模式应用在目前的引擎**渲染**过程中。

# 代码流程

- 在Editorlayer中有**scene**指针

  ```cpp
  Ref<Scene> m_ActiveScene;
  ```

- 由scene创建**实体**，返回实体id

  ```cpp
  auto square = m_ActiveScene->CreateEnitty();
  
  entt::entity Scene::CreateEnitty()
  {
      return m_Registry.create();
  }
  ```

- 由实体添加**组件**

  ```cpp
  m_ActiveScene->Reg().emplace<TransformComponent>(square); // 先要获取注册表才能添加组件
  m_ActiveScene->Reg().emplace<SpriteRendererComponent>(square, glm::vec4(0.0f, 1.0f, 0.0f, 1.0f));		// 保存ID
  m_SquareEntity = square;
  ```

- 在Editorlayer的OnUpdate中，调用scene的OnUpdate

  ```cpp
  Renderer2D::BeginScene(m_CameraController.GetCamera());
  // Scene更新
  m_ActiveScene->OnUpdate(ts);
  Renderer2D::EndScene();
  ```

- scene的OnUpdate用来获取既有transform又有spriterenderer组件的所有实体，**遍历这个实体列表进行渲染**

  ```cpp
  void Scene::OnUpdate(Timestep ts)
  {
      auto group = m_Registry.group<TransformComponent>(entt::get<SpriteRendererComponent>);
      for (auto entity : group) {
          auto& [transform, sprite] = group.get<TransformComponent, SpriteRendererComponent>(entity);
          Renderer2D::DrawQuad(transform, sprite.Color);
      }
  }
  ```

# 涉及的类代码

- 新增**Components**.h

  ```cpp
  #pragma once
  #include <glm/glm.hpp>
  namespace Hazel {
      struct TransformComponent { // 不用继承Component
          glm::mat4 Transform{ 1.0f };
          TransformComponent() = default;
          TransformComponent(const TransformComponent&) = default; // 复制构造函数
          TransformComponent(const glm::mat4& transform)          // 转换构造函数
              : Transform(transform) {}
          operator const glm::mat4& () { return Transform; }      // 类型转换构造函数
          operator const glm::mat4& () const { return Transform; }
      };
  
      struct SpriteRendererComponent {
          glm::vec4 Color{ 1.0f, 1.0f, 1.0f, 1.0f };
          SpriteRendererComponent() = default;
          SpriteRendererComponent(const SpriteRendererComponent&) = default;
          SpriteRendererComponent(const glm::vec4& color)
              : Color(color) {}
      };
  
  }
  ```

- 新增**Scene**

  ```cpp
  #pragma once
  #include "entt.hpp"
  #include "Entity.h"
  #include "Hazel/Core/Timestep.h"
  namespace Hazel {
  	class Entity;
  	class Scene
  	{
  		friend class Entity;
  	public:
  		Scene();
  		~Scene();
  		
  		Entity CreateEnitty(std::string name);
  
  		void OnUpdate(Timestep ts);
  	private:
  		entt::registry m_Registry;// entt提供的注册表
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "Scene.h"
  #include "Components.h"
  #include "Hazel/Renderer/Renderer2D.h"
  #include <glm/glm.hpp>
  namespace Hazel {
      static void DoMath(const glm::mat4& transform) {
      }
      static void OnTransformConstruct(entt::registry& registry, entt::entity entity) {
      }
      Scene::Scene()
      {
      }
  	entt::entity Scene::CreateEnitty()
      {
          return m_Registry.create();
      }
      void Scene::OnUpdate(Timestep ts)
      {
          auto group = m_Registry.group<TransformComponent>(entt::get<SpriteRendererComponent>);
          for (auto entity : group) {
              auto& [transform, sprite] = group.get<TransformComponent, SpriteRendererComponent>(entity);
              Renderer2D::DrawQuad(transform, sprite.Color);
          }
      }
  }
  ```
