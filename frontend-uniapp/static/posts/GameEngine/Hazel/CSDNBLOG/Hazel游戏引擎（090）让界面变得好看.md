> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  如此节标题，让编辑器更好看，主要有：

  1. 更换字体
  2. 按钮字体加粗
  3. 调整布局
  4. 控制最小宽度
  5. 界面颜色
  6. 用模板函数去除重复代码

- 如何实现

  ImGui的Api。

# 关键代码

- ImGui相关

  - 更换字体

    ```cpp
    // 完善UI：设置界面主题字体
    io.Fonts->AddFontFromFileTTF("assets/fonts/opensans/OpenSans-Bold.ttf", 18.0f);
    io.FontDefault = io.Fonts->AddFontFromFileTTF("assets/fonts/opensans/OpenSans-Regular.ttf", 18.0f);
    ```

  - 按钮字体加粗

    ```cpp
    // 完善UI：加粗字体
    ImGui::PushFont(boldFont);
    if (ImGui::Button("X", buttonSize) ){
        values.x = resetValue;
    }
    ImGui::PopFont();
    ImGui::PopStyleColor(3);
    ```

  - 控制最小宽度

    ```cpp
    // 完善UI：设置面板最小宽度
    float minWinSizeX = style.WindowMinSize.x;
    style.WindowMinSize.x = 370.f;
    if (io.ConfigFlags & ImGuiConfigFlags_DockingEnable)
    {
        ImGuiID dockspace_id = ImGui::GetID("MyDockSpace");
        ImGui::DockSpace(dockspace_id, ImVec2(0.0f, 0.0f), dockspace_flags);
    }
    style.WindowMinSize.x = minWinSizeX; // 恢复
    ```

  - 界面颜色

    ```cpp
    	void ImGuiLayer::SetDarkThemeColors()
    	{
    		auto& colors = ImGui::GetStyle().Colors;
    		colors[ImGuiCol_WindowBg] = ImVec4{ 0.1f, 0.105f, 0.11f, 1.0f };
    
    		// Headers
    		colors[ImGuiCol_Header] = ImVec4{ 0.2f, 0.205f, 0.21f, 1.0f };
    		colors[ImGuiCol_HeaderHovered] = ImVec4{ 0.3f, 0.305f, 0.31f, 1.0f };
    		colors[ImGuiCol_HeaderActive] = ImVec4{ 0.15f, 0.1505f, 0.151f, 1.0f };
    
    		// Buttons
    		colors[ImGuiCol_Button] = ImVec4{ 0.2f, 0.205f, 0.21f, 1.0f };
    		colors[ImGuiCol_ButtonHovered] = ImVec4{ 0.3f, 0.305f, 0.31f, 1.0f };
    		colors[ImGuiCol_ButtonActive] = ImVec4{ 0.15f, 0.1505f, 0.151f, 1.0f };
    
    		// Frame BG
    		colors[ImGuiCol_FrameBg] = ImVec4{ 0.2f, 0.205f, 0.21f, 1.0f };
    		colors[ImGuiCol_FrameBgHovered] = ImVec4{ 0.3f, 0.305f, 0.31f, 1.0f };
    		colors[ImGuiCol_FrameBgActive] = ImVec4{ 0.15f, 0.1505f, 0.151f, 1.0f };
    
    		// Tabs
    		colors[ImGuiCol_Tab] = ImVec4{ 0.15f, 0.1505f, 0.151f, 1.0f };
    		colors[ImGuiCol_TabHovered] = ImVec4{ 0.38f, 0.3805f, 0.381f, 1.0f };
    		colors[ImGuiCol_TabActive] = ImVec4{ 0.28f, 0.2805f, 0.281f, 1.0f };
    		colors[ImGuiCol_TabUnfocused] = ImVec4{ 0.15f, 0.1505f, 0.151f, 1.0f };
    		colors[ImGuiCol_TabUnfocusedActive] = ImVec4{ 0.2f, 0.205f, 0.21f, 1.0f };
    
    		// Title
    		colors[ImGuiCol_TitleBg] = ImVec4{ 0.15f, 0.1505f, 0.151f, 1.0f };
    		colors[ImGuiCol_TitleBgActive] = ImVec4{ 0.15f, 0.1505f, 0.151f, 1.0f };
    		colors[ImGuiCol_TitleBgCollapsed] = ImVec4{ 0.15f, 0.1505f, 0.151f, 1.0f };
    	}
    ```

