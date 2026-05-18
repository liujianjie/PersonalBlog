> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  1. 为实现点击运行，**复制**当前场景成为**运行**场景，点击结束**销毁**当前场景。
  2. 在当前场景**复制**实体

  最重要的如何复制场景，复制场景需要复制当前场景的所有实体及其包含的组件，但是当前的entt库不包含复制组件的API，所以我们需要**手动写复制实体**。

- 如何实现复制场景

  entt的注册表起关键作用entt::registry

  1. 创建新场景，为新场景创建和旧场景同名和uuid的**实体**，并用**map存入（旧实体的uuid对应新实体）的关系**
  2. 遍历旧场景所有uuid组件的旧实体，用**旧实体的uuid-map-对应新实体**
  3. 获取旧实体的**所有组件**，然后用API，**复制旧实体的所有组件给新实体**，复制组件会包括复制组件的属性值

- 如何实现复制实体

  1. 创建新的同名实体
  2. 分别检测旧实体是否有对应组件，有就添加或修改对应新实体组件

- 实现细节

  运行场景时，注意设置面板的上下文为**新**场景，停止后要设回编辑场景（**旧**场景）。

# 关键代码+代码流程

- 注册表添加或者替换组件

  ```cpp
  T& component = m_Scene->m_Registry.emplace_or_replace<T>(m_EntityHandle, std::forward<Args>(args)...);
  ```

- 复制场景

  - 在editorlayer中点击运行，执行Scene的Copy函数复制当前的场景，并设置面板的上下文为新场景

    ```cpp
    void EditorLayer::OnScenePlay()
    {
        if (!m_EditorScene) {
            HZ_CORE_WARN("editorscene is null");
            return;
        }
        m_SceneState = SceneState::Play;
    
        // 复制新场景给活动场景
        m_ActiveScene = Scene::Copy(m_EditorScene);
        m_ActiveScene->OnRuntimeStart(); // 复制完新场景就开始运行
        // 当前上下文是新场景----------------------------
        m_SceneHierarchyPanel.SetContext(m_ActiveScene);
    }
    ```

  - 执行Scene的Copy函数**复制**当前的场景

    ```cpp
    Ref<Scene> Scene::Copy(Ref<Scene> other)
    {
        // 1.1创建新场景
        Ref<Scene> newScene = CreateRef<Scene>();
    
        newScene->m_ViewportWidth = other->m_ViewportWidth;
        newScene->m_ViewportHeight = other->m_ViewportHeight;
    
        auto& srcSceneRegistry = other->m_Registry;
        auto& dstSceneRegistry = newScene->m_Registry;
        std::unordered_map<UUID, entt::entity> enttMap;
    
        auto idView = srcSceneRegistry.view<IDComponent>();
        for (auto e : idView) {
            UUID uuid = srcSceneRegistry.get<IDComponent>(e).ID;
            const auto& name = srcSceneRegistry.get<TagComponent>(e).Tag;
            // 1.2为新场景创建和旧场景同名和uuid的实体
            Entity newEntity = newScene->CreateEntityWithUUID(uuid, name);
            // 1.3并用**map存入（旧实体的uuid对应新实体）的关系**
            enttMap[uuid] = (entt::entity)newEntity;// UUID类需要哈希
        }
    
        // 拷贝组件，除了IDcomponent与tagcomponent，因CreateEntityWithUUID创建了
        CopyComponent<TransformComponent>(dstSceneRegistry, srcSceneRegistry, enttMap);
        CopyComponent<SpriteRendererComponent>(dstSceneRegistry, srcSceneRegistry, enttMap);
        CopyComponent<CameraComponent>(dstSceneRegistry, srcSceneRegistry, enttMap);
        CopyComponent<NativeScriptComponent>(dstSceneRegistry, srcSceneRegistry, enttMap);
        CopyComponent<Rigidbody2DComponent>(dstSceneRegistry, srcSceneRegistry, enttMap);
        CopyComponent<BoxCollider2DComponent>(dstSceneRegistry, srcSceneRegistry, enttMap);
    
        return newScene;
    }
    // 为复制场景的实体的组件的辅助方法
    template<typename Component>
    static void CopyComponent(entt::registry& dst, entt::registry& src, const std::unordered_map<UUID, entt::entity>& enttMap) {
        auto view = src.view<Component>();
        // 2.1遍历旧场景所有uuid组件的旧实体
        for (auto e : view) {
            UUID uuid = src.get<IDComponent>(e).ID;
            HZ_CORE_ASSERT(enttMap.find(uuid) != enttMap.end());
            // 2.2用** 旧实体的uuid - map - 对应新实体 * *
            entt::entity dstEnttID = enttMap.at(uuid);
            // 3.1获取旧实体的组件
            auto& component = src.get<Component>(e);
            // 3.2然后用API，** 复制旧实体的组件给新实体**
            dst.emplace_or_replace<Component>(dstEnttID, component);// 添加或替换，保险
        }
    }
    ```

