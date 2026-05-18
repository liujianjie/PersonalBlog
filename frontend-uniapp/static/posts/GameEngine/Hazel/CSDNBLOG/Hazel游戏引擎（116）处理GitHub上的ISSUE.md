> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  如标题，处理GitHub上的**pull**请求，以防项目有什么问题

# 关于优化

Cherno说，太注重缓存优化可能会降低性能，因为缓存优化需要在CPU上开辟额外空间，这些空间的消耗可能比，不缓存直接运行代码的+-运算的消耗还大。

# 一些比较重要的Pull Request

- 属性面板的添加组件按钮

  每一个组件，都得写一段代码来创建一个ImGui的UI按钮，表示添加这个组件给当前实体。

  代码冗余，用**template**可以优化

  ```cpp
  if (ImGui::BeginPopup("AddComponent"))
  {
      if (!m_SelectionContext.HasComponent<CircleCollider2DComponent>())
      {
          if (ImGui::MenuItem("Circle Collider 2D"))
          {
              m_SelectionContext.AddComponent<CircleCollider2DComponent>();
              ImGui::CloseCurrentPopup();
          }
      }
      ......
  ```

  ```cpp
  if (ImGui::BeginPopup("AddComponent")) {
      DisplayAddComponentEntry<CameraComponent>("Camera");
      DisplayAddComponentEntry<SpriteRendererComponent>("Sprite Renderer");
      DisplayAddComponentEntry<CircleRendererComponent>("Circle Renderer");
      DisplayAddComponentEntry<Rigidbody2DComponent>("Rigidbody 2D");
      DisplayAddComponentEntry<BoxCollider2DComponent>("Box Collider 2D");
      DisplayAddComponentEntry<CircleCollider2DComponent>("Circle Collider 2D");
      ImGui::EndPopup();
  }
  
  template<typename T>
  void SceneHierarchyPanel::DisplayAddComponentEntry(const std::string& entryName)
  {
      if (!m_SelectionContext.HasComponent<T>()) {
          if (ImGui::MenuItem(entryName.c_str())) {
              m_SelectionContext.AddComponent<T>();
              ImGui::CloseCurrentPopup();
          }
      }
  }
  ```

- "std::filesystem::relative" 

  这段代码计算相对路径在循环中会有很大的消耗，应在相对路径中改为**绝对路径**，然后在设置**拖动源处**修改为相对路径。

  ```cpp
  for (auto& directoryEntry : std::filesystem::directory_iterator(m_CurrentDirectory))
  {
      const auto& path = directoryEntry.path();
      //auto relativePath = std::filesystem::relative(path, g_AssetPath);
      //std::string filenameString = relativePath.filename().string();
      std::string filenameString = path.filename().string();
  ```

  ```cpp
  if (ImGui::BeginDragDropSource())
  {
      auto relativePath = std::filesystem::relative(path, g_AssetPath);
      const wchar_t* itemPath = relativePath.c_str();
      ImGui::SetDragDropPayload("CONTENT_BROWSER_ITEM", itemPath, (wcslen(itemPath) + 1) * sizeof(wchar_t));
      ImGui::EndDragDropSource();
  ```

- 内存未清理

  - 解释步骤
    1. 当前场景运行时，再New空场景
    2. 原先Editor场景并没有被销毁，它还是存在的。
  - 为什么
    1. 因为运行时m_ActiveScene是复制了m_EditorScene，它们两个各指向**不同的场景内存**，
    2. 当New空场景，m_ActiveScene又新指向了内存，原先指向的内存会销毁，**但是m_EditorScene指向的场景内存还存在**。

  ```cpp
  void EditorLayer::NewScene()
  {
      // 原先代码
      // 让m_ActiveScene指向新场景内存 旧的场景内存会自动被销毁
      m_ActiveScene = CreateRef<Scene>();
      // 但是m_EditorScene指向的场景内存还存在
      m_ActiveScene->OnViewportResize((uint32_t)m_ViewportSize.x, (uint32_t)m_ViewportSize.y);
      m_SceneHierarchyPanel.SetContext(m_ActiveScene);
  }
  ```

  ```cpp
  void EditorLayer::NewScene()
  {
      m_EditorScene = CreateRef<Scene>();// 让m_EditorScene指向新场景内存 旧的编辑场景内存会自动被销毁
      m_ActiveScene = m_EditorScene; // 让m_ActiveScene也指向新场景内存 它指向的旧的运行场景内存也会被销毁。
      
      m_ActiveScene = CreateRef<Scene>();
      m_ActiveScene->OnViewportResize((uint32_t)m_ViewportSize.x, (uint32_t)m_ViewportSize.y);
      m_SceneHierarchyPanel.SetContext(m_ActiveScene);
  }
  ```

  先让m_EditorScene指向新场景内存，**旧的编辑场景内存会被销毁**，再让m_ActiveScene也指向新场景内存，它指向的旧的运行场景内存也会被销毁。

- uuid的hash

  uuid已经接近唯一，并不用再次hash，只需返回uuid作为hash码就行

  ```cpp
  namespace std {
  	template<typename T> struct hash;// 不清楚这个干嘛用的
  
  	template<>
  	struct hash<Hazel::UUID> {
  		std::size_t operator()(const Hazel::UUID& uuid) const {
  			//return hash<uint64_t>()((uint64_t)uuid);
  			return (uint64_t)uuid;
  		}
  	};
  }
  ```

  