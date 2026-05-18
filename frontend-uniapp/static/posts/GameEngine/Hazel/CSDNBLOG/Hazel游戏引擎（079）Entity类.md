> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  由于Entt提供操作组件的API太长，所以需

  - 抽象Scene类(078节以做)

    - 获取Entt提供的注册表
    - 能**创建、删除**实体

  - 抽象出Entity实体类，作为中介，连接场景与组件的媒介（此节所作）

    能**添加、删除**组件

- 探讨Entt的API优缺点来设计出Scene、Entity类

  游戏引擎开发人员的角度，是场景拥有实体、**场景给实体添加组件**，所以以下调用Entt代码是合理的。

  ```cpp
  // 场景给square实体添加组件
  m_ActiveScene->Reg().emplace<TransformComponent>(square); // 先要获取注册表才能添加组件
  m_ActiveScene->Reg().emplace<SpriteRendererComponent>(square, glm::vec4(0.0f, 1.0f, 0.0f, 1.0f));
  ```

  但是，这代码太长了，引擎开发人员应该站在**游戏开发人员角度**思考

  1. 场景虽然拥有实体，可以获取实体给它添加组件
  2. 但站在之前Ecs2.0设计模式下**实体也应拥有组件**，只需简单的考虑**实体添加组件**这个行为，而**忽略场景这个东西**
  3. 这有利于我们简化代码，目标是简化成Unity那样给gameobject添加组件的函数

  ```cpp
  // 原先：场景给square实体添加组件
  m_ActiveScene->Reg().emplace<TransformComponent>(square); // 先要获取注册表才能添加组件
  m_ActiveScene->Reg().emplace<SpriteRendererComponent>(square, glm::vec4(0.0f, 1.0f, 0.0f, 1.0f));
  // 化简为：square实体添加组件，忽略场景
  square.AddComponent<TransformComponent>();
  square.AddComponent<SpriteRendererComponent>(glm::vec4(0.0f, 1.0f, 0.0f, 1.0f));
  ```

  Cherno说，应该先想出设计出API再谈实现。

# 代码

- 设计的Entity

  ```cpp
  #pragma once
  
  #include "Scene.h"
  #include "entt.hpp"
  namespace Hazel {
  	class Scene;
  	class Entity
  	{
  	public:
  		Entity() = default;
  		Entity(entt::entity handle, Scene* scene);
  		Entity(const Entity& other) = default;
  
  		template<typename T, typename... Args>
  		T& AddComponent(Args&&... args) {
  			HZ_CORE_ASSERT(!HasComponent<T>(), "实体已经存在这个组件");
  			return m_Scene->m_Registry.emplace<T>(m_EntityHandle, std::forward<Args>(args)...);
  		}
  		template<typename T>
  		T& GetComponent() {
  			HZ_CORE_ASSERT(HasComponent<T>(), "实体不存在这个组件");
  			return m_Scene->m_Registry.get<T>(m_EntityHandle);
  		}
  		template<typename T>
  		bool HasComponent() {
  			return m_Scene->m_Registry.all_of<T>(m_EntityHandle);
  		}
  		template<typename T>
  		void RemoveComponent() {
  			HZ_CORE_ASSERT(HasComponent<T>(), "实体不存在这个组件");
  			m_Scene->m_Registry.remove<T>(m_EntityHandle);
  		}
  		operator bool() const { return (uint32_t)m_EntityHandle != 0; }
  	private:
  		entt::entity m_EntityHandle{ 0 };// 会有bug
  		Scene* m_Scene = nullptr;
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "Entity.h"
  namespace Hazel {
  	Entity::Entity(entt::entity handle, Scene* scene)
  		: m_EntityHandle(handle), m_Scene(scene)
  	{
  	}
  }
  ```

- 设计的Scene

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
      Scene::Scene()
      {
          m_Registry.create(); // 让值+1
      }
      Scene::~Scene()
      {
      }
      Entity Scene::CreateEnitty(std::string name)// 此节新增加了
      {
          // 添加默认组件
          Entity entity = { m_Registry.create(),this };
          entity.AddComponent<TransformComponent>();
          auto& tag = entity.AddComponent<TagComponent>();
          tag.Tag = name.empty() ? "Entity" : name;
          return entity;
      }
      // 更新
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

- EditorLayer.cpp使用

  ```cpp
  // 创建实体
  auto square = m_ActiveScene->CreateEnitty("Square");
  // 实体添加组件
  square.AddComponent<SpriteRendererComponent>(glm::vec4(0.0f, 1.0f, 0.0f, 1.0f));
  //m_ActiveScene->Reg().emplace<TransformComponent>(square); // 先要获取注册表才能添加组件
  //m_ActiveScene->Reg().emplace<SpriteRendererComponent>(square, glm::vec4(0.0f, 1.0f, 0.0f, 1.0f));
  // 保存ID
  m_SquareEntity = square;
  ```

# 记录bug

1. error C3646: “CreateEnitty”: 未知重写说明符

   ```cpp
   // 需要前置Entity声明
   class Entity;
   class Scene
   {
   	Entity CreateEnitty();
   }
   ```

2. error C2039: "has": 不是 "entt::basic_registry<entt::entity,std::allocator<Entity>>" 的成员

   ```cpp
   “.has<T>”已从较新版本的 EnTT 中删除。
   需要替换成
   m_scene->m_registry.all_of<T>( m_entity_handle );或 (...).any_of<T> 是现在要使用的函数。 
   ```

3. m_Registry.create();返回的值是从**0**开始的

   所以，实体所对应的id不能默认为0，应该改为null

   ```cpp
   entt::entity m_EntityHandle{ 0 };// 会有bug
   ```

   ```cpp
   entt::entity m_EntityHandle{ null };
   ```

   
