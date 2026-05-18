> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 什么是UUID

  可以理解为全球**唯一**标识

- 为什么要使用UUID标识实体 = 此节目的

  为了点击运行场景，实体发生位置等变化**复原**而要实现的标识功能

- 为什么不简单的使用increment递增

  假设从0开始，游戏分发到两个电脑，他们创建实体标识id，需要知道从多少开始递增，需要服务器提供权威多少开始递增，这样的设计不太好，不想多一个服务器功能，所以只需使用uuid。

  uuid发生的冲突很小，所以不用担心两个电脑创建实体的id一样

- 如何实现

  定义UUID类，使用cpp的随机函数，随机ID

- 实现细节

  - uuid一般是128位，16字节，但是Cherno只用了64位，**8字节**实现表示UUID

  - uuid作为key对应实体存储在map中时

    - 若是unordered_map<**uint64_t**, std::string> m_Map;

      这种结构，UUID类只需提供**类型转换函数**

      ```cpp
      operator uint64_t() const {return m_UUID;}
      m_Map[(uint64_t)UUID()] = "Cherno"; 
      ```

    - 若是unordered_map<**UUID**, std::string> m_Map;

      需要为UUID类提供**哈希函数**

      ```cpp
      namespace std {
      	template<>
      	struct hash<Hazel::UUID>{
      		std::size_t operator()(const Hazel::UUID& uuid) const{
      			return hash<uint64_t>()((uint64_t)uuid);
      		}
      	};
      }
      ```

      不然使用UUID类作为key会有bug

      ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132111801.png)

  - 在SceneSerializer中获取实体的UUID

    需要先获取实体的id组件再获取uuid，挺麻烦的，所以就直接在实体类中提供一个**GetUUID**的函数。

# 关键代码+代码流程

- 定义好UUID类

  ```cpp
  #pragma once
  namespace Hazel {
  	class UUID{
  	public:
  		UUID();
  		UUID(uint64_t uuid);
  		UUID(const UUID&) = default;
  
  		operator uint64_t() const { return m_UUID; }
  	private:
      	///////////////////////////////////////
          // 类型转换函数
  		uint64_t m_UUID;
  	};
  }
  namespace std {
      ///////////////////////////////////////
      // 哈希函数
  	template<>
  	struct hash<Hazel::UUID>{
  		std::size_t operator()(const Hazel::UUID& uuid) const{
  			return hash<uint64_t>()((uint64_t)uuid);
  		}
  	};
  }
  
  #include "hzpch.h"
  #include "UUID.h"
  #include <random>
  namespace Hazel {
  	static std::random_device s_RandomDevice;
  	static std::mt19937_64 s_Engine(s_RandomDevice());
  	static std::uniform_int_distribution<uint64_t> s_UniformDistribution;
  	UUID::UUID()
  		: m_UUID(s_UniformDistribution(s_Engine)){
  	}
  	UUID::UUID(uint64_t uuid)
  		: m_UUID(uuid){
  	}
  }
  ```

- 开始创建实体时候（CreateEntity）创建新的UUID，真正创建实体时（CreateEntityWithUUID）使用实参UUID

  ```cpp
      Entity Scene::CreateEntity(std::string name)
      {
          // 创建新的uuid
          return CreateEntityWithUUID(UUID(), name);
      }
      Entity Scene::CreateEntityWithUUID(UUID uuid, const std::string name)
      {
          // 添加默认组件
          Entity entity = { m_Registry.create(),this };
          entity.AddComponent<TransformComponent>();
          entity.AddComponent<IDComponent>(uuid); // 使用实参uuid，不创建新的
          auto& tag = entity.AddComponent<TagComponent>();
          tag.Tag = name.empty() ? "Entity" : name;
          return entity;
      }
  ```

- **序列化**yaml-cpp文件时，读取实体的ID

  ```cpp
  static void SerializeEntity(YAML::Emitter& out, Entity entity) {
      HZ_CORE_ASSERT(entity.HasComponent<IDComponent>());
      out << YAML::BeginMap;
      //out << YAML::Key << "Entity" << YAML::Value << "12837192831273";
      out << YAML::Key << "Entity" << YAML::Value << entity.GetUUID();
  ```

