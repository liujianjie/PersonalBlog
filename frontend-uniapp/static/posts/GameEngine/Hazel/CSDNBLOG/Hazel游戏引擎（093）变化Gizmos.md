> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 目的

  为实现像大多3D软件那种，点击物体，会有那种拖动、缩放、旋转的辅助小程序。

- 如何实现

  利用开源的imguizmo库，[网址](https://github.com/CedricGuillemet/ImGuizmo)

- 介绍imguizmo

  ImGizmo是一个建立在**Dear ImGu**i之上的小型（.h和.cpp）库，允许你操作（目前是旋转和平移）4x4浮点矩阵，没有其他依赖性。编写时考虑到了即时模式（IM）的理念。

- gizmos实现小点

  - 平移、缩放、旋转可以用快捷键切换
  - 可以像Unity一样设置每次移动或者旋转的量，**snap**

# 如何引入ImGuiZmo库

- git加入子模块

  ```cpp
  git submodule add https://github.com/TheCherno/ImGuizmo GameEngineLightWeight/vendor/ImGuizmo
  ```

- premake5.lua修改

  和glm库一样，只需要**包含目录**，但需过滤，不包含预编译头

  ```cpp
  IncludeDir["ImGuizmo"] = "GameEngineLightWeight/vendor/ImGuizmo" 
  
  files{
      "%{prj.name}/src/**.h",
      "%{prj.name}/src/**.cpp",
      "%{prj.name}/vendor/stb_image/**.cpp",
      "%{prj.name}/vendor/stb_image/**.h",
      "%{prj.name}/vendor/glm/glm/**.hpp",
      "%{prj.name}/vendor/glm/glm/**.inl",
      "%{prj.name}/vendor/ImGuizmo/ImGuizmo.h",
      "%{prj.name}/vendor/ImGuizmo/ImGuizmo.cpp"
  }
  includedirs{
      "%{prj.name}/src",
      "%{prj.name}/vendor/spdlog/include",
      "%{IncludeDir.Glad}",
      "%{IncludeDir.GLFW}",
      "%{IncludeDir.ImGui}",
      "%{IncludeDir.glm}",
      "%{IncludeDir.stb_image}",
      "%{IncludeDir.entt}",
      "%{IncludeDir.yaml_cpp}",
      "%{IncludeDir.ImGuizmo}"
  }
  -- imguizmo不使用编译头？ 没用 这句
  filter "files:%{prj.name}/vendor/ImGuizmo/**.cpp"
  flags { "NoPCH" }
  ```

# 关键代码

```cpp
void EditorLayer::OnImGuiRender()
{
    // ImGuizmos
Entity selectedEntity = m_SceneHierarchyPanel.GetSelectedEntity();
if (selectedEntity && m_GizmoType != -1) {
    ImGuizmo::SetOrthographic(false);
    ImGuizmo::SetDrawlist();

    float windowWidth = (float)ImGui::GetWindowWidth();
    float windowHeight = (float)ImGui::GetWindowHeight();
    ImGuizmo::SetRect(ImGui::GetWindowPos().x, ImGui::GetWindowPos().y, windowWidth, windowHeight);

    // Camera
    auto cameraEntity = m_ActiveScene->GetPrimaryCameraEntity();
    const auto& camera = cameraEntity.GetComponent<CameraComponent>().camera;
    const glm::mat4& cameraProjection = camera.GetProjection();
    glm::mat4 cameraView = glm::inverse(cameraEntity.GetComponent<TransformComponent>().GetTransform());

    // Entity transform
    auto& tc = selectedEntity.GetComponent<TransformComponent>();
    glm::mat4 transform = tc.GetTransform();

    // Snapping
    bool snap = Input::IsKeyPressed(Key::LeftControl);
    float snapValue = 0.5f; // 平移的snap
    if (m_GizmoType == ImGuizmo::OPERATION::ROTATE) {// rotate的度数
        snapValue = 45.0f;
    }
    float snapValues[3] = { snapValue, snapValue,snapValue };

    // 这里可以说是传入相应参数，得到绘画出来的gizmos
    ImGuizmo::Manipulate(glm::value_ptr(cameraView), glm::value_ptr(cameraProjection),
                         (ImGuizmo::OPERATION)m_GizmoType, ImGuizmo::LOCAL, glm::value_ptr(transform),
                         nullptr, snap ? snapValues : nullptr);

    // 如果gizmos被使用 或者 说被移动
    if (ImGuizmo::IsUsing()) {
        glm::vec3 translation, rotation, scale;
        Math::DecomposeTransform(transform, translation, rotation, scale);

        // 用增量旋转，解决矩阵可能会造成万向锁。
        glm::vec3 deltaRotation = rotation - tc.Rotation;
        tc.Translation = translation;
        tc.Rotation += deltaRotation; // 每一帧增加没有限制角度，而不是固定在360度数。
        tc.Scale = scale;
    }
}
```

```cpp
bool EditorLayer::OnKeyPressed(KeyPressedEvent& e)
{
    if (e.GetRepeatCount() > 0) {
        return false;
    }
    bool control = Input::IsKeyPressed(Key::LeftControl) || Input::IsKeyPressed(Key::RightControl);
    bool shift = Input::IsKeyPressed(Key::LeftShift) || Input::IsKeyPressed(Key::RightShift);
    switch (e.GetKeyCode()) {
        case Key::N: {
            if (control) {
                NewScene();
            }
            break;
        }
        case Key::O: {
            if (control) {
                OpenScene();
            }
            break;
        }
        case Key::S: {
            if (control && shift) {
                SaveSceneAs();
            }
            // 保存当前场景:要有一个记录当前场景的路径。
            //if (control) {

            //}
            break;
        }
            // Gizmos
        case Key::Q:
            m_GizmoType = -1;
            break;
        case Key::W:
            m_GizmoType = ImGuizmo::OPERATION::TRANSLATE;
            break;
        case Key::E:
            m_GizmoType = ImGuizmo::OPERATION::ROTATE;
            break;
        case Key::R:
            m_GizmoType = ImGuizmo::OPERATION::SCALE;
            break;
    }
```

# 效果

![gizmo](../图片/093.gizmos/gizmo.gif)

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302313617.png)

