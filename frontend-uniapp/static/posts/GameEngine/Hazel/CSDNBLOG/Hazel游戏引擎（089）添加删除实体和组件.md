> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 目的

  此节需要完成像Unity那样

  - 右键实体可以弹出菜单可以**删除实体**，右键空白地方可以弹出菜单**添加实体**
  - 在属性面板显示实体的组件，有**添加组件按钮**，点击弹出菜单项可以添加相应组件。
  - 在属性面板显示实体的组件，每个组件的下拉有按钮，点击弹出菜单项可以**删除这个组件**

- 有点需要注意

  给实体添加摄像机组件后，并不会立即显示画面，因为投影矩阵的aspect ratio宽高比是**0**，投影矩阵无，所以应在添加摄像机实体的时候就设置当前视口的宽高比，从而计算投影矩阵。

# 关键代码

- 删除、添加实体

  ```cpp
  void SceneHierarchyPanel::OnImGuiRender()
  {
      // 判断当前点击的实体是否存在
      ImGui::Begin("Properties");
      if (m_SelectionContext) { // operator uint32_t() 的是const，不然不会调用operator bool(),而是调用uint32_t()
          DrawComponents(m_SelectionContext);
          // 弹出菜单: 在属性面板显示添加组件按钮
          if (ImGui::Button("Add Component")) {
              ImGui::OpenPopup("AddComponent");// AddComponent只是id
          }
          if (ImGui::BeginPopup("AddComponent")) {
              if (ImGui::MenuItem("Camera")) {
                  m_SelectionContext.AddComponent<CameraComponent>();
                  ImGui::CloseCurrentPopup();
              }
              if (ImGui::MenuItem("Sprite Renderer")) {
                  m_SelectionContext.AddComponent<SpriteRendererComponent>();
              }
              ImGui::EndPopup();
          }
      }
      ImGui::End();
  }
  void SceneHierarchyPanel::DrawEntityNode(Entity entity)
  {
      auto& tag = entity.GetComponent<TagComponent>().Tag;
      // 若是被点击标记为选中状态|有下一级
      ImGuiTreeNodeFlags flags = ((m_SelectionContext == entity) ? ImGuiTreeNodeFlags_Selected : 0) | ImGuiTreeNodeFlags_OpenOnArrow;
      // 第一个参数是唯一ID 64的，
      bool opened = ImGui::TreeNodeEx((void*)(uint64_t)(uint32_t)entity, flags, tag.c_str());
      if (ImGui::IsItemClicked()) {
          m_SelectionContext = entity; // 记录当前点击的实体
      }
      // 右键实体 弹出菜单:删除实体
      bool entityDeleted = false;
      if (ImGui::BeginPopupContextItem()) {
          if (ImGui::MenuItem("Delete Entity")) {
              entityDeleted = true;
          }
          ImGui::EndPopup();
      }
  ```

- ImGui弹出菜单与延迟删除

  ```cpp
  void SceneHierarchyPanel::OnImGuiRender()
  {
      // 右击空白面板-弹出菜单。0是ID 1是右键
      if (ImGui::BeginPopupContextWindow(0, 1, false)) {
          if (ImGui::MenuItem("Create Empty Entity")) {
              m_Context->CreateEntity("Empty Entity");
          }
          ImGui::EndPopup();
      }
      ImGui::End();
  .......
  void SceneHierarchyPanel::DrawComponents(Entity entity)
  {
      // 点击按钮-弹出菜单
      if (ImGui::Button("+", ImVec2{20, 20})) {
          ImGui::OpenPopup("ComponentSettings");// ComponentSettings只是id
      }
      bool removeComponent = false;
      if (ImGui::BeginPopup("ComponentSettings")) {
          if (ImGui::MenuItem("Remove component")) {
              removeComponent = true;
          }
          ImGui::EndPopup();
      }
      // 延迟删除
      if (removeComponent) {
          entity.RemoveComponent<SpriteRendererComponent>();
      }
  ```

- 添加摄像机组件的时候，设置视口大小计算投影矩阵

  ```cpp
  Scene.h
  private:
      template<typename T>
      void OnComponentAdded(Entity entity, T& component);
  Scene.cpp
  // 模板类定义在cpp中
  template<typename T>
  void Scene::OnComponentAdded(Entity entity, T& component)
  {
      // 静态断言：false，代表在编译前就会执行， 但是编译器这里不会报错，说明这段代码不会编译吧。。
      // 而且打了断点，也不行，证明这段代码只是声明作用吧。
      static_assert(false);
  }
  template<>
  void Scene::OnComponentAdded<CameraComponent>(Entity entity, CameraComponent& component)
  {
      entity.GetComponent<TransformComponent>().Translation = { 0, 0, 5.0f };
      component.camera.SetViewportSize(m_ViewportWidth, m_ViewportHeight);
  }
  
  ```

# 效果

![image-20230730185043197](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302312294.png)

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302312300.png)

场景有绿色的quad，是因为删除了绿色的实体，opengl却还有缓存

# 自己遇到的bug

- 问题描述

  删除实体或者实体的sprite，场景还是会绘制最后删除的quad，应该是没清除缓存还是啥。

- 尝试解决

  可以在scene代码加上，如果没有spriteer要绘制就清空（好像也没用）

  ```cpp
  if (mainCamera) {
      Renderer2D::BeginScene(*mainCamera, cameraTransform);
      auto group = m_Registry.group<TransformComponent>(entt::get<SpriteRendererComponent>);
      for (auto entity : group) {
          // get返回的tuple里本是引用
          auto [tfc, sprite] = group.get<TransformComponent, SpriteRendererComponent>(entity);
          Renderer2D::DrawQuad(tfc.GetTransform(), sprite.Color);
      }
      if (group.size() <= 0) {
          Renderer2D::Shutdown();
      }
      Renderer2D::EndScene();
  }
  ```

  