- 复制实体

  - 在editorlayer中按下快捷键ctrl+d，执行OnDuplicateEntity函数，复制当前选择的实体

    ```cpp
    void EditorLayer::OnDuplicateEntity(){
        // 编辑场景时 可以复制实体
        if (m_SceneState != SceneState::Edit) {
            return;
        }
        Entity selectedEntity = m_SceneHierarchyPanel.GetSelectedEntity();
        if (selectedEntity) {
            m_EditorScene->DuplicateEntity(selectedEntity);
        }
    }
    ```

  - Scene的DuplicateEntity函数执行具体操作

    1. 创建旧实体同名的新实体
    2. 复制组件

    ```cpp
    void Scene::DuplicateEntity(Entity entity){
        // 1.创建旧实体同名的新实体
        std::string name = entity.GetName();
        Entity newEntity = CreateEntity(name);
        // 2.复制组件
        CopyComponentIfExists<TransformComponent>(newEntity, entity);
        CopyComponentIfExists<SpriteRendererComponent>(newEntity, entity);
        CopyComponentIfExists<CameraComponent>(newEntity, entity);
        CopyComponentIfExists<NativeScriptComponent>(newEntity, entity);
        CopyComponentIfExists<Rigidbody2DComponent>(newEntity, entity);
        CopyComponentIfExists<BoxCollider2DComponent>(newEntity, entity);
    }
    // 为复制实体的辅助方法
    template<typename Component>
    static void CopyComponentIfExists(Entity dst, Entity src) {
        if (src.HasComponent<Component>()) {
            dst.AddOrReplaceComponent<Component>(src.GetComponent<Component>());
        }
    }
    ```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132112218.png)

![1.3运行](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132112274.png)

![1.4运行](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132112890.png)

- 注意的小点

  这里相机也有box2d组件，注意相机的z是5，表示在绿色障碍物的前面，运行的时候也能与绿色的障碍物计算模拟。

  给白色的实体z调成任何值，也能和绿色障碍物交互！

  但摄像机是透视投影，所以白色实体z大小会影响白色实体的感官，若z太小，实体也会看起来缩小一样，若z太大超过摄像机的z，则实体将不会呈现。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132112809.png)

# Cherno遇到的bug

- hierarchy面板不显示实体

  没有设置面板的上下文场景，所以获取不到场景的实体

- Ctrl+D复制实体出错

  问题概述：引用问题

  **问题分析：**

  在Editorlayer ctrl+d复制实体，调用scene的DuplicateEntity函数，创建一个和旧实体同名的新实体

  ```cpp
  void Scene::DuplicateEntity(Entity entity)
  {
      Entity newEntity = CreateEntity(entity.GetName());
  ```

  在CreateEntity执行CreateEntityWithUUID函数

  ```cpp
  Entity Scene::CreateEntity(const std::string& name)
  {
      // 创建新的uuid
      return CreateEntityWithUUID(UUID(), name);
  }
  Entity Scene::CreateEntityWithUUID(UUID uuid, const std::string& name)
  {
      // 添加默认组件
      Entity entity = { m_Registry.create(),this };
      entity.AddComponent<TransformComponent>();
      entity.AddComponent<IDComponent>(uuid); // 使用存在的uuid，不创建新的
      // 下面这一行！！！！！！！！！！！！！！！
      auto& tag = entity.AddComponent<TagComponent>();
      tag.Tag = name.empty() ? "Entity" : name;
      return entity;
  }
  ```

  当CreateEntityWithUUID函数执行到 auto& tag = entity.AddComponent<TagComponent>();这段代码，会导致参数name获取字符串失败。

  **问题原因：**

  1. Entity的GetName是获取TagComponent的字符串

     ```cpp
     const std::string& GetName() { return GetComponent<TagComponent>().Tag; }
     ```

  2. CreateEntity 、CreateEntityWithUUID的参数string都是引用类型

  3. 当执行auto& tag = entity.AddComponent<TagComponent>();代码时候，添加新的TagComponent组件，entt的库会移动组件再内存的位置，所以会导致字符串引用的地址无效

  **解决方法：**

  在Scene的DuplicateEntity函数GetName()后赋给局部string变量

  ```cpp
  void Scene::DuplicateEntity(Entity entity)
  {
      std::string name = entity.GetName();
      Entity newEntity = CreateEntity(name);
  ```

  