# 修改Bug

- 问题详情

  在Hierarchy点击了实体后，鼠标即使悬停在viewport窗口，快捷键按下，也不会切换gizmos的类型

  要修改为鼠标停在viewport窗口，快捷键按下，才会切换gizmos的类型

- 修改之前

  ```cpp
  Application::Get().GetImGuiLayer()->BlockEvents(!m_ViewportFocused || !m_ViewportHovered);
  // 修改之前：意思是当鼠标点击面板并且悬停在面板上，才能接受事件，其它情况均不能接收事件
  bool canshu = !m_ViewportFocused || !m_ViewportHovered;
  m_ViewportFocused = true,  m_ViewportHovered = true; canshu = false, m_BlockEvents：false-> viewport面板 能 接收事件
  m_ViewportFocused = true,  m_ViewportHovered = false;canshu = true,  m_BlockEvents：true->  viewport面板 不 能接收事件
  m_ViewportFocused = false, m_ViewportHovered = true; canshu = true,  m_BlockEvents：true->  viewport面板 不 能接收事件
  m_ViewportFocused = false, m_ViewportHovered = false;canshu = true,  m_BlockEvents：true->  viewport面板 不 能接收事件
  ```

- 修改之后

  ```cpp
  Application::Get().GetImGuiLayer()->BlockEvents(!m_ViewportFocused && !m_ViewportHovered);
  // 修改之后：意思是当鼠标没有点击面板并且没有悬停在面板上，就不接受事件，其它情况均可接收事件
  bool canshu = !m_ViewportFocused && !m_ViewportHovered;
  m_ViewportFocused = true,  m_ViewportHovered = true; canshu = false, m_BlockEvents：false-> viewport面板 能 接收事件
  m_ViewportFocused = true,  m_ViewportHovered = false;canshu = false,  m_BlockEvents：true-> viewport面板 能 接收事件
  m_ViewportFocused = false, m_ViewportHovered = true; canshu = false,  m_BlockEvents：true-> viewport面板 能 接收事件
  m_ViewportFocused = false, m_ViewportHovered = false;canshu = true,  m_BlockEvents：true->  viewport面板 不 能接收事件		
  ```

  

