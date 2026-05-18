> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 前情提要

  由上节已经可以读取当前鼠标位置所在实体围成的像素在缓冲区的**实体ID值**

- 此节目的

  鼠标点击实体，会出现gizmos，并且可以拖动什么的

- 如何实现

  使用**点击事件**(事件系统）设置hierarchy面板哪个实体被选中

- 实现过程中出现的Bug

  1. 拖动gizmo移动一个实体与另一个实体重叠时停下，且另一个实体在当前实体上面，再点击gizmo想移动**原先**实体，那么会获取在**上面**另一个实体的实体ID，即**另一个实体会被选中**，会切换gizmo。
  2. 显示了gizmo，但是若按下leftalt拖动旋转摄像机，则gizmo会消失

# 代码

```cpp
void EditorLayer::OnEvent(Event& e)
{
    // 事件
    m_CameraController.OnEvent(e);
    m_EditorCamera.OnEvent(e);

    EventDispatcher dispatcher(e);
    dispatcher.Dispatch<KeyPressedEvent>(HZ_BIND_EVENT_FN(EditorLayer::OnKeyPressed));
    // 鼠标按下事件，由OnMouseButtonPressed函数处理
    dispatcher.Dispatch<MouseButtonPressedEvent>(HZ_BIND_EVENT_FN(EditorLayer::OnMouseButtonPressed));
}
.......
bool EditorLayer::OnMouseButtonPressed(MouseButtonPressedEvent& e)
{
    if (e.GetMouseButton() == Mouse::ButtonLeft) {
        /*
				m_ViewportHovered 是为了在别的视口点击不会关闭当前显示的gizmo
				后面两个&&是解决下面
				1. 拖动gizmo移动一个实体与另一个实体重叠时停下，且另一个实体在当前实体上面，再点击gizmo想移动原先实体，那么会获取在上面另一个实体的实体ID，即另一个实体会被选中，会切换gizmo。
				2. 显示了gizmo，但是若按下leftalt拖动旋转摄像机，则gizmo会消失
			*/
        
        if (m_ViewportHovered && !ImGuizmo::IsOver() && !Input::IsKeyPressed(Key::LeftAlt)) {
            m_SceneHierarchyPanel.SetSelectedEntity(m_HoveredEntity);
        }
    }
    return false;
}
.......
//////////////////////////////////////
// 选中实体//////////////////////////////////////
void SceneHierarchyPanel::SetSelectedEntity(Entity entity)
{
    m_SelectionContext = entity;
}
```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308122242158.png)