- **解析**yaml-cpp文件的时候，创建实体使用存储在yaml文件中的uuid

  ```cpp
  bool SceneSerializer::DeSerialize(const std::string& filepath){
      ......
      auto entities = data["Entities"];
      if (entities) {
          for (auto entity : entities) {
              uint64_t uuid = entity["Entity"].as<uint64_t>();
  
              std::string name;
              auto tagComponent = entity["TagComponent"];
              if (tagComponent) {
                  name = tagComponent["Tag"].as<std::string>();
              }
              HZ_CORE_TRACE("Deserialized entity with ID = {0}, name = {1}", uuid, name);
  
              // 使用已存在的UUID
              Entity deserializedEntity = m_Scene->CreateEntityWithUUID(uuid, name);;
  ```

# yaml-cpp的uuid

```cpp
Scene: Untitled
Entities:
  - Entity: 17719385851905286962
    TagComponent:
      Tag: Red Square Entity
    TransformComponent:
	......
  - Entity: 734470491072089684
    TagComponent:
      Tag: Green Square Entity
    TransformComponent:
	......
  - Entity: 1740022399049692222
    TagComponent:
      Tag: Camera A
	......
  - Entity: 1432312044630952282
    TagComponent:
      Tag: Camera B
    TransformComponent:
	......
```

# Cherno遇到的BUG

- BUG1递归包含

  - Bug分析

    Entity.h

    ```cpp
    #include "Hazel/Core/UUID.h"
    #include "Components.h"// 注意这个文件
    #include "Scene.h"
    #include "entt.hpp"
    ```

    Components.h

    ```cpp
    // 脚本编辑组件要这个ScriptableEntity头文件
    #include "Hazel/Scene/ScriptableEntity.h"
    #include "Hazel/Renderer/Texture.h"
    #include "Hazel/Core/UUID.h"
    ```

    ScriptableEntity.h

    ```cpp
    #include "Hazel/Core/Timestep.h"
    #include "Entity.h"
    ```

    可见：Entity**包含**Component，Component**包含**ScriptableEntity，ScriptableEntity包含Entity如此递归包含，所以会报以下错。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132112206.png)

  - 解决方法：

    组件Components应该不知道实体类Entity的存在，而ScriptableEntity类include包含实体，所以组件Components需改为**不包含**ScriptableEntity

    但是组件Components内部会使用ScriptableEntity，但这里正好是指针，可以**前向**声明ScriptableEntity，等要使用ScriptableEntity指针的时候再实际包含ScriptableEntity。

    ```cpp
    class ScriptableEntity; // 前向声明
    struct NativeScriptComponent {
        ScriptableEntity* Instance = nullptr;
        /////////////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////////////
        // 函数指针名称：InstantiateScript、指向无参数、返回ScriptableEntity指针的函数
        // 1.函数指针指向的函数返回ScriptableEntity*
        // 2.*InstantiateScript 是函数指针，函数指针名字是InstantiateScript
        // 3.函数指针指向的函数无参数
        ScriptableEntity* (*InstantiateScript)();// 这函数返回ScriptableEntity指针，函数无参数（InstantiateScript的*代表为指针）
        void(*DestroyScript)(NativeScriptComponent*);
        template<typename T>
        void Bind() {
            // 这里绑定的函数功能是：根据T动态实例化Instanse
            InstantiateScript = []() {return static_cast<ScriptableEntity*>(new T()); };// 引用值捕获Instance
            DestroyScript = [](NativeScriptComponent* nsc) {delete nsc->Instance; nsc->Instance = nullptr; };// 感觉参数放不放NativeScriptComponent无所谓，反正有this
        }
    };
    ```

    注意：由于Scene使用了ScriptableEntity，且Scene包含了component.h（所以Scene之前可以不包含ScriptableEntity而使用ScriptableEntity）

    但现在component.h不包含ScriptableEntity了，所以需要在scene中包含"ScriptableEntity.h"

    ```cpp
    #include "Components.h"
    #include "ScriptableEntity.h"
    ```

    

  