- 用模板函数去除重复代码

  ```cpp
  void SceneHierarchyPanel::DrawComponents(Entity entity)
  {
      .......
      // 实体transform组件
      // 完善UI：模板类画组件的ui
      DrawComponent<TransformComponent>("Transform", entity, [](auto& tfc)
                                        {
                                            DrawVec3Control("Translation", tfc.Translation);
                                            glm::vec3 rotation = glm::degrees(tfc.Rotation);
                                            DrawVec3Control("Rotation", rotation); // 界面显示角度
                                            tfc.Rotation = glm::radians(rotation);
                                            DrawVec3Control("Scale", tfc.Scale, 1.0f);
                                        });
  	......
      // 实体SpriteRendererComponent组件		
      // 完善UI：模板类画组件的ui
      DrawComponent<SpriteRendererComponent>("Sprite Renderer", entity, [](auto& component)
                                             {
                                                 ImGui::ColorEdit4("Color", glm::value_ptr(component.Color));
                                             });
  }
  ```

  ```cpp
  // 完善UI：用模板+lambda替换冗余的ui绘制。类型2是参数传递推断出来的
  template<typename T,typename UIFunction>
  static void DrawComponent(const std::string& name, Entity entity, UIFunction uiFunction) {
      const ImGuiTreeNodeFlags treeNodeFlags = ImGuiTreeNodeFlags_DefaultOpen | ImGuiTreeNodeFlags_Framed | ImGuiTreeNodeFlags_SpanAvailWidth | ImGuiTreeNodeFlags_AllowItemOverlap | ImGuiTreeNodeFlags_FramePadding;
      if (entity.HasComponent<T>()) {
          //ImGui::Separator();
          auto& component = entity.GetComponent<T>();
          // 为了定位+按钮在 最右边
          ImVec2 contentRegionAvailable = ImGui::GetContentRegionAvail();
  
          ImGui::PushStyleVar(ImGuiStyleVar_FramePadding, ImVec2{ 4,4 });
          float lineHeight = GImGui->Font->FontSize + GImGui->Style.FramePadding.y * 2.0f;
          ImGui::Separator(); // 水平风格线，测试放上面也行
          // 先绘制下三角
          bool open = ImGui::TreeNodeEx((void*)typeid(T).hash_code(), treeNodeFlags, "Sprite Renderer");
          ImGui::PopStyleVar();
  
          // 再绘制按钮
          ImGui::SameLine(contentRegionAvailable.x - lineHeight * 0.5f); // 设置下一个组件同一行，并且在父组件的最右边
          // 点击按钮-弹出菜单
          if (ImGui::Button("+", ImVec2{ lineHeight, lineHeight })) {
              ImGui::OpenPopup("ComponentSettings");
          }
          //ImGui::PopStyleVar();
  
          bool removeComponent = false;
          if (ImGui::BeginPopup("ComponentSettings")) {
              if (ImGui::MenuItem("Remove component")) {
                  removeComponent = true;
              }
              ImGui::EndPopup();
          }
          if (open) {
              uiFunction(component);// 调用lambda函数
              // 展开树节点
              ImGui::TreePop();
          }
          // 延迟删除
          if (removeComponent) {
              entity.RemoveComponent<T>();
          }
      }
  }
  ```

# 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302312282.png)

# 涉及C++知识-模板类型如何推断

```cpp
#include <iostream>
using namespace std;
// T1的<>类型是传入,T2类型是用函数参数推导出来的
template<typename T1, typename T2>
void Func1(T2 t2) {
	T1 t1 = 2;
	cout << t1 << endl; // 2
	cout << t2 << endl; // 3
}
// 高级点:是lambda类型
template<typename T1, typename T2>
void Func2(T2 t2) {
	T1 t1 = 2;
	cout << t1 << endl; // 2
	int val = 3;
	// t2是一个lambda函数，执行即可
	t2(val);// 3
}
void main(){
	Func1<int>(3);
	Func2<int>([](auto& val) { cout << val << endl; });
}
```

