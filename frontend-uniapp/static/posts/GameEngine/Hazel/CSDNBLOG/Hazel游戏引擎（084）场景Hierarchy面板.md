> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  给引擎添加hierarchy界面面板，显示当前场景存活的实体

- 如何实现

  用ECS遍历当前场景的实体，用imgui显示

- 小提示

  用ImGui::ShowDemoWindow();  可以看想要的UI代码

# 代码流程

- EditorLayer场景定义层级面板SceneHierarchyPanel

  ```cpp
  SceneHierarchyPanel m_SceneHierarchyPanel;
  ```

- 给SceneHierarchyPanel设置**当前哪个场景被打开**

  ```cpp
  m_SceneHierarchyPanel.SetContext(m_ActiveScene);// 设置上下文
  
  SceneHierarchyPanel::SceneHierarchyPanel(const Ref<Scene>& context)
  {
      SetContext(context);
  }
  void SceneHierarchyPanel::SetContext(const Ref<Scene>& context)
  {
      m_Context = context;
  }
  ```

- SceneHierarchyPanel的OnImGuiRender函数中用ECS遍历当前场景的实体，并用imgui显示

  ```cpp
  void SceneHierarchyPanel::OnImGuiRender()
  {
      // 新面板
      ImGui::Begin("Scene Hierarchy");
      m_Context->m_Registry.each([&](auto entityID){
      	// ImGui显示场景的实体
          Entity entity{entityID, m_Context.get()};
          DrawEntityNode(entity);
      });
      ImGui::End();
  }
  void SceneHierarchyPanel::DrawEntityNode(Entity entity)
  {
      // 要引入 Log头文件
      auto& tag = entity.GetComponent<TagComponent>().Tag;
      // 若是被点击标记为选中状态|有下一级
      ImGuiTreeNodeFlags flags = ((m_SelectionContext == entity) ? ImGuiTreeNodeFlags_Selected : 0) | ImGuiTreeNodeFlags_OpenOnArrow;
      // 第一个参数是唯一ID 64的，
      bool opened = ImGui::TreeNodeEx((void*)(uint64_t)(uint32_t)entity, flags, tag.c_str());
      if (ImGui::IsItemClicked()) {
          m_SelectionContext = entity;
      }
      if (opened) {
          ImGuiTreeNodeFlags flags = ImGuiTreeNodeFlags_OpenOnArrow;
          bool opened = ImGui::TreeNodeEx((void*)98476565, flags, tag.c_str());
          if (opened) {
              ImGui::TreePop();
          }
          ImGui::TreePop();
      }
  }
  ```

- 在EditorLayer.cpp的OnImGuiRender函数中渲染SceneHierarchyPanel的UI

  ```cpp
  // 渲染
  m_SceneHierarchyPanel.OnImGuiRender();
  ```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302311370.png)

# 相关代码

```cpp
#pragma once

#include "Hazel/Core/Core.h"
#include "Hazel/Core/Log.h"
#include "Hazel/Scene/Scene.h"
#include "Hazel/Scene/Entity.h"

namespace Hazel {
	class SceneHierarchyPanel
	{
	public:
		SceneHierarchyPanel() = default;
		SceneHierarchyPanel(const Ref<Scene>& scene);

		void SetContext(const Ref<Scene>& scene);
		void OnImGuiRender();
	private:
		void DrawEntityNode(Entity entity);
	private:
		Ref<Scene> m_Context;// 用来标注哪个场景
		Entity m_SelectionContext;
	};
}
```

```cpp
#include "SceneHierarchyPanel.h"

#include <imgui/imgui.h>
#include "Hazel/Scene/Components.h"

namespace Hazel {
	SceneHierarchyPanel::SceneHierarchyPanel(const Ref<Scene>& context)
	{
		SetContext(context);
	}
	void SceneHierarchyPanel::SetContext(const Ref<Scene>& context)
	{
		m_Context = context;
	}
	void SceneHierarchyPanel::OnImGuiRender()
	{
		ImGui::Begin("Scene Hierarchy");
		m_Context->m_Registry.each([&](auto entityID){
			Entity entity{entityID, m_Context.get()};
			DrawEntityNode(entity);
		});
		ImGui::End();
	}
	void SceneHierarchyPanel::DrawEntityNode(Entity entity)
	{
		// 要引入 Log头文件
		auto& tag = entity.GetComponent<TagComponent>().Tag;
		// 若是被点击标记为选中状态|有下一级
		ImGuiTreeNodeFlags flags = ((m_SelectionContext == entity) ? ImGuiTreeNodeFlags_Selected : 0) | ImGuiTreeNodeFlags_OpenOnArrow;
		// 第一个参数是唯一ID 64的，
		bool opened = ImGui::TreeNodeEx((void*)(uint64_t)(uint32_t)entity, flags, tag.c_str());
		if (ImGui::IsItemClicked()) {
			m_SelectionContext = entity;// 记录当前点击的实体
		}
		if (opened) {
			ImGuiTreeNodeFlags flags = ImGuiTreeNodeFlags_OpenOnArrow;
			bool opened = ImGui::TreeNodeEx((void*)98476565, flags, tag.c_str());
			if (opened) {
				ImGui::TreePop();
			}
			ImGui::TreePop();
		}
	}
}
```

