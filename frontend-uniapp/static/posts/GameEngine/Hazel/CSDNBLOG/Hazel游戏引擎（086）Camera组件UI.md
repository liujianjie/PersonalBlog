> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  - 在属性面板上

    实现点击摄像机实体，属性面板**显示**摄像机实体的摄像机组件参数。

  - 修改摄像机的参数，摄像机**会做出相应的显示**。

  - 给摄像机添加**透视投影**类型。

- 如何实现

  - 使用ImGui的API
  - 使用glm::perspctive()来计算透视投影矩阵

# 代码流程

- 点击当前场景的实体，打开属性面板，获取到当前实体的camera组件，将参数填入ImGui提供的API中

  ```cpp
  void SceneHierarchyPanel::OnImGuiRender()
  {	.......
      // 判断当前点击的实体是否存在
      ImGui::Begin("Properties");
      if (m_SelectionContext) { // operator uint32_t() 的是const，不然不会调用operator bool(),而是调用uint32_t()
          DrawComponents(m_SelectionContext);
      }
      ImGui::End();
  }
  ```

- 对camera组件的参数修改时，重新**计算投影矩阵**

  ```cpp
  void SceneHierarchyPanel::DrawComponents(Entity entity)
  {
      // 摄像机组件
      if (entity.HasComponent<CameraComponent>()) {
          if (ImGui::TreeNodeEx((void*)typeid(CameraComponent).hash_code(), ImGuiTreeNodeFlags_DefaultOpen, "Camera")) {
              auto& cameraComponent = entity.GetComponent<CameraComponent>();
              auto& camera = cameraComponent.camera;
  
              ImGui::Checkbox("Primary", &cameraComponent.primary);
  
              const char* projectionTypeStrings[] = { "Perspective", "Orthographic" };
              const char* currentProjectionTypeString = projectionTypeStrings[(int)camera.GetProjectionType()];
              if (ImGui::BeginCombo("Projection", currentProjectionTypeString)) {
                  for (int i = 0; i < 2; i++) {
                      bool isSelected = currentProjectionTypeString == projectionTypeStrings[i];
                      if (ImGui::Selectable(projectionTypeStrings[i], isSelected)) {
                          currentProjectionTypeString = projectionTypeStrings[i];
                          /////////////////////////////////////////////////////////
                          /////////////////////////////////////////////////////////
                          // 设置摄像机的类型，重新计算投影矩阵
                          camera.SetProjectionType((SceneCamera::ProjectionType)i);
                      }
                      if (isSelected)
                          ImGui::SetItemDefaultFocus();
                  }
                  ImGui::EndCombo();
              }
              if (camera.GetProjectionType() == SceneCamera::ProjectionType::Perspective) {
                  float verticalFov = glm::degrees(camera.GetPerspectiveVerticalFOV()); // 转换为角度
                  if (ImGui::DragFloat("Vertical FOV", &verticalFov)) {
                      camera.SetPerspectiveVerticalFOV(glm::radians(verticalFov)); // 设置回弧度
                  }
  
                  float orthoNear = camera.GetPerspectiveNearClip();
                  if (ImGui::DragFloat("Near", &orthoNear)) {
                      camera.SetPerspectiveNearClip(orthoNear);
                  }
  
                  float orthoFar = camera.GetPerspectiveFarClip();
                  if (ImGui::DragFloat("Far", &orthoFar)) {
                      camera.SetPerspectiveNearClip(orthoFar);
                  }
              }
              if (camera.GetProjectionType() == SceneCamera::ProjectionType::Orthographic) {
                  float orthoSize = camera.GetOrthographicSize();
                  if (ImGui::DragFloat("Size", &orthoSize)) {
                      camera.SetOrthographicSize(orthoSize);
                  }
  
                  float orthoNear = camera.GetOrthographicNearClip();
                  if (ImGui::DragFloat("Near", &orthoNear)) {
                      camera.SetOrthographicNearClip(orthoNear);
                  }
  
                  float orthoFar = camera.GetOrthographicFarClip();
                  if (ImGui::DragFloat("Far", &orthoFar)) {
                      camera.SetOrthographicFarClip(orthoFar);
                  }
                  ImGui::Checkbox("Fixed Aspect Ratio", &cameraComponent.fixedAspectRatio);
              }
              // 展开树节点
              ImGui::TreePop();
          }
      }
  ```

- 在Scene中绘制时，获取到主摄像机的投影矩阵，计算得到投影视图矩阵传入给OpenGL计算绘制的图形在世界的**最终位置**

  ```cpp
  void SceneCamera::RecalculateProjection()
  {
      // 区分是正交还是透视
      if (m_ProjectionType == ProjectionType::Perspective) {
          m_Projection = glm::perspective(m_PerspectiveFOV, m_AspectRatio, m_PerspectiveNear, m_PerspectiveFar);
      }else {
          float orthoLeft = -m_OrthographicSize * m_AspectRatio * 0.5f;
          float orthoRight = m_OrthographicSize * m_AspectRatio * 0.5f;
          float orthoBottom = -m_OrthographicSize * 0.5f;
          float orthoTop = m_OrthographicSize * 0.5f;
  
          m_Projection = glm::ortho(orthoLeft, orthoRight, orthoBottom,
                                    orthoTop, m_OrthographicNear, m_OrthographicFar);
      }
  }
  ```

  ```cpp
  void Scene::OnUpdate(Timestep ts)
  {
      // 获取到主摄像机，并且获取到摄像机的位置，用来计算投影矩阵projection
      Camera* mainCamera = nullptr;
      glm::mat4* cameraTransform = nullptr;
      {
          auto group = m_Registry.view<TransformComponent, CameraComponent>();
          for (auto entity : group){
              auto &[transform, camera] = group.get<TransformComponent, CameraComponent>(entity);
  
              if (camera.primary) {
                  mainCamera = &camera.camera;
                  cameraTransform = &transform.Transform;
              }
          }
      }
      ///////////////////////////////////////////////////////////////
      // 注意这，BeginScene中传入主摄像机的投影矩阵与主摄像机的transform矩阵
      if (mainCamera) {
          Renderer2D::BeginScene(mainCamera->GetProjection(), *cameraTransform);
          auto group = m_Registry.group<TransformComponent>(entt::get<SpriteRendererComponent>);
          for (auto entity : group) {
              auto& [transform, sprite] = group.get<TransformComponent, SpriteRendererComponent>(entity);
              Renderer2D::DrawQuad(transform, sprite.Color);
          }
          Renderer2D::EndScene();
      }
  }
  ```

# 关键代码

- 计算透视投影矩阵

  ```cpp
  m_Projection = glm::perspective(m_PerspectiveFOV, m_AspectRatio, m_PerspectiveNear, m_PerspectiveFar);
  ```

- ImGui的API，checkbox单选框、Combo下拉列表

  ```cpp
  ImGui::Checkbox("Primary", &cameraComponent.primary);
  ImGui::BeginCombo("Projection", currentProjectionTypeString)
  ImGui::EndCombo();
  ```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302311490.png)

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302311503.png)

OpenGl是**右手坐标系**，Z大于0图形靠近摄像机，Z小于0图形远离摄像机

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302311312.png